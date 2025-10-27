/**
 * User Tier Detection
 * PRD-0016: Async Background Song Generation
 *
 * Determines user tier (free vs premium) for concurrent generation limits.
 */

import { UserTier, CONCURRENT_GENERATION_LIMITS } from '@/lib/config';

/**
 * User object from InstantDB with type field
 */
export interface User {
  id: string;
  email?: string;
  type?: string | null;
}

/**
 * Determines the user's tier based on their type field.
 *
 * Users are considered premium if:
 * - user.type === 'premium'
 * - user.type === 'pro'
 * - user.type === 'paid'
 *
 * All other users (including those without a type field) are considered free tier.
 *
 * @param user - The user object from InstantDB
 * @returns The user's tier ('free' | 'premium')
 *
 * @example
 * ```typescript
 * const tier = getUserTier(auth.user);
 * if (tier === 'premium') {
 *   // Allow more concurrent generations
 * }
 * ```
 */
export function getUserTier(user: User | null | undefined): UserTier {
  if (!user || !user.type) {
    return 'free';
  }

  const userType = user.type.toLowerCase();

  // Check for premium tier indicators
  if (userType === 'premium' || userType === 'pro' || userType === 'paid') {
    return 'premium';
  }

  // Default to free tier
  return 'free';
}

/**
 * Gets the concurrent generation limit for a user based on their tier.
 *
 * @param user - The user object from InstantDB
 * @returns The maximum number of concurrent generations allowed
 *
 * @example
 * ```typescript
 * const limit = getConcurrentLimit(auth.user);
 * console.log(`User can generate ${limit} songs concurrently`);
 * ```
 */
export function getConcurrentLimit(user: User | null | undefined): number {
  const tier = getUserTier(user);
  return CONCURRENT_GENERATION_LIMITS[tier === 'premium' ? 'PREMIUM' : 'FREE'];
}

/**
 * Checks if a user is on the free tier.
 *
 * @param user - The user object from InstantDB
 * @returns True if user is on free tier, false otherwise
 */
export function isFreeUser(user: User | null | undefined): boolean {
  return getUserTier(user) === 'free';
}

/**
 * Checks if a user is on the premium tier.
 *
 * @param user - The user object from InstantDB
 * @returns True if user is on premium tier, false otherwise
 */
export function isPremiumUser(user: User | null | undefined): boolean {
  return getUserTier(user) === 'premium';
}
