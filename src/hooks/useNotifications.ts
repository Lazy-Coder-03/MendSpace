
"use client";

import { useState, useCallback, useEffect } from 'react';

export function useNotifications() {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    // Initialize permission state on mount
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    } else {
      setNotificationPermission('denied'); // Or a custom 'unsupported' state
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notification');
      // setNotificationPermission is already handling this in useEffect, 
      // but we can be explicit if preferred for unsupported case.
      return 'denied'; 
    }

    if (Notification.permission === 'granted') {
      setNotificationPermission('granted');
      return 'granted';
    }

    // Only request if not denied. If denied, user has to change it in browser settings.
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission;
    } else {
      setNotificationPermission('denied');
      return 'denied';
    }
  }, []);

  const showNotification = useCallback((title: string, body: string, icon?: string) => {
    if (notificationPermission === 'granted' && 'Notification' in window) {
      const options: NotificationOptions = {
        body,
        icon: icon || '/logo.png', // Default icon if none provided
        tag: `mendspace-notification-${Date.now()}` // Unique tag to prevent multiple identical notifications if rapidly fired
      };
      try {
        const notification = new Notification(title, options);
        // Optional: handle notification click or close events
        // notification.onclick = () => { ... };
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    } else {
      if (!('Notification' in window)) {
        console.log('Notifications not supported in this browser.');
      } else if (notificationPermission !== 'granted') {
        console.log(`Notification permission is ${notificationPermission}. Cannot show notification.`);
      }
    }
  }, [notificationPermission]);

  return { requestNotificationPermission, showNotification, notificationPermission };
}
