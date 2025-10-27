/**
 * Unit Tests for User Tier Detection
 * PRD-0016: Async Background Song Generation
 */

import { describe, it, expect } from 'vitest';
import {
  getUserTier,
  getConcurrentLimit,
  isFreeUser,
  isPremiumUser,
} from './userTier';

describe('getUserTier', () => {
  it('returns "free" for null user', () => {
    expect(getUserTier(null)).toBe('free');
  });

  it('returns "free" for undefined user', () => {
    expect(getUserTier(undefined)).toBe('free');
  });

  it('returns "free" for user without type field', () => {
    const user = { id: '123', email: 'test@example.com' };
    expect(getUserTier(user)).toBe('free');
  });

  it('returns "free" for user with null type', () => {
    const user = { id: '123', email: 'test@example.com', type: null };
    expect(getUserTier(user)).toBe('free');
  });

  it('returns "premium" for user with type "premium"', () => {
    const user = { id: '123', type: 'premium' };
    expect(getUserTier(user)).toBe('premium');
  });

  it('returns "premium" for user with type "PREMIUM" (case insensitive)', () => {
    const user = { id: '123', type: 'PREMIUM' };
    expect(getUserTier(user)).toBe('premium');
  });

  it('returns "premium" for user with type "pro"', () => {
    const user = { id: '123', type: 'pro' };
    expect(getUserTier(user)).toBe('premium');
  });

  it('returns "premium" for user with type "paid"', () => {
    const user = { id: '123', type: 'paid' };
    expect(getUserTier(user)).toBe('premium');
  });

  it('returns "free" for user with unknown type', () => {
    const user = { id: '123', type: 'basic' };
    expect(getUserTier(user)).toBe('free');
  });
});

describe('getConcurrentLimit', () => {
  it('returns FREE limit (1) for free users', () => {
    const user = { id: '123', type: null };
    expect(getConcurrentLimit(user)).toBe(1);
  });

  it('returns PREMIUM limit (5) for premium users', () => {
    const user = { id: '123', type: 'premium' };
    expect(getConcurrentLimit(user)).toBe(5);
  });

  it('returns FREE limit for null user', () => {
    expect(getConcurrentLimit(null)).toBe(1);
  });
});

describe('isFreeUser', () => {
  it('returns true for free users', () => {
    const user = { id: '123', type: null };
    expect(isFreeUser(user)).toBe(true);
  });

  it('returns false for premium users', () => {
    const user = { id: '123', type: 'premium' };
    expect(isFreeUser(user)).toBe(false);
  });

  it('returns true for null user', () => {
    expect(isFreeUser(null)).toBe(true);
  });
});

describe('isPremiumUser', () => {
  it('returns false for free users', () => {
    const user = { id: '123', type: null };
    expect(isPremiumUser(user)).toBe(false);
  });

  it('returns true for premium users', () => {
    const user = { id: '123', type: 'premium' };
    expect(isPremiumUser(user)).toBe(true);
  });

  it('returns false for null user', () => {
    expect(isPremiumUser(null)).toBe(false);
  });
});
