# Быстрая настройка базы данных

## Вариант 1: Supabase (Рекомендуется) ⭐

1. Зарегистрируйтесь на https://supabase.com (через GitHub)
2. Создайте новый проект
3. Дождитесь создания (1-2 минуты)
4. Перейдите в Settings → Database
5. Найдите "Connection string" → выберите "URI"
6. Скопируйте строку подключения (она выглядит так):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
7. Замените `[YOUR-PASSWORD]` на ваш пароль из Supabase
8. Добавьте в `frontend/.env.local`:
   ```env
   DATABASE_URL="postgresql://postgres:ВАШ_ПАРОЛЬ@db.xxxxx.supabase.co:5432/postgres?sslmode=require"
   ```
9. Запустите миграции:
   ```bash
   cd frontend
   npx prisma migrate dev --name init
   ```

## Вариант 2: Локальный PostgreSQL (если нужен пароль)

Если ваш PostgreSQL требует пароль:

1. Узнайте пароль для пользователя `ppmtrue` или создайте нового пользователя
2. Обновите `frontend/.env.local`:
   ```env
   DATABASE_URL="postgresql://ppmtrue:ВАШ_ПАРОЛЬ@localhost:5432/eltoronegro?schema=public"
   ```
3. Создайте базу данных:
   ```bash
   createdb -U ppmtrue eltoronegro
   ```
4. Запустите миграции:
   ```bash
   cd frontend
   npx prisma migrate dev --name init
   ```

## После настройки

Проверьте подключение:
```bash
curl "http://localhost:3000/api/email/check-verification?email=alekseevpo@gmail.com"
```

