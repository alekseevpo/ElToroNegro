/**
 * Script to verify lottery probability calculations
 * Run with: node scripts/test-lottery-probabilities.js
 */

// Updated probabilities that sum to 100%
const LOTTERY_PRIZES = [
  { amount: 1000, probability: 0.09 },
  { amount: 500, probability: 0.09 },
  { amount: 100, probability: 0.18 },
  { amount: 50, probability: 0.93 },
  { amount: 30, probability: 1.39 },
  { amount: 20, probability: 1.85 },
  { amount: 15, probability: 2.78 },
  { amount: 10, probability: 4.63 },
  { amount: 7, probability: 4.63 },
  { amount: 5, probability: 9.26 },
  { amount: 4, probability: 9.26 },
  { amount: 3, probability: 18.52 },
  { amount: 2, probability: 27.78 },
  { amount: 1, probability: 18.61 },
];

// Calculate total probability
const totalProbability = LOTTERY_PRIZES.reduce((sum, prize) => sum + prize.probability, 0);

// Calculate expected value
const expectedValue = LOTTERY_PRIZES.reduce((sum, prize) => {
  return sum + (prize.amount * prize.probability / 100);
}, 0);

const ticketPrice = 10;
const profit = ticketPrice - expectedValue;
const margin = (profit / ticketPrice) * 100;

console.log('=== Lottery Probability Verification ===\n');
console.log('Total Probability:', totalProbability.toFixed(2), '%');
console.log('Expected Value:', expectedValue.toFixed(2), 'USDT');
console.log('Ticket Price:', ticketPrice, 'USDT');
console.log('Profit per Ticket:', profit.toFixed(2), 'USDT');
console.log('Profit Margin:', margin.toFixed(2), '%');
console.log('Return to Player:', (100 - margin).toFixed(2), '%\n');

// Verify probabilities sum to 100%
if (Math.abs(totalProbability - 100) < 0.01) {
  console.log('✅ Probabilities sum correctly to 100%');
} else {
  console.log('❌ ERROR: Probabilities sum to', totalProbability.toFixed(2), '% (should be 100%)');
  process.exit(1);
}

// Verify profitability
if (margin > 0 && margin < 50) {
  console.log('✅ Profit margin is reasonable (between 0% and 50%)');
} else {
  console.log('⚠️  WARNING: Profit margin is', margin.toFixed(2), '%');
}

// Verify expected value
if (expectedValue > 0 && expectedValue < ticketPrice) {
  console.log('✅ Expected value is positive and less than ticket price');
} else {
  console.log('❌ ERROR: Invalid expected value');
  process.exit(1);
}

console.log('\n=== Prize Distribution ===');
LOTTERY_PRIZES.forEach(prize => {
  const chance = (100 / prize.probability).toFixed(0);
  console.log(`${prize.amount.toString().padStart(4)} USDT: ${prize.probability.toString().padStart(5)}% (1 in ${chance})`);
});

// Simulate lottery draws
console.log('\n=== Simulation (100,000 tickets) ===');
const iterations = 100000;
const prizeCounts = {};
let totalWinnings = 0;

LOTTERY_PRIZES.forEach(prize => {
  prizeCounts[prize.amount] = 0;
});

for (let i = 0; i < iterations; i++) {
  const random = Math.random() * 100;
  let cumulativeProbability = 0;
  
  for (const prize of LOTTERY_PRIZES) {
    cumulativeProbability += prize.probability;
    if (random < cumulativeProbability) {
      prizeCounts[prize.amount]++;
      totalWinnings += prize.amount;
      break;
    }
  }
}

const simulatedExpectedValue = totalWinnings / iterations;
const simulatedMargin = ((ticketPrice - simulatedExpectedValue) / ticketPrice * 100);

console.log('Simulated Expected Value:', simulatedExpectedValue.toFixed(2), 'USDT');
console.log('Theoretical Expected Value:', expectedValue.toFixed(2), 'USDT');
console.log('Difference:', Math.abs(simulatedExpectedValue - expectedValue).toFixed(2), 'USDT');
console.log('Simulated Margin:', simulatedMargin.toFixed(2), '%');

if (Math.abs(simulatedExpectedValue - expectedValue) < 0.5) {
  console.log('✅ Simulation matches theory (within 0.5 USDT)');
} else {
  console.log('⚠️  WARNING: Simulation differs from theory');
}

console.log('\n=== Top Prizes Distribution ===');
const topPrizes = [1000, 500, 100, 50, 30];
topPrizes.forEach(prize => {
  const count = prizeCounts[prize] || 0;
  const actualProb = (count / iterations * 100).toFixed(2);
  const expectedProb = LOTTERY_PRIZES.find(p => p.amount === prize)?.probability || 0;
  console.log(`${prize} USDT: ${count} wins (${actualProb}% vs expected ${expectedProb}%)`);
});
