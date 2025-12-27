// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LotteryV2
 * @dev Улучшенная версия децентрализованной лотереи с дополнительными функциями безопасности
 * @notice Версия с emergency pause, таймаутами и комиссией для production
 */
contract LotteryV2 is VRFConsumerBaseV2, ReentrancyGuard, Pausable, Ownable {
    // VRF Variables
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_keyHash;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // Lottery State
    uint256 public ticketPrice;
    uint256 public maxTickets;
    uint256 public ticketCounter;
    bool public lotteryActive;
    bool public pendingWinnerSelection;
    
    // Timestamps for timeout management
    uint256 public lotteryStartTime;
    uint256 public winnerSelectionRequestTime;
    uint256 public maxLotteryDuration; // Максимальная длительность лотереи (в секундах)
    uint256 public maxSelectionDuration; // Максимальное время ожидания выбора победителя (в секундах)
    
    // Commission settings
    uint256 public ownerCommissionPercent; // Комиссия owner в процентах (basis points, 100 = 1%)
    address public commissionRecipient; // Адрес для получения комиссии
    
    // Winner selection
    uint256 private s_requestId;
    address private s_pendingWinner;
    uint256 private s_pendingPrize;
    
    mapping(uint256 => address) public tickets;
    mapping(address => uint256[]) public playerTickets;
    mapping(uint256 => bool) private s_requestIdToLotteryActive;
    
    event TicketPurchased(address indexed player, uint256 ticketId);
    event LotteryEnded(address indexed winner, uint256 prize, uint256 commission);
    event LotteryCreated(uint256 ticketPrice, uint256 maxTickets);
    event WinnerRequested(uint256 indexed requestId);
    event FundsRefunded(address indexed player, uint256 amount, uint256 ticketCount);
    event EmergencyRefund(uint256 totalRefunded);
    event CommissionUpdated(uint256 oldPercent, uint256 newPercent);
    
    constructor(
        uint256 _ticketPrice,
        uint256 _maxTickets,
        address vrfCoordinatorV2,
        bytes32 keyHash,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 _maxLotteryDuration,
        uint256 _maxSelectionDuration,
        uint256 _ownerCommissionPercent
    ) VRFConsumerBaseV2(vrfCoordinatorV2) Ownable(msg.sender) {
        ticketPrice = _ticketPrice;
        maxTickets = _maxTickets;
        lotteryActive = true;
        ticketCounter = 0;
        pendingWinnerSelection = false;
        lotteryStartTime = block.timestamp;
        maxLotteryDuration = _maxLotteryDuration;
        maxSelectionDuration = _maxSelectionDuration;
        ownerCommissionPercent = _ownerCommissionPercent;
        commissionRecipient = msg.sender;
        
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_keyHash = keyHash;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        
        emit LotteryCreated(_ticketPrice, _maxTickets);
    }
    
    /**
     * @dev Покупка билета лотереи
     */
    function buyTicket() external payable nonReentrant whenNotPaused {
        require(lotteryActive, "Lottery is not active");
        require(!pendingWinnerSelection, "Winner selection in progress");
        require(block.timestamp <= lotteryStartTime + maxLotteryDuration, "Lottery duration expired");
        require(msg.value == ticketPrice, "Incorrect ticket price");
        require(ticketCounter < maxTickets, "All tickets sold");
        
        tickets[ticketCounter] = msg.sender;
        playerTickets[msg.sender].push(ticketCounter);
        ticketCounter++;
        
        emit TicketPurchased(msg.sender, ticketCounter - 1);
    }
    
    /**
     * @dev Получить билеты игрока
     */
    function getPlayerTickets(address player) external view returns (uint256[] memory) {
        return playerTickets[player];
    }
    
    /**
     * @dev Получить баланс контракта (призовой фонд)
     */
    function getPrizePool() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Инициировать процесс выбора победителя через Chainlink VRF
     */
    function requestWinnerSelection() external onlyOwner whenNotPaused nonReentrant {
        require(lotteryActive, "Lottery is not active");
        require(ticketCounter > 0, "No tickets sold");
        require(!pendingWinnerSelection, "Winner selection already requested");
        
        lotteryActive = false;
        pendingWinnerSelection = true;
        winnerSelectionRequestTime = block.timestamp;
        s_pendingPrize = address(this).balance;
        
        // Request random number from Chainlink VRF
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_keyHash,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        
        s_requestId = requestId;
        s_requestIdToLotteryActive[requestId] = true;
        
        emit WinnerRequested(requestId);
    }
    
    /**
     * @dev Callback функция, вызываемая Chainlink VRF после генерации случайного числа
     */
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        require(s_requestIdToLotteryActive[requestId], "Request ID not found");
        require(pendingWinnerSelection, "No pending winner selection");
        
        uint256 randomNumber = randomWords[0] % ticketCounter;
        address winner = tickets[randomNumber];
        
        s_pendingWinner = winner;
        s_requestIdToLotteryActive[requestId] = false;
        pendingWinnerSelection = false;
        
        // Calculate commission
        uint256 commission = (s_pendingPrize * ownerCommissionPercent) / 10000;
        uint256 winnerPrize = s_pendingPrize - commission;
        
        // Transfer commission to owner (if any)
        if (commission > 0 && commissionRecipient != address(0)) {
            (bool commissionSuccess, ) = commissionRecipient.call{value: commission}("");
            require(commissionSuccess, "Commission transfer failed");
        }
        
        // Transfer prize to winner
        (bool success, ) = winner.call{value: winnerPrize}("");
        require(success, "Winner transfer failed");
        
        emit LotteryEnded(winner, winnerPrize, commission);
    }
    
    /**
     * @dev Возврат средств игроку (если лотерея не завершилась вовремя)
     * @notice Игрок может вернуть средства для своих билетов если лотерея истекла
     */
    function refundMyTickets() external nonReentrant {
        require(!lotteryActive, "Lottery is still active");
        require(
            block.timestamp > lotteryStartTime + maxLotteryDuration || 
            (pendingWinnerSelection && block.timestamp > winnerSelectionRequestTime + maxSelectionDuration),
            "Refund conditions not met"
        );
        
        uint256[] memory playerTicketIds = playerTickets[msg.sender];
        require(playerTicketIds.length > 0, "No tickets to refund");
        
        uint256 refundAmount = ticketPrice * playerTicketIds.length;
        require(address(this).balance >= refundAmount, "Insufficient balance for refund");
        
        // Clear player tickets
        delete playerTickets[msg.sender];
        
        // Transfer refund
        (bool success, ) = msg.sender.call{value: refundAmount}("");
        require(success, "Refund transfer failed");
        
        emit FundsRefunded(msg.sender, refundAmount, playerTicketIds.length);
    }
    
    /**
     * @dev Emergency refund - возврат всех средств всем игрокам (только owner)
     * @notice Используется в критических ситуациях (например, если VRF не сработал)
     */
    function emergencyRefundAll() external onlyOwner nonReentrant {
        require(
            (pendingWinnerSelection && block.timestamp > winnerSelectionRequestTime + maxSelectionDuration) ||
            (!lotteryActive && address(this).balance > 0),
            "Refund conditions not met"
        );
        
        uint256 totalRefunded = 0;
        uint256 currentBalance = address(this).balance;
        
        // Refund to all players proportionally
        // Простой подход: возврат по количеству билетов
        for (uint256 i = 0; i < ticketCounter; i++) {
            address player = tickets[i];
            if (player != address(0) && playerTickets[player].length > 0) {
                uint256 playerRefund = ticketPrice * playerTickets[player].length;
                if (currentBalance >= playerRefund) {
                    delete playerTickets[player];
                    (bool success, ) = player.call{value: playerRefund}("");
                    if (success) {
                        totalRefunded += playerRefund;
                        currentBalance -= playerRefund;
                    }
                }
            }
        }
        
        emit EmergencyRefund(totalRefunded);
    }
    
    /**
     * @dev Создать новую лотерею (только для owner)
     */
    function createNewLottery(
        uint256 _ticketPrice,
        uint256 _maxTickets,
        uint256 _maxLotteryDuration,
        uint256 _maxSelectionDuration
    ) external onlyOwner {
        require(!lotteryActive && !pendingWinnerSelection, "Lottery must be finished");
        require(address(this).balance == 0, "Contract must be empty");
        
        ticketPrice = _ticketPrice;
        maxTickets = _maxTickets;
        ticketCounter = 0;
        lotteryActive = true;
        lotteryStartTime = block.timestamp;
        maxLotteryDuration = _maxLotteryDuration;
        maxSelectionDuration = _maxSelectionDuration;
        
        emit LotteryCreated(_ticketPrice, _maxTickets);
    }
    
    /**
     * @dev Установить комиссию (только для owner)
     */
    function setCommission(uint256 _ownerCommissionPercent, address _commissionRecipient) external onlyOwner {
        require(_ownerCommissionPercent <= 1000, "Commission cannot exceed 10%"); // Максимум 10%
        uint256 oldPercent = ownerCommissionPercent;
        ownerCommissionPercent = _ownerCommissionPercent;
        commissionRecipient = _commissionRecipient;
        emit CommissionUpdated(oldPercent, _ownerCommissionPercent);
    }
    
    /**
     * @dev Pause контракт (только для owner) - emergency stop
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause контракт (только для owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Получить текущий статус лотереи
     */
    function getLotteryStatus() external view returns (
        bool active,
        bool pendingSelection,
        uint256 ticketsSold,
        uint256 totalTickets,
        uint256 prizePool,
        uint256 timeRemaining,
        bool canRefund
    ) {
        bool expired = block.timestamp > lotteryStartTime + maxLotteryDuration;
        bool selectionExpired = pendingWinnerSelection && 
            block.timestamp > winnerSelectionRequestTime + maxSelectionDuration;
        
        return (
            lotteryActive && !expired,
            pendingWinnerSelection && !selectionExpired,
            ticketCounter,
            maxTickets,
            address(this).balance,
            expired ? 0 : (lotteryStartTime + maxLotteryDuration) - block.timestamp,
            expired || selectionExpired
        );
    }
    
    /**
     * @dev Получить информацию о комиссии
     */
    function getCommissionInfo() external view returns (uint256 percent, address recipient) {
        return (ownerCommissionPercent, commissionRecipient);
    }
}

