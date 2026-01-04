/**
 * Lottery Utilities
 * 
 * Functions for instant lottery prize determination and calculations
 */

import { LOTTERY_PRIZES } from './constants';
import { logger } from './logger';

export interface LotteryPrize {
  amount: number;
  probability: number;
}

export interface LotteryResult {
  prize: number;
  ticketId: string;
  timestamp: number;
}

/**
 * Determine prize for a lottery ticket using weighted random selection
 * Based on the probability distribution defined in LOTTERY_PRIZES
 * 
 * @returns Prize amount in USDT
 * @throws Error if LOTTERY_PRIZES is empty or invalid
 */
export function determinePrize(): number {
  // Validate LOTTERY_PRIZES is not empty
  // TypeScript knows LOTTERY_PRIZES is a constant array, so we just check if it exists
  if (!LOTTERY_PRIZES) {
    logger.error('LOTTERY_PRIZES is undefined', new Error('LOTTERY_PRIZES configuration is invalid'));
    throw new Error('Lottery prizes configuration is invalid');
  }

  // Generate random number between 0 and 100 (cryptographically secure if available)
  // Using crypto.getRandomValues for better randomness in production
  let random: number;
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    random = (array[0] / (0xFFFFFFFF + 1)) * 100;
  } else {
    random = Math.random() * 100;
  }
  
  // Validate random value
  if (random < 0 || random >= 100 || !isFinite(random)) {
    logger.error('Invalid random value generated', { random });
    random = Math.random() * 100; // Fallback to Math.random
  }
  
  // Calculate cumulative probabilities
  let cumulativeProbability = 0;
  
  for (const prize of LOTTERY_PRIZES) {
    // Validate prize structure
    if (!prize || typeof prize.amount !== 'number' || typeof prize.probability !== 'number') {
      logger.error('Invalid prize structure', { prize });
      continue;
    }
    
    if (prize.amount <= 0 || prize.probability <= 0) {
      logger.warn('Invalid prize amount or probability', { prize });
      continue;
    }
    
    cumulativeProbability += prize.probability;
    
    if (random < cumulativeProbability) {
      logger.info('Lottery prize determined', { 
        prize: prize.amount, 
        random: random.toFixed(4),
        probability: prize.probability 
      });
      return prize.amount;
    }
  }
  
  // Fallback to minimum prize (should never happen if probabilities sum to 100%)
  // This is a safety measure in case of floating point errors
  const minPrize = Math.min(...LOTTERY_PRIZES.map(p => p.amount));
  logger.warn('Lottery prize fallback to minimum', { 
    random, 
    cumulativeProbability,
    minPrize 
  });
  return minPrize;
}

/**
 * Calculate expected value (mathematical expectation) of lottery ticket
 * 
 * @returns Expected value in USDT
 */
export function calculateExpectedValue(): number {
  return LOTTERY_PRIZES.reduce((sum, prize) => {
    return sum + (prize.amount * prize.probability / 100);
  }, 0);
}

/**
 * Calculate probability of winning a specific prize or higher
 * 
 * @param minPrize Minimum prize amount to calculate probability for
 * @returns Probability as percentage
 */
export function calculateWinProbability(minPrize: number): number {
  return LOTTERY_PRIZES
    .filter(prize => prize.amount >= minPrize)
    .reduce((sum, prize) => sum + prize.probability, 0);
}

/**
 * Get prize distribution statistics
 * 
 * @returns Object with prize statistics
 */
export function getPrizeStatistics() {
  const expectedValue = calculateExpectedValue();
  const totalProbability = LOTTERY_PRIZES.reduce((sum, prize) => sum + prize.probability, 0);
  
  return {
    expectedValue: expectedValue.toFixed(2),
    totalProbability: totalProbability.toFixed(2),
    totalPrizes: LOTTERY_PRIZES.length,
    maxPrize: Math.max(...LOTTERY_PRIZES.map(p => p.amount)),
    minPrize: Math.min(...LOTTERY_PRIZES.map(p => p.amount)),
    prizes: LOTTERY_PRIZES.map(prize => ({
      amount: prize.amount,
      probability: prize.probability,
      chance: `${(1 / (prize.probability / 100)).toFixed(0)} in ${(100 / prize.probability).toFixed(0)}`,
    })),
  };
}

/**
 * Generate unique ticket ID
 * Uses timestamp and random string for uniqueness
 * 
 * @returns Unique ticket identifier in format: TICKET-{timestamp}-{random}
 */
export function generateTicketId(): string {
  const timestamp = Date.now();
  
  // Use crypto.getRandomValues for better randomness if available
  let random: string;
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    random = Array.from(array, byte => byte.toString(36)).join('');
  } else {
    random = Math.random().toString(36).substring(2, 10);
  }
  
  // Ensure we have enough randomness
  if (random.length < 6) {
    random += Math.random().toString(36).substring(2, 10);
  }
  
  return `TICKET-${timestamp}-${random.substring(0, 9).toUpperCase()}`;
}

/**
 * Calculate number of free tickets based on investment amount
 * 
 * @param investmentAmount Investment amount in EUR
 * @returns Number of free tickets (always >= 0)
 */
export function calculateFreeTickets(investmentAmount: number): number {
  // Validate input
  if (typeof investmentAmount !== 'number' || !isFinite(investmentAmount)) {
    logger.warn('Invalid investment amount for free tickets calculation', { investmentAmount });
    return 0;
  }
  
  // Ensure non-negative
  if (investmentAmount < 0) {
    logger.warn('Negative investment amount provided', { investmentAmount });
    return 0;
  }
  
  const freeTickets = Math.floor(investmentAmount / 10);
  
  // Ensure result is non-negative (floor of negative would still be negative)
  return Math.max(0, freeTickets);
}

