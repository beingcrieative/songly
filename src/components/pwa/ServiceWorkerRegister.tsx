"use client";
import { useEffect, useState } from 'react';

/**
 * ServiceWorkerRegister (PRD-0014 Task 3.5)
 *
 * Registers the service worker and manages push notification permissions.
 * Shows permission prompt after first successful song creation.
 */
export default function ServiceWorkerRegister() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    // Register service worker
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[SW] Service worker registered:', reg.scope);
        setRegistration(reg);
      })
      .catch((error) => {
        console.error('[SW] Service worker registration failed:', error);
      });
  }, []);

  // Task 3.5.1: Request permission after registration
  useEffect(() => {
    if (!registration) return;
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;

    // Check if permission already granted
    const currentPermission = Notification.permission;
    console.log('[SW] Notification permission:', currentPermission);

    // Store permission status in localStorage
    localStorage.setItem('push_permission_status', currentPermission);

    // Task 3.5.2: Handle permission states
    if (currentPermission === 'granted') {
      // Subscribe user to push notifications
      subscribeUserToPush(registration);
    } else if (currentPermission === 'denied') {
      // Don't ask again if user denied
      console.log('[SW] Push notifications denied by user');
    } else if (currentPermission === 'default') {
      // Default state - will show prompt when appropriate
      // (triggered by user action in Library or after song creation)
      console.log('[SW] Push notifications not yet requested');
    }
  }, [registration]);

  return null;
}

/**
 * Subscribe user to push notifications
 */
async function subscribeUserToPush(registration: ServiceWorkerRegistration) {
  try {
    // Get VAPID public key from environment
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.warn('[SW] VAPID public key not configured');
      return;
    }

    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('[SW] Already subscribed to push notifications');
      // Send subscription to server (in case it changed)
      await sendSubscriptionToServer(existingSubscription);
      return;
    }

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    console.log('[SW] Subscribed to push notifications:', subscription.endpoint);

    // Send subscription to server
    await sendSubscriptionToServer(subscription);
  } catch (error) {
    console.error('[SW] Failed to subscribe to push:', error);
  }
}

/**
 * Send push subscription to server
 */
async function sendSubscriptionToServer(subscription: PushSubscription) {
  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save subscription');
    }

    console.log('[SW] Subscription saved to server');
  } catch (error) {
    console.error('[SW] Failed to save subscription:', error);
  }
}

/**
 * Convert VAPID public key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray as BufferSource;
}

/**
 * Request push notification permission (call from user action)
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined') return 'default';
  if (!('Notification' in window)) return 'default';

  try {
    const permission = await Notification.requestPermission();
    localStorage.setItem('push_permission_status', permission);

    if (permission === 'granted') {
      // Get service worker registration and subscribe
      const registration = await navigator.serviceWorker.ready;
      await subscribeUserToPush(registration);
    }

    return permission;
  } catch (error) {
    console.error('[SW] Failed to request permission:', error);
    return 'default';
  }
}

