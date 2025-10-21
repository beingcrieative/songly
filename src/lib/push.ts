// Minimal push sender scaffold. Requires `web-push` if enabled in the environment.
type PushSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function sendWebPush(sub: PushSubscription, payload: any) {
  try {
    // Lazy import to avoid hard dependency when not installed
    const mod = await import('web-push');
    const webpush = mod.default || mod;
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';
    const publicKey = process.env.VAPID_PUBLIC_KEY || '';
    const privateKey = process.env.VAPID_PRIVATE_KEY || '';
    if (!publicKey || !privateKey) return { ok: false, error: 'VAPID not configured' };
    webpush.setVapidDetails(subject, publicKey, privateKey);
    await webpush.sendNotification(sub as any, JSON.stringify(payload));
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'send failed' };
  }
}

