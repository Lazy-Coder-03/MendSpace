
"use client";

// This hook is now simplified as FCM handles its own permission.
// It can still be used for non-FCM related local notifications if needed,
// or fully deprecated if all notifications go through FCM.
// For now, we'll keep it and `useFCM` will use `showLocalNotification` from `lib/notificationUtils.ts`.

import { useState, useCallback, useEffect } from 'react';
import { showLocalNotification } from '@/lib/notificationUtils';


export function useNotifications() {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    } else {
      setNotificationPermission('denied'); 
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notification. Cannot request permission.');
      setNotificationPermission('denied');
      return 'denied'; 
    }

    if (Notification.permission === 'granted') {
      setNotificationPermission('granted');
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission;
    } else {
      setNotificationPermission('denied');
      return 'denied';
    }
  }, []);

  // showNotification function is now globally available via showLocalNotification
  // This hook mainly manages the permission state for non-FCM uses if any.

  return { requestSystemNotificationPermission: requestNotificationPermission, systemNotificationPermission: notificationPermission, showSystemNotification: showLocalNotification };
}
