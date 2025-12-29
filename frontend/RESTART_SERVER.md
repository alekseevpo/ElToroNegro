# ⚠️ ВАЖНО: Перезапустите сервер!

После downgrade Prisma с 7 на 6 и очистки кеша Next.js, **обязательно перезапустите dev сервер**:

```bash
# 1. Остановите текущий сервер (Ctrl+C)

# 2. Запустите снова:
npm run dev
```

После перезапуска проверьте:
- http://localhost:3000/api/stats - должен вернуть JSON с данными из БД

## Что было сделано:
1. ✅ Downgrade Prisma с 7.2.0 на 6.19.1
2. ✅ Обновлен schema.prisma (добавлен `url = env("DATABASE_URL")`)
3. ✅ Удален prisma.config.ts (не нужен для Prisma 6)
4. ✅ Очищен кеш Next.js (.next)
5. ✅ Сгенерирован Prisma Client для версии 6

## Проверка:
```bash
# Проверьте версию Prisma
npm list @prisma/client

# Проверьте подключение к БД
psql eltoronegro -c "SELECT COUNT(*) FROM \"User\";"
```

