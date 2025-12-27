# Investment Pool - Инвестиционный пул

## Описание

Контракт для управления инвестиционным пулом, где пользователи могут инвестировать средства от эквивалента €10 и получать проценты через 7 дней.

## Как это работает

1. **Инвестирование** - Пользователи отправляют ETH (минимум ~0.004 ETH = €10)
2. **Хранение** - Средства блокируются на 7 дней
3. **Доходность** - Через 7 дней можно вывести основную сумму + проценты (например, 12.5%)
4. **Комиссия** - Платформа получает комиссию с процентов (например, 2%)

## Основные функции

### Для инвесторов

#### `invest()`
Сделать инвестицию в пул.

**Требования:**
- Минимальная сумма: ~0.004 ETH (эквивалент €10)
- Отправка ETH вместе с вызовом функции

**Пример:**
```javascript
await investmentPool.invest({ value: ethers.parseEther("0.01") });
```

#### `withdraw(uint256 investmentIndex)`
Вывести конкретную инвестицию после истечения периода.

**Параметры:**
- `investmentIndex` - Индекс инвестиции в массиве пользователя

**Пример:**
```javascript
await investmentPool.withdraw(0); // Вывести первую инвестицию
```

#### `withdrawAll()`
Вывести все доступные инвестиции одним вызовом.

**Пример:**
```javascript
await investmentPool.withdrawAll();
```

#### `getInvestment(address investor, uint256 index)`
Получить информацию об инвестиции.

**Возвращает:**
- `amount` - Сумма инвестиции
- `depositTime` - Время депозита
- `withdrawTime` - Время, когда можно вывести
- `withdrawn` - Выведена ли инвестиция
- `estimatedReturn` - Ожидаемая сумма возврата

#### `getUserInvestments(address investor)`
Получить статистику по всем инвестициям пользователя.

**Возвращает:**
- `totalCount` - Всего инвестиций
- `activeCount` - Активных инвестиций
- `totalInvestedAmount` - Общая сумма инвестиций
- `totalAvailableToWithdraw` - Сумма доступная к выводу

### Для Owner

#### `setInterestRate(uint256 _interestRate)`
Изменить процентную ставку (в basis points).

**Пример:**
```javascript
// Установить 15% за неделю
await investmentPool.setInterestRate(1500);
```

#### `setPlatformFee(uint256 _platformFeePercent, address _feeRecipient)`
Изменить комиссию платформы и получателя.

**Параметры:**
- `_platformFeePercent` - Комиссия в basis points (максимум 5% = 500)
- `_feeRecipient` - Адрес для получения комиссий

#### `depositFunds()`
Пополнить пул средствами (для выплаты процентов).

**Пример:**
```javascript
await investmentPool.depositFunds({ value: ethers.parseEther("10") });
```

#### `pause() / unpause()`
Приостановить/возобновить работу контракта.

#### `getPoolStats()`
Получить общую статистику пула.

## Параметры контракта

### Константы

- **MIN_INVESTMENT**: ~0.004 ETH (эквивалент €10)
- **INVESTMENT_PERIOD**: 7 дней (604,800 секунд)

### Настраиваемые параметры

- **interestRate**: Процентная ставка за неделю (в basis points)
  - Например: 1250 = 12.5%
  - Можно изменить через `setInterestRate()`

- **platformFeePercent**: Комиссия платформы с процентов (в basis points)
  - Например: 200 = 2%
  - Максимум: 500 = 5%
  - Можно изменить через `setPlatformFee()`

## Расчет доходности

### Пример расчета

**Входные данные:**
- Инвестиция: 0.01 ETH
- Процентная ставка: 12.5% (1250 basis points)
- Комиссия платформы: 2% (200 basis points)

**Расчет:**
1. Процент: 0.01 ETH × 12.5% = 0.00125 ETH
2. Комиссия платформы: 0.00125 ETH × 2% = 0.000025 ETH
3. Чистый процент инвестору: 0.00125 - 0.000025 = 0.001225 ETH
4. Общая сумма к выводу: 0.01 + 0.001225 = 0.011225 ETH

**ROI**: ~12.25% за неделю (после комиссии)

## Важные моменты

### Безопасность

- ✅ ReentrancyGuard - защита от повторного входа
- ✅ Pausable - возможность приостановки
- ✅ Ownable - контроль доступа
- ✅ Проверка минимальной суммы инвестиции
- ✅ Проверка периода инвестирования

### Ограничения

- Минимальная инвестиция: ~0.004 ETH (€10)
- Период инвестирования: 7 дней (фиксированный)
- Вывод только после истечения периода
- Комиссия вычитается только с процентов, не с основной суммы

### Управление пулом

**Важно:** Owner должен поддерживать баланс контракта достаточным для выплаты процентов всем инвесторам.

**Пример:**
- Если в пуле 100 ETH инвестиций
- При ставке 12.5% нужно ~12.5 ETH для выплаты процентов
- Owner должен регулярно пополнять пул через `depositFunds()`

Средства для выплаты процентов могут поступать от:
- Торговли токенизированными активами
- Комиссий с других сервисов платформы
- Прибыли от инвестиций платформы

## События (Events)

- `InvestmentMade(address indexed investor, uint256 amount, uint256 withdrawTime)` - Инвестиция сделана
- `Withdrawal(address indexed investor, uint256 principal, uint256 interest, uint256 fee)` - Вывод средств
- `InterestRateUpdated(uint256 oldRate, uint256 newRate)` - Ставка изменена
- `PlatformFeeUpdated(uint256 oldFee, uint256 newFee)` - Комиссия изменена
- `FeeRecipientUpdated(address oldRecipient, address newRecipient)` - Получатель комиссий изменен
- `FundsDeposited(uint256 amount)` - Средства депозированы в пул

## Пример использования

### Инвестирование

```javascript
// Инвестировать 0.01 ETH
await investmentPool.invest({ 
  value: ethers.parseEther("0.01") 
});
```

### Получение информации

```javascript
// Получить статистику пула
const stats = await investmentPool.getPoolStats();
console.log("Total invested:", ethers.formatEther(stats._totalInvested));
console.log("Interest rate:", stats._interestRate / 100, "%");

// Получить инвестиции пользователя
const userStats = await investmentPool.getUserInvestments(userAddress);
console.log("User investments:", userStats.totalCount);
console.log("Available to withdraw:", ethers.formatEther(userStats.totalAvailableToWithdraw));
```

### Вывод средств

```javascript
// Вывести первую инвестицию
await investmentPool.withdraw(0);

// Или вывести все доступные
await investmentPool.withdrawAll();
```

### Управление (Owner)

```javascript
// Пополнить пул
await investmentPool.depositFunds({ 
  value: ethers.parseEther("10") 
});

// Изменить процентную ставку
await investmentPool.setInterestRate(1500); // 15%

// Изменить комиссию
await investmentPool.setPlatformFee(300, feeRecipientAddress); // 3%
```

## Рекомендации для production

1. **Мониторинг баланса** - Следите за балансом контракта
2. **Автоматизация пополнений** - Настройте автоматическое пополнение пула
3. **Аналитика** - Отслеживайте общий объем инвестиций и доступные средства
4. **Управление ставками** - Адаптируйте процентную ставку в зависимости от рыночных условий
5. **Резервирование** - Поддерживайте резерв для гарантированных выплат
6. **Аудит** - Проведите аудит перед запуском на mainnet

## Предупреждения

⚠️ **Важно:**
- Контракт должен иметь достаточный баланс для выплаты процентов
- Owner несет ответственность за поддержание ликвидности пула
- Процентная ставка может быть изменена owner (прозрачность важна!)
- Инвестиции блокируются на 7 дней без возможности досрочного вывода

