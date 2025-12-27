# Руководство по деплою

## Подготовка к деплою

### 1. Установка зависимостей
```bash
npm install
```

### 2. Компиляция контрактов
```bash
npm run compile
```

### 3. Запуск тестов
```bash
npm run test
```

## Настройка Chainlink VRF

### Создание Subscription

1. Перейдите на [Chainlink VRF Subscription Manager](https://vrf.chain.link/)
2. Подключите ваш кошелек (MetaMask)
3. Создайте новую subscription
4. Запомните ваш Subscription ID
5. Пополните subscription LINK токенами (минимум 0.5 LINK рекомендуется)

### Параметры для разных сетей

#### Sepolia Testnet
- VRF Coordinator: `0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625`
- Key Hash: `0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c`
- LINK Token: `0x779877A7B0D9E8603169DdbD7836e478b4624789`

#### Ethereum Mainnet
- VRF Coordinator: `0x271682DEB8C4E0901D1a1550aD2e64D568E69909`
- Key Hash: `0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef`
- LINK Token: `0x514910771AF9Ca656af840dff83E8264EcF986CA`

## Деплой контракта

### Локальная сеть (Hardhat Network)

1. Запустите локальный нод:
```bash
npm run node
```

2. В новом терминале выполните деплой:
```bash
npm run deploy
```

### Sepolia Testnet

1. Создайте файл `.env` на основе `.env.example`
2. Заполните необходимые параметры:
   - `PRIVATE_KEY` - приватный ключ кошелька с ETH для gas
   - `SEPOLIA_URL` - RPC URL для Sepolia (Infura, Alchemy и т.д.)
   - `SUBSCRIPTION_ID` - ваш Chainlink VRF Subscription ID

3. Обновите параметры в `scripts/deploy.js`:
   - `ticketPrice` - цена билета в ETH
   - `maxTickets` - максимальное количество билетов
   - `subscriptionId` - ваш Subscription ID

4. Выполните деплой:
```bash
npm run deploy -- --network sepolia
```

5. После деплоя добавьте контракт как consumer в вашу subscription:
   - На странице [VRF Subscription Manager](https://vrf.chain.link/)
   - Найдите вашу subscription
   - Нажмите "Add Consumer"
   - Вставьте адрес деплоенного контракта
   - Подтвердите транзакцию

Или используйте скрипт:
```bash
LOTTERY_ADDRESS=<адрес_контракта> SUBSCRIPTION_ID=<ваш_id> npm run add-consumer -- --network sepolia
```

## Проверка деплоя

После деплоя проверьте:

1. ✅ Контракт успешно деплоен (адрес в выводе скрипта)
2. ✅ Контракт добавлен как consumer в Chainlink subscription
3. ✅ Subscription имеет достаточный баланс LINK
4. ✅ Можете вызвать `buyTicket()` с правильной суммой
5. ✅ Статус лотереи отображается корректно

## Важные замечания

⚠️ **Безопасность:**
- Никогда не коммитьте `.env` файл с реальными ключами
- Проверьте все параметры перед деплоем на mainnet
- Рекомендуется провести аудит контрактов перед mainnet деплоем

⚠️ **Gas:**
- Убедитесь, что на кошельке достаточно ETH для gas
- Рекомендуется иметь запас LINK в subscription (минимум 1-2 LINK)

⚠️ **Тестирование:**
- Всегда тестируйте на testnet перед mainnet
- Проверьте работу VRF на testnet несколько раз
- Убедитесь, что выбор победителя работает корректно

## Следующие шаги

После успешного деплоя:

1. Создайте frontend для взаимодействия с контрактом
2. Настройте мониторинг событий (events)
3. Добавьте дополнительные функции (таймауты, возврат средств)
4. Проведите аудит безопасности
5. Подготовьте документацию для пользователей

