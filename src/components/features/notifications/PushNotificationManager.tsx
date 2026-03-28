'use client';

import { useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

/**
 * Manages Web Push subscription and Service Worker registration.
 */
export const PushNotificationManager = () => {
  const { user } = useAuth();

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeUser = useCallback(async (registration: ServiceWorkerRegistration) => {
    if (!VAPID_PUBLIC_KEY) {
      console.error('VAPID Public Key not found');
      return;
    }

    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Send subscription to backend
      const { endpoint, keys } = JSON.parse(JSON.stringify(subscription));
      await axios.post(`${API_URL}/notifications/subscribe`, {
        endpoint,
        keys: {
          p256dh: keys.p256dh,
          auth: keys.auth,
        }
      }, {
        withCredentials: true,
      });

      console.log('User is subscribed to Web Push');
    } catch (err) {
      console.error('Failed to subscribe the user: ', err);
    }
  }, []);

  useEffect(() => {
    if (!user || typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    const registerAndSubscribe = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/push-sw.js');
        console.log('Service Worker registered');

        // Check if already subscribed
        const existingSubscription = await registration.pushManager.getSubscription();
        if (!existingSubscription) {
          // Request permission
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            await subscribeUser(registration);
          }
        }
      } catch (err) {
        console.error('Service Worker registration failed: ', err);
      }
    };

    registerAndSubscribe();
  }, [user, subscribeUser]);

  return null; // This component doesn't render anything
};
