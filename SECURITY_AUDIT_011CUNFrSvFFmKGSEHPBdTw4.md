# Security Audit Report: Songly External API Integrations

**Date**: 2025-10-22  
**Scope**: External API integrations, webhook security, API key management, push notifications, and secrets handling  
**Severity Levels**: Critical, High, Medium, Low

---

## Executive Summary

The Songly application implements integrations with multiple external APIs (Suno AI, OpenRouter, InstantDB, Web Push). While the codebase demonstrates awareness of security concerns (evidenced by detailed security notes in callback handlers), there are **10+ security vulnerabilities** ranging from High to Critical severity that require immediate remediation:

- **Critical**: Missing webhook signature verification
- **High**: Exposed admin tokens in query parameters, SSRF vulnerability in audio URL handling
- **Medium**: Weak session secret defaults, missing IP whitelisting, no replay attack protection

---

## 1. SUNO API INTEGRATION SECURITY

### 1.1 Webhook Signature Verification - MISSING (CRITICAL)

**Location**: 
- `/src/app/api/suno/callback/route.ts` (lines 1-17)
- `/src/app/api/suno/lyrics/callback/route.ts` (lines 6-23)

**Finding**: Both webhook endpoints explicitly acknowledge the absence of HMAC signature verification:

```typescript
// From callback/route.ts (lines 4-16):
/**
 * Security Note:
 * This endpoint is publicly accessible (exempted from session auth in middleware.ts)
 * to allow Suno webhooks to deliver results. Current security measures:
 * - Request metadata logging (User-Agent, Origin) for monitoring
 * - Payload structure validation
 * - Database verification (songId/taskId must exist before updates)
 * - 200 responses on errors to prevent retries
 *
 * Recommended Future Enhancements:
 * - HMAC signature verification if Suno provides webhook signatures
 * - IP allowlist for known Suno webhook sources
 * - Rate limiting per IP/taskId to prevent abuse
 * - Timestamp validation to prevent replay attacks
 */
```

**Risk**: An attacker can:
1. Forge webhook requests from Suno's endpoints
2. Trigger song generation completion with malicious data
3. Inject arbitrary URLs as audio/video content
4. Cause denial of service by updating songs to "failed" status

**Impact**: Critical - Webhook integrity cannot be verified

**Recommendation**:
```typescript
// Add HMAC verification for all webhooks
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// In POST handler:
const signature = request.headers.get('x-suno-signature');
const payload = await request.text();
if (!verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
}
```

---

### 1.2 Missing Replay Attack Protection (HIGH)

**Location**: 
- `/src/app/api/suno/callback/route.ts`
- `/src/app/api/suno/lyrics/callback/route.ts`

**Finding**: No timestamp validation on webhook payloads. Same callback can be replayed indefinitely.

**Risk**:
- Attacker can replay old callbacks to revert song status
- Causes data inconsistency (e.g., song marked as "ready" repeatedly)
- Can trigger duplicate push notifications

**Current State**:
```typescript
// No timestamp checking - accepts any age of callback
const payload = await request.json();
// Processes immediately without date validation
```

**Recommendation**:
```typescript
const MAX_WEBHOOK_AGE_SECONDS = 300; // 5 minutes

const timestamp = payload?.data?.timestamp || payload?.timestamp;
if (!timestamp) {
  return NextResponse.json(
    { ok: false, error: 'Missing timestamp' },
    { status: 400 }
  );
}

const payloadAge = Math.floor((Date.now() - timestamp) / 1000);
if (payloadAge > MAX_WEBHOOK_AGE_SECONDS) {
  console.warn(`Webhook too old: ${payloadAge} seconds`, { taskId });
  return NextResponse.json(
    { ok: true, warning: 'Webhook expired' },
    { status: 200 } // Return 200 to stop retries
  );
}
```

---

### 1.3 No IP Whitelisting (HIGH)

**Location**: 
- `/src/app/api/suno/callback/route.ts` (lines 90-96)
- `/src/app/api/suno/lyrics/callback/route.ts` (lines 35-42)

**Finding**: Callback endpoints accept requests from any IP address. Only basic logging of Origin/User-Agent.

**Current Code**:
```typescript
const userAgent = request.headers.get('user-agent') || 'unknown';
const origin = request.headers.get('origin') || request.headers.get('referer') || 'unknown';
// Logs but doesn't validate origin
```

**Risk**: Anyone can send webhook requests if they know the endpoint URL structure

**Recommendation**:
```typescript
const SUNO_WEBHOOK_IPS = [
  '203.0.113.42',  // Suno's documented IPs
  '203.0.113.43',
];

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                   request.headers.get('cf-connecting-ip') ||
                   request.ip;

  if (!SUNO_WEBHOOK_IPS.includes(clientIp)) {
    console.warn('Webhook from unauthorized IP:', clientIp);
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  // ... rest of handler
}
```

---

### 1.4 Insufficient Payload Validation (MEDIUM)

**Location**: `/src/app/api/suno/callback/route.ts` (lines 101-105)

**Finding**: Minimal validation of webhook payload structure:

```typescript
if (!payload || typeof payload !== 'object') {
  console.warn("⚠️ Invalid callback payload structure");
  return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
}
```

**Risk**: Malformed or malicious payloads could cause:
- Unexpected JSON parsing errors
- Injection via callback data fields
- Integer overflow in duration fields

**Recommendation**:
```typescript
import { z } from 'zod';

const SunoCallbackSchema = z.object({
  data: z.object({
    task_id: z.string().uuid().optional(),
    taskId: z.string().uuid().optional(),
    callbackType: z.enum(['first', 'complete', 'failed']).optional(),
    data: z.array(z.object({
      id: z.string().optional(),
      audio_url: z.string().url().optional(),
      stream_audio_url: z.string().url().optional(),
      duration: z.number().positive().max(3600).optional(),
      // ... strict validation
    })).optional(),
  }).optional(),
});

const parsed = SunoCallbackSchema.safeParse(payload);
if (!parsed.success) {
  return NextResponse.json(
    { ok: false, error: 'Invalid payload structure' },
    { status: 400 }
  );
}
```

---

### 1.5 API Key Logging (MEDIUM)

**Location**: `/src/app/api/suno/route.ts` (lines 140-146)

**Finding**: API key presence and first 10 characters logged to console:

```typescript
console.log('=== SUNO API REQUEST DEBUG ===');
// ...
console.log('API Key present:', !!SUNO_API_KEY);
console.log('API Key (first 10 chars):', SUNO_API_KEY.substring(0, 10)); // LEAKS PREFIX
```

**Risk**:
- Logs aggregated in monitoring/observability platforms
- First 10 chars can aid in brute-force attacks
- Sensitive data in production logs

**Recommendation**:
```typescript
console.log('API Key configured:', !!SUNO_API_KEY);
// Never log any part of the key value
```

---

### 1.6 Callback URL Not Validated for HTTPS (MEDIUM)

**Location**: `/src/app/api/suno/route.ts` (lines 157-172)

**Finding**: Callback URL validation only checks format, not protocol:

```typescript
if (!callbackUrl || callbackUrl.includes('localhost') && !process.env.SUNO_CALLBACK_URL) {
  console.warn('No production callback URL configured...');
  if (process.env.NODE_ENV === 'production') {
    // Warns but doesn't enforce HTTPS
  }
}
```

**Risk**:
- Callbacks could be sent to HTTP endpoints (man-in-the-middle)
- Webhook data intercepted in transit

**Current Code** in `getDeploymentUrl.ts`:
```typescript
export function getSunoCallbackUrl(songId?: string): string {
  const baseUrl = process.env.SUNO_CALLBACK_URL ||
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
                  'http://localhost:3000'; // Allows HTTP
  // ...
}
```

**Recommendation**:
```typescript
export function getSunoCallbackUrl(songId?: string): string {
  const baseUrl = process.env.SUNO_CALLBACK_URL;
  
  if (!baseUrl?.startsWith('https://') && process.env.NODE_ENV === 'production') {
    throw new Error('SUNO_CALLBACK_URL must use HTTPS in production');
  }
  // ...
}
```

---

## 2. OPENROUTER API SECURITY

### 2.1 API Key Hardcoded in Function (MEDIUM)

**Location**: `/src/lib/utils/openrouterClient.ts` (lines 3-4)

**Finding**:
```typescript
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
```

API key loaded at module initialization level

**Risk**:
- If not set, falls back to empty string (fails silently)
- Key is available to all requests using this module
- No per-request authentication validation

**Impact**: Requests sent with empty API key won't fail clearly

---

### 2.2 Lack of Rate Limiting (MEDIUM)

**Location**: `/src/lib/utils/openrouterClient.ts`

**Finding**: No rate limiting on OpenRouter requests. Multiple fallback models attempted sequentially:

```typescript
for (const model of models) {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        // ...
      },
      // ...
    });
    // ... retry loop continues for each model
  } catch (err) {
    lastError = err;
  }
}
```

**Risk**: 
- Expensive LLM calls repeated on each failure
- OpenRouter account could be over-billed
- No backoff strategy between retries

**Recommendation**:
```typescript
async function openrouterChatCompletionWithRetry(params) {
  const MAX_RETRIES = 2;
  let lastError;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Attempt call
      return await fetchWithModel(...);
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError;
}
```

---

## 3. PUSH NOTIFICATION SECURITY

### 3.1 Missing VAPID Key Validation (MEDIUM)

**Location**: `/src/lib/push.ts` (lines 12-15)

**Finding**:
```typescript
const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';
const publicKey = process.env.VAPID_PUBLIC_KEY || '';
const privateKey = process.env.VAPID_PRIVATE_KEY || '';
if (!publicKey || !privateKey) return { ok: false, error: 'VAPID not configured' };
```

**Risk**:
- Silent failure if VAPID keys not configured
- Default subject is non-production
- No validation that keys are valid VAPID keys

**Recommendation**:
```typescript
function validateVapidConfig(): boolean {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey) {
    throw new Error('VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are required');
  }
  
  if (!subject?.startsWith('mailto:') && !subject?.startsWith('https://')) {
    throw new Error('VAPID_SUBJECT must be email or URL');
  }
  
  return true;
}

// Call on app startup, not on each notification
```

---

### 3.2 Test Endpoint Disabled in Production But Without Clear Error (LOW)

**Location**: `/src/app/api/push/test/route.ts` (lines 5-8)

**Finding**:
```typescript
if (process.env.NODE_ENV === 'production') {
  return NextResponse.json({ error: 'disabled' }, { status: 403 });
}
```

**Issue**: While disabled in production, returns generic "disabled" message. Better to prevent access entirely or provide more context.

---

### 3.3 Push Subscription Endpoint URL Passed Without Validation (MEDIUM)

**Location**: `/src/app/api/push/subscribe/route.ts` (lines 11-30)

**Finding**:
```typescript
const endpoint = String(body?.endpoint || '');
const p256dh = String(body?.keys?.p256dh || '');
const auth = String(body?.keys?.auth || '');

// Minimal validation - just checks if empty
if (!endpoint || !p256dh || !auth) {
  return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
}
```

**Risk**:
- No validation that endpoint is a valid URL
- No check that p256dh and auth are valid base64
- Could store malformed subscription data

**Recommendation**:
```typescript
import { z } from 'zod';

const PushSubscriptionSchema = z.object({
  endpoint: z.string().url().max(1024),
  keys: z.object({
    p256dh: z.string().regex(/^[A-Za-z0-9_-]+={0,2}$/), // base64url
    auth: z.string().regex(/^[A-Za-z0-9_-]+={0,2}$/),
  }),
  ua: z.string().optional(),
  platform: z.string().optional(),
  allowMarketing: z.boolean().optional(),
});

const parsed = PushSubscriptionSchema.safeParse(body);
```

---

## 4. FILE UPLOAD SECURITY (Cover Images)

### 4.1 Upload Endpoint Not Implemented (LOW)

**Location**: `/src/app/api/cover/upload/route.ts`

**Finding**:
```typescript
export async function POST() {
  return NextResponse.json({ error: 'Not implemented. Planned in Phase 2.' }, { status: 501 });
}
```

**Status**: This endpoint is not yet implemented, so no current vulnerabilities.

**Future Recommendations** when implemented:
- Validate file MIME type (not just extension)
- Limit file size (max 5MB)
- Virus/malware scanning via CLAMAV or similar
- Store in isolated S3 bucket with restricted access
- Generate random filenames (not user-provided)
- Implement rate limiting per user

---

## 5. SESSION MANAGEMENT SECURITY

### 5.1 Weak Default Session Secret (HIGH)

**Location**: `/src/lib/session.ts` (lines 6-8)

**Finding**:
```typescript
function getSecret() {
  return process.env.SESSION_SECRET || 
         process.env.NEXTAUTH_SECRET || 
         'dev-secret-change-me';
}
```

**Risk**: 
- Default secret is publicly visible in source code
- If neither env var is set, all sessions use predictable secret
- JWT tokens can be forged by anyone

**Impact**: High - Session hijacking possible if env vars not configured

**Recommendation**:
```typescript
function getSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET;
  
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'SESSION_SECRET or NEXTAUTH_SECRET must be set in production'
      );
    }
    // Log warning but allow in development
    console.warn('⚠️  Using default dev session secret - set SESSION_SECRET for security');
  }
  
  return secret || 'dev-secret-change-me';
}
```

---

### 5.2 JWT Implementation Lacks Standard Claims (MEDIUM)

**Location**: `/src/lib/session.ts` (lines 45-56)

**Finding**: Custom JWT implementation missing security best practices:

```typescript
const payload = {
  sub: user.id,
  email: user.email || null,
  iat: Date.now(),
  exp: Date.now() + ttlMs,
};
```

**Issues**:
- `iat` should be in seconds, not milliseconds
- No `jti` (JWT ID) for revocation tracking
- No `nbf` (not before) claim
- Cookie doesn't set `Secure` flag (only in HTTPS)
- `SameSite=Lax` is minimum; `Strict` preferred

**Recommendation**:
```typescript
const payload = {
  sub: user.id,
  email: user.email || null,
  iat: Math.floor(Date.now() / 1000),     // seconds
  exp: Math.floor((Date.now() + ttlMs) / 1000), // seconds
  nbf: Math.floor(Date.now() / 1000),
  jti: crypto.randomUUID(),               // for revocation
};

// In createSessionCookie:
const cookieOptions = [
  `${COOKIE_NAME}=${token}`,
  'Path=/',
  'HttpOnly',
  ...(process.env.NODE_ENV === 'production' ? ['Secure'] : []),
  'SameSite=Strict',
  `Max-Age=${Math.floor(ttlMs / 1000)}`,
];
return {
  cookie: cookieOptions.join('; '),
  token
};
```

---

## 6. ADMIN ENDPOINT SECURITY

### 6.1 Admin Token Exposed in Query Parameters (CRITICAL)

**Location**: `/src/app/api/admin/backfill-suno/route.ts` (lines 102-107)

**Finding**:
```typescript
const token =
  request.headers.get("x-admin-token") || 
  searchParams.get("token") || // SECURITY ISSUE
  "";

if (ADMIN_SECRET && token !== ADMIN_SECRET) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**Risk**: 
- Admin token can be passed in URL query parameter: `?token=ADMIN_SECRET`
- URL is logged in browser history, server logs, proxies, CDN logs
- Enables full database backfill without authentication

**Impact**: Critical - Anyone with URL history/logs can impersonate admin

**Recommendation**:
```typescript
export async function POST(request: NextRequest) {
  // Only accept from headers
  const token = request.headers.get("x-admin-token");
  
  if (!token || !ADMIN_SECRET || token !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Use rate limiting + IP whitelisting for extra security
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim();
  if (!ALLOWED_ADMIN_IPS.includes(clientIp)) {
    console.warn('Admin endpoint accessed from unauthorized IP:', clientIp);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
```

---

### 6.2 Missing Admin Endpoint Rate Limiting (MEDIUM)

**Location**: `/src/app/api/admin/backfill-suno/route.ts`

**Finding**: No rate limiting on admin backfill endpoint

**Risk**: 
- Can be called repeatedly to cause DoS
- Resource-intensive operations (database queries/updates)

**Recommendation**: Implement rate limiting:
```typescript
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.fixedWindow(1, '1 h'), // 1 per hour
});

const { limit, remaining } = await ratelimit.limit(`admin-backfill-${clientIp}`);
if (!limit) {
  return NextResponse.json(
    { error: 'Rate limit exceeded' },
    { status: 429, headers: { 'Retry-After': '3600' } }
  );
}
```

---

## 7. SSRF VULNERABILITY IN AUDIO FILE OPERATIONS

### 7.1 Unvalidated Audio File URLs (HIGH)

**Location**: 
- `/src/app/api/suno/add-vocals/route.ts` (line 27-32)
- `/src/app/api/suno/add-instrumental/route.ts` (line 27-32)

**Finding**:
```typescript
const { audioFileUrl, prompt, tags, styleWeight } = await request.json();

if (!audioFileUrl) {
  return NextResponse.json(
    { error: 'Audio file URL is required' },
    { status: 400 }
  );
}

const requestBody: any = {
  audio_file_url: audioFileUrl, // PASSED DIRECTLY TO SUNO
  // ...
};
```

**Risk**: Server-Side Request Forgery (SSRF)
- Attacker can pass internal URLs: `http://localhost:8080`, `http://169.254.169.254/` (AWS metadata)
- Suno API will fetch from specified URL
- Can leak internal network information
- Could access private databases or services

**Recommendation**:
```typescript
import { URL } from 'url';

function validateAudioFileUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    
    // Only allow specific domains
    const allowedDomains = [
      'storage.googleapis.com',
      'cdn.example.com',
      's3.amazonaws.com',
    ];
    
    if (!allowedDomains.some(domain => url.hostname.endsWith(domain))) {
      return false;
    }
    
    // Prevent access to private networks
    const hostname = url.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.16.') ||
        hostname.startsWith('192.168.') ||
        hostname === '169.254.169.254') {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

if (!validateAudioFileUrl(audioFileUrl)) {
  return NextResponse.json(
    { error: 'Invalid audio file URL' },
    { status: 400 }
  );
}
```

---

## 8. CALLBACK RATE LIMITING (MEDIUM)

### 8.1 No Per-Task Rate Limiting (MEDIUM)

**Location**: 
- `/src/app/api/suno/callback/route.ts`
- `/src/app/api/suno/lyrics/callback/route.ts`

**Finding**: No protection against callback flood from same taskId

**Risk**: Attacker could:
- Send 1000s of callbacks for same task
- Cause database write storm
- Trigger thousands of push notifications

**Recommendation**:
```typescript
const CALLBACK_RATE_LIMIT = new Map<string, { count: number; resetTime: number }>();
const RATE_WINDOW_MS = 60000; // 1 minute
const MAX_CALLBACKS_PER_TASK = 5; // Suno sends at most 2-3

function checkCallbackRateLimit(taskId: string): boolean {
  const now = Date.now();
  const entry = CALLBACK_RATE_LIMIT.get(taskId);
  
  if (!entry || now > entry.resetTime) {
    CALLBACK_RATE_LIMIT.set(taskId, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return true;
  }
  
  entry.count++;
  if (entry.count > MAX_CALLBACKS_PER_TASK) {
    console.warn(`Rate limit exceeded for task ${taskId}`);
    return false;
  }
  
  return true;
}

if (!checkCallbackRateLimit(taskId)) {
  return NextResponse.json({ ok: true }, { status: 200 }); // Silently ignore
}
```

---

## 9. ENVIRONMENT VARIABLE SECURITY

### 9.1 Validation Not Enforced in Production (MEDIUM)

**Location**: `/src/middleware.ts` (lines 8-34)

**Finding**: Environment validation runs but doesn't block startup:

```typescript
let envValidated = false;
function validateEnvironmentOnce() {
  // ... validation code
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    // DOES NOT THROW - app continues with missing vars!
  }
}
```

**Risk**: App starts with missing critical config, fails at runtime

**Recommendation**:
```typescript
export function validateEnvironmentOnce() {
  if (envValidated) return;
  envValidated = true;

  const missing: string[] = [];
  const required = ['NEXT_PUBLIC_INSTANT_APP_ID', 'INSTANT_APP_ADMIN_TOKEN', 'SUNO_API_KEY'];
  
  for (const key of required) {
    if (!process.env[key]?.trim()) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}
```

---

### 9.2 Secrets Not Rotated (LOW)

**Location**: Multiple API integrations

**Issue**: No mechanism for API key rotation without redeployment

**Recommendation**:
- Implement key versioning in database
- Support multiple API keys with "active" flag
- Rotate Suno/OpenRouter keys quarterly
- Monitor for key exposure in GitHub/logs

---

## 10. CALLBACK DATA INJECTION

### 10.1 URLs from Callbacks Not Sanitized (MEDIUM)

**Location**: `/src/app/api/suno/callback/route.ts` (lines 157-207)

**Finding**: Audio/video URLs stored directly from callback without validation:

```typescript
const updateData: any = {
  songId: targetSongId,
  // ... directly stores callback data
  audioUrl: track.audioUrl,
  streamAudioUrl: track.streamAudioUrl,
  videoUrl: null,
  imageUrl: track.imageUrl,
};
```

**Risk**:
- Malicious URLs could be stored
- XSS if URLs rendered in frontend without proper escaping
- Phishing URLs served to users

**Recommendation**:
```typescript
function validateMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  try {
    const parsed = new URL(url);
    // Only allow HTTPS
    if (parsed.protocol !== 'https:') return null;
    // Whitelist known Suno/CDN domains
    if (!['d26nlxe6jxv4q7.cloudfront.net', 'api.sunoapi.org'].some(
      d => parsed.hostname.endsWith(d)
    )) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

const audioUrl = validateMediaUrl(track.audioUrl);
if (!audioUrl) {
  console.warn('Invalid audio URL in callback:', track.audioUrl);
  return NextResponse.json({ ok: false }, { status: 400 });
}
```

---

## Summary of Vulnerabilities by Severity

| Severity | Count | Issues |
|----------|-------|--------|
| Critical | 2 | Missing webhook signatures, Admin token in query params |
| High | 3 | No replay protection, No IP whitelisting, Weak session secret |
| Medium | 8 | API key logging, SSRF in audio URLs, Callback injection, Rate limiting, VAPID validation, Payload validation, Callback URL HTTPS, OpenRouter retry |
| Low | 2 | Test endpoint messaging, Secret rotation |

---

## Remediation Priority

### Immediate (This Sprint)
1. Implement webhook signature verification
2. Remove admin token from query parameters
3. Add IP whitelisting for callbacks
4. Fix session secret defaults
5. Implement SSRF protection for audio URLs

### Short-term (Next 2 Weeks)
6. Add replay attack protection
7. Implement rate limiting on admin endpoints
8. Validate media URLs from callbacks
9. Enforce HTTPS for callback URLs
10. Add payload schema validation

### Medium-term (This Quarter)
11. Implement JWT revocation list
12. Add audit logging for sensitive operations
13. Implement API key rotation
14. Add comprehensive integration tests

---

## Testing Recommendations

### Security Testing
- Unit tests for URL validation functions
- Integration tests for webhook handlers with various payloads
- Penetration testing of callback endpoints
- JWT signature verification tests
- SSRF injection test cases

### Example Test:
```typescript
describe('Webhook Security', () => {
  it('should reject callbacks without valid signature', async () => {
    const response = await fetch('/api/suno/callback', {
      method: 'POST',
      body: JSON.stringify({ data: { task_id: '123' } }),
    });
    expect(response.status).toBe(401);
  });

  it('should reject callbacks from unauthorized IPs', async () => {
    // Mock request with untrusted IP
  });

  it('should reject expired callbacks', async () => {
    const oldTimestamp = Date.now() - 600000; // 10 minutes old
  });
});
```

---

## Compliance Considerations

### Standards Alignment
- **OAuth 2.0**: Not implemented; consider for future integrations
- **OpenID Connect**: Would provide better auth than custom JWT
- **OWASP Top 10**: Multiple issues with A02:2021 (Cryptographic Failures), A06:2021 (Vulnerable Components)
- **CWE**: CWE-347 (Improper Verification), CWE-776 (Improper Verification of Cryptographic Signature)

### Data Protection
- GDPR: No explicit consent for push notifications (collect `allowMarketing` flag ✓, but no opt-in validation)
- CCPA: Session data retention policy not documented

---

## Conclusion

The application demonstrates security awareness (documented concerns, exempting webhooks from auth), but implementation gaps leave critical vulnerabilities. **Webhook security is the highest priority**, as callbacks are the attack surface between untrusted external service (Suno) and application database.

All recommendations are implementation-ready and should be deployed before production use with large user bases.
