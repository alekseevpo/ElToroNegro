/**
 * Password utilities
 * Note: In production, password hashing should be done server-side using bcrypt or similar
 * For client-side demo purposes, we use a simple hash function
 */

/**
 * Simple hash function for password hashing (client-side only, for demo)
 * In production, use bcrypt on the server
 */
async function hashPassword(password: string): Promise<string> {
  // Use Web Crypto API for hashing
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Hash a password (returns a promise)
 */
export async function hashPasswordForStorage(password: string): Promise<string> {
  return hashPassword(password);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

