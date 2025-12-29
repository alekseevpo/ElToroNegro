# Database Setup Guide

This guide explains how to set up PostgreSQL database with Prisma for El Toro Negro.

## Prerequisites

1. PostgreSQL installed locally or access to a PostgreSQL database
2. Node.js 18+ installed

## Setup Steps

### 1. Install Dependencies

Dependencies are already installed:
- `prisma` - Prisma CLI
- `@prisma/client` - Prisma Client for TypeScript

### 2. Configure Database Connection

Add `DATABASE_URL` to your `.env.local` file in the `frontend` directory:

```env
# PostgreSQL Database URL
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE

# Local PostgreSQL example:
DATABASE_URL="postgresql://postgres:password@localhost:5432/eltoronegro?schema=public"

# Or use a cloud database (Supabase, Neon, Railway, etc.):
# DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public&sslmode=require"
```

### 3. Create Database

If using local PostgreSQL:

```bash
# Create database
createdb eltoronegro

# Or using psql:
psql -U postgres
CREATE DATABASE eltoronegro;
```

### 4. Run Migrations

```bash
cd frontend
npx prisma migrate dev --name init
```

This will:
- Create all tables in the database
- Generate Prisma Client
- Create migration files

### 5. Generate Prisma Client

```bash
npx prisma generate
```

### 6. (Optional) View Database in Prisma Studio

```bash
npx prisma studio
```

This opens a visual database browser at `http://localhost:5555`

## Database Schema

The database includes the following tables:

- **User** - User profiles and authentication
- **Wallet** - Connected cryptocurrency wallets
- **SocialConnection** - Social media connections
- **Transaction** - User transaction history
- **PortfolioAsset** - User portfolio assets
- **KYCVerification** - KYC verification history

## Cloud Database Options

### Option 1: Supabase (Recommended for free tier)
1. Sign up at https://supabase.com
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string
5. Add to `.env.local` as `DATABASE_URL`

### Option 2: Neon (Serverless PostgreSQL)
1. Sign up at https://neon.tech
2. Create a new project
3. Copy the connection string
4. Add to `.env.local` as `DATABASE_URL`

### Option 3: Railway
1. Sign up at https://railway.app
2. Create a new PostgreSQL service
3. Copy the connection string
4. Add to `.env.local` as `DATABASE_URL`

## Migration from localStorage

To migrate existing localStorage data to the database:

1. Export data from localStorage (if needed)
2. Create a migration script (TODO)
3. Run the migration script

## Troubleshooting

### Connection Issues

If you get connection errors:
- Check that PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL format
- Check firewall/network settings for cloud databases
- Ensure SSL mode is correct for cloud databases

### Migration Issues

If migrations fail:
- Check database connection
- Ensure database exists
- Check for existing tables (may need to drop and recreate)

## Next Steps

After setting up the database:
1. Update API routes to use database functions
2. Replace localStorage calls with database calls
3. Test all functionality
4. Deploy database migrations to production

