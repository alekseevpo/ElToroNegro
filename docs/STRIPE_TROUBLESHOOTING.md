# Устранение проблем со Stripe

## Проблема: Ошибка 500 при создании payment intent

### Причина
Объект Stripe не был инициализирован в `create-payment-intent/route.ts`.

### Решение
✅ Исправлено: Добавлена инициализация Stripe с проверкой наличия ключа.

### Проверка настройки

1. **Убедитесь, что в `.env.local` есть ключи:**
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

2. **Проверьте формат ключей:**
   - `STRIPE_SECRET_KEY` должен начинаться с `sk_test_` (для тестового режима)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` должен начинаться с `pk_test_` (для тестового режима)

3. **Перезапустите dev сервер после изменения .env.local:**
   ```bash
   cd frontend
   npm run dev
   ```

## Другие возможные проблемы

### Ошибка: "Stripe is not configured"
- Проверьте, что `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` установлен
- Убедитесь, что ключ не пустой и не содержит пробелов

### Ошибка: "Payment method types not activated"
- Это предупреждение о bancontact (уже исправлено)
- Теперь используются только карты: `payment_method_types: ['card']`

### Ошибка: "Card element not found"
- Обновите страницу
- Убедитесь, что Stripe.js загрузился (проверьте Network tab)

## Тестовые карты

Для тестирования используйте:
- **Успешная оплата:** `4242 4242 4242 4242`
- **Отклонена:** `4000 0000 0000 0002`
- **3D Secure:** `4000 0025 0000 3155`

Любая будущая дата истечения, любой 3-значный CVC.

