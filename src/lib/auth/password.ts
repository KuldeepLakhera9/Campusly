import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * Hashes a plaintext password using bcrypt.
 * Never logs or exposes the plaintext password.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Securely verifies a plaintext password against a stored bcrypt hash.
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  if (!password || !storedHash) return false;
  return bcrypt.compare(password, storedHash);
}

/**
 * Validates password strength according to Campusly security policies:
 * - Minimum 8 characters
 * - At least one letter and one number
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  message?: string;
} {
  if (!password || password.length < 8) {
    return {
      isValid: false,
      message: "Password must be at least 8 characters long.",
    };
  }

  if (password.length > 72) {
    return {
      isValid: false,
      message: "Password cannot exceed 72 characters.",
    };
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasLetter || !hasNumber) {
    return {
      isValid: false,
      message: "Password must contain both letters and numbers.",
    };
  }

  return { isValid: true };
}
