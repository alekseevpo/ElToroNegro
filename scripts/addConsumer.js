const hre = require("hardhat");

/**
 * @notice Добавление контракта лотереи как consumer в Chainlink VRF subscription
 * 
 * Этот скрипт нужно запустить после деплоя контракта
 * чтобы контракт мог получать случайные числа от Chainlink VRF
 */
async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  // Адрес деплоенного контракта (замените на ваш)
  const lotteryAddress = process.env.LOTTERY_ADDRESS || "";
  const subscriptionId = process.env.SUBSCRIPTION_ID || 0;
  
  // Адрес VRF Coordinator (для Sepolia)
  const vrfCoordinatorAddress = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625";
  
  if (!lotteryAddress || subscriptionId === 0) {
    console.error("Ошибка: Установите LOTTERY_ADDRESS и SUBSCRIPTION_ID в .env файле");
    process.exit(1);
  }

  console.log("Добавление consumer в subscription...");
  console.log("Lottery адрес:", lotteryAddress);
  console.log("Subscription ID:", subscriptionId);
  console.log("VRF Coordinator:", vrfCoordinatorAddress);

  // Получаем интерфейс VRF Coordinator
  const VRFCoordinatorV2Interface = await hre.ethers.getContractAt(
    "VRFCoordinatorV2Interface",
    vrfCoordinatorAddress
  );

  // Добавляем consumer
  const tx = await VRFCoordinatorV2Interface.addConsumer(
    subscriptionId,
    lotteryAddress
  );
  
  console.log("Транзакция отправлена:", tx.hash);
  await tx.wait();
  
  console.log("✅ Consumer успешно добавлен в subscription!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

