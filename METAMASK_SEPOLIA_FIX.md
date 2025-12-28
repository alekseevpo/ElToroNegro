# Исправление ошибки RPC URL в MetaMask

## Проблема:
Ошибка: "Не удалось получить ID блокчейна. Верен ли ваш URL RPC?"

## Причина:
Вы указали только домен `rpc.sepolia.org` без протокола `https://`. MetaMask требует полный URL.

## Решение:

### В поле "URL-адрес RPC по умолчанию" (Default RPC URL) введите:

```
https://rpc.sepolia.org
```

**Важно:** Обязательно добавьте `https://` в начале!

## Полная правильная конфигурация:

**Network Name (Имя сети):**
```
Sepolia
```
(или оставьте "Sepolia Test Network" - оба варианта работают)

**Default RPC URL:**
```
https://rpc.sepolia.org
```

**Chain ID:**
```
11155111
```

**Currency Symbol:**
```
ETH
```
(или `SepoliaETH`)

**Block Explorer URL:**
```
https://sepolia.etherscan.io
```

## После исправления:

1. Введите полный URL `https://rpc.sepolia.org`
2. MetaMask автоматически проверит подключение
3. Ошибка должна исчезнуть
4. Нажмите "Сохранить" (Save)

## Альтернативные RPC URL (если нужны):

Если `https://rpc.sepolia.org` всё ещё не работает, попробуйте:

**Option 1:**
```
https://ethereum-sepolia-rpc.publicnode.com
```

**Option 2:**
```
https://sepolia.gateway.tenderly.co
```

**Option 3:**
```
https://rpc2.sepolia.org
```

Но обычно `https://rpc.sepolia.org` работает отлично, просто нужно добавить `https://`!

