const hre = require("hardhat");

/**
 * @notice Деплой контракта инвестиционного пула
 */
async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Деплой контракта InvestmentPool с аккаунта:", deployer.address);
  console.log("Баланс аккаунта:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Параметры пула
  const interestRate = 1250; // 12.5% за неделю (1250 basis points)
  const platformFeePercent = 200; // 2% комиссия платформы (200 basis points)
  const feeRecipient = deployer.address; // Адрес для получения комиссий

  console.log("\nПараметры инвестиционного пула:");
  console.log("- Процентная ставка:", interestRate / 100, "% за неделю");
  console.log("- Комиссия платформы:", platformFeePercent / 100, "%");
  console.log("- Получатель комиссий:", feeRecipient);
  console.log("- Минимальная инвестиция: ~0.004 ETH (€10)");
  console.log("- Период инвестирования: 7 дней");

  // Деплой контракта
  const InvestmentPool = await hre.ethers.getContractFactory("InvestmentPool");
  const investmentPool = await InvestmentPool.deploy(
    interestRate,
    platformFeePercent,
    feeRecipient
  );

  await investmentPool.waitForDeployment();

  const address = await investmentPool.getAddress();
  console.log("\n✅ Контракт InvestmentPool деплоен по адресу:", address);

  console.log("\n📝 Следующие шаги:");
  console.log("1. Убедитесь, что контракт имеет достаточный баланс для выплаты процентов");
  console.log("2. Пользователи могут инвестировать через функцию invest()");
  console.log("3. После 7 дней пользователи могут вывести средства через withdraw()");
  console.log("4. Owner может пополнять пул через depositFunds() для выплаты процентов");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

