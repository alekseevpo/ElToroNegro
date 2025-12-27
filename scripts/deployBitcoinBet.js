const hre = require("hardhat");

/**
 * @notice Деплой контракта ставок на цену биткоина
 * 
 * Перед деплоем убедитесь что:
 * 1. Вы знаете адрес Chainlink Price Feed для BTC/USD в вашей сети
 * 2. Вы правильно рассчитали времена для понедельника-пятницы
 * 
 * Параметры Chainlink Price Feed для разных сетей:
 * - Sepolia: https://docs.chain.link/data-feeds/price-feeds/addresses
 * - Ethereum Mainnet: https://docs.chain.link/data-feeds/price-feeds/addresses
 */
async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Деплой контракта BitcoinPriceBet с аккаунта:", deployer.address);
  console.log("Баланс аккаунта:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Параметры ставки
  const betAmount = hre.ethers.parseEther("0.01"); // 0.01 ETH за ставку
  
  // Временные параметры (пример для следующей недели)
  // В реальности нужно вычислить точное время начала понедельника
  const now = Math.floor(Date.now() / 1000);
  const daysUntilMonday = (8 - new Date(now * 1000).getDay()) % 7 || 7;
  const betStartTime = now + (daysUntilMonday * 24 * 60 * 60); // Следующий понедельник 00:00 UTC
  const betDuration = 4 * 24 * 60 * 60; // 4 дня (понедельник-четверг)
  const resultDelay = 24 * 60 * 60; // 1 день (до пятницы)
  
  // Chainlink Price Feed адреса для BTC/USD
  // Sepolia testnet:
  const btcPriceFeed = "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43"; // Sepolia BTC/USD
  // Ethereum Mainnet: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c"
  
  const ownerCommissionPercent = 200; // 2% комиссия (200 basis points)

  console.log("\nПараметры ставки:");
  console.log("- Сумма ставки:", hre.ethers.formatEther(betAmount), "ETH");
  console.log("- Время начала (понедельник):", new Date(betStartTime * 1000).toISOString());
  console.log("- Время окончания приема ставок (четверг):", new Date((betStartTime + betDuration) * 1000).toISOString());
  console.log("- Время получения результата (пятница):", new Date((betStartTime + betDuration + resultDelay) * 1000).toISOString());
  console.log("- BTC Price Feed:", btcPriceFeed);
  console.log("- Комиссия owner:", ownerCommissionPercent / 100, "%");

  // Деплой контракта
  const BitcoinPriceBet = await hre.ethers.getContractFactory("BitcoinPriceBet");
  const bitcoinBet = await BitcoinPriceBet.deploy(
    btcPriceFeed,
    betAmount,
    betStartTime,
    betDuration,
    resultDelay,
    ownerCommissionPercent
  );

  await bitcoinBet.waitForDeployment();

  const address = await bitcoinBet.getAddress();
  console.log("\n✅ Контракт BitcoinPriceBet деплоен по адресу:", address);

  console.log("\n📝 Следующие шаги:");
  console.log("1. Убедитесь, что Chainlink Price Feed адрес корректен для вашей сети");
  console.log("2. Проверьте временные параметры (должны соответствовать понедельнику-пятнице)");
  console.log("3. После начала ставок пользователи могут вызвать placeBet(predictedPrice)");
  console.log("4. В пятницу owner должен вызвать determineWinners()");
  console.log("5. После определения победителей вызвать distributePrizes()");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

