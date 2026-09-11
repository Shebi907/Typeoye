import { z } from 'zod';

/**
 * Strong-password policy shared by server-side password endpoints. Mirrors the
 * client-side requirement checklist exactly: length, upper/lower case, a digit
 * and a special character. Returned to callers through the Zod validate()
 * middleware, so it can never be bypassed by calling the API directly.
 */
export const strongPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');