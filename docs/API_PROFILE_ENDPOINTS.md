# Profile API Endpoints

Документация по API endpoints для работы с профилями пользователей.

## Base URL
```
http://localhost:3000/api/profile
```

## Endpoints

### 1. Получить профиль по адресу
**GET** `/api/profile/[address]`

**Параметры:**
- `address` (path) - Ethereum address пользователя

**Пример запроса:**
```bash
curl http://localhost:3000/api/profile/0x1234567890123456789012345678901234567890
```

**Пример ответа:**
```json
{
  "username": "testuser",
  "name": "Test User",
  "email": "test@example.com",
  "referralCode": "TEST-1234",
  "referredBy": null,
  "wallets": {...},
  "transactions": [...],
  ...
}
```

**Коды ответа:**
- `200` - Успешно
- `400` - Неверный запрос
- `404` - Профиль не найден
- `500` - Ошибка сервера

---

### 2. Создать/обновить профиль
**POST** `/api/profile`

**Тело запроса:**
```json
{
  "address": "0x1234...",
  "username": "newuser",  // Обязательно для новых профилей
  "name": "Display Name",
  "email": "user@example.com",
  "avatar": "character1",
  "referredBy": "REF-CODE",
  ...
}
```

**Пример запроса:**
```bash
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x1234...",
    "username": "newuser",
    "name": "Test User"
  }'
```

**Коды ответа:**
- `201` - Профиль создан
- `200` - Профиль обновлен
- `400` - Неверный запрос
- `500` - Ошибка сервера

**Примечания:**
- `username` нельзя изменить после создания
- `referralCode` генерируется автоматически
- Если профиль существует, выполняется обновление

---

### 3. Обновить профиль
**PUT** `/api/profile`

**Тело запроса:**
```json
{
  "address": "0x1234...",
  "name": "New Name",
  "email": "newemail@example.com",
  ...
}
```

**Пример запроса:**
```bash
curl -X PUT http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x1234...",
    "name": "Updated Name"
  }'
```

**Коды ответа:**
- `200` - Успешно обновлено
- `404` - Профиль не найден
- `400` - Неверный запрос
- `500` - Ошибка сервера

---

### 4. Получить транзакции
**GET** `/api/profile/[address]/transactions`

**Query параметры:**
- `type` (optional) - Фильтр по типу: `token_purchase`, `investment`, `withdrawal`, `lottery_ticket`, `btc_bet`
- `limit` (optional) - Лимит результатов (по умолчанию: 100)
- `offset` (optional) - Смещение для пагинации (по умолчанию: 0)

**Пример запроса:**
```bash
# Все транзакции
curl http://localhost:3000/api/profile/0x1234.../transactions

# Только инвестиции
curl "http://localhost:3000/api/profile/0x1234.../transactions?type=investment"

# С пагинацией
curl "http://localhost:3000/api/profile/0x1234.../transactions?limit=10&offset=0"
```

**Пример ответа:**
```json
{
  "transactions": [
    {
      "id": "tx_...",
      "type": "investment",
      "status": "completed",
      "amount": "1000",
      "currency": "EUR",
      "timestamp": 1234567890,
      ...
    }
  ],
  "total": 25,
  "limit": 10,
  "offset": 0
}
```

---

### 5. Добавить транзакцию
**POST** `/api/profile/[address]/transactions`

**Тело запроса:**
```json
{
  "type": "investment",
  "status": "completed",
  "amount": "1000",
  "currency": "EUR",
  "description": "Investment in pool",
  "txHash": "0x...",
  "paymentMethod": "card",
  "stripeSessionId": "cs_...",
  "metadata": {}
}
```

**Обязательные поля:**
- `type` - Тип транзакции
- `status` - Статус: `pending`, `completed`, `failed`
- `amount` - Сумма
- `currency` - Валюта: `EUR`, `ETH`, `TAI`
- `description` - Описание

**Пример запроса:**
```bash
curl -X POST http://localhost:3000/api/profile/0x1234.../transactions \
  -H "Content-Type: application/json" \
  -d '{
    "type": "investment",
    "status": "completed",
    "amount": "1000",
    "currency": "EUR",
    "description": "Investment"
  }'
```

**Коды ответа:**
- `201` - Транзакция создана
- `400` - Неверный запрос
- `404` - Профиль не найден
- `500` - Ошибка сервера

---

### 6. Получить referrals
**GET** `/api/profile/[address]/referrals`

**Пример запроса:**
```bash
curl http://localhost:3000/api/profile/0x1234.../referrals
```

**Пример ответа:**
```json
{
  "referralCode": "REF-1234",
  "referredBy": "REF-5678",
  "totalReferrals": 5,
  "referrals": [
    {
      "address": "0xabc...",
      "username": "user1",
      "name": "User One",
      "createdAt": 1234567890
    }
  ]
}
```

---

### 7. Получить профиль по email
**GET** `/api/profile/by-email?email=user@example.com`

**Query параметры:**
- `email` (required) - Email адрес пользователя

**Пример запроса:**
```bash
curl "http://localhost:3000/api/profile/by-email?email=test@example.com"
```

---

## Обработка ошибок

Все endpoints возвращают ошибки в следующем формате:

```json
{
  "error": "Описание ошибки"
}
```

## Примеры использования в коде

### React Hook для получения профиля
```typescript
const useProfile = (address: string) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/profile/${address}`)
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setLoading(false);
      });
  }, [address]);

  return { profile, loading };
};
```

### Создание профиля
```typescript
const createProfile = async (address: string, username: string) => {
  const response = await fetch('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, username }),
  });
  return response.json();
};
```

