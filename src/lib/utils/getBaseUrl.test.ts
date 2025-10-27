/**
 * Unit Tests for getBaseUrl Helper
 * PRD-0016: Async Background Song Generation
 *
 * @vitest-environment node
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getBaseUrl, isProduction, isDevelopment, isVercel } from './getBaseUrl';

describe('getBaseUrl', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('returns custom base URL when NEXT_PUBLIC_BASE_URL is set', () => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://custom.example.com';
    process.env.VERCEL_URL = undefined;
    expect(getBaseUrl()).toBe('https://custom.example.com');
  });

  it('returns Vercel URL when VERCEL_URL is set', () => {
    process.env.NEXT_PUBLIC_BASE_URL = undefined;
    process.env.VERCEL_URL = 'songly-abc123.vercel.app';
    expect(getBaseUrl()).toBe('https://songly-abc123.vercel.app');
  });

  it('prefers custom base URL over Vercel URL', () => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://custom.example.com';
    process.env.VERCEL_URL = 'songly-abc123.vercel.app';
    expect(getBaseUrl()).toBe('https://custom.example.com');
  });

  it('returns localhost fallback when no env vars set', () => {
    process.env.NEXT_PUBLIC_BASE_URL = undefined;
    process.env.VERCEL_URL = undefined;
    expect(getBaseUrl()).toBe('http://localhost:3000');
  });
});

describe('isProduction', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns true when NODE_ENV is production', () => {
    process.env.NODE_ENV = 'production';
    expect(isProduction()).toBe(true);
  });

  it('returns false when NODE_ENV is development', () => {
    process.env.NODE_ENV = 'development';
    expect(isProduction()).toBe(false);
  });

  it('returns false when NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test';
    expect(isProduction()).toBe(false);
  });
});

describe('isDevelopment', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns true when NODE_ENV is development', () => {
    process.env.NODE_ENV = 'development';
    expect(isDevelopment()).toBe(true);
  });

  it('returns false when NODE_ENV is production', () => {
    process.env.NODE_ENV = 'production';
    expect(isDevelopment()).toBe(false);
  });
});

describe('isVercel', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns true when VERCEL is set', () => {
    process.env.VERCEL = '1';
    expect(isVercel()).toBe(true);
  });

  it('returns false when VERCEL is not set', () => {
    process.env.VERCEL = undefined;
    expect(isVercel()).toBe(false);
  });
});
