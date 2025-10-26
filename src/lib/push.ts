/**
 * Push Notification System (PRD-0014 Task 3.0)
 *
 * Provides functions to send push notifications to users when:
 * - Lyrics are ready for selection
 * - Music is ready to play
 *
 * Uses web-push with VAPID authentication.
 */

type PushSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

type NotificationPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  data?: any;
};

/**
 * Low-level function to send a push notification to a single subscription
 */
export async function sendWebPush(sub: PushSubscription, payload: NotificationPayload) {
  try {
    // Lazy import to avoid hard dependency when not installed
    const mod = await import('web-push');
    const webpush = mod.default || mod;
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';
    const publicKey = process.env.VAPID_PUBLIC_KEY || '';
    const privateKey = process.env.VAPID_PRIVATE_KEY || '';

    if (!publicKey || !privateKey) {
      console.warn('[Push] VAPID keys not configured');
      return { ok: false, error: 'VAPID not configured' };
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    await webpush.sendNotification(sub as any, JSON.stringify(payload));
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'send failed' };
  }
}

/**
 * Task 3.0: Send "Lyrics Ready" notification
 *
 * Notifies user that lyrics variants are ready for selection
 */
export async function sendLyricsReadyNotification(userId: string, songId: string) {
  try {
    console.log('[Push] Sending lyrics ready notification to user:', userId);

    // Get admin DB to query subscriptions
    const { getAdminDb } = await import('@/lib/adminDb');
    const adminDb = getAdminDb();

    if (!adminDb) {
      console.error('[Push] Admin DB not available');
      return { ok: false, error: 'Admin DB not configured' };
    }

    // Query user's push subscriptions
    const { push_subscriptions } = await adminDb.query({
      push_subscriptions: {
        $: { where: { 'user.id': userId } } as any,
      },
    });

    if (!push_subscriptions || push_subscriptions.length === 0) {
      console.log('[Push] No subscriptions found for user:', userId);
      return { ok: true, sent: 0, message: 'No subscriptions' };
    }

    // Create notification payload
    const payload: NotificationPayload = {
      title: 'Je songteksten zijn klaar! 🎵',
      body: 'Kies je favoriete variant en ga verder met je liedje',
      url: `/library?songId=${songId}`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        type: 'lyrics_ready',
        songId,
        timestamp: Date.now(),
      },
    };

    // Send to all subscriptions
    const results = await Promise.allSettled(
      push_subscriptions.map((sub: any) =>
        sendWebPush(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      )
    );

    const sent = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
    const failed = results.length - sent;

    console.log(`[Push] Lyrics ready notification: ${sent} sent, ${failed} failed`);

    // Update song's notificationsSent field
    try {
      const { parseNotificationsSent, stringifyNotificationsSent } = await import('@/types/generation');
      const { songs } = await adminDb.query({
        songs: { $: { where: { id: songId } } as any },
      });

      if (songs.length > 0) {
        const currentNotifications = parseNotificationsSent(songs[0].notificationsSent);
        if (!currentNotifications.includes('lyrics_ready')) {
          const updatedNotifications = [...currentNotifications, 'lyrics_ready' as const];
          await adminDb.transact([
            adminDb.tx.songs[songId].update({
              notificationsSent: stringifyNotificationsSent(updatedNotifications),
            }),
          ]);
          console.log('[Push] Updated notificationsSent for song:', songId);
        }
      }
    } catch (error) {
      console.error('[Push] Failed to update notificationsSent:', error);
    }

    return { ok: true, sent, failed };
  } catch (error: any) {
    console.error('[Push] Error sending lyrics ready notification:', error);
    return { ok: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Task 3.0: Send "Music Ready" notification
 *
 * Notifies user that music is ready to play
 */
export async function sendMusicReadyNotification(userId: string, songId: string) {
  try {
    console.log('[Push] Sending music ready notification to user:', userId);

    // Get admin DB to query subscriptions
    const { getAdminDb } = await import('@/lib/adminDb');
    const adminDb = getAdminDb();

    if (!adminDb) {
      console.error('[Push] Admin DB not available');
      return { ok: false, error: 'Admin DB not configured' };
    }

    // Query user's push subscriptions
    const { push_subscriptions } = await adminDb.query({
      push_subscriptions: {
        $: { where: { 'user.id': userId } } as any,
      },
    });

    if (!push_subscriptions || push_subscriptions.length === 0) {
      console.log('[Push] No subscriptions found for user:', userId);
      return { ok: true, sent: 0, message: 'No subscriptions' };
    }

    // Create notification payload
    const payload: NotificationPayload = {
      title: 'Je liedje is klaar! 🎵',
      body: 'Klik om te luisteren naar je nieuwe liedje',
      url: `/library?songId=${songId}`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        type: 'music_ready',
        songId,
        timestamp: Date.now(),
      },
    };

    // Send to all subscriptions
    const results = await Promise.allSettled(
      push_subscriptions.map((sub: any) =>
        sendWebPush(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      )
    );

    const sent = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
    const failed = results.length - sent;

    console.log(`[Push] Music ready notification: ${sent} sent, ${failed} failed`);

    // Update song's notificationsSent field
    try {
      const { parseNotificationsSent, stringifyNotificationsSent } = await import('@/types/generation');
      const { songs } = await adminDb.query({
        songs: { $: { where: { id: songId } } as any },
      });

      if (songs.length > 0) {
        const currentNotifications = parseNotificationsSent(songs[0].notificationsSent);
        if (!currentNotifications.includes('music_ready')) {
          const updatedNotifications = [...currentNotifications, 'music_ready' as const];
          await adminDb.transact([
            adminDb.tx.songs[songId].update({
              notificationsSent: stringifyNotificationsSent(updatedNotifications),
            }),
          ]);
          console.log('[Push] Updated notificationsSent for song:', songId);
        }
      }
    } catch (error) {
      console.error('[Push] Failed to update notificationsSent:', error);
    }

    return { ok: true, sent, failed };
  } catch (error: any) {
    console.error('[Push] Error sending music ready notification:', error);
    return { ok: false, error: error.message || 'Unknown error' };
  }
}

