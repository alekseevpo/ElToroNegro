# Тестирование базы данных

## Проблема с Prisma 7

Prisma 7 требует, чтобы `DATABASE_URL` был доступен в runtime. Next.js автоматически загружает переменные из `.env.local`, но иногда нужно перезапустить сервер.

## Решение

1. **Убедитесь, что DATABASE_URL установлен в `.env.local`:**
   ```bash
   DATABASE_URL="postgresql://your_username@localhost:5432/eltoronegro?schema=public"
   ```

2. **Перезапустите dev сервер:**
   ```bash
   # Остановите текущий сервер (Ctrl+C)
   npm run dev
   ```

3. **Проверьте подключение:**
   - Откройте http://localhost:3000/api/stats
   - Должен вернуться JSON с реальной статистикой из БД

4. **Проверьте Prisma Studio:**
   ```bash
   npm run db:studio
   ```
   - Откроется на http://localhost:5555
   - Позволяет просматривать данные в БД

## Тестирование API

### Stats API
```bash
curl http://localhost:3000/api/stats
```

Ожидаемый ответ:
```json
{
  "totalRegistrations": 0,
  "activeToday": 0,
  "onlineNow": 0
}
```

### Email Verification
```bash
# Send verification
curl -X POST http://localhost:3000/api/email/send-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","userId":"0x123..."}'

# Verify email
curl -X POST http://localhost:3000/api/email/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"...","email":"test@example.com"}'
```

## Если проблемы

1. Проверьте, что PostgreSQL запущен:
   ```bash
   brew services list | grep postgresql
   ```

2. Проверьте подключение к БД:
   ```bash
   psql eltoronegro -c "SELECT COUNT(*) FROM \"User\";"
   ```

3. Убедитесь, что миграции применены:
   ```bash
   npm run db:migrate
   ```

