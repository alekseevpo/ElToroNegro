# Бесплатные облачные базы данных для проекта

## Рекомендуемые варианты (в порядке предпочтения)

### 1. Supabase (Рекомендуется) ⭐

**Преимущества:**
- Полностью бесплатный tier с 500MB базы данных
- Автоматические бэкапы
- Встроенный REST API
- Реальное время (realtime subscriptions)
- Отличная документация
- PostgreSQL 15

**Регистрация:**
1. Перейдите на https://supabase.com
2. Нажмите "Start your project"
3. Войдите через GitHub
4. Создайте новый проект
5. Выберите регион (ближайший к вам)
6. Дождитесь создания проекта (1-2 минуты)

**Получение connection string:**
1. В проекте перейдите в Settings → Database
2. Найдите секцию "Connection string"
3. Выберите "URI" или "Connection pooling"
4. Скопируйте строку подключения
5. Добавьте в `.env.local` как `DATABASE_URL`

**Пример:**
```
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
```

---

### 2. Neon (Serverless PostgreSQL) ⭐

**Преимущества:**
- Полностью бесплатный tier
- Serverless (автоматически масштабируется)
- Автоматические бэкапы
- Быстрое создание проектов
- PostgreSQL 15

**Регистрация:**
1. Перейдите на https://neon.tech
2. Нажмите "Sign Up"
3. Войдите через GitHub
4. Создайте новый проект
5. Скопируйте connection string

**Пример:**
```
DATABASE_URL="postgresql://[user]:[password]@[endpoint]/[dbname]?sslmode=require"
```

---

### 3. Railway

**Преимущества:**
- $5 бесплатных кредитов в месяц
- Простое развертывание
- Автоматические бэкапы

**Регистрация:**
1. Перейдите на https://railway.app
2. Войдите через GitHub
3. Создайте новый проект
4. Добавьте PostgreSQL service
5. Скопируйте connection string из Variables

---

### 4. Render

**Преимущества:**
- Бесплатный PostgreSQL (с ограничениями)
- Автоматические бэкапы
- 90 дней бездействия = удаление (для бесплатного tier)

**Регистрация:**
1. Перейдите на https://render.com
2. Войдите через GitHub
3. Создайте новый PostgreSQL database
4. Скопируйте Internal Database URL

---

## Рекомендация

**Для начала рекомендую Supabase**, потому что:
- ✅ Самый щедрый бесплатный tier
- ✅ Отличная документация
- ✅ Дополнительные функции (Auth, Storage, Realtime)
- ✅ Не удаляет данные при неактивности
- ✅ Легко масштабировать позже

## Быстрая настройка с Supabase

1. Зарегистрируйтесь на https://supabase.com
2. Создайте проект
3. Скопируйте connection string из Settings → Database
4. Добавьте в `frontend/.env.local`:
   ```env
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres?sslmode=require"
   ```
5. Замените `[PASSWORD]` на ваш пароль из Supabase
6. Запустите миграции:
   ```bash
   cd frontend
   npx prisma migrate dev --name init
   ```

## Важно

- **Никогда не коммитьте** `.env.local` в Git
- Храните пароли в безопасности
- Используйте SSL (`sslmode=require`) для облачных БД
- Регулярно делайте бэкапы (Supabase делает автоматически)

