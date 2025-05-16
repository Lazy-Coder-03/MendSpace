
"use client";

import { useState, useCallback, useEffect } from 'react';

export function useNotifications() {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    // Initialize permission state on mount
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      console.log('Notification API available. Initial permission:', Notification.permission);
    } else {
      setNotificationPermission('denied'); // Or a custom 'unsupported' state
      console.warn('Notification API not supported in this browser.');
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notification. Cannot request permission.');
      return 'denied'; 
    }

    if (Notification.permission === 'granted') {
      setNotificationPermission('granted');
      console.log('Notification permission already granted.');
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      console.log('Requesting notification permission...');
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      console.log('Notification permission result:', permission);
      return permission;
    } else {
      setNotificationPermission('denied');
      console.log('Notification permission was previously denied. Cannot request again without user manual reset.');
      return 'denied';
    }
  }, []);

  const showNotification = useCallback((title: string, body: string, icon?: string) => {
    console.log('Attempting to show notification. Current permission state:', notificationPermission);
    if (!('Notification' in window)) {
      console.warn('Notification API not available. Cannot show notification.');
      return;
    }
    
    if (notificationPermission === 'granted') {
      const options: NotificationOptions = {
        body,
        icon: icon || '/logo.png', // Default icon if none provided
        tag: `mendspace-notification-${Date.now()}` // Unique tag
      };
      try {
        console.log('Creating notification with title:', title, 'options:', options);
        const notification = new Notification(title, options);
        notification.onclick = () => {
          console.log('Notification clicked');
          // Optional: focus the window or navigate to a specific page
          window.focus(); 
        };
        notification.onclose = () => {
          console.log('Notification closed');
        };
        notification.onerror = (err) => {
          console.error('Notification error:', err);
        };
        console.log('Notification created successfully.');
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    } else {
      console.log(`Cannot show notification. Permission is: ${notificationPermission}. Please ensure permission is granted.`);
    }
  }, [notificationPermission]);

  return { requestNotificationPermission, showNotification, notificationPermission };
}

