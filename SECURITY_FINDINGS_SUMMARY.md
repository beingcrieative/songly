# Security Audit - Quick Reference

**Full Report**: `/SECURITY_AUDIT_011CUNFrSvFFmKGSEHPBdTw4.md`

## Critical Issues (Fix Immediately)

### 1. Missing Webhook Signatures
- **Files**: `/src/app/api/suno/callback/route.ts`, `/src/app/api/suno/lyrics/callback/route.ts`
- **Issue**: No HMAC verification on Suno callbacks
- **Risk**: Attacker can forge webhook requests and corrupt song data
- **Fix**: Add signature verification using `crypto.createHmac()`
- **Impact**: Anyone can update any song's status, URLs, or metadata

### 2. Admin Token in Query Parameters  
- **File**: `/src/app/api/admin/backfill-suno/route.ts` (line 103)
- **Issue**: `searchParams.get("token")` allows token in URL
- **Risk**: Token logged in browser history, server logs, CDN logs
- **Fix**: Only accept token from HTTP headers
- **Impact**: Anyone with access logs can perform admin operations

## High Priority Issues

### 3. No IP Whitelisting
- **Files**: Suno callback handlers
- **Issue**: Accept webhooks from any IP address
- **Fix**: Validate source IP against Suno's known IPs
- **Impact**: Callback endpoints are completely open to forgery

### 4. No Replay Attack Protection
- **Files**: Suno callback handlers
- **Issue**: No timestamp validation on callbacks
- **Fix**: Reject webhooks older than 5 minutes
- **Impact**: Can replay old callbacks indefinitely

### 5. Weak Session Secret Fallback
- **File**: `/src/lib/session.ts` (line 7)
- **Issue**: Default secret is `'dev-secret-change-me'`
- **Fix**: Require `SESSION_SECRET` env var in production
- **Impact**: Session hijacking if env var not configured

### 6. SSRF in Audio File URLs
- **Files**: `/src/app/api/suno/add-vocals/route.ts`, `/src/app/api/suno/add-instrumental/route.ts`
- **Issue**: Passes user-provided URLs directly to Suno API
- **Fix**: Whitelist allowed domains and block private IPs
- **Impact**: Can access internal services, AWS metadata, etc.

## Medium Priority Issues

| # | Issue | File | Impact |
|---|-------|------|--------|
| 7 | API key logged (first 10 chars) | `/src/app/api/suno/route.ts:146` | Aids brute-force attacks |
| 8 | Callback URLs not validated for HTTPS | `/src/lib/utils/getDeploymentUrl.ts` | Man-in-the-middle attacks |
| 9 | OpenRouter retries without backoff | `/src/lib/utils/openrouterClient.ts` | Over-billing, DoS |
| 10 | VAPID keys not validated | `/src/lib/push.ts` | Silent failures on push |
| 11 | Insufficient payload validation | `/src/app/api/suno/callback/route.ts:102` | Injection attacks |
| 12 | Push subscription data not validated | `/src/app/api/push/subscribe/route.ts` | Malformed data storage |
| 13 | Callback URLs not sanitized | `/src/app/api/suno/callback/route.ts:162` | XSS if rendered unsafely |
| 14 | No rate limiting on callbacks | All callbacks | DB write storms, DoS |
| 15 | No rate limiting on admin endpoint | `/src/app/api/admin/backfill-suno/route.ts` | Resource exhaustion |

## Remediation Timeline

### This Week (Critical)
- [ ] Implement webhook signature verification (Items 1)
- [ ] Fix admin token authentication (Item 2)
- [ ] Add IP whitelisting (Item 3)
- [ ] Add timestamp validation (Item 4)

### Next 2 Weeks (High)
- [ ] Fix session secret validation (Item 5)
- [ ] Implement SSRF protection (Item 6)
- [ ] Add rate limiting (Items 14, 15)
- [ ] Validate URLs in callbacks (Items 8, 13)

### This Month (Medium)
- [ ] Remove API key logging (Item 7)
- [ ] Validate VAPID config (Item 10)
- [ ] Add payload schema validation (Item 11, 12)
- [ ] Add OpenRouter backoff (Item 9)

## Testing Checklist

- [ ] Unit tests for URL validation functions
- [ ] Integration tests for webhook handlers
- [ ] Webhook signature verification tests
- [ ] SSRF injection test cases
- [ ] Session secret validation tests
- [ ] Admin endpoint authentication tests
- [ ] Rate limiting tests

## Files Most at Risk

**Critical**: 
- `/src/app/api/suno/callback/route.ts`
- `/src/app/api/admin/backfill-suno/route.ts`
- `/src/lib/session.ts`

**High**:
- `/src/app/api/suno/add-vocals/route.ts`
- `/src/app/api/suno/add-instrumental/route.ts`
- `/src/app/api/suno/lyrics/callback/route.ts`

**Medium**:
- `/src/app/api/suno/route.ts`
- `/src/lib/utils/getDeploymentUrl.ts`
- `/src/lib/utils/openrouterClient.ts`
- `/src/app/api/push/subscribe/route.ts`

## References

- **OWASP Top 10 2021**: A02:2021 (Cryptographic Failures), A06:2021 (Vulnerable Components)
- **CWE-347**: Improper Verification of Cryptographic Signature
- **CWE-776**: Improper Verification of Cryptographic Signature
- **CWE-918**: Server-Side Request Forgery (SSRF)
- **CWE-613**: Insufficient Session Expiration

---

For detailed analysis, code examples, and implementation guidance, see `/SECURITY_AUDIT_011CUNFrSvFFmKGSEHPBdTw4.md`
