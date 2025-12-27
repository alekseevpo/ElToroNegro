/**
 * TON Wallet Utilities
 * 
 * Helper functions for TON Wallet integration using @tonconnect/ui
 */

/**
 * Generate random username for display
 */
export const generateRandomUsername = (): string => {
  const adjectives = ['Cool', 'Smart', 'Fast', 'Bold', 'Bright', 'Swift', 'Sharp', 'Elite', 'Pro', 'Max', 'Crypto', 'DeFi', 'Bull', 'Moon'];
  const nouns = ['Trader', 'Investor', 'Bull', 'Whale', 'Hodler', 'Crypto', 'DeFi', 'Alpha', 'Beta', 'Gamma', 'King', 'Master', 'Runner', 'Lover'];
  const numbers = Math.floor(Math.random() * 9999);
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adjective}${noun}${numbers}`;
};
