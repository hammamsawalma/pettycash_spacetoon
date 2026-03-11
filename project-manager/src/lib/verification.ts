import crypto from 'crypto';

const SECRET = process.env.VERIFICATION_SECRET || process.env.JWT_SECRET || 'default-verification-secret-1234';

/**
 * Generate a deterministic verification token for a document ID.
 * This prevents users from guessing URLs for other documents.
 */
export function generateVerificationToken(id: string): string {
  return crypto
    .createHmac('sha256', SECRET)
    .update(id)
    .digest('hex');
}

/**
 * Validates a token against a document ID.
 */
export function verifyToken(id: string, token: string): boolean {
  const expectedToken = generateVerificationToken(id);
  // Use timingSafeEqual to prevent timing attacks
  const expectedBuffer = Buffer.from(expectedToken, 'hex');
  const actualBuffer = Buffer.from(token, 'hex');
  
  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}
