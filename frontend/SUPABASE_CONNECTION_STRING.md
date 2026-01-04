# Как найти Connection String в Supabase

## Способ 1: Через Settings → Database

1. Откройте ваш проект: https://supabase.com/dashboard/project/jizlgnfieinbaswfiwim
2. В левом меню найдите раздел **"Project Settings"** (иконка шестеренки ⚙️ внизу)
3. Перейдите в **"Database"** → **"Connection string"**
4. Там будут вкладки:
   - **URI** - для прямого подключения
   - **Connection pooling** - для пула соединений
5. Скопируйте строку из вкладки **"URI"**

## Способ 2: Через API Settings

1. Откройте **Project Settings** → **API**
2. Найдите раздел **"Database"** или **"Connection string"**
3. Скопируйте connection string

## Способ 3: Составить вручную

Если не можете найти, используйте этот формат:

**Direct Connection (прямое подключение):**
```
postgresql://postgres:QWEqwe0304+!@db.jizlgnfieinbaswfiwim.supabase.co:5432/postgres?sslmode=require
```

**Connection Pooling (рекомендуется для приложений):**
```
postgresql://postgres.jizlgnfieinbaswfiwim:QWEqwe0304+!@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

**Важно:** Замените `us-east-1` на ваш регион (может быть `eu-west-1`, `ap-southeast-1` и т.д.)

## Проверка подключения

После того как получите connection string, обновите `.env.local`:

```bash
cd frontend
# Откройте .env.local и вставьте ваш connection string
```

Затем запустите миграции:
```bash
npx prisma migrate dev --name init
```

