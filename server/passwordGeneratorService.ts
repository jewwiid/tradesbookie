import { randomBytes } from 'crypto';

/**
 * Generate a secure, memorable password for installer invitations
 * Format: 3-4 words with numbers and symbols for security
 * Example: Apple42-Moon-River91
 */
export function generateSecurePassword(): string {
  const words = [
    'Apple', 'Beach', 'Cloud', 'Dream', 'Eagle', 'Fire', 'Green', 'Happy',
    'Island', 'Jazz', 'Kite', 'Light', 'Moon', 'Night', 'Ocean', 'Peace',
    'Quick', 'River', 'Star', 'Tree', 'Unity', 'Voice', 'Wave', 'Zebra'
  ];
  
  // Pick 3 random words
  const word1 = words[Math.floor(Math.random() * words.length)];
  const word2 = words[Math.floor(Math.random() * words.length)];
  const word3 = words[Math.floor(Math.random() * words.length)];
  
  // Generate random numbers
  const num1 = Math.floor(Math.random() * 100);
  const num2 = Math.floor(Math.random() * 100);
  
  // Combine with separators for security and memorability
  return `${word1}${num1}-${word2}-${word3}${num2}`;
}

/**
 * Generate a simpler password for testing/demo purposes
 */
export function generateSimplePassword(): string {
  const adjectives = ['Quick', 'Smart', 'Happy', 'Bright', 'Strong'];
  const nouns = ['Cat', 'Dog', 'Bird', 'Fish', 'Bear'];
  
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);
  
  return `${adj}${noun}${num}`;
}

/**
 * Generate a cryptographically secure random password
 */
export function generateCryptoPassword(length: number = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const bytes = randomBytes(length);
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  
  return result;
}