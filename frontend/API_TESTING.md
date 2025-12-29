# API Testing Guide

## Быстрое тестирование всех endpoints

### 1. Получить профиль
```bash
curl http://localhost:3000/api/profile/0xtest1234567890123456789012345678901234567890
```

### 2. Создать новый профиль
```bash
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0xnewuser123456789012345678901234567890123456",
    "username": "newuser",
    "name": "New User"
  }'
```

### 3. Обновить профиль
```bash
curl -X PUT http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0xtest1234567890123456789012345678901234567890",
    "name": "Updated Name",
    "email": "updated@example.com"
  }'
```

### 4. Добавить транзакцию
```bash
curl -X POST http://localhost:3000/api/profile/0xtest1234567890123456789012345678901234567890/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "type": "investment",
    "status": "completed",
    "amount": "1000",
    "currency": "EUR",
    "description": "Test investment",
    "paymentMethod": "card"
  }'
```

### 5. Получить транзакции
```bash
# Все транзакции
curl http://localhost:3000/api/profile/0xtest1234567890123456789012345678901234567890/transactions

# Только инвестиции
curl "http://localhost:3000/api/profile/0xtest1234567890123456789012345678901234567890/transactions?type=investment"
```

### 6. Получить referrals
```bash
curl http://localhost:3000/api/profile/0xtest1234567890123456789012345678901234567890/referrals
```

### 7. Получить профиль по email
```bash
curl "http://localhost:3000/api/profile/by-email?email=test@example.com"
```

## Проверка в браузере

1. **GET профиль**: http://localhost:3000/api/profile/0xtest1234567890123456789012345678901234567890
2. **GET транзакции**: http://localhost:3000/api/profile/0xtest1234567890123456789012345678901234567890/transactions
3. **GET referrals**: http://localhost:3000/api/profile/0xtest1234567890123456789012345678901234567890/referrals

