// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BitcoinPriceBet
 * @dev Контракт для ставок на цену биткоина
 * @notice Участники делают ставки на предполагаемую цену BTC в пятницу, старт в понедельник
 */
contract BitcoinPriceBet is ReentrancyGuard, Pausable, Ownable {
    // Chainlink Price Feed для BTC/USD
    AggregatorV3Interface internal immutable priceFeed;
    
    // Параметры ставки
    uint256 public betAmount; // Сумма ставки
    uint256 public betStartTime; // Время начала (понедельник)
    uint256 public betEndTime; // Время окончания приема ставок (четверг 23:59)
    uint256 public resultTime; // Время получения результата (пятница)
    uint256 public prizePool; // Призовой фонд
    uint256 public ownerCommissionPercent; // Комиссия owner в basis points (100 = 1%)
    
    // Состояние
    bool public betsClosed;
    bool public resultDetermined;
    int256 public finalPrice; // Финальная цена BTC в пятницу
    address[] public winners; // Победители (те, кто ближе всего угадал)
    
    // Ставки участников
    struct Bet {
        address player;
        uint256 predictedPrice; // Предполагаемая цена в USD (без десятичных знаков, например 50000 для $50,000)
        uint256 timestamp;
        bool exists;
    }
    
    mapping(address => Bet) public bets; // Ставка участника
    address[] public players; // Список всех участников
    
    // События
    event BetPlaced(address indexed player, uint256 predictedPrice, uint256 timestamp);
    event BetsClosed(uint256 timestamp);
    event ResultDetermined(int256 finalPrice, address[] winners, uint256 prizePool);
    event PrizeDistributed(address indexed winner, uint256 amount);
    event CommissionUpdated(uint256 oldPercent, uint256 newPercent);
    
    /**
     * @dev Конструктор
     * @param _priceFeed Адрес Chainlink Price Feed для BTC/USD
     * @param _betAmount Сумма ставки в wei
     * @param _betStartTime Время начала ставок (понедельник)
     * @param _betDuration Длительность приема ставок в секундах (обычно 4 дня: понедельник-четверг)
     * @param _resultDelay Задержка до получения результата в секундах (обычно 1 день до пятницы)
     * @param _ownerCommissionPercent Комиссия owner в basis points (100 = 1%)
     */
    constructor(
        address _priceFeed,
        uint256 _betAmount,
        uint256 _betStartTime,
        uint256 _betDuration,
        uint256 _resultDelay,
        uint256 _ownerCommissionPercent
    ) Ownable(msg.sender) {
        require(_priceFeed != address(0), "Invalid price feed address");
        require(_betAmount > 0, "Bet amount must be greater than 0");
        require(_ownerCommissionPercent <= 1000, "Commission cannot exceed 10%");
        
        priceFeed = AggregatorV3Interface(_priceFeed);
        betAmount = _betAmount;
        betStartTime = _betStartTime;
        betEndTime = _betStartTime + _betDuration;
        resultTime = betEndTime + _resultDelay;
        ownerCommissionPercent = _ownerCommissionPercent;
        
        betsClosed = false;
        resultDetermined = false;
    }
    
    /**
     * @dev Сделать ставку на цену биткоина
     * @param _predictedPrice Предполагаемая цена BTC в USD (без десятичных, например 50000 для $50,000)
     */
    function placeBet(uint256 _predictedPrice) external payable whenNotPaused nonReentrant {
        require(block.timestamp >= betStartTime, "Betting has not started yet");
        require(block.timestamp < betEndTime, "Betting period has ended");
        require(!betsClosed, "Bets are closed");
        require(msg.value == betAmount, "Incorrect bet amount");
        require(!bets[msg.sender].exists, "You have already placed a bet");
        require(_predictedPrice > 0, "Predicted price must be greater than 0");
        
        bets[msg.sender] = Bet({
            player: msg.sender,
            predictedPrice: _predictedPrice,
            timestamp: block.timestamp,
            exists: true
        });
        
        players.push(msg.sender);
        prizePool += msg.value;
        
        emit BetPlaced(msg.sender, _predictedPrice, block.timestamp);
    }
    
    /**
     * @dev Закрыть прием ставок (можно вызвать досрочно)
     */
    function closeBets() external onlyOwner {
        require(!betsClosed, "Bets are already closed");
        betsClosed = true;
        emit BetsClosed(block.timestamp);
    }
    
    /**
     * @dev Определить победителей на основе цены BTC
     */
    function determineWinners() external onlyOwner nonReentrant {
        require(block.timestamp >= resultTime, "Result time has not arrived yet");
        require(!resultDetermined, "Winners have already been determined");
        require(betsClosed || block.timestamp >= betEndTime, "Bets are still open");
        require(players.length > 0, "No players");
        
        // Получить цену BTC из Chainlink
        (, int256 price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price data");
        
        // Chainlink возвращает цену с 8 десятичными знаками
        // Например, $50,000.00 = 5000000000 (с 8 знаками после запятой)
        // Участники указывают цену без десятичных (например, 50000 для $50,000)
        // Приводим цену Chainlink к формату участников (делим на 1e8 и округляем)
        uint256 currentPriceInUSD = uint256(price) / 1e8;
        
        // Найти ближайшие ставки (минимальная разница)
        uint256 minDifference = type(uint256).max;
        address[] memory closestPlayers = new address[](players.length);
        uint256 closestCount = 0;
        
        for (uint256 i = 0; i < players.length; i++) {
            address player = players[i];
            Bet memory bet = bets[player];
            
            // Вычислить разницу (абсолютное значение)
            uint256 difference;
            if (bet.predictedPrice > currentPriceInUSD) {
                difference = bet.predictedPrice - currentPriceInUSD;
            } else {
                difference = currentPriceInUSD - bet.predictedPrice;
            }
            
            // Если это минимальная разница, добавить в список
            if (difference < minDifference) {
                minDifference = difference;
                closestPlayers[0] = player;
                closestCount = 1;
            } else if (difference == minDifference) {
                closestPlayers[closestCount] = player;
                closestCount++;
            }
        }
        
        // Сохранить результаты
        finalPrice = price;
        winners = new address[](closestCount);
        for (uint256 i = 0; i < closestCount; i++) {
            winners[i] = closestPlayers[i];
        }
        
        resultDetermined = true;
        
        emit ResultDetermined(finalPrice, winners, prizePool);
    }
    
    /**
     * @dev Распределить призы между победителями
     */
    function distributePrizes() external nonReentrant {
        require(resultDetermined, "Winners have not been determined yet");
        require(winners.length > 0, "No winners");
        require(address(this).balance > 0, "No funds to distribute");
        
        // Вычислить комиссию
        uint256 commission = (prizePool * ownerCommissionPercent) / 10000;
        uint256 prizeToDistribute = prizePool - commission;
        
        // Распределить комиссию (если есть)
        if (commission > 0 && owner() != address(0)) {
            (bool commissionSuccess, ) = owner().call{value: commission}("");
            require(commissionSuccess, "Commission transfer failed");
        }
        
        // Распределить призы между победителями (поровну)
        uint256 prizePerWinner = prizeToDistribute / winners.length;
        uint256 remainder = prizeToDistribute % winners.length;
        
        for (uint256 i = 0; i < winners.length; i++) {
            uint256 amount = prizePerWinner;
            if (i == 0) {
                amount += remainder; // Отдать остаток первому победителю
            }
            
            (bool success, ) = winners[i].call{value: amount}("");
            require(success, "Prize transfer failed");
            
            emit PrizeDistributed(winners[i], amount);
        }
    }
    
    /**
     * @dev Получить текущую цену BTC из Chainlink
     */
    function getCurrentBTCPrice() external view returns (int256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return price;
    }
    
    /**
     * @dev Получить информацию о ставке участника
     */
    function getBet(address player) external view returns (
        address,
        uint256,
        uint256,
        bool
    ) {
        Bet memory bet = bets[player];
        return (bet.player, bet.predictedPrice, bet.timestamp, bet.exists);
    }
    
    /**
     * @dev Получить статус ставки
     */
    function getBetStatus() external view returns (
        bool _betsClosed,
        bool _resultDetermined,
        uint256 _playerCount,
        uint256 _prizePool,
        uint256 _timeUntilEnd,
        uint256 _timeUntilResult,
        int256 _finalPrice
    ) {
        uint256 timeUntilEnd = 0;
        if (block.timestamp < betEndTime) {
            timeUntilEnd = betEndTime - block.timestamp;
        }
        
        uint256 timeUntilResult = 0;
        if (block.timestamp < resultTime) {
            timeUntilResult = resultTime - block.timestamp;
        }
        
        return (
            betsClosed || block.timestamp >= betEndTime,
            resultDetermined,
            players.length,
            prizePool,
            timeUntilEnd,
            timeUntilResult,
            finalPrice
        );
    }
    
    /**
     * @dev Получить список всех участников
     */
    function getAllPlayers() external view returns (address[] memory) {
        return players;
    }
    
    /**
     * @dev Получить список победителей
     */
    function getWinners() external view returns (address[] memory) {
        return winners;
    }
    
    /**
     * @dev Установить комиссию (только owner)
     */
    function setCommission(uint256 _ownerCommissionPercent) external onlyOwner {
        require(_ownerCommissionPercent <= 1000, "Commission cannot exceed 10%");
        uint256 oldPercent = ownerCommissionPercent;
        ownerCommissionPercent = _ownerCommissionPercent;
        emit CommissionUpdated(oldPercent, _ownerCommissionPercent);
    }
    
    /**
     * @dev Pause контракт (только owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause контракт (только owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Создать новую ставку (после завершения предыдущей)
     */
    function createNewBet(
        uint256 _betAmount,
        uint256 _betStartTime,
        uint256 _betDuration,
        uint256 _resultDelay
    ) external onlyOwner {
        require(resultDetermined && address(this).balance == 0, "Previous bet must be completed");
        require(_betAmount > 0, "Bet amount must be greater than 0");
        
        betAmount = _betAmount;
        betStartTime = _betStartTime;
        betEndTime = _betStartTime + _betDuration;
        resultTime = betEndTime + _resultDelay;
        
        // Сброс состояния
        delete players;
        delete winners;
        betsClosed = false;
        resultDetermined = false;
        prizePool = 0;
        finalPrice = 0;
    }
}

