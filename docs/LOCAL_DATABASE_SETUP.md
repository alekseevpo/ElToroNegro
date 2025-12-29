# Настройка локальной PostgreSQL базы данных

## Установка PostgreSQL на macOS

### Вариант 1: Homebrew (Рекомендуется)

```bash
# Установка PostgreSQL
brew install postgresql@16

# Запуск PostgreSQL
brew services start postgresql@16

# Проверка статуса
brew services list | grep postgresql
```

### Вариант 2: Postgres.app

1. Скачайте Postgres.app с https://postgresapp.com
2. Установите и запустите приложение
3. PostgreSQL будет доступен на `localhost:5432`

### Вариант 3: Docker

```bash
# Запуск PostgreSQL в Docker
docker run --name postgres-eltoro -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=eltoronegro -p 5432:5432 -d postgres:16

# Проверка
docker ps | grep postgres
```

## Создание базы данных

После установки PostgreSQL:

```bash
# Создать базу данных
createdb eltoronegro

# Или через psql
psql postgres
CREATE DATABASE eltoronegro;
\q
```

## Настройка .env.local

Добавьте в `frontend/.env.local`:

```env
# Локальная PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/eltoronegro?schema=public"
```

**Примечание:** Замените `postgres:postgres` на ваши реальные username:password, если они отличаются.

## Проверка подключения

```bash
# Проверить подключение
psql -d eltoronegro -c "SELECT version();"
```

## Запуск миграций

После настройки DATABASE_URL:

```bash
cd frontend
npx prisma migrate dev --name init
```

Это создаст все таблицы в базе данных.

## Просмотр базы данных

```bash
# Через Prisma Studio (визуальный интерфейс)
npx prisma studio

# Или через psql
psql eltoronegro
```

## Миграция на облако позже

Когда будете готовы перенести на облако:

1. Экспортируйте данные из локальной БД:
   ```bash
   pg_dump eltoronegro > backup.sql
   ```

2. Создайте облачную БД (Supabase/Neon)

3. Импортируйте данные:
   ```bash
   psql -h [cloud-host] -U [user] -d [database] < backup.sql
   ```

4. Обновите DATABASE_URL в `.env.local`

