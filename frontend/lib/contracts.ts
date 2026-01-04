import { BrowserProvider, Contract } from 'ethers';

// ABI для InvestmentPool (упрощенная версия, основные функции)
export const INVESTMENT_POOL_ABI = [
  "function invest() payable",
  "function withdraw(uint256 investmentIndex)",
  "function withdrawAll()",
  "function getInvestment(address investor, uint256 index) view returns (uint256 amount, uint256 depositTime, uint256 withdrawTime, bool withdrawn, uint256 estimatedReturn)",
  "function getUserInvestments(address investor) view returns (uint256 totalCount, uint256 activeCount, uint256 totalInvestedAmount, uint256 totalAvailableToWithdraw)",
  "function getPoolStats() view returns (uint256 _totalInvested, uint256 _totalWithdrawn, uint256 _totalActiveInvestments, uint256 _currentBalance, uint256 _interestRate, uint256 _platformFeePercent)",
  "function MIN_INVESTMENT() view returns (uint256)",
  "function INVESTMENT_PERIOD() view returns (uint256)",
  "function interestRate() view returns (uint256)",
  "event InvestmentMade(address indexed investor, uint256 amount, uint256 withdrawTime)",
  "event Withdrawal(address indexed investor, uint256 principal, uint256 interest, uint256 fee)"
];

// ABI для Lottery (упрощенная версия)
export const LOTTERY_ABI = [
  "function buyTicket() payable",
  "function getPlayerTickets(address player) view returns (uint256[] memory)",
  "function getPrizePool() view returns (uint256)",
  "function getLotteryStatus() view returns (bool active, bool pendingSelection, uint256 ticketsSold, uint256 totalTickets, uint256 prizePool)",
  "function ticketPrice() view returns (uint256)",
  "function maxTickets() view returns (uint256)",
  "event TicketPurchased(address indexed player, uint256 ticketId)"
];

// ABI для BitcoinPriceBet
export const BTC_BET_ABI = [
  "function placeBet(uint256 _predictedPrice) payable",
  "function getBet(address player) view returns (address, uint256 predictedPrice, uint256 timestamp, bool exists)",
  "function getBetStatus() view returns (bool _betsClosed, bool _resultDetermined, uint256 _playerCount, uint256 _prizePool, uint256 _timeUntilEnd, uint256 _timeUntilResult, int256 _finalPrice)",
  "function getCurrentBTCPrice() view returns (int256)",
  "function betAmount() view returns (uint256)",
  "event BetPlaced(address indexed player, uint256 predictedPrice, uint256 timestamp)"
];

// Адреса контрактов (будут настроены через переменные окружения)
export const getContractAddresses = () => {
  return {
    investmentPool: process.env.NEXT_PUBLIC_INVESTMENT_POOL_ADDRESS || '',
    lottery: process.env.NEXT_PUBLIC_LOTTERY_ADDRESS || '',
    btcBet: process.env.NEXT_PUBLIC_BTC_BET_ADDRESS || '',
  };
};

// Получить провайдер
export const getProvider = () => {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    return new BrowserProvider((window as any).ethereum);
  }
  return null;
};

// Получить signer
export const getSigner = async () => {
  const provider = getProvider();
  if (!provider) return null;
  return await provider.getSigner();
};

// Получить контракт InvestmentPool
export const getInvestmentPoolContract = async (address?: string) => {
  try {
    // Проверить наличие провайдера без запроса разрешений
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      return null;
    }

    const signer = await getSigner();
    if (!signer) return null;
    
    const addresses = getContractAddresses();
    const contractAddress = address || addresses.investmentPool;
    if (!contractAddress || contractAddress === '') {
      // Контракт не развернут - это нормально, не логируем как ошибку
      return null;
    }
    
    return new Contract(contractAddress, INVESTMENT_POOL_ABI, signer);
  } catch (error: any) {
    // Игнорируем ошибки, если просто нет подключения или контракта
    if (error.code !== 'UNSUPPORTED_OPERATION' && !error.message?.includes('user rejected')) {
      console.warn('Failed to get InvestmentPool contract:', error.message);
    }
    return null;
  }
};

// Получить контракт Lottery
export const getLotteryContract = async (address?: string) => {
  const signer = await getSigner();
  if (!signer) return null;
  
  const addresses = getContractAddresses();
  const contractAddress = address || addresses.lottery;
  if (!contractAddress) return null;
  
  return new Contract(contractAddress, LOTTERY_ABI, signer);
};

// Получить контракт BitcoinPriceBet
export const getBTCBetContract = async (address?: string) => {
  const signer = await getSigner();
  if (!signer) return null;
  
  const addresses = getContractAddresses();
  const contractAddress = address || addresses.btcBet;
  if (!contractAddress) return null;
  
  return new Contract(contractAddress, BTC_BET_ABI, signer);
};

