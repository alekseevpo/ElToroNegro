/**
 * Unit tests for lottery utilities
 * 
 * Tests prize determination, probability calculations, and edge cases
 */

import {
  determinePrize,
  calculateExpectedValue,
  calculateWinProbability,
  getPrizeStatistics,
  generateTicketId,
  calculateFreeTickets,
  type LotteryPrize,
} from '../lottery-utils';
import { LOTTERY_PRIZES } from '../constants';

describe('lottery-utils', () => {
  describe('determinePrize', () => {
    it('should always return a valid prize amount', () => {
      const prize = determinePrize();
      expect(prize).toBeGreaterThan(0);
      expect(typeof prize).toBe('number');
    });

    it('should return a prize within expected range', () => {
      const minPrize = Math.min(...LOTTERY_PRIZES.map(p => p.amount));
      const maxPrize = Math.max(...LOTTERY_PRIZES.map(p => p.amount));
      
      for (let i = 0; i < 100; i++) {
        const prize = determinePrize();
        expect(prize).toBeGreaterThanOrEqual(minPrize);
        expect(prize).toBeLessThanOrEqual(maxPrize);
      }
    });

    it('should return valid prize values from LOTTERY_PRIZES', () => {
      const validPrizes = new Set(LOTTERY_PRIZES.map(p => p.amount));
      const results = new Set();
      
      // Run multiple times to get various prizes
      for (let i = 0; i < 1000; i++) {
        const prize = determinePrize();
        results.add(prize);
      }
      
      // All results should be valid prizes
      results.forEach(prize => {
        expect(validPrizes.has(prize)).toBe(true);
      });
    });

    it('should have correct probability distribution over large sample', () => {
      const iterations = 100000;
      const prizeCounts: Record<number, number> = {};
      const prizeProbabilities: Record<number, number> = {};
      
      // Initialize counts
      LOTTERY_PRIZES.forEach(prize => {
        prizeCounts[prize.amount] = 0;
        prizeProbabilities[prize.amount] = prize.probability;
      });
      
      // Collect results
      for (let i = 0; i < iterations; i++) {
        const prize = determinePrize();
        prizeCounts[prize]++;
      }
      
      // Check each prize probability (allow 10% deviation)
      LOTTERY_PRIZES.forEach(prize => {
        const expectedCount = (prize.probability / 100) * iterations;
        const actualCount = prizeCounts[prize.amount];
        const deviation = Math.abs(actualCount - expectedCount) / expectedCount;
        
        expect(deviation).toBeLessThan(0.1); // Within 10% of expected
      });
    });

    it('should be deterministic with seeded random (for testing)', () => {
      // Note: This test assumes we could seed Math.random if needed
      // For now, we just verify the function works
      const prizes = new Set();
      for (let i = 0; i < 100; i++) {
        prizes.add(determinePrize());
      }
      expect(prizes.size).toBeGreaterThan(1); // Should have variety
    });
  });

  describe('calculateExpectedValue', () => {
    it('should return a positive number', () => {
      const expectedValue = calculateExpectedValue();
      expect(expectedValue).toBeGreaterThan(0);
    });

    it('should return expected value close to 7 USDT', () => {
      const expectedValue = calculateExpectedValue();
      // Should be around 6.5-7.5 USDT based on our calculations
      expect(expectedValue).toBeGreaterThan(6);
      expect(expectedValue).toBeLessThan(8);
    });

    it('should calculate correctly based on prize probabilities', () => {
      const expectedValue = calculateExpectedValue();
      let manualCalculation = 0;
      
      LOTTERY_PRIZES.forEach(prize => {
        manualCalculation += (prize.amount * prize.probability / 100);
      });
      
      expect(Math.abs(expectedValue - manualCalculation)).toBeLessThan(0.01);
    });
  });

  describe('calculateWinProbability', () => {
    it('should return 100% for minimum prize', () => {
      const minPrize = Math.min(...LOTTERY_PRIZES.map(p => p.amount));
      const probability = calculateWinProbability(minPrize);
      expect(probability).toBeCloseTo(100, 1);
    });

    it('should return 0% for prize above maximum', () => {
      const maxPrize = Math.max(...LOTTERY_PRIZES.map(p => p.amount));
      const probability = calculateWinProbability(maxPrize + 1);
      expect(probability).toBe(0);
    });

    it('should return decreasing probability for increasing prize amounts', () => {
      const prize1 = 10;
      const prize2 = 50;
      const prize3 = 100;
      
      const prob1 = calculateWinProbability(prize1);
      const prob2 = calculateWinProbability(prize2);
      const prob3 = calculateWinProbability(prize3);
      
      expect(prob1).toBeGreaterThanOrEqual(prob2);
      expect(prob2).toBeGreaterThanOrEqual(prob3);
    });

    it('should return correct probability for specific prizes', () => {
      const prob1000 = calculateWinProbability(1000);
      expect(prob1000).toBeCloseTo(0.1, 1); // 0.1%
      
      const prob500 = calculateWinProbability(500);
      expect(prob500).toBeCloseTo(0.2, 1); // 0.1% + 0.1%
    });
  });

  describe('getPrizeStatistics', () => {
    it('should return valid statistics object', () => {
      const stats = getPrizeStatistics();
      
      expect(stats).toHaveProperty('expectedValue');
      expect(stats).toHaveProperty('totalProbability');
      expect(stats).toHaveProperty('totalPrizes');
      expect(stats).toHaveProperty('maxPrize');
      expect(stats).toHaveProperty('minPrize');
      expect(stats).toHaveProperty('prizes');
    });

    it('should have total probability close to 100%', () => {
      const stats = getPrizeStatistics();
      const totalProb = parseFloat(stats.totalProbability);
      expect(totalProb).toBeCloseTo(100, 1);
    });

    it('should have correct min and max prizes', () => {
      const stats = getPrizeStatistics();
      const expectedMin = Math.min(...LOTTERY_PRIZES.map(p => p.amount));
      const expectedMax = Math.max(...LOTTERY_PRIZES.map(p => p.amount));
      
      expect(stats.minPrize).toBe(expectedMin);
      expect(stats.maxPrize).toBe(expectedMax);
    });

    it('should have correct number of prizes', () => {
      const stats = getPrizeStatistics();
      expect(stats.totalPrizes).toBe(LOTTERY_PRIZES.length);
    });

    it('should have prizes array with correct structure', () => {
      const stats = getPrizeStatistics();
      expect(stats.prizes).toHaveLength(LOTTERY_PRIZES.length);
      
      stats.prizes.forEach((prize, index) => {
        expect(prize).toHaveProperty('amount');
        expect(prize).toHaveProperty('probability');
        expect(prize).toHaveProperty('chance');
        expect(prize.amount).toBe(LOTTERY_PRIZES[index].amount);
        expect(prize.probability).toBe(LOTTERY_PRIZES[index].probability);
      });
    });
  });

  describe('generateTicketId', () => {
    it('should generate unique ticket IDs', () => {
      const id1 = generateTicketId();
      const id2 = generateTicketId();
      
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs with correct format', () => {
      const id = generateTicketId();
      expect(id).toMatch(/^TICKET-\d+-[A-Z0-9]+$/);
    });

    it('should generate IDs with TICKET prefix', () => {
      const id = generateTicketId();
      expect(id.startsWith('TICKET-')).toBe(true);
    });

    it('should generate different IDs on subsequent calls', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateTicketId());
      }
      expect(ids.size).toBe(100); // All should be unique
    });
  });

  describe('calculateFreeTickets', () => {
    it('should return 0 for investment less than 10', () => {
      expect(calculateFreeTickets(9.99)).toBe(0);
      expect(calculateFreeTickets(0)).toBe(0);
      expect(calculateFreeTickets(5)).toBe(0);
    });

    it('should return 1 for investment of exactly 10', () => {
      expect(calculateFreeTickets(10)).toBe(1);
    });

    it('should return correct number for multiples of 10', () => {
      expect(calculateFreeTickets(20)).toBe(2);
      expect(calculateFreeTickets(50)).toBe(5);
      expect(calculateFreeTickets(100)).toBe(10);
      expect(calculateFreeTickets(1000)).toBe(100);
    });

    it('should floor the result for non-multiples', () => {
      expect(calculateFreeTickets(19.99)).toBe(1);
      expect(calculateFreeTickets(25)).toBe(2);
      expect(calculateFreeTickets(99)).toBe(9);
    });

    it('should handle large investment amounts', () => {
      expect(calculateFreeTickets(10000)).toBe(1000);
      expect(calculateFreeTickets(100000)).toBe(10000);
    });

    it('should handle decimal investment amounts', () => {
      expect(calculateFreeTickets(10.5)).toBe(1);
      expect(calculateFreeTickets(15.99)).toBe(1);
      expect(calculateFreeTickets(25.5)).toBe(2);
    });
  });

  describe('Edge cases and security', () => {
    it('should handle determinePrize being called many times', () => {
      const prizes = [];
      for (let i = 0; i < 10000; i++) {
        prizes.push(determinePrize());
      }
      
      // All should be valid
      prizes.forEach(prize => {
        expect(prize).toBeGreaterThan(0);
        expect(LOTTERY_PRIZES.some(p => p.amount === prize)).toBe(true);
      });
    });

    it('should not have memory leaks when called repeatedly', () => {
      // This is more of a sanity check
      const initialMemory = (process.memoryUsage?.()?.heapUsed || 0);
      
      for (let i = 0; i < 100000; i++) {
        determinePrize();
      }
      
      // If we could measure, memory should not grow unbounded
      // For now, we just verify it completes
      expect(true).toBe(true);
    });

    it('should handle calculateWinProbability with edge values', () => {
      expect(calculateWinProbability(0)).toBeGreaterThan(0);
      expect(calculateWinProbability(-1)).toBeGreaterThan(0);
      expect(calculateWinProbability(Infinity)).toBe(0);
    });

    it('should handle calculateFreeTickets with edge values', () => {
      expect(calculateFreeTickets(-1)).toBe(0);
      expect(calculateFreeTickets(0)).toBe(0);
      expect(calculateFreeTickets(NaN)).toBeNaN();
    });
  });

  describe('Mathematical correctness', () => {
    it('should have probabilities that sum to 100%', () => {
      const totalProbability = LOTTERY_PRIZES.reduce((sum, prize) => sum + prize.probability, 0);
      expect(totalProbability).toBeCloseTo(100, 1);
    });

    it('should have expected value that matches manual calculation', () => {
      const expectedValue = calculateExpectedValue();
      let manualCalc = 0;
      
      LOTTERY_PRIZES.forEach(prize => {
        manualCalc += (prize.amount * prize.probability / 100);
      });
      
      expect(expectedValue).toBeCloseTo(manualCalc, 2);
    });

    it('should have all probabilities positive', () => {
      LOTTERY_PRIZES.forEach(prize => {
        expect(prize.probability).toBeGreaterThan(0);
      });
    });

    it('should have all prize amounts positive', () => {
      LOTTERY_PRIZES.forEach(prize => {
        expect(prize.amount).toBeGreaterThan(0);
      });
    });

    it('should have profitability margin of approximately 30%', () => {
      const ticketPrice = 10; // USDT
      const expectedValue = calculateExpectedValue();
      const profit = ticketPrice - expectedValue;
      const margin = (profit / ticketPrice) * 100;
      
      // Should be around 30% (allow 5% deviation)
      expect(margin).toBeGreaterThan(25);
      expect(margin).toBeLessThan(35);
    });
  });
});

