const hre = require("hardhat");

/**
 * @notice Деплой контракта лотереи
 * 
 * Перед деплоем убедитесь что:
 * 1. У вас есть Chainlink subscription ID
 * 2. У вас есть LINK токены на балансе subscription
 * 3. Вы знаете параметры VRF для вашей сети
 * 
 * Параметры VRF для разных сетей:
 * - Sepolia: https://docs.chain.link/vrf/v2/subscription/supported-networks
 */
async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Деплой контракта с аккаунта:", deployer.address);
  console.log("Баланс аккаунта:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Параметры лотереи
  const ticketPrice = hre.ethers.parseEther("0.01"); // 0.01 ETH за билет
  const maxTickets = 100; // Максимум 100 билетов

  // VRF параметры (нужно настроить для вашей сети)
  // Для Sepolia testnet:
  const vrfCoordinatorV2 = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625"; // Sepolia VRF Coordinator
  const keyHash = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c"; // Sepolia key hash
  const subscriptionId = 0; // TODO: Замените на ваш subscription ID
  const callbackGasLimit = 500000; // Gas limit для callback

  console.log("\nПараметры лотереи:");
  console.log("- Цена билета:", hre.ethers.formatEther(ticketPrice), "ETH");
  console.log("- Максимум билетов:", maxTickets);
  console.log("- VRF Coordinator:", vrfCoordinatorV2);
  console.log("- Subscription ID:", subscriptionId);

  if (subscriptionId === 0) {
    console.log("\n⚠️  ВНИМАНИЕ: Subscription ID не настроен!");
    console.log("Создайте subscription на https://vrf.chain.link/");
    console.log("И обновите subscriptionId в этом файле.");
  }

  // Деплой контракта
  const Lottery = await hre.ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy(
    ticketPrice,
    maxTickets,
    vrfCoordinatorV2,
    keyHash,
    subscriptionId,
    callbackGasLimit
  );

  await lottery.waitForDeployment();

  const address = await lottery.getAddress();
  console.log("\n✅ Контракт деплоен по адресу:", address);

  // Добавление контракта как consumer в subscription (нужно сделать вручную через UI или скрипт)
  console.log("\n⚠️  Не забудьте добавить контракт как consumer в ваш Chainlink subscription!");
  console.log("Адрес контракта для добавления:", address);
  console.log("Или используйте скрипт addConsumer.js после деплоя");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

