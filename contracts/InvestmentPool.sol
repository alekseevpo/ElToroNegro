// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title InvestmentPool
 * @dev Контракт для управления инвестиционным пулом
 * @notice Инвесторы вкладывают средства (от 10 EUR эквивалента), средства хранятся 7 дней, затем можно вывести с процентами
 */
contract InvestmentPool is ReentrancyGuard, Pausable, Ownable {
    // Минимальная сумма инвестиции (в wei, эквивалент 10 EUR)
    // Для ETH: примерно 0.004 ETH (при курсе ~2500 EUR/ETH)
    uint256 public constant MIN_INVESTMENT = 0.004 ether; // ~10 EUR
    
    // Период инвестирования (7 дней в секундах)
    uint256 public constant INVESTMENT_PERIOD = 7 days;
    
    // Процентная ставка (в basis points, 1250 = 12.5% за неделю)
    uint256 public interestRate; // Процент за неделю (basis points)
    
    // Комиссия платформы (в basis points, 200 = 2%)
    uint256 public platformFeePercent;
    address public feeRecipient;
    
    // Структура инвестиции
    struct Investment {
        address investor;
        uint256 amount;        // Сумма инвестиции
        uint256 depositTime;   // Время депозита
        uint256 withdrawTime;  // Время, когда можно вывести (depositTime + INVESTMENT_PERIOD)
        bool withdrawn;        // Выведены ли средства
    }
    
    // Инвестиции пользователей
    mapping(address => Investment[]) public userInvestments;
    mapping(address => uint256) public userInvestmentCount;
    
    // Общая статистика
    uint256 public totalInvested;
    uint256 public totalWithdrawn;
    uint256 public totalActiveInvestments;
    
    // События
    event InvestmentMade(address indexed investor, uint256 amount, uint256 withdrawTime);
    event Withdrawal(address indexed investor, uint256 principal, uint256 interest, uint256 fee);
    event InterestRateUpdated(uint256 oldRate, uint256 newRate);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);
    event FundsDeposited(uint256 amount);
    event FundsWithdrawn(uint256 amount);
    
    constructor(
        uint256 _interestRate,
        uint256 _platformFeePercent,
        address _feeRecipient
    ) Ownable(msg.sender) {
        require(_interestRate > 0, "Interest rate must be greater than 0");
        require(_platformFeePercent <= 500, "Platform fee cannot exceed 5%");
        require(_feeRecipient != address(0), "Invalid fee recipient");
        
        interestRate = _interestRate; // например, 1250 = 12.5%
        platformFeePercent = _platformFeePercent; // например, 200 = 2%
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @dev Сделать инвестицию
     */
    function invest() external payable whenNotPaused nonReentrant {
        require(msg.value >= MIN_INVESTMENT, "Investment amount below minimum");
        
        uint256 withdrawTime = block.timestamp + INVESTMENT_PERIOD;
        
        Investment memory newInvestment = Investment({
            investor: msg.sender,
            amount: msg.value,
            depositTime: block.timestamp,
            withdrawTime: withdrawTime,
            withdrawn: false
        });
        
        userInvestments[msg.sender].push(newInvestment);
        userInvestmentCount[msg.sender]++;
        totalInvested += msg.value;
        totalActiveInvestments++;
        
        emit InvestmentMade(msg.sender, msg.value, withdrawTime);
    }
    
    /**
     * @dev Вывести средства (после 7 дней)
     * @param investmentIndex Индекс инвестиции в массиве пользователя
     */
    function withdraw(uint256 investmentIndex) external nonReentrant {
        require(investmentIndex < userInvestmentCount[msg.sender], "Invalid investment index");
        
        Investment storage investment = userInvestments[msg.sender][investmentIndex];
        require(investment.investor == msg.sender, "Not your investment");
        require(!investment.withdrawn, "Already withdrawn");
        require(block.timestamp >= investment.withdrawTime, "Investment period not ended");
        
        uint256 principal = investment.amount;
        uint256 interest = (principal * interestRate) / 10000; // Процент от суммы
        
        // Вычислить комиссию платформы с процентов
        uint256 fee = (interest * platformFeePercent) / 10000;
        uint256 netInterest = interest - fee;
        uint256 withdrawalAmount = principal + netInterest;
        
        require(address(this).balance >= withdrawalAmount, "Insufficient contract balance");
        
        // Отметить инвестицию как выведенную
        investment.withdrawn = true;
        totalActiveInvestments--;
        totalWithdrawn += withdrawalAmount;
        
        // Перевести комиссию платформе (если есть)
        if (fee > 0 && feeRecipient != address(0)) {
            (bool feeSuccess, ) = feeRecipient.call{value: fee}("");
            require(feeSuccess, "Fee transfer failed");
        }
        
        // Перевести средства инвестору
        (bool success, ) = msg.sender.call{value: withdrawalAmount}("");
        require(success, "Withdrawal failed");
        
        emit Withdrawal(msg.sender, principal, netInterest, fee);
    }
    
    /**
     * @dev Вывести все доступные инвестиции пользователя
     */
    function withdrawAll() external nonReentrant {
        uint256 count = userInvestmentCount[msg.sender];
        require(count > 0, "No investments");
        
        uint256 totalWithdrawal = 0;
        uint256 totalInterest = 0;
        uint256 totalFee = 0;
        
        for (uint256 i = 0; i < count; i++) {
            Investment storage investment = userInvestments[msg.sender][i];
            
            if (!investment.withdrawn && block.timestamp >= investment.withdrawTime) {
                uint256 principal = investment.amount;
                uint256 interest = (principal * interestRate) / 10000;
                uint256 fee = (interest * platformFeePercent) / 10000;
                uint256 netInterest = interest - fee;
                
                totalWithdrawal += principal + netInterest;
                totalInterest += netInterest;
                totalFee += fee;
                
                investment.withdrawn = true;
                totalActiveInvestments--;
            }
        }
        
        require(totalWithdrawal > 0, "No investments ready for withdrawal");
        require(address(this).balance >= totalWithdrawal, "Insufficient contract balance");
        
        totalWithdrawn += totalWithdrawal;
        
        // Перевести комиссию
        if (totalFee > 0 && feeRecipient != address(0)) {
            (bool feeSuccess, ) = feeRecipient.call{value: totalFee}("");
            require(feeSuccess, "Fee transfer failed");
        }
        
        // Перевести средства инвестору
        (bool success, ) = msg.sender.call{value: totalWithdrawal}("");
        require(success, "Withdrawal failed");
        
        emit Withdrawal(msg.sender, totalWithdrawal - totalInterest, totalInterest, totalFee);
    }
    
    /**
     * @dev Получить информацию об инвестиции
     */
    function getInvestment(address investor, uint256 index) external view returns (
        uint256 amount,
        uint256 depositTime,
        uint256 withdrawTime,
        bool withdrawn,
        uint256 estimatedReturn
    ) {
        require(index < userInvestmentCount[investor], "Invalid investment index");
        Investment memory investment = userInvestments[investor][index];
        
        uint256 interest = (investment.amount * interestRate) / 10000;
        uint256 fee = (interest * platformFeePercent) / 10000;
        uint256 netInterest = interest - fee;
        uint256 returnAmount = investment.amount + netInterest;
        
        return (
            investment.amount,
            investment.depositTime,
            investment.withdrawTime,
            investment.withdrawn,
            returnAmount
        );
    }
    
    /**
     * @dev Получить все инвестиции пользователя
     */
    function getUserInvestments(address investor) external view returns (
        uint256 totalCount,
        uint256 activeCount,
        uint256 totalInvestedAmount,
        uint256 totalAvailableToWithdraw
    ) {
        totalCount = userInvestmentCount[investor];
        uint256 available = 0;
        uint256 invested = 0;
        
        for (uint256 i = 0; i < totalCount; i++) {
            Investment memory investment = userInvestments[investor][i];
            invested += investment.amount;
            
            if (!investment.withdrawn && block.timestamp >= investment.withdrawTime) {
                uint256 interest = (investment.amount * interestRate) / 10000;
                uint256 fee = (interest * platformFeePercent) / 10000;
                uint256 netInterest = interest - fee;
                available += investment.amount + netInterest;
            }
        }
        
        uint256 active = totalCount;
        for (uint256 i = 0; i < totalCount; i++) {
            if (userInvestments[investor][i].withdrawn) {
                active--;
            }
        }
        
        return (totalCount, active, invested, available);
    }
    
    /**
     * @dev Получить общую статистику пула
     */
    function getPoolStats() external view returns (
        uint256 _totalInvested,
        uint256 _totalWithdrawn,
        uint256 _totalActiveInvestments,
        uint256 _currentBalance,
        uint256 _interestRate,
        uint256 _platformFeePercent
    ) {
        return (
            totalInvested,
            totalWithdrawn,
            totalActiveInvestments,
            address(this).balance,
            interestRate,
            platformFeePercent
        );
    }
    
    /**
     * @dev Установить процентную ставку (только owner)
     */
    function setInterestRate(uint256 _interestRate) external onlyOwner {
        require(_interestRate > 0, "Interest rate must be greater than 0");
        uint256 oldRate = interestRate;
        interestRate = _interestRate;
        emit InterestRateUpdated(oldRate, _interestRate);
    }
    
    /**
     * @dev Установить комиссию платформы (только owner)
     */
    function setPlatformFee(uint256 _platformFeePercent, address _feeRecipient) external onlyOwner {
        require(_platformFeePercent <= 500, "Platform fee cannot exceed 5%");
        require(_feeRecipient != address(0), "Invalid fee recipient");
        uint256 oldFee = platformFeePercent;
        platformFeePercent = _platformFeePercent;
        address oldRecipient = feeRecipient;
        feeRecipient = _feeRecipient;
        emit PlatformFeeUpdated(oldFee, _platformFeePercent);
        emit FeeRecipientUpdated(oldRecipient, _feeRecipient);
    }
    
    /**
     * @dev Депозит средств в пул (для owner, например, от торговли активами)
     */
    function depositFunds() external payable onlyOwner {
        require(msg.value > 0, "Must deposit some funds");
        emit FundsDeposited(msg.value);
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
     * @dev Получить баланс контракта
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Получить минимальную сумму инвестиции
     */
    function getMinInvestment() external pure returns (uint256) {
        return MIN_INVESTMENT;
    }
    
    /**
     * @dev Получить период инвестирования
     */
    function getInvestmentPeriod() external pure returns (uint256) {
        return INVESTMENT_PERIOD;
    }
}

