'use client';

import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/contexts/AuthContext';
import AnimatedCounter from './AnimatedCounter';
import FundsChart from './FundsChart';
import { generateRandomUsername } from '@/lib/ton-utils';
import { addTransaction, getUserProfile, initializeProfile, addToPortfolio } from '@/lib/profile-utils';
import { fetchCryptoPrice } from '@/lib/price-api';
import { ethers } from 'ethers';
import { getSigner } from '@/lib/contracts';

interface ActivityMessage {
  id: string;
  text: string;
  type: 'investment' | 'withdrawal' | 'user' | 'ton_auth';
}

function BuyTokensSection() {
  const { user, refreshBalance } = useAuth();
  const { account, connect, isConnected } = useWallet();
  
  // Адреса для приема платежей (можно настроить через переменные окружения)
  const treasuryAddress = process.env.NEXT_PUBLIC_TREASURY_ADDRESS || '0x0000000000000000000000000000000000000000';
  
  // Адреса контрактов токенов (ERC-20)
  const tokenAddresses = {
    USDT: process.env.NEXT_PUBLIC_USDT_ADDRESS || '0xdAC17F958D2ee523a2206206994597C13D831ec7', // Mainnet USDT
    WBTC: process.env.NEXT_PUBLIC_WBTC_ADDRESS || '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // Mainnet WBTC
  };
  
  // ABI для ERC-20 токенов (только необходимые функции)
  const ERC20_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
  ];
  
  // Получить адрес сети для Etherscan (по умолчанию Sepolia для тестирования)
  const getEtherscanUrl = (txHash: string) => {
    const chainId = typeof window !== 'undefined' && (window as any).ethereum 
      ? (window as any).ethereum.chainId 
      : null;
    
    if (chainId === '0x1' || chainId === '0x1') {
      return `https://etherscan.io/tx/${txHash}`;
    } else if (chainId === '0xaa36a7' || chainId === '11155111') {
      return `https://sepolia.etherscan.io/tx/${txHash}`;
    } else {
      return `https://etherscan.io/tx/${txHash}`;
    }
  };
  const searchParams = useSearchParams();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto'>('card');
  const [cryptoCurrency, setCryptoCurrency] = useState<'ETH' | 'USDT' | 'WBTC'>('ETH');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string, etherscanUrl?: string } | null>(null);
  const [totalRaised, setTotalRaised] = useState<number>(111291.00); // Начальное значение
  const [activityMessages, setActivityMessages] = useState<ActivityMessage[]>([]);
  const messagesRef = useRef<ActivityMessage[]>([]);

  // Check for Stripe redirect success/cancel
  useEffect(() => {
    const success = searchParams?.get('success');
    const canceled = searchParams?.get('canceled');
    const sessionId = searchParams?.get('session_id');

    if (success === 'true' && sessionId) {
      // Verify the payment
      verifyPayment(sessionId);
    } else if (canceled === 'true') {
      setMessage({ type: 'error', text: 'Payment was canceled' });
    }
  }, [searchParams]);

  // Обновить баланс при загрузке компонента и при изменении пользователя
  useEffect(() => {
    if (user?.address) {
      refreshBalance();
    }
  }, [user?.address, refreshBalance]);

  const verifyPayment = async (sessionId: string) => {
    try {
      const response = await fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (data.success && data.session?.payment_status === 'paid') {
        const amount = data.session.amount_total / 100; // Convert from cents to euros
        setMessage({
          type: 'success',
          text: `Payment successful! You've purchased €${amount.toFixed(2)} worth of $TAI tokens.`,
        });
        // Clear the amount field
        setAmount('');
        // Update URL to remove query params
        window.history.replaceState({}, '', '/buy-tokens');
      } else {
        setMessage({ type: 'error', text: 'Payment verification failed' });
      }
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      setMessage({ type: 'error', text: 'Failed to verify payment' });
    }
  };

  const minAmount = 10; // Минимум 10 евро
  const tokenPrice = 1; // 1 $TAI = 1 EUR (примерно)

  // Генерация сообщений для бегущей строки
  const generateInvestmentMessage = (amount: number): ActivityMessage => ({
    id: Date.now().toString() + Math.random(),
    text: `New user invested €${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    type: 'investment',
  });

  const generateWithdrawalMessage = (amount: number): ActivityMessage => ({
    id: Date.now().toString() + Math.random(),
    text: `Pro user withdrew €${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    type: 'withdrawal',
  });

  const generateNewUserMessage = (): ActivityMessage => ({
    id: Date.now().toString() + Math.random(),
    text: 'New user joined the platform',
    type: 'user',
  });

  const generateTonAuthMessage = (username: string): ActivityMessage => ({
    id: Date.now().toString() + Math.random(),
    text: `User "@${username}" authorized via TON wallet`,
    type: 'ton_auth',
  });

  // Реалтайм обновления счётчика
  useEffect(() => {
    let updateInterval: NodeJS.Timeout;

    const updateCounter = () => {
      setTotalRaised(prev => {
        const random = Math.random();
        let change = 0;
        let newMessage: ActivityMessage | null = null;

        // 60% шанс на инвестицию, 20% на вывод, 10% на нового пользователя, 10% на TON авторизацию
        if (random < 0.6) {
          // Инвестиция: от 10 до 500 евро
          const investmentAmount = 10 + Math.random() * 490;
          change = investmentAmount;
          newMessage = generateInvestmentMessage(investmentAmount);
        } else if (random < 0.8) {
          // Вывод: от 50 до 300 евро (меньше чем инвестиции)
          const withdrawalAmount = 50 + Math.random() * 250;
          change = -withdrawalAmount;
          newMessage = generateWithdrawalMessage(withdrawalAmount);
        } else if (random < 0.9) {
          // Новый пользователь (без изменения суммы)
          newMessage = generateNewUserMessage();
        } else {
          // TON авторизация (без изменения суммы)
          const randomUsername = generateRandomUsername();
          newMessage = generateTonAuthMessage(randomUsername);
        }

        // Добавляем сообщение в бегущую строку
        if (newMessage) {
          const newMessages = [...messagesRef.current, newMessage];
          // Ограничиваем количество сообщений (храним последние 20)
          if (newMessages.length > 20) {
            newMessages.shift();
          }
          messagesRef.current = newMessages;
          setActivityMessages([...newMessages]);
        }

        // Гарантируем, что сумма всегда растёт (больше инвестиций чем выводов)
        const newValue = prev + change;
        return Math.max(newValue, 111291.00); // Минимум начальное значение
      });
    };

    // Обновляем счётчик каждые 8-15 секунд (рандомно) - замедленный рост
    const scheduleUpdate = () => {
      const delay = 8000 + Math.random() * 7000; // 8-15 секунд
      updateInterval = setTimeout(() => {
        updateCounter();
        scheduleUpdate();
      }, delay);
    };

    scheduleUpdate();

    return () => {
      if (updateInterval) clearTimeout(updateInterval);
    };
  }, []);

  // Инициализация с несколькими начальными сообщениями
  useEffect(() => {
    const initialMessages: ActivityMessage[] = [
      generateInvestmentMessage(125.50),
      generateNewUserMessage(),
      generateInvestmentMessage(250.00),
      generateWithdrawalMessage(100.00),
      generateTonAuthMessage(generateRandomUsername()),
      generateTonAuthMessage(generateRandomUsername()),
    ];
    messagesRef.current = initialMessages;
    setActivityMessages(initialMessages);
  }, []);

  const handleBuy = async () => {
    if (!amount || parseFloat(amount) < minAmount) {
      setMessage({ type: 'error', text: `Minimum purchase is €${minAmount}` });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      if (paymentMethod === 'crypto') {
        if (!isConnected) {
          await connect();
          // После подключения пользователь должен подтвердить транзакцию в MetaMask
          setLoading(false);
          return;
        }
        
        if (!user?.address) {
          throw new Error('Wallet not connected. Please connect your wallet first.');
        }
        
        // Проверка адреса казначейства
        if (!treasuryAddress || treasuryAddress === '0x0000000000000000000000000000000000000000') {
          throw new Error('Treasury address not configured. Please contact support.');
        }
        
        // Проверка, что treasury address не равен адресу пользователя
        if (treasuryAddress.toLowerCase() === user.address.toLowerCase()) {
          console.warn('Warning: Treasury address is the same as user address. Transaction will be sent to yourself.');
          // Это нормально для тестирования, но предупреждаем пользователя
        }
        
        const amountInEur = parseFloat(amount);
        
        // Проверить текущую сеть напрямую из MetaMask
        if (typeof window === 'undefined' || !(window as any).ethereum) {
          throw new Error('MetaMask not found. Please install MetaMask.');
        }
        
        const ethereum = (window as any).ethereum;
        const chainId = await ethereum.request({ method: 'eth_chainId' });
        const sepoliaChainIdHex = '0xaa36a7'; // Sepolia chain ID in hex
        
        if (chainId !== sepoliaChainIdHex) {
          // Попробовать переключить на Sepolia
          try {
            await ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: sepoliaChainIdHex }],
            });
            // Подождать немного для переключения сети
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (switchError: any) {
            // Если сеть не добавлена, добавить её
            if (switchError.code === 4902) {
              await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: sepoliaChainIdHex,
                  chainName: 'Sepolia Test Network',
                  nativeCurrency: {
                    name: 'SepoliaETH',
                    symbol: 'ETH',
                    decimals: 18
                  },
                  rpcUrls: ['https://rpc.sepolia.org'],
                  blockExplorerUrls: ['https://sepolia.etherscan.io']
                }],
              });
            } else {
              throw new Error(`Please switch to Sepolia testnet in MetaMask. Current chain ID: ${chainId}.`);
            }
          }
        }
        
        // Получить signer для отправки транзакции (после проверки сети)
        const signer = await getSigner();
        if (!signer) {
          throw new Error('Failed to get wallet signer. Please connect your wallet.');
        }
        
        let tx: ethers.ContractTransactionResponse;
        let cryptoAmount: number;
        let cryptoSymbol: string;
        
        if (cryptoCurrency === 'ETH') {
          // Получить курс ETH/EUR
          const ethPriceData = await fetchCryptoPrice('ETH');
          if (!ethPriceData || !ethPriceData.price) {
            throw new Error('Failed to fetch ETH price. Please try again.');
          }
          
          const ethPriceInEur = ethPriceData.price;
          cryptoAmount = amountInEur / ethPriceInEur;
          cryptoSymbol = 'ETH';
          
          // Проверить баланс пользователя
          console.log('Checking balance for address:', user.address);
          const balance = await signer.provider.getBalance(user.address);
          const balanceInEth = parseFloat(ethers.formatEther(balance));
          console.log('Balance from provider:', balanceInEth, 'ETH');
          
          // Получить информацию о сети для отладки
          const networkInfo = await signer.provider.getNetwork();
          console.log('Current network:', networkInfo.name, 'Chain ID:', networkInfo.chainId.toString());
          
          if (balanceInEth < cryptoAmount) {
            throw new Error(`Insufficient balance. You need ${cryptoAmount.toFixed(6)} ETH but have ${balanceInEth.toFixed(6)} ETH.`);
          }
          
          // Отправить транзакцию ETH
          setMessage({ 
            type: 'success', 
            text: `Sending ${cryptoAmount.toFixed(6)} ETH (€${amountInEur.toFixed(2)})... Please confirm in MetaMask.` 
          });
          
          // Логирование для отладки
          console.log('Sending transaction to treasury address:', treasuryAddress);
          console.log('User address:', user.address);
          console.log('Amount:', cryptoAmount.toFixed(18), 'ETH');
          
          tx = await signer.sendTransaction({
            to: treasuryAddress,
            value: ethers.parseEther(cryptoAmount.toFixed(18)),
          });
        } else {
          // Для USDT и WBTC - работа с ERC-20 токенами
          const tokenAddress = tokenAddresses[cryptoCurrency];
          if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
            throw new Error(`${cryptoCurrency} token address not configured. Please contact support.`);
          }
          
          // Получить курс токена/EUR
          const tokenSymbol = cryptoCurrency === 'WBTC' ? 'BTC' : cryptoCurrency;
          const tokenPriceData = await fetchCryptoPrice(tokenSymbol);
          if (!tokenPriceData || !tokenPriceData.price) {
            throw new Error(`Failed to fetch ${cryptoCurrency} price. Please try again.`);
          }
          
          const tokenPriceInEur = tokenPriceData.price;
          cryptoAmount = amountInEur / tokenPriceInEur;
          cryptoSymbol = cryptoCurrency;
          
          // Получить контракт токена
          const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
          
          // Получить decimals токена
          const decimals = await tokenContract.decimals();
          const decimalsNumber = Number(decimals);
          const amountInWei = ethers.parseUnits(cryptoAmount.toFixed(decimalsNumber), decimalsNumber);
          
          // Проверить баланс пользователя
          const balance = await tokenContract.balanceOf(user.address);
          const balanceFormatted = parseFloat(ethers.formatUnits(balance, decimalsNumber));
          
          if (balanceFormatted < cryptoAmount) {
            const shortfall = cryptoAmount - balanceFormatted;
            throw new Error(
              `Insufficient ${cryptoCurrency} balance.\n` +
              `Required: ${cryptoAmount.toFixed(6)} ${cryptoCurrency} (€${amountInEur.toFixed(2)})\n` +
              `Your balance: ${balanceFormatted.toFixed(6)} ${cryptoCurrency}\n` +
              `Shortfall: ${shortfall.toFixed(6)} ${cryptoCurrency}\n\n` +
              `Please add ${cryptoCurrency} to your wallet to complete this purchase.`
            );
          }
          
          // Проверить allowance (разрешение на перевод)
          const allowance = await tokenContract.allowance(user.address, treasuryAddress);
          
          // Если allowance недостаточно, нужно одобрить
          if (allowance < amountInWei) {
            setMessage({ 
              type: 'success', 
              text: `Approving ${cryptoCurrency} transfer... Please confirm in MetaMask.` 
            });
            
            // Одобрить максимальное количество (или можно одобрить только нужное)
            const approveTx = await tokenContract.approve(treasuryAddress, ethers.MaxUint256);
            await approveTx.wait();
          }
          
          // Отправить транзакцию перевода токенов
          setMessage({ 
            type: 'success', 
            text: `Sending ${cryptoAmount.toFixed(6)} ${cryptoCurrency} (€${amountInEur.toFixed(2)})... Please confirm in MetaMask.` 
          });
          
          tx = await tokenContract.transfer(treasuryAddress, amountInWei);
        }
        
        const txHash = tx.hash;
        setMessage({ 
          type: 'success', 
          text: `Transaction sent! Waiting for confirmation... (${txHash.slice(0, 10)}...)` 
        });
        
        // Дождаться подтверждения
        const receipt = await tx.wait();
        
        if (receipt && receipt.status === 1) {
          // Транзакция успешна
          const finalTxHash = receipt.hash;
          const etherscanUrl = getEtherscanUrl(finalTxHash);
          
          // Получить курс для сохранения в метаданных
          const tokenSymbol = cryptoCurrency === 'WBTC' ? 'BTC' : cryptoCurrency;
          const priceData = await fetchCryptoPrice(tokenSymbol);
          const priceInEur = priceData?.price || 0;
          
          // Добавить транзакцию в историю
          if (user.address) {
            // Убедиться, что профиль существует перед добавлением транзакции
            let profile = getUserProfile(user.address);
            if (!profile) {
              // Создать профиль с дефолтным username, если его нет
              const defaultUsername = `user_${user.address.slice(2, 8)}`;
              profile = initializeProfile(user.address, defaultUsername);
              console.log('Profile created for transaction:', user.address);
            }
            
            const tokensAmount = parseFloat(amount);
            const transaction = await addTransaction(user.address, {
              type: 'token_purchase',
              status: 'completed',
              amount: amountInEur.toFixed(2),
              currency: 'EUR',
              tokensAmount: tokensAmount.toFixed(2),
              description: `Purchased ${tokensAmount.toFixed(2)} $TAI tokens with ${cryptoAmount.toFixed(6)} ${cryptoSymbol}`,
              txHash: finalTxHash,
              paymentMethod: 'crypto',
              metadata: {
                cryptoAmount: cryptoAmount.toFixed(6),
                cryptoCurrency: cryptoSymbol,
                priceInEur: priceInEur,
                etherscanUrl: etherscanUrl,
              },
            });
            
            if (transaction) {
              console.log('Transaction saved successfully:', transaction.id);
              
              // Добавить токены в портфель
              // Цена 1 $TAI токена = 1 EUR (фиксированная цена)
              const tokenPricePerUnit = 1; // 1 $TAI = 1 EUR
              await addToPortfolio(user.address, {
                type: 'token',
                symbol: 'TAI',
                name: 'Tokenized Asset Investment',
                quantity: tokensAmount,
                purchasePrice: tokenPricePerUnit,
                currentPrice: tokenPricePerUnit, // Текущая цена равна цене покупки (1 EUR)
                purchaseDate: Date.now(),
                currency: 'EUR',
                totalCost: amountInEur, // Стоимость покупки в EUR
              });
              
              console.log(`Added ${tokensAmount} $TAI tokens to portfolio`);
            } else {
              console.error('Failed to save transaction');
            }
          }
          
          setMessage({ 
            type: 'success', 
            text: `Successfully purchased ${parseFloat(amount).toFixed(2)} $TAI tokens!`,
            etherscanUrl: etherscanUrl,
          });
          
          // Очистить поле суммы
          setAmount('');
          setLoading(false);
          
          // Показать ссылку на Etherscan в консоли для отладки
          console.log(`Transaction confirmed: ${etherscanUrl}`);
        } else {
          throw new Error('Transaction failed. Please try again.');
        }
      } else {
        // Create Stripe Checkout Session
        const response = await fetch('/api/stripe/create-checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: parseFloat(amount),
            currency: 'eur',
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create checkout session');
        }

        // Redirect to Stripe Checkout
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error processing purchase:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to process purchase' });
      setLoading(false);
    }
  };

  const tokensAmount = amount ? parseFloat(amount).toFixed(2) : '0.00';

  return (
    <section className="relative py-20">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm"></div>
      <div className="relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-accent-yellow mb-6">
              Buy $TAI Tokens
            </h1>
            <p className="text-xl md:text-2xl text-primary-gray-lighter max-w-3xl mx-auto">
              Purchase tokens using credit card or cryptocurrency. Start your investment journey today.
            </p>
          </div>

          {/* Уникальность $TAI */}
          <div className="max-w-5xl mx-auto mb-8">
            <div className="bg-primary-gray rounded-2xl p-8 md:p-12 border-2 border-primary-gray-light shadow-lg mb-6">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-yellow rounded-full mb-4">
                  <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-accent-yellow mb-3">Why $TAI is Your Universal Investment Token</h2>
                <p className="text-lg text-primary-gray-lighter max-w-2xl mx-auto">
                  A revolutionary token designed for simplicity, security, and guaranteed returns
                </p>
              </div>
              
              <div className="text-left space-y-6 text-primary-gray-lighter leading-relaxed">
                <div className="bg-black rounded-xl p-6 border border-primary-gray-light">
                  <p className="text-lg">
                    <strong className="text-white text-xl">$TAI (Tokenized Asset Investment)</strong> is the universal token powering our entire investment ecosystem. Unlike other platforms, we've created a unified currency that simplifies your investment experience while providing unmatched security and guarantees.
                  </p>
                </div>

                <div className="bg-primary-gray rounded-xl p-6 border-2 border-primary-gray-light">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-black border-2 border-primary-gray-light rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-accent-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Guaranteed Returns Protection</h3>
                      <p className="text-primary-gray-lighter">
                        Even if our professional traders face market downturns, <strong className="text-white">we guarantee dividend payments to all investors</strong>. This is possible because we maintain a substantial reserve fund specifically designed to cover all investment obligations, regardless of trading performance.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white mb-6 text-center">Our Unique Value Proposition</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-black rounded-xl p-5 border border-primary-gray-light hover:shadow-md hover:border-accent-yellow transition-all">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border border-primary-gray-light bg-primary-gray">
                          <svg className="w-5 h-5 text-accent-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-white mb-1">Reserve Fund Protection</h4>
                          <p className="text-sm text-primary-gray-lighter">Every investment is backed by our reserve fund, ensuring your returns are never at risk from market volatility or trading losses</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-black rounded-xl p-5 border border-primary-gray-light hover:shadow-md hover:border-accent-yellow transition-all">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border border-primary-gray-light bg-primary-gray">
                          <svg className="w-5 h-5 text-accent-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-white mb-1">Universal Token</h4>
                          <p className="text-sm text-primary-gray-lighter">One token ($TAI) for all investments - stocks, commodities, crypto, and more - eliminating the complexity of managing multiple currencies</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-black rounded-xl p-5 border border-primary-gray-light hover:shadow-md hover:border-accent-yellow transition-all">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border border-primary-gray-light bg-primary-gray">
                          <svg className="w-5 h-5 text-accent-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-white mb-1">Transparent Operations</h4>
                          <p className="text-sm text-primary-gray-lighter">All transactions are recorded on the blockchain, providing complete transparency and auditability</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-black rounded-xl p-5 border border-primary-gray-light hover:shadow-md hover:border-accent-yellow transition-all">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border border-primary-gray-light bg-primary-gray">
                          <svg className="w-5 h-5 text-accent-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-white mb-1">Professional Trading Team</h4>
                          <p className="text-sm text-primary-gray-lighter">Our experienced traders work with your pooled investments, but their performance doesn't affect your guaranteed returns</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-black rounded-xl p-5 border border-primary-gray-light hover:shadow-md hover:border-accent-yellow transition-all md:col-span-2">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border border-primary-gray-light bg-primary-gray">
                          <svg className="w-5 h-5 text-accent-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-white mb-1">Flexible Investments</h4>
                          <p className="text-sm text-primary-gray-lighter">Start from just €10 and access institutional-grade investment opportunities</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Счетчик привлеченных средств */}
            <div className="bg-primary-gray rounded-xl p-6 border border-accent-yellow relative overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Левая часть - счётчик */}
                <div>
                  <div className="text-sm text-primary-gray-lighter mb-2">Total Funds Raised</div>
                  <div className="text-4xl md:text-5xl font-bold text-accent-yellow mb-2">
                    <AnimatedCounter
                      value={totalRaised}
                      prefix="€"
                      duration={800}
                      decimals={2}
                    />
                  </div>
                  <div className="text-sm text-primary-gray-lighter mb-3">
                    Live updates • Growing every day
                  </div>
                </div>
                
                {/* Правая часть - график */}
                <div className="flex justify-center md:justify-end">
                  <FundsChart currentValue={totalRaised} />
                </div>
              </div>
              
              {/* Бегущая строка */}
              {activityMessages.length > 0 && (
                <div className="mt-4 pt-4 border-t border-primary-gray-light">
                  <div className="relative overflow-hidden h-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="whitespace-nowrap flex space-x-8 animate-scroll">
                        {[...activityMessages, ...activityMessages].map((msg, idx) => (
                          <span
                            key={`${msg.id}-${idx}`}
                            className={`text-xs ${
                              msg.type === 'investment' 
                                ? 'text-accent-yellow font-medium' 
                                : msg.type === 'withdrawal'
                                ? 'text-accent-yellow-dark'
                                : msg.type === 'ton_auth'
                                ? 'text-accent-yellow-light font-medium'
                                : 'text-accent-yellow'
                            }`}
                          >
                            {msg.text}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        <div className="bg-primary-gray rounded-2xl shadow-xl border border-primary-gray-light p-8 md:p-12">
          {/* Payment Method Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-primary-gray-lighter mb-4">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-accent-yellow bg-black'
                    : 'border-primary-gray-light hover:border-accent-yellow'
                }`}
              >
                <div className="text-2xl mb-2">💳</div>
                <div className="font-semibold text-white">Credit/Debit Card</div>
                <div className="text-sm text-primary-gray-lighter mt-1">Visa, Mastercard, etc.</div>
              </button>
              
              <button
                onClick={() => setPaymentMethod('crypto')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'crypto'
                    ? 'border-accent-yellow bg-black'
                    : 'border-primary-gray-light hover:border-accent-yellow'
                }`}
              >
                <div className="text-2xl mb-2">₿</div>
                <div className="font-semibold text-white">Cryptocurrency</div>
                <div className="text-sm text-primary-gray-lighter mt-1">ETH, USDT, WBTC</div>
              </button>
            </div>
          </div>

          {/* Crypto Currency Selection */}
          {paymentMethod === 'crypto' && isConnected && (
            <div className="mb-8">
              <label className="block text-sm font-medium text-primary-gray-lighter mb-4">
                Select Cryptocurrency
              </label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setCryptoCurrency('ETH')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    cryptoCurrency === 'ETH'
                      ? 'border-accent-yellow bg-black'
                      : 'border-primary-gray-light hover:border-accent-yellow'
                  }`}
                >
                  <div className="font-semibold text-white mb-1">ETH</div>
                  <div className="text-xs text-primary-gray-lighter">Ethereum</div>
                </button>
                
                <button
                  onClick={() => setCryptoCurrency('USDT')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    cryptoCurrency === 'USDT'
                      ? 'border-accent-yellow bg-black'
                      : 'border-primary-gray-light hover:border-accent-yellow'
                  }`}
                >
                  <div className="font-semibold text-white mb-1">USDT</div>
                  <div className="text-xs text-primary-gray-lighter">Tether</div>
                </button>
                
                <button
                  onClick={() => setCryptoCurrency('WBTC')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    cryptoCurrency === 'WBTC'
                      ? 'border-accent-yellow bg-black'
                      : 'border-primary-gray-light hover:border-accent-yellow'
                  }`}
                >
                  <div className="font-semibold text-white mb-1">WBTC</div>
                  <div className="text-xs text-primary-gray-lighter">Wrapped Bitcoin</div>
                </button>
              </div>
              <p className="mt-2 text-xs text-primary-gray-lighter">
                {cryptoCurrency === 'WBTC' && 'WBTC is Bitcoin on Ethereum network. Use this to pay with Bitcoin.'}
                {cryptoCurrency === 'USDT' && 'USDT (Tether) - Stablecoin pegged to USD.'}
                {cryptoCurrency === 'ETH' && 'ETH (Ethereum) - Native Ethereum cryptocurrency.'}
              </p>
            </div>
          )}

          {/* Amount Input */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-primary-gray-lighter mb-2">
              Amount (EUR)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary-gray-lighter text-lg">€</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Minimum: €${minAmount}`}
                min={minAmount}
                step="0.01"
                className="w-full pl-10 pr-4 py-4 bg-black border-2 border-primary-gray-light rounded-xl focus:ring-2 focus:ring-accent-yellow focus:border-accent-yellow text-lg text-white"
              />
            </div>
            <p className="mt-2 text-sm text-primary-gray-lighter">
              Minimum purchase: €{minAmount}
            </p>
          </div>

          {/* Token Calculation */}
          {amount && parseFloat(amount) >= minAmount && (
            <div className="mb-8 p-6 bg-black border border-accent-yellow rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-primary-gray-lighter">You will receive:</span>
                <span className="text-2xl font-bold text-accent-yellow">
                  {tokensAmount} $TAI
                </span>
              </div>
              <div className="text-sm text-primary-gray-lighter">
                Token price: 1 $TAI = €{tokenPrice}
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-primary-gray border border-accent-yellow text-accent-yellow'
                : 'bg-primary-gray border border-red-500 text-red-400'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <p>{message.text}</p>
                {message.etherscanUrl && (
                  <a
                    href={message.etherscanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-yellow hover:text-accent-yellow-light underline text-sm whitespace-nowrap flex-shrink-0"
                  >
                    View on Etherscan →
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Buy Button */}
          <button
            onClick={handleBuy}
            disabled={!amount || parseFloat(amount) < minAmount || loading}
            className="w-full py-4 bg-accent-yellow text-black font-semibold text-lg rounded-xl hover:bg-accent-yellow-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Processing...'
              : paymentMethod === 'crypto' && !isConnected
                ? 'Connect Wallet to Continue'
                : `Buy ${tokensAmount} $TAI Tokens`}
          </button>

          {/* Crypto Wallet Connection Notice */}
          {paymentMethod === 'crypto' && !isConnected && (
            <div className="mt-4 p-4 bg-primary-gray border border-accent-yellow rounded-lg">
              <p className="text-sm text-accent-yellow">
                Please connect your wallet to purchase tokens with cryptocurrency. We support MetaMask and other Web3 wallets.
              </p>
            </div>
          )}

          {/* Info Section */}
          <div className="mt-8 pt-8 border-t border-primary-gray-light">
            <h3 className="font-semibold text-white mb-4">What are $TAI tokens?</h3>
            <ul className="space-y-2 text-sm text-primary-gray-lighter">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>$TAI tokens are used to invest in tokenized assets on our platform</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Minimum investment starts from €10 (equivalent in $TAI)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Use tokens to invest in stocks, commodities, and crypto assets</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Secure and transparent transactions on the blockchain</span>
              </li>
            </ul>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}

export default memo(BuyTokensSection);
