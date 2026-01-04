# Быстрая настройка Google OAuth

## Шаг 1: Создать OAuth Client в Google Cloud Console

1. Откройте https://console.cloud.google.com/
2. Выберите проект или создайте новый
3. Перейдите в **APIs & Services** → **Credentials**
4. Нажмите **+ CREATE CREDENTIALS** → **OAuth client ID**

### Если появится экран OAuth consent screen:
- **User Type**: External
- **App name**: El Toro Negro
- **User support email**: ваш email
- **Authorized domains**: оставьте пустым для localhost
- Нажмите **Save and Continue**
- На следующем экране нажмите **Save and Continue** (scopes можно оставить по умолчанию)
- На экране Test users добавьте ваш email (alekseevpo@gmail.com)
- Нажмите **Save and Continue**

### Создание OAuth Client ID:
- **Application type**: Web application
- **Name**: El Toro Negro Web Client
- **Authorized JavaScript origins**: 
  ```
  http://localhost:3000
  ```
- **Authorized redirect URIs**:
  ```
  http://localhost:3000/api/auth/google/handle-callback
  ```
- Нажмите **CREATE**

## Шаг 2: Скопировать Client ID

После создания вы получите:
- **Client ID** (выглядит как: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)
- **Client Secret** (не нужен для нашего случая, так как используем Implicit Flow)

## Шаг 3: Добавить в .env.local

Откройте `frontend/.env.local` и добавьте:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=ваш_client_id_здесь
```

**Важно:** 
- Используйте `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (с префиксом NEXT_PUBLIC_)
- Client Secret не нужен для Implicit Flow

## Шаг 4: Перезапустить сервер

```bash
# Остановите текущий сервер (Ctrl+C)
# Затем запустите снова:
cd frontend
npm run dev
```

## Готово! 🎉

Теперь вход через Google должен работать.

## Проверка

1. Откройте http://localhost:3000
2. Нажмите "Continue with Google"
3. Должен открыться Google Sign-In

## Проблемы?

### "Redirect URI mismatch"
- Убедитесь, что в Google Cloud Console указан точно такой redirect URI:
  `http://localhost:3000/api/auth/google/handle-callback`
- Проверьте, что нет лишних слэшей или пробелов

### "Google Sign-In is not configured"
- Проверьте, что `NEXT_PUBLIC_GOOGLE_CLIENT_ID` добавлен в `.env.local`
- Перезапустите сервер после добавления переменной

