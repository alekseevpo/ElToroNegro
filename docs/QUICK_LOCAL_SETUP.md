# Быстрая настройка локальной PostgreSQL

## Шаг 1: Установка PostgreSQL

### Если у вас установлен Homebrew:

```bash
# Установить PostgreSQL
brew install postgresql@16

# Запустить PostgreSQL как сервис
brew services start postgresql@16

# Проверить, что запущен
brew services list | grep postgresql
```

### Если Homebrew нет:

**Вариант A: Установить Homebrew**
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Вариант B: Использовать Postgres.app**
1. Скачайте с https://postgresapp.com
2. Установите и запустите
3. Нажмите "Initialize" для создания сервера

**Вариант C: Docker (если установлен Docker)**
```bash
docker run --name postgres-eltoro \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=eltoronegro \
  -p 5432:5432 \
  -d postgres:16
```

## Шаг 2: Создать базу данных

```bash
# Если PostgreSQL установлен через Homebrew
createdb eltoronegro

# Или через psql
psql postgres
CREATE DATABASE eltoronegro;
\q
```

## Шаг 3: Настроить .env.local

Добавьте в `frontend/.env.local`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/eltoronegro?schema=public"
```

**Важно:** 
- Если используете другой username/password, замените `postgres:postgres`
- Для Postgres.app обычно: `postgres:` (без пароля) или `postgres:postgres`
- Для Docker: `postgres:postgres`

## Шаг 4: Запустить миграции

```bash
cd frontend
npx prisma migrate dev --name init
```

## Шаг 5: Сгенерировать Prisma Client

```bash
npx prisma generate
```

## Готово! 🎉

Теперь база данных настроена и готова к использованию.

## Просмотр данных

```bash
# Визуальный интерфейс
npx prisma studio
# Откроется на http://localhost:5555

# Или через командную строку
psql eltoronegro
```

## Проблемы?

### PostgreSQL не запускается
```bash
# Проверить статус
brew services list

# Перезапустить
brew services restart postgresql@16
```

### Ошибка подключения
- Проверьте, что PostgreSQL запущен: `pg_isready`
- Проверьте DATABASE_URL в `.env.local`
- Убедитесь, что база данных создана: `psql -l | grep eltoronegro`

