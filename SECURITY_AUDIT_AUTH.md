# Security Audit: Authentication & Session Management
## Next.js 15 "Liefdesliedje Maker" Application

**Audit Date**: October 22, 2025
**Scope**: Authentication and Session Management Layer
**Status**: REQUIRES IMMEDIATE REMEDIATION

---

## EXECUTIVE SUMMARY

The application implements a custom JWT-based session management system with InstantDB authentication. The audit identified **6 Critical**, **5 High**, and **7 Medium** severity security findings that require immediate remediation.

**Critical Findings:**
1. Hardcoded default secret fallback (`dev-secret-change-me`)
2. Missing `Secure` flag on session cookies
3. Timing attack vulnerability in JWT signature verification
4. Weak Suno webhook authentication (no signature verification)
5. Weak admin token authentication (timing attack vulnerability)
6. Unvalidated Base64URL decoding in JWT parsing

**High Findings:**
7. Missing `Domain` attribute on cookies
8. Weak `SameSite=Lax` instead of `Strict`
9. No CSRF token protection
10. Insufficient session expiration enforcement
11. No rate limiting on authentication endpoints

**Medium Findings:**
12. Session bridge continues on auth failure
13. Magic code validation error information leakage
14. Missing Content-Security-Policy header
15. Missing HSTS header
16. Development CORS bypass
17. Insufficient auth event logging
18. Missing environment variable validation
19. No token refresh mechanism
20. No session revocation capability

---

## CRITICAL SEVERITY FINDINGS

### 1. Hardcoded Default Secret in Production Fallback
**File**: `src/lib/session.ts:7`
**Severity**: CRITICAL
**CWE**: CWE-798 (Use of Hardcoded Credentials)

```typescript
function getSecret() {
  return process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret-change-me';
}
```

**Risk**: 
- If neither environment variable is set, defaults to hardcoded `'dev-secret-change-me'`
- Well-known default allows trivial JWT forgery
- Complete authentication bypass possible
- Any user can impersonate any other user

**Impact**: Complete authentication bypass, account takeover, unauthorized data access

**Fix Priority**: IMMEDIATE (within 24 hours)

---

### 2. Missing Secure Flag on Session Cookies
**File**: `src/lib/session.ts:53-55`
**Severity**: CRITICAL
**CWE**: CWE-614 (Sensitive Cookie in HTTPS Session Without Secure Attribute)

```typescript
const cookie = `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${...}`;
```

**Risk**:
- Session cookie lacks `Secure` flag
- Browsers will transmit over unencrypted HTTP
- Network sniffers can capture session tokens
- MITM attacks can steal valid tokens

**Impact**: Session token theft, account hijacking, credential compromise

**Fix Priority**: IMMEDIATE (within 24 hours)

---

### 3. Timing Attack Vulnerability in JWT Signature Verification
**File**: `src/lib/session.ts:34-35`
**Severity**: CRITICAL
**CWE**: CWE-208 (Observable Timing Discrepancy)

```typescript
const expected = b64url(crypto.createHmac('sha256', secret).update(data).digest());
if (expected !== s) return null;  // Vulnerable string comparison
```

**Risk**:
- JavaScript string comparison exits early on mismatch
- Attacker can measure response times to brute-force valid signatures
- Timing-based JWT forgery possible
- Signature validation can be bypassed

**Impact**: Signature forgery, authentication bypass

**Fix Priority**: IMMEDIATE (within 24 hours)

---

### 4. Weak Suno Webhook Authentication
**File**: `src/app/api/suno/callback/route.ts`
**Severity**: CRITICAL
**CWE**: CWE-347 (Improper Verification of Cryptographic Signature)

**Risk**:
- Endpoint accepts ANY POST request from ANY source
- No verification of webhook origin
- Can inject false song completion data
- Can trigger malicious push notifications

**Impact**: Data injection, fraudulent updates, notification abuse

**Fix Priority**: HIGH (within 48 hours)

---

### 5. Weak Admin Token Authentication
**File**: `src/app/api/admin/backfill-suno/route.ts:99-107`
**Severity**: CRITICAL
**CWE**: CWE-640 (Weak Password Recovery Mechanism)

**Risk**:
- Token in query parameters (logged in browser history)
- No timing-safe comparison
- Logic flaw: accepts ANY token if ADMIN_SECRET is undefined
- No rate limiting
- No audit logging

**Impact**: Unauthorized admin operations, data manipulation

**Fix Priority**: HIGH (within 48 hours)

---

### 6. Unvalidated Base64URL Decoding
**File**: `src/lib/session.ts:37`
**Severity**: CRITICAL
**CWE**: CWE-400 (Uncontrolled Resource Consumption)

```typescript
const payload = JSON.parse(Buffer.from(p2, 'base64').toString('utf8'));
```

**Risk**:
- No validation of base64 format
- No size limits on decoded payload
- Could crash with malformed input
- DoS attack vector

**Impact**: DoS attacks, JWT parsing bypass

**Fix Priority**: IMMEDIATE (within 24 hours)

---

## HIGH SEVERITY FINDINGS

### 7. Missing Domain Attribute
**File**: `src/lib/session.ts`
**Severity**: HIGH - Session cookies lack Domain attribute, accessible to all subdomains

### 8. SameSite=Lax Configuration
**File**: `src/lib/session.ts`
**Severity**: HIGH - Should use `SameSite=Strict` to prevent CSRF attacks

### 9. No CSRF Token Protection
**File**: All API routes
**Severity**: HIGH - No CSRF tokens on state-changing operations (POST/PUT/DELETE)

### 10. Insufficient Session Expiration
**File**: `src/lib/session.ts:38`
**Severity**: HIGH - Loose expiration check allows indefinite sessions

### 11. No Rate Limiting
**File**: Auth endpoints
**Severity**: HIGH - No rate limiting enables brute-force attacks on magic codes

---

## MEDIUM SEVERITY FINDINGS

### 12-20. Additional Security Issues
- Silent session exchange failures (SessionBridge.tsx)
- Information leakage in error messages (LoginScreen.tsx)
- Missing security headers (CSP, HSTS)
- Development CORS bypass
- Insufficient auth logging
- Missing environment variable validation
- No token refresh mechanism
- No session revocation capability

---

## IMMEDIATE ACTION PLAN

### Phase 1: Critical Fixes (24 hours)
1. Remove hardcoded default secret - throw error instead
2. Add `Secure` flag to session cookies
3. Implement timing-safe signature comparison using `crypto.timingSafeEqual()`
4. Add base64url format validation
5. Fix environment variable validation to THROW on missing secrets

### Phase 2: High Priority (48 hours)
6. Implement Suno webhook signature verification
7. Fix admin token authentication (header-only, constant-time comparison)
8. Add rate limiting to auth endpoints
9. Change `SameSite=Lax` to `SameSite=Strict`
10. Implement CSRF token validation

### Phase 3: Medium Priority (1 week)
11. Add security headers (CSP, HSTS)
12. Implement comprehensive auth logging
13. Fix session bridge error handling
14. Add token refresh mechanism
15. Implement session revocation

---

## TESTING RECOMMENDATIONS

- Test JWT signature verification against timing attacks
- Verify Secure flag on production cookies
- Test CSRF protection on all API routes
- Test rate limiting on auth endpoints
- Test session expiration enforcement
- Verify webhook signature validation
- Test admin token authentication

---

See detailed recommendations in the full report sections above.

