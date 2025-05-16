
"use client";

import { useEffect, useState } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '@/firebase/config'; // Ensure messaging is exported from config
import { useAuth } from './useAuth';
import { doc, setDoc, serverTimestamp, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { showLocalNotification } from '@/lib/notificationUtils'; // We'll create this

export const useFCM = () => {
  const { user } = useAuth();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermissionStatus(Notification.permission);
    }
  }, []);

  useEffect(() => {
    const retrieveToken = async () => {
      if (!messaging || !user || typeof window === 'undefined' || !('Notification' in window)) {
        console.log("FCM: Messaging not available or user not logged in.");
        return;
      }

      if (Notification.permission === 'granted') {
        try {
          // Ensure VAPID key is generated in Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
          const currentToken = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
          if (currentToken) {
            console.log('FCM token:', currentToken);
            setFcmToken(currentToken);
            // Save the token to Firestore
            const tokenRef = doc(db, 'users', user.uid, 'fcmTokens', currentToken);
            await setDoc(tokenRef, { token: currentToken, createdAt: serverTimestamp() });
            console.log('FCM token saved to Firestore.');

            // Optional: Clean up old tokens for the user if multiple devices/sessions
            // This is more complex and might be added later if needed
            
          } else {
            console.log('No registration token available. Request permission to generate one.');
            requestFCMNotificationPermission(); // Try to request if not available
          }
        } catch (error) {
          console.error('An error occurred while retrieving token. ', error);
          if ((error as Error).message.includes("notification permission") || (error as Error).message.includes("permission denied")) {
            setNotificationPermissionStatus('denied');
          }
        }
      } else {
        console.log("FCM: Notification permission not granted. Current status:", Notification.permission);
      }
    };

    if (user && notificationPermissionStatus === 'granted') {
      retrieveToken();
    }
  }, [user, notificationPermissionStatus]);


  const requestFCMNotificationPermission = async () => {
    if (!('Notification' in window) || !messaging) {
      console.warn('This browser does not support desktop notification or FCM is not initialized.');
      setNotificationPermissionStatus('denied');
      return 'denied';
    }
    
    console.log('Requesting FCM notification permission...');
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermissionStatus(permission);
      console.log('FCM Notification permission status:', permission);
      if (permission === 'granted') {
        // If permission granted, try to retrieve and save token again
        // This will be handled by the useEffect watching notificationPermissionStatus
      }
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setNotificationPermissionStatus('denied');
      return 'denied';
    }
  };


  useEffect(() => {
    if (messaging && notificationPermissionStatus === 'granted') {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Foreground message received. ', payload);
        const title = payload.notification?.title || 'New Message';
        const body = payload.notification?.body || 'You received a new message.';
        const icon = payload.notification?.icon || '/logo.png';
        showLocalNotification(title, body, icon);
      });
      return () => unsubscribe(); // Unsubscribe from foreground messages when component unmounts
    }
  }, [notificationPermissionStatus]);

  return { fcmToken, requestFCMNotificationPermission, notificationPermissionStatus };
};
