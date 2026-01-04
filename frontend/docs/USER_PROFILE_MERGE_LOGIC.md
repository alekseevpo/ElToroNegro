# Логика объединения профилей пользователей

## Проблема
При входе разными способами (Google OAuth, MetaMask, TON) создавались отдельные профили для одного и того же пользователя, что приводило к дублированию в статистике.

## Решение

### 1. Структура данных
- **User** - основной профиль пользователя
  - `address` - уникальный идентификатор (email для Google auth, wallet address для MetaMask)
  - `email` - email пользователя (если есть)
- **Wallet** - связанные кошельки пользователя
  - `userId` - ссылка на User
  - `type` - тип кошелька (metamask, ton, walletconnect, etc.)
  - `address` - адрес кошелька

### 2. Логика объединения в heartbeat API

#### При входе через Google OAuth:
1. Используется email как `address` в таблице User
2. Если профиль с таким email уже существует - используется он
3. Если пользователь потом подключает MetaMask - wallet добавляется в таблицу Wallet, связанную с этим User

#### При входе через MetaMask:
1. Проверяется, есть ли уже User с таким wallet address
2. Если нет, проверяется, есть ли wallet в таблице Wallet, связанный с каким-то User
3. Если пользователь добавил email к wallet профилю:
   - Проверяется, есть ли User с таким email
   - Если есть - wallet связывается с существующим User профилем
   - Если нет - создается новый User с wallet address как address
4. Если пользователь не добавил email - создается User с wallet address как address

### 3. Алгоритм поиска пользователя

```typescript
// 1. Поиск по address (email или wallet address)
user = await prisma.user.findUnique({ where: { address } });

// 2. Если не найден и это wallet address - проверяем таблицу Wallet
if (!user && address.startsWith('0x')) {
  wallet = await prisma.wallet.findFirst({ where: { address } });
  if (wallet?.user) {
    user = wallet.user;
  }
}

// 3. Поиск по email
if (!user && email) {
  user = await prisma.user.findFirst({
    where: { OR: [{ email }, { address: email }] }
  });
}
```

### 4. Автоматическое объединение

При входе через MetaMask с email:
- Если существует User с таким email - wallet связывается с ним
- Дублирующий User (если был создан ранее) не удаляется автоматически, но wallet перенаправляется

При обновлении профиля:
- Если пользователь добавляет email к wallet профилю, и такой email уже существует - wallet перенаправляется к существующему User

### 5. Рекомендации

1. **При создании нового профиля:**
   - Всегда проверять существование профиля по email (если есть)
   - Всегда проверять существование wallet в таблице Wallet

2. **При обновлении профиля:**
   - Если пользователь добавляет email - проверять, не существует ли уже User с таким email
   - Если существует - предложить объединение или автоматически объединить

3. **Миграция существующих данных:**
   - Найти дублирующие профили (по email или связанным wallet)
   - Объединить их вручную через SQL или скрипт миграции

### 6. Примеры использования

#### Пример 1: Пользователь входит через Google, потом через MetaMask
1. Google вход → создается User с address = email
2. MetaMask вход → проверяется wallet в таблице Wallet
3. Если пользователь добавил email к MetaMask профилю → wallet связывается с Google User

#### Пример 2: Пользователь входит через MetaMask, потом через Google
1. MetaMask вход → создается User с address = wallet address
2. Пользователь добавляет email → проверяется, есть ли User с таким email
3. Google вход → используется существующий User (если email совпадает)

### 7. Текущая реализация

Логика объединения реализована в:
- `frontend/app/api/profile/heartbeat/route.ts` - автоматическое объединение при heartbeat
- Проверка wallet address в таблице Wallet перед созданием нового User
- Автоматическое связывание wallet с существующим User при добавлении email

