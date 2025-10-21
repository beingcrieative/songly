import { describe, it, expect } from 'vitest';
import { createSessionCookie, parseSessionFromRequest } from './session';

function makeReq(cookie: string) {
  return new Request('http://localhost', { headers: { cookie } });
}

describe('session utils', () => {
  it('creates and parses session cookie', () => {
    const { cookie } = createSessionCookie({ id: 'user-123', email: 'test@example.com' }, 1000);
    const req = makeReq(cookie);
    const sess = parseSessionFromRequest(req);
    expect(sess?.userId).toBe('user-123');
    expect(sess?.email).toBe('test@example.com');
  });
});

