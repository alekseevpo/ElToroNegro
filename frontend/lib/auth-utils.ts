/**
 * Authentication Utilities
 * 
 * Secure authentication helpers for Web3 wallet-based authentication
 * Implements message signing with nonce and timestamp for replay attack prevention
 */

import { BrowserProvider, verifyMessage } from 'ethers';

export interface AuthMessage {
  message: string;
  timestamp: number;
  nonce: string;
}

export interface AuthSession {
  address: string;
  signature: string;
  message: AuthMessage;
  expiresAt: number;
}

const MESSAGE_PREFIX = 'Sign this message to authenticate with El Toro Negro';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const NONCE_STORAGE_KEY = 'auth_nonce';

/**
 * Generate a random nonce for authentication
 */
export function generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get or generate a nonce for the current session
 * Nonce is stored in sessionStorage (cleared when tab closes)
 */
export function getOrGenerateNonce(): string {
  if (typeof window === 'undefined') {
    return generateNonce();
  }

  let nonce = sessionStorage.getItem(NONCE_STORAGE_KEY);
  if (!nonce) {
    nonce = generateNonce();
    sessionStorage.setItem(NONCE_STORAGE_KEY, nonce);
  }
  return nonce;
}

/**
 * Create authentication message with nonce and timestamp
 */
export function createAuthMessage(address: string): AuthMessage {
  const nonce = getOrGenerateNonce();
  const timestamp = Date.now();
  
  const message = `${MESSAGE_PREFIX}\n\nAddress: ${address}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;
  
  return {
    message,
    timestamp,
    nonce,
  };
}

/**
 * Verify signature (client-side validation)
 * Note: In production, this should be verified on the backend server
 */
export async function verifySignature(
  message: string,
  signature: string,
  address: string
): Promise<boolean> {
  try {
    // Recover the address from the signature
    const recoveredAddress = verifyMessage(message, signature);
    
    // Compare addresses (case-insensitive)
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Create a secure session object
 */
export function createSession(
  address: string,
  signature: string,
  message: AuthMessage
): AuthSession {
  const expiresAt = Date.now() + SESSION_DURATION;
  
  return {
    address: address.toLowerCase(),
    signature,
    message,
    expiresAt,
  };
}

/**
 * Check if session is valid (not expired and signature is valid)
 */
export async function validateSession(session: AuthSession | null): Promise<boolean> {
  if (!session) {
    return false;
  }

  // Check expiration
  if (Date.now() > session.expiresAt) {
    return false;
  }

  // Verify signature
  const isValid = await verifySignature(
    session.message.message,
    session.signature,
    session.address
  );

  return isValid;
}

/**
 * Get session from secure storage
 */
export function getStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = sessionStorage.getItem('auth_session');
    if (!stored) {
      return null;
    }

    const session = JSON.parse(stored) as AuthSession;
    
    // Validate expiration
    if (Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error reading stored session:', error);
    clearSession();
    return null;
  }
}

/**
 * Store session in secure storage
 * Using sessionStorage for security (cleared when tab closes)
 */
export function storeSession(session: AuthSession): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    sessionStorage.setItem('auth_session', JSON.stringify(session));
  } catch (error) {
    console.error('Error storing session:', error);
  }
}

/**
 * Clear session and nonce from storage
 */
export function clearSession(): void {
  if (typeof window === 'undefined') {
    return;
  }

  sessionStorage.removeItem('auth_session');
  sessionStorage.removeItem(NONCE_STORAGE_KEY);
}

/**
 * Request signature from wallet
 */
export async function requestSignature(
  provider: BrowserProvider,
  message: string
): Promise<string> {
  try {
    const signer = await provider.getSigner();
    const signature = await signer.signMessage(message);
    return signature;
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('User rejected the signature request');
    }
    throw new Error('Failed to sign message: ' + (error.message || 'Unknown error'));
  }
}

