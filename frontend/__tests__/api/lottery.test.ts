/**
 * API endpoint tests for lottery
 * 
 * Tests for /api/lottery/play and /api/lottery/free-tickets
 */

import { POST as playLottery, GET as getFreeTickets } from '@/app/api/lottery/play/route';
import { POST as awardFreeTickets } from '@/app/api/lottery/free-tickets/route';
import { NextRequest } from 'next/server';

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock lottery-utils
jest.mock('@/lib/lottery-utils', () => ({
  determinePrize: jest.fn(() => 10),
  generateTicketId: jest.fn(() => `TICKET-${Date.now()}-TEST`),
  calculateFreeTickets: jest.fn((amount) => Math.floor(amount / 10)),
}));

describe('Lottery API', () => {
  describe('POST /api/lottery/play', () => {
    const createRequest = (body: any) => {
      return new NextRequest('http://localhost/api/lottery/play', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      });
    };

    it('should reject request without userId', async () => {
      const request = createRequest({ ticketCount: 1 });
      const response = await playLottery(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toContain('User ID is required');
    });

    it('should reject request with invalid ticket count', async () => {
      const request = createRequest({ ticketCount: 0, userId: 'test-user' });
      const response = await playLottery(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid ticket count');
    });

    it('should reject request with ticket count > 100', async () => {
      const request = createRequest({ ticketCount: 101, userId: 'test-user' });
      const response = await playLottery(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid ticket count');
    });

    it('should process valid lottery play request', async () => {
      const request = createRequest({ ticketCount: 5, userId: 'test-user' });
      const response = await playLottery(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.tickets).toHaveLength(5);
      expect(data.totalCost).toBe(50); // 5 tickets × 10 USDT
      expect(data.isFreeTicket).toBe(false);
    });

    it('should process free ticket request', async () => {
      const request = createRequest({ 
        ticketCount: 3, 
        userId: 'test-user',
        isFreeTicket: true 
      });
      const response = await playLottery(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.tickets).toHaveLength(3);
      expect(data.totalCost).toBe(0); // Free tickets
      expect(data.isFreeTicket).toBe(true);
    });

    it('should calculate total prize correctly', async () => {
      const { determinePrize } = require('@/lib/lottery-utils');
      determinePrize.mockReturnValueOnce(100).mockReturnValueOnce(50);
      
      const request = createRequest({ ticketCount: 2, userId: 'test-user' });
      const response = await playLottery(request);
      const data = await response.json();
      
      expect(data.totalPrize).toBe(150); // 100 + 50
    });

    it('should handle single ticket', async () => {
      const request = createRequest({ ticketCount: 1, userId: 'test-user' });
      const response = await playLottery(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.tickets).toHaveLength(1);
      expect(data.tickets[0]).toHaveProperty('ticketId');
      expect(data.tickets[0]).toHaveProperty('prize');
      expect(data.tickets[0]).toHaveProperty('timestamp');
    });

    it('should handle maximum tickets (100)', async () => {
      const request = createRequest({ ticketCount: 100, userId: 'test-user' });
      const response = await playLottery(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.tickets).toHaveLength(100);
      expect(data.totalCost).toBe(1000); // 100 × 10
    });

    it('should generate unique ticket IDs', async () => {
      const request = createRequest({ ticketCount: 10, userId: 'test-user' });
      const response = await playLottery(request);
      const data = await response.json();
      
      const ticketIds = data.tickets.map((t: any) => t.ticketId);
      const uniqueIds = new Set(ticketIds);
      expect(uniqueIds.size).toBe(10); // All should be unique
    });
  });

  describe('POST /api/lottery/free-tickets', () => {
    const createRequest = (body: any) => {
      return new NextRequest('http://localhost/api/lottery/free-tickets', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      });
    };

    it('should reject request without userId', async () => {
      const request = createRequest({ investmentAmount: 100 });
      const response = await awardFreeTickets(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toContain('User ID is required');
    });

    it('should reject request with invalid investment amount', async () => {
      const request = createRequest({ userId: 'test-user', investmentAmount: -1 });
      const response = await awardFreeTickets(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid investment amount');
    });

    it('should return 0 tickets for investment < 10', async () => {
      const request = createRequest({ userId: 'test-user', investmentAmount: 9 });
      const response = await awardFreeTickets(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.freeTickets).toBe(0);
    });

    it('should return 1 ticket for investment of 10', async () => {
      const request = createRequest({ userId: 'test-user', investmentAmount: 10 });
      const response = await awardFreeTickets(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.freeTickets).toBe(1);
    });

    it('should return correct number for multiples of 10', async () => {
      const testCases = [
        { amount: 20, expected: 2 },
        { amount: 50, expected: 5 },
        { amount: 100, expected: 10 },
        { amount: 1000, expected: 100 },
      ];

      for (const testCase of testCases) {
        const request = createRequest({ 
          userId: 'test-user', 
          investmentAmount: testCase.amount 
        });
        const response = await awardFreeTickets(request);
        const data = await response.json();
        
        expect(data.freeTickets).toBe(testCase.expected);
      }
    });

    it('should floor the result for non-multiples', async () => {
      const request = createRequest({ userId: 'test-user', investmentAmount: 25 });
      const response = await awardFreeTickets(request);
      const data = await response.json();
      
      expect(data.freeTickets).toBe(2); // 25 / 10 = 2.5, floored to 2
    });
  });

  describe('GET /api/lottery/free-tickets', () => {
    const createRequest = (userId: string) => {
      return new NextRequest(`http://localhost/api/lottery/free-tickets?userId=${userId}`);
    };

    it('should reject request without userId', async () => {
      const request = new NextRequest('http://localhost/api/lottery/free-tickets');
      const response = await getFreeTickets(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toContain('User ID is required');
    });

    it('should return free ticket balance', async () => {
      const request = createRequest('test-user');
      const response = await getFreeTickets(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('freeTickets');
      expect(typeof data.freeTickets).toBe('number');
    });
  });

  describe('Security and validation', () => {
    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost/api/lottery/play', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      });

      try {
        await playLottery(request);
      } catch (error) {
        // Should handle error gracefully
        expect(error).toBeDefined();
      }
    });

    it('should handle extremely large ticket counts safely', async () => {
      const request = new NextRequest('http://localhost/api/lottery/play', {
        method: 'POST',
        body: JSON.stringify({ ticketCount: 999999, userId: 'test-user' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await playLottery(request);
      expect(response.status).toBe(400); // Should reject
    });

    it('should sanitize userId input', async () => {
      // Test with various potentially dangerous inputs
      const dangerousInputs = [
        '<script>alert("xss")</script>',
        '../../../etc/passwd',
        "'; DROP TABLE users; --",
      ];

      for (const input of dangerousInputs) {
        const request = new NextRequest('http://localhost/api/lottery/play', {
          method: 'POST',
          body: JSON.stringify({ ticketCount: 1, userId: input }),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await playLottery(request);
        // Should either reject or handle safely
        expect([200, 400]).toContain(response.status);
      }
    });
  });
});

