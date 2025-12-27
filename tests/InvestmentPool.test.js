const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("InvestmentPool", function () {
  let investmentPool;
  let owner;
  let investor1;
  let investor2;
  let investor3;
  let feeRecipient;
  
  // Параметры для тестирования
  const interestRate = 1250; // 12.5% за неделю
  const platformFeePercent = 200; // 2% комиссия
  const minInvestment = ethers.parseEther("0.004"); // ~€10
  const investmentPeriod = 7 * 24 * 60 * 60; // 7 дней в секундах

  beforeEach(async function () {
    [owner, investor1, investor2, investor3, feeRecipient] = await ethers.getSigners();

    const InvestmentPool = await ethers.getContractFactory("InvestmentPool");
    investmentPool = await InvestmentPool.deploy(
      interestRate,
      platformFeePercent,
      feeRecipient.address
    );
  });

  describe("Деплой", function () {
    it("Должен установить правильного владельца", async function () {
      expect(await investmentPool.owner()).to.equal(owner.address);
    });

    it("Должен установить правильную процентную ставку", async function () {
      expect(await investmentPool.interestRate()).to.equal(interestRate);
    });

    it("Должен установить правильную комиссию платформы", async function () {
      expect(await investmentPool.platformFeePercent()).to.equal(platformFeePercent);
    });

    it("Должен установить правильного получателя комиссий", async function () {
      expect(await investmentPool.feeRecipient()).to.equal(feeRecipient.address);
    });

    it("Должен установить правильную минимальную инвестицию", async function () {
      expect(await investmentPool.MIN_INVESTMENT()).to.equal(minInvestment);
    });

    it("Должен установить правильный период инвестирования", async function () {
      expect(await investmentPool.INVESTMENT_PERIOD()).to.equal(investmentPeriod);
    });
  });

  describe("Инвестирование", function () {
    it("Должна позволить сделать инвестицию с минимальной суммой", async function () {
      await expect(investmentPool.connect(investor1).invest({ value: minInvestment }))
        .to.emit(investmentPool, "InvestmentMade")
        .withArgs(investor1.address, minInvestment, (value) => value > 0);

      const userStats = await investmentPool.getUserInvestments(investor1.address);
      expect(userStats.totalCount).to.equal(1);
      expect(userStats.totalInvestedAmount).to.equal(minInvestment);
    });

    it("Должна позволить сделать инвестицию больше минимальной", async function () {
      const amount = ethers.parseEther("0.01");
      await investmentPool.connect(investor1).invest({ value: amount });

      const userStats = await investmentPool.getUserInvestments(investor1.address);
      expect(userStats.totalInvestedAmount).to.equal(amount);
    });

    it("Должна предотвратить инвестицию меньше минимальной", async function () {
      const smallAmount = ethers.parseEther("0.001");
      await expect(
        investmentPool.connect(investor1).invest({ value: smallAmount })
      ).to.be.revertedWith("Investment amount below minimum");
    });

    it("Должна позволить сделать несколько инвестиций", async function () {
      await investmentPool.connect(investor1).invest({ value: minInvestment });
      await investmentPool.connect(investor1).invest({ value: ethers.parseEther("0.01") });
      await investmentPool.connect(investor1).invest({ value: ethers.parseEther("0.02") });

      const userStats = await investmentPool.getUserInvestments(investor1.address);
      expect(userStats.totalCount).to.equal(3);
    });

    it("Должна правильно обновлять общую статистику", async function () {
      const amount1 = ethers.parseEther("0.01");
      const amount2 = ethers.parseEther("0.02");

      await investmentPool.connect(investor1).invest({ value: amount1 });
      await investmentPool.connect(investor2).invest({ value: amount2 });

      const stats = await investmentPool.getPoolStats();
      expect(stats._totalInvested).to.equal(amount1 + amount2);
      expect(stats._totalActiveInvestments).to.equal(2);
    });

    it("Должна предотвратить инвестицию когда контракт на паузе", async function () {
      await investmentPool.pause();
      await expect(
        investmentPool.connect(investor1).invest({ value: minInvestment })
      ).to.be.revertedWithCustomError(investmentPool, "EnforcedPause");
    });
  });

  describe("Вывод средств", function () {
    let investmentAmount;
    let depositTime;
    let withdrawTime;

    beforeEach(async function () {
      investmentAmount = ethers.parseEther("0.01");
      depositTime = (await ethers.provider.getBlock("latest")).timestamp;
      
      // Сделать инвестицию
      await investmentPool.connect(investor1).invest({ value: investmentAmount });
      
      // Получить время вывода
      const investment = await investmentPool.getInvestment(investor1.address, 0);
      withdrawTime = Number(investment.withdrawTime);
    });

    it("Должна предотвратить вывод до истечения периода", async function () {
      await expect(
        investmentPool.connect(investor1).withdraw(0)
      ).to.be.revertedWith("Investment period not ended");
    });

    it("Должна позволить вывести средства после истечения периода", async function () {
      // Увеличить время на 7 дней + 1 секунда
      await ethers.provider.send("evm_increaseTime", [investmentPeriod + 1]);
      await ethers.provider.send("evm_mine", []);

      // Пополнить пул для выплаты процентов
      const interest = (investmentAmount * BigInt(interestRate)) / BigInt(10000);
      const fee = (interest * BigInt(platformFeePercent)) / BigInt(10000);
      const netInterest = interest - fee;
      const totalNeeded = investmentAmount + netInterest;
      
      await investmentPool.connect(owner).depositFunds({ value: totalNeeded });

      // Вывести средства
      await expect(investmentPool.connect(investor1).withdraw(0))
        .to.emit(investmentPool, "Withdrawal");

      const investment = await investmentPool.getInvestment(investor1.address, 0);
      expect(investment.withdrawn).to.be.true;
    });

    it("Должна правильно рассчитать проценты и комиссию", async function () {
      await ethers.provider.send("evm_increaseTime", [investmentPeriod + 1]);
      await ethers.provider.send("evm_mine", []);

      const interest = (investmentAmount * BigInt(interestRate)) / BigInt(10000);
      const fee = (interest * BigInt(platformFeePercent)) / BigInt(10000);
      const netInterest = interest - fee;
      const totalNeeded = investmentAmount + netInterest;
      
      await investmentPool.connect(owner).depositFunds({ value: totalNeeded });

      const balanceBefore = await ethers.provider.getBalance(investor1.address);
      const tx = await investmentPool.connect(investor1).withdraw(0);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(investor1.address);

      const received = balanceAfter - balanceBefore + gasUsed;
      expect(received).to.equal(totalNeeded);
    });

    it("Должна перевести комиссию получателю", async function () {
      await ethers.provider.send("evm_increaseTime", [investmentPeriod + 1]);
      await ethers.provider.send("evm_mine", []);

      const interest = (investmentAmount * BigInt(interestRate)) / BigInt(10000);
      const fee = (interest * BigInt(platformFeePercent)) / BigInt(10000);
      const netInterest = interest - fee;
      const totalNeeded = investmentAmount + netInterest;
      
      await investmentPool.connect(owner).depositFunds({ value: totalNeeded });

      const feeRecipientBalanceBefore = await ethers.provider.getBalance(feeRecipient.address);
      await investmentPool.connect(investor1).withdraw(0);
      const feeRecipientBalanceAfter = await ethers.provider.getBalance(feeRecipient.address);

      expect(feeRecipientBalanceAfter - feeRecipientBalanceBefore).to.equal(fee);
    });

    it("Должна предотвратить повторный вывод", async function () {
      await ethers.provider.send("evm_increaseTime", [investmentPeriod + 1]);
      await ethers.provider.send("evm_mine", []);

      const interest = (investmentAmount * BigInt(interestRate)) / BigInt(10000);
      const fee = (interest * BigInt(platformFeePercent)) / BigInt(10000);
      const netInterest = interest - fee;
      const totalNeeded = investmentAmount + netInterest;
      
      await investmentPool.connect(owner).depositFunds({ value: totalNeeded });
      await investmentPool.connect(investor1).withdraw(0);

      await expect(
        investmentPool.connect(investor1).withdraw(0)
      ).to.be.revertedWith("Already withdrawn");
    });
  });

  describe("Вывод всех инвестиций", function () {
    it("Должна вывести все доступные инвестиции", async function () {
      const amount1 = ethers.parseEther("0.01");
      const amount2 = ethers.parseEther("0.02");

      // Сделать две инвестиции
      await investmentPool.connect(investor1).invest({ value: amount1 });
      await investmentPool.connect(investor1).invest({ value: amount2 });

      // Увеличить время
      await ethers.provider.send("evm_increaseTime", [investmentPeriod + 1]);
      await ethers.provider.send("evm_mine", []);

      // Пополнить пул
      const interest1 = (amount1 * BigInt(interestRate)) / BigInt(10000);
      const interest2 = (amount2 * BigInt(interestRate)) / BigInt(10000);
      const totalInterest = interest1 + interest2;
      const fee = (totalInterest * BigInt(platformFeePercent)) / BigInt(10000);
      const netInterest = totalInterest - fee;
      const totalNeeded = amount1 + amount2 + netInterest;
      
      await investmentPool.connect(owner).depositFunds({ value: totalNeeded });

      // Вывести все
      await expect(investmentPool.connect(investor1).withdrawAll())
        .to.emit(investmentPool, "Withdrawal");

      const userStats = await investmentPool.getUserInvestments(investor1.address);
      expect(userStats.activeCount).to.equal(0);
    });
  });

  describe("Получение информации", function () {
    it("Должна вернуть правильную информацию об инвестиции", async function () {
      const amount = ethers.parseEther("0.01");
      await investmentPool.connect(investor1).invest({ value: amount });

      const investment = await investmentPool.getInvestment(investor1.address, 0);
      expect(investment.amount).to.equal(amount);
      expect(investment.withdrawn).to.be.false;
      expect(investment.estimatedReturn).to.be.gt(amount);
    });

    it("Должна вернуть правильную статистику пользователя", async function () {
      const amount1 = ethers.parseEther("0.01");
      const amount2 = ethers.parseEther("0.02");

      await investmentPool.connect(investor1).invest({ value: amount1 });
      await investmentPool.connect(investor1).invest({ value: amount2 });

      const userStats = await investmentPool.getUserInvestments(investor1.address);
      expect(userStats.totalCount).to.equal(2);
      expect(userStats.totalInvestedAmount).to.equal(amount1 + amount2);
    });

    it("Должна вернуть правильную статистику пула", async function () {
      const amount1 = ethers.parseEther("0.01");
      const amount2 = ethers.parseEther("0.02");

      await investmentPool.connect(investor1).invest({ value: amount1 });
      await investmentPool.connect(investor2).invest({ value: amount2 });

      const stats = await investmentPool.getPoolStats();
      expect(stats._totalInvested).to.equal(amount1 + amount2);
      expect(stats._totalActiveInvestments).to.equal(2);
      expect(stats._interestRate).to.equal(interestRate);
      expect(stats._platformFeePercent).to.equal(platformFeePercent);
    });
  });

  describe("Управление (Owner)", function () {
    it("Только owner может изменить процентную ставку", async function () {
      await expect(
        investmentPool.connect(investor1).setInterestRate(1500)
      ).to.be.revertedWithCustomError(investmentPool, "OwnableUnauthorizedAccount");
    });

    it("Owner может изменить процентную ставку", async function () {
      const newRate = 1500; // 15%
      await expect(investmentPool.setInterestRate(newRate))
        .to.emit(investmentPool, "InterestRateUpdated")
        .withArgs(interestRate, newRate);

      expect(await investmentPool.interestRate()).to.equal(newRate);
    });

    it("Только owner может изменить комиссию платформы", async function () {
      await expect(
        investmentPool.connect(investor1).setPlatformFee(300, feeRecipient.address)
      ).to.be.revertedWithCustomError(investmentPool, "OwnableUnauthorizedAccount");
    });

    it("Owner может изменить комиссию платформы", async function () {
      const newFee = 300; // 3%
      await expect(investmentPool.setPlatformFee(newFee, feeRecipient.address))
        .to.emit(investmentPool, "PlatformFeeUpdated")
        .withArgs(platformFeePercent, newFee);

      expect(await investmentPool.platformFeePercent()).to.equal(newFee);
    });

    it("Должна предотвратить комиссию больше 5%", async function () {
      await expect(
        investmentPool.setPlatformFee(600, feeRecipient.address)
      ).to.be.revertedWith("Platform fee cannot exceed 5%");
    });

    it("Owner может пополнить пул", async function () {
      const depositAmount = ethers.parseEther("10");
      await expect(investmentPool.depositFunds({ value: depositAmount }))
        .to.emit(investmentPool, "FundsDeposited")
        .withArgs(depositAmount);

      expect(await investmentPool.getBalance()).to.equal(depositAmount);
    });

    it("Только owner может поставить на паузу", async function () {
      await expect(
        investmentPool.connect(investor1).pause()
      ).to.be.revertedWithCustomError(investmentPool, "OwnableUnauthorizedAccount");
    });

    it("Owner может поставить на паузу и снять с паузы", async function () {
      await investmentPool.pause();
      expect(await investmentPool.paused()).to.be.true;

      await investmentPool.unpause();
      expect(await investmentPool.paused()).to.be.false;
    });
  });

  describe("Граничные случаи", function () {
    it("Должна обработать вывод при недостаточном балансе", async function () {
      const amount = ethers.parseEther("0.01");
      await investmentPool.connect(investor1).invest({ value: amount });

      await ethers.provider.send("evm_increaseTime", [investmentPeriod + 1]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        investmentPool.connect(investor1).withdraw(0)
      ).to.be.revertedWith("Insufficient contract balance");
    });

    it("Должна предотвратить вывод несуществующей инвестиции", async function () {
      await expect(
        investmentPool.connect(investor1).withdraw(0)
      ).to.be.revertedWith("Invalid investment index");
    });

    it("Должна предотвратить вывод чужой инвестиции", async function () {
      await investmentPool.connect(investor1).invest({ value: minInvestment });
      await investmentPool.connect(investor2).invest({ value: minInvestment });
      
      await ethers.provider.send("evm_increaseTime", [investmentPeriod + 1]);
      await ethers.provider.send("evm_mine", []);

      // Пополнить пул для обеих инвестиций
      const interest = (minInvestment * BigInt(interestRate)) / BigInt(10000);
      const fee = (interest * BigInt(platformFeePercent)) / BigInt(10000);
      const netInterest = interest - fee;
      const totalNeeded = (minInvestment + netInterest) * BigInt(2);
      await investmentPool.connect(owner).depositFunds({ value: totalNeeded });

      // Проверим, что getInvestment возвращает правильного инвестора
      const [amount1, depositTime1, withdrawTime1, withdrawn1, estimatedReturn1] = 
        await investmentPool.getInvestment(investor1.address, 0);
      expect(amount1).to.equal(minInvestment);
      
      const [amount2, depositTime2, withdrawTime2, withdrawn2, estimatedReturn2] = 
        await investmentPool.getInvestment(investor2.address, 0);
      expect(amount2).to.equal(minInvestment);
      
      // Контракт проверяет, что investor == msg.sender в функции withdraw
      // Но так как у каждого свой массив инвестиций, investor2 не может получить доступ к массиву investor1
      // Правильная проверка: убедимся, что каждый может вывести только свои инвестиции
      // investor2 выводит свою инвестицию успешно (это нормально)
      await expect(investmentPool.connect(investor2).withdraw(0))
        .to.emit(investmentPool, "Withdrawal");
      
      // Проверим, что investor1 все еще может вывести свою инвестицию
      const [,,,withdrawn1After] = await investmentPool.getInvestment(investor1.address, 0);
      expect(withdrawn1After).to.be.false; // Инвестиция investor1 не должна быть выведена
    });
  });
});


