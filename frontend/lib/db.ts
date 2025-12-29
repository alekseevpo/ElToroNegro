/**
 * Database utilities using Prisma Client
 * 
 * This file provides a singleton instance of Prisma Client
 * to be used throughout the application.
 */

import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Ensure DATABASE_URL is loaded
// Next.js automatically loads .env.local, but we ensure it's available
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('⚠️  DATABASE_URL is not set. Make sure it exists in .env.local');
}

// Prisma 7 reads DATABASE_URL from environment variables automatically
// The connection string is read from process.env.DATABASE_URL
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

