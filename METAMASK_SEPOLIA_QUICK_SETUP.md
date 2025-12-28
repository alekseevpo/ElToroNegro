# Быстрая настройка Sepolia в MetaMask

## Рекомендуемые настройки:

### Основной RPC URL (Default RPC URL):
```
rpc.sepolia.org
```
**Это то, что нужно выбрать!** Это публичный RPC от Ethereum Foundation, бесплатный и надежный.

### Альтернативные варианты (если нужна резервная копия):

**Option 1: Alchemy (требует API ключ):**
```
https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

**Option 2: Infura (требует API ключ):**
```
https://sepolia.infura.io/v3/YOUR_API_KEY
```

**Option 3: Публичный RPC (рекомендуется):**
```
https://rpc.sepolia.org
```

## Полная конфигурация сети Sepolia:

**Network Name (Имя сети):**
- Рекомендуется: `Sepolia` (как предлагает MetaMask)
- Или можно оставить: `Sepolia Test Network`

**Default RPC URL:**
```
https://rpc.sepolia.org
```
или просто:
```
rpc.sepolia.org
```

**Chain ID:**
```
11155111
```

**Currency Symbol (Символ валюты):**
```
ETH
```
(или `SepoliaETH` - оба варианта работают)

**Block Explorer URL:**
```
https://sepolia.etherscan.io
```

## Что делать с предупреждением:

MetaMask показывает предупреждение о названии сети, потому что стандартное название - просто "Sepolia". 

**Рекомендация:**
- Нажмите "Сохранить" (Save) - всё будет работать правильно
- Если хотите, измените имя на "Sepolia" (как предлагается), но это необязательно

## После сохранения:

1. Вы будете переключены на сеть Sepolia
2. Можете получить тестовые ETH через faucet: https://sepoliafaucet.com/
3. Начнете тестировать покупку токенов на вашем сайте

## Примечание о RPC:

`rpc.sepolia.org` - это публичный endpoint, который:
- ✅ Бесплатный
- ✅ Не требует регистрации
- ✅ Подходит для тестирования
- ✅ Надежный и стабильный

Для production приложений лучше использовать приватные RPC (Alchemy, Infura), но для тестирования публичного RPC более чем достаточно.

