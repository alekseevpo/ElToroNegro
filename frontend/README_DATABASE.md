# Database Setup - Quick Start

## 1. Choose Database Option

### Option A: Free Cloud Database (Recommended for Start)

**Supabase (Recommended):**
1. Sign up at https://supabase.com (free)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string
5. Add to `.env.local` as `DATABASE_URL`

**Neon (Alternative):**
1. Sign up at https://neon.tech (free)
2. Create a new project
3. Copy the connection string
4. Add to `.env.local` as `DATABASE_URL`

See `docs/FREE_CLOUD_DATABASES.md` for detailed instructions.

### Option B: Local PostgreSQL

**Install PostgreSQL:**
```bash
# macOS with Homebrew
brew install postgresql@16
brew services start postgresql@16

# Or use Postgres.app from https://postgresapp.com
# Or use Docker: docker run --name postgres-eltoro -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=eltoronegro -p 5432:5432 -d postgres:16
```

**Create Database:**
```bash
createdb eltoronegro
# or
psql postgres -c "CREATE DATABASE eltoronegro;"
```

**Add to `frontend/.env.local`:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/eltoronegro?schema=public"
```

See `docs/QUICK_LOCAL_SETUP.md` for detailed instructions.

## 3. Run Migration

```bash
cd frontend
npx prisma migrate dev --name init
```

This will:
- Create all tables
- Generate Prisma Client
- Create migration files

## 4. Generate Prisma Client

```bash
npx prisma generate
```

## 5. (Optional) View Database

```bash
npx prisma studio
```

Opens at http://localhost:5555

## Available Scripts

- `npm run db:generate` - Generate Prisma Client
- `npm run db:migrate` - Run migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:push` - Push schema changes (dev only)

## Next Steps

After database is set up:
1. Update API routes to use `lib/db-profile-utils.ts` instead of `localStorage`
2. Test all functionality
3. Migrate existing localStorage data (if any)

