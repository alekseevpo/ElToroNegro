// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Lottery
 * @dev Децентрализованная лотерея с использованием Chainlink VRF для безопасного выбора победителя
 */
contract Lottery is VRFConsumerBaseV2, ReentrancyGuard {
    // VRF Variables
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_keyHash;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // Lottery State
    address public owner;
    uint256 public ticketPrice;
    uint256 public maxTickets;
    uint256 public ticketCounter;
    bool public lotteryActive;
    bool public pendingWinnerSelection;
    
    // Winner selection
    uint256 private s_requestId;
    address private s_pendingWinner;
    uint256 private s_pendingPrize;
    
    mapping(uint256 => address) public tickets;
    mapping(address => uint256[]) public playerTickets;
    mapping(uint256 => bool) private s_requestIdToLotteryActive;
    
    event TicketPurchased(address indexed player, uint256 ticketId);
    event LotteryEnded(address indexed winner, uint256 prize);
    event LotteryCreated(uint256 ticketPrice, uint256 maxTickets);
    event WinnerRequested(uint256 indexed requestId);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    modifier lotteryIsActive() {
        require(lotteryActive, "Lottery is not active");
        _;
    }

    constructor(
        uint256 _ticketPrice,
        uint256 _maxTickets,
        address vrfCoordinatorV2,
        bytes32 keyHash,
        uint64 subscriptionId,
        uint32 callbackGasLimit
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        owner = msg.sender;
        ticketPrice = _ticketPrice;
        maxTickets = _maxTickets;
        lotteryActive = true;
        ticketCounter = 0;
        pendingWinnerSelection = false;
        
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_keyHash = keyHash;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        
        emit LotteryCreated(_ticketPrice, _maxTickets);
    }
    
    /**
     * @dev Покупка билета лотереи
     */
    function buyTicket() external payable nonReentrant lotteryIsActive {
        require(!pendingWinnerSelection, "Winner selection in progress");
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
    function requestWinnerSelection() external onlyOwner lotteryIsActive nonReentrant {
        require(ticketCounter > 0, "No tickets sold");
        require(!pendingWinnerSelection, "Winner selection already requested");
        
        lotteryActive = false;
        pendingWinnerSelection = true;
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
        
        // Transfer prize to winner
        (bool success, ) = winner.call{value: s_pendingPrize}("");
        require(success, "Transfer failed");
        
        emit LotteryEnded(winner, s_pendingPrize);
    }
    
    /**
     * @dev Создать новую лотерею (только для owner)
     */
    function createNewLottery(uint256 _ticketPrice, uint256 _maxTickets) external onlyOwner {
        require(!lotteryActive && !pendingWinnerSelection, "Lottery must be finished");
        require(address(this).balance == 0, "Contract must be empty");
        
        ticketPrice = _ticketPrice;
        maxTickets = _maxTickets;
        ticketCounter = 0;
        lotteryActive = true;
        
        emit LotteryCreated(_ticketPrice, _maxTickets);
    }
    
    /**
     * @dev Получить текущий статус лотереи
     */
    function getLotteryStatus() external view returns (
        bool active,
        bool pendingSelection,
        uint256 ticketsSold,
        uint256 totalTickets,
        uint256 prizePool
    ) {
        return (
            lotteryActive,
            pendingWinnerSelection,
            ticketCounter,
            maxTickets,
            address(this).balance
        );
    }
}
