const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * @notice Базовые тесты для контракта лотереи
 * @dev Для полноценного тестирования VRF функциональности нужен mock VRF Coordinator
 * или тестирование на локальной сети с настроенным VRF
 */
describe("Lottery", function () {
  let lottery;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let mockVRFCoordinator;
  
  // Параметры для тестирования
  const ticketPrice = ethers.parseEther("0.01");
  const maxTickets = 10;
  const keyHash = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";
  const subscriptionId = 1;
  const callbackGasLimit = 500000;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    // Для тестирования используем нулевой адрес как mock VRF Coordinator
    // В реальных тестах нужно использовать официальный VRFCoordinatorV2Mock
    const mockVRFAddress = "0x0000000000000000000000000000000000000000";

    const Lottery = await ethers.getContractFactory("Lottery");
    
    // Деплоим контракт (но VRF функциональность работать не будет без реального coordinator)
    // Это базовые тесты для проверки остальной функциональности
    lottery = await Lottery.deploy(
      ticketPrice,
      maxTickets,
      mockVRFAddress, // Mock адрес для базовых тестов
      keyHash,
      subscriptionId,
      callbackGasLimit
    );
  });

  describe("Деплой", function () {
    it("Должен установить правильного владельца", async function () {
      expect(await lottery.owner()).to.equal(owner.address);
    });

    it("Должен установить правильную цену билета", async function () {
      expect(await lottery.ticketPrice()).to.equal(ticketPrice);
    });

    it("Должен установить правильное максимальное количество билетов", async function () {
      expect(await lottery.maxTickets()).to.equal(maxTickets);
    });

    it("Лотерея должна быть активна при создании", async function () {
      const status = await lottery.getLotteryStatus();
      expect(status.active).to.be.true;
      expect(status.pendingSelection).to.be.false;
      expect(status.ticketsSold).to.equal(0);
    });
  });

  describe("Покупка билетов", function () {
    it("Должна позволить купить билет с правильной суммой", async function () {
      await expect(lottery.connect(addr1).buyTicket({ value: ticketPrice }))
        .to.emit(lottery, "TicketPurchased")
        .withArgs(addr1.address, 0);

      const tickets = await lottery.getPlayerTickets(addr1.address);
      expect(tickets.length).to.equal(1);
      expect(tickets[0]).to.equal(0);
    });

    it("Должна предотвратить покупку билета с неправильной суммой (меньше)", async function () {
      await expect(
        lottery.connect(addr1).buyTicket({ value: ethers.parseEther("0.005") })
      ).to.be.revertedWith("Incorrect ticket price");
    });

    it("Должна предотвратить покупку билета с неправильной суммой (больше)", async function () {
      await expect(
        lottery.connect(addr1).buyTicket({ value: ethers.parseEther("0.02") })
      ).to.be.revertedWith("Incorrect ticket price");
    });

    it("Должна позволить купить несколько билетов одному игроку", async function () {
      await lottery.connect(addr1).buyTicket({ value: ticketPrice });
      await lottery.connect(addr1).buyTicket({ value: ticketPrice });
      await lottery.connect(addr1).buyTicket({ value: ticketPrice });

      const tickets = await lottery.getPlayerTickets(addr1.address);
      expect(tickets.length).to.equal(3);
      expect(tickets[0]).to.equal(0);
      expect(tickets[1]).to.equal(1);
      expect(tickets[2]).to.equal(2);
    });

    it("Должна позволить разным игрокам покупать билеты", async function () {
      await lottery.connect(addr1).buyTicket({ value: ticketPrice });
      await lottery.connect(addr2).buyTicket({ value: ticketPrice });
      await lottery.connect(addr3).buyTicket({ value: ticketPrice });

      const tickets1 = await lottery.getPlayerTickets(addr1.address);
      const tickets2 = await lottery.getPlayerTickets(addr2.address);
      const tickets3 = await lottery.getPlayerTickets(addr3.address);

      expect(tickets1.length).to.equal(1);
      expect(tickets2.length).to.equal(1);
      expect(tickets3.length).to.equal(1);
    });

    it("Должна предотвратить покупку билетов когда они закончились", async function () {
      // Покупаем все билеты
      for (let i = 0; i < maxTickets; i++) {
        const signer = i % 2 === 0 ? addr1 : addr2;
        await lottery.connect(signer).buyTicket({ value: ticketPrice });
      }

      // Попытка купить еще один должна провалиться
      await expect(
        lottery.connect(addr3).buyTicket({ value: ticketPrice })
      ).to.be.revertedWith("All tickets sold");
    });

    it("Должна правильно учитывать призовой фонд", async function () {
      await lottery.connect(addr1).buyTicket({ value: ticketPrice });
      await lottery.connect(addr2).buyTicket({ value: ticketPrice });
      await lottery.connect(addr3).buyTicket({ value: ticketPrice });

      const prizePool = await lottery.getPrizePool();
      expect(prizePool).to.equal(ticketPrice * BigInt(3));
    });
  });

  describe("Статус лотереи", function () {
    it("Должен правильно отображать статус активной лотереи", async function () {
      await lottery.connect(addr1).buyTicket({ value: ticketPrice });
      await lottery.connect(addr2).buyTicket({ value: ticketPrice });

      const status = await lottery.getLotteryStatus();
      expect(status.active).to.be.true;
      expect(status.pendingSelection).to.be.false;
      expect(status.ticketsSold).to.equal(2);
      expect(status.totalTickets).to.equal(maxTickets);
      expect(status.prizePool).to.equal(ticketPrice * BigInt(2));
    });
  });

  describe("Доступ", function () {
    beforeEach(async function () {
      await lottery.connect(addr1).buyTicket({ value: ticketPrice });
    });

    it("Только владелец может запросить выбор победителя", async function () {
      await expect(
        lottery.connect(addr1).requestWinnerSelection()
      ).to.be.revertedWith("Only owner can call this");
    });

    it("Только владелец может создать новую лотерею", async function () {
      await expect(
        lottery.connect(addr1).createNewLottery(ticketPrice, maxTickets)
      ).to.be.revertedWith("Only owner can call this");
    });
  });

  describe("Интеграция с билетами", function () {
    it("Должна правильно сохранять владельца билета", async function () {
      await lottery.connect(addr1).buyTicket({ value: ticketPrice });
      await lottery.connect(addr2).buyTicket({ value: ticketPrice });

      expect(await lottery.tickets(0)).to.equal(addr1.address);
      expect(await lottery.tickets(1)).to.equal(addr2.address);
    });
  });
});
