
"use client"; 

import React, { useEffect, useRef } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { useFCM } from '@/hooks/useFCM'; // Import useFCM
// Firestore listener for local notifications (for when tab is active)
// Background push notifications are handled by the service worker
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import type { Submission } from '@/lib/types';
import { getOtherPerson } from '@/lib/dynamicFields';
import { showLocalNotification } from '@/lib/notificationUtils';


export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, dbInstance } = useAuth();
  const { requestFCMNotificationPermission, notificationPermissionStatus } = useFCM(); // Use FCM hook
  
  const initialLoadTimeRef = useRef<Timestamp | null>(null);
  const isListenerAttachedRef = useRef(false);

  useEffect(() => {
    if (user && notificationPermissionStatus !== 'granted' && notificationPermissionStatus !== 'denied') {
      // Only request if not already granted or denied to avoid repeated prompts
      // or if status is null (initial)
      requestFCMNotificationPermission();
    }
  }, [user, requestFCMNotificationPermission, notificationPermissionStatus]);


  // This listener is for IN-APP notifications when another user acts
  // Background push notifications are handled by firebase-messaging-sw.js
  useEffect(() => {
    if (!user || !dbInstance || notificationPermissionStatus !== 'granted' || isListenerAttachedRef.current) {
      if (notificationPermissionStatus !== 'granted' && notificationPermissionStatus !== null) {
          console.log(`In-app notification listener not attached. Permission: ${notificationPermissionStatus}`);
      }
      return;
    }
    
    if (!initialLoadTimeRef.current) {
        initialLoadTimeRef.current = Timestamp.now();
    }
    
    console.log(`Setting up in-app notification listener. Reacting to submissions created/modified after ${initialLoadTimeRef.current.toDate()}`);

    const q = query(
      collection(dbInstance, 'submissions'),
      // Listen to changes based on updatedAt to catch modifications
      // If updatedAt doesn't exist, Firestore won't include docs without it in orderBy
      // A more robust way might be to listen to all docs and filter client side,
      // or ensure updatedAt is always set. For simplicity, using createdAt for now.
      orderBy('createdAt', 'desc') 
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const submission = { id: change.doc.id, ...change.doc.data() } as Submission;
        
        const relevantTimestamp = submission.updatedAt || submission.createdAt;
        if (!relevantTimestamp || !initialLoadTimeRef.current || relevantTimestamp.toMillis() < initialLoadTimeRef.current!.toMillis()) {
            return; // Ignore changes older than when the listener started for this session
        }

        if (change.type === 'added') {
          if (submission.uid !== user.uid) { // New submission by another user
            console.log('New submission by other user detected (for in-app notification):', submission);
            showLocalNotification(
              'New Mendspace Entry',
              `${submission.displayName || 'Someone'} just shared their feelings.`
            );
          }
        } else if (change.type === 'modified') {
          // If the current user is the original author of the submission,
          // and field3 (defence) is present and non-empty,
          // and the update was likely made by the other person.
          if (submission.uid === user.uid && submission.field3 && submission.field3.trim() !== '') {
            // This logic assumes that if field3 is modified on the user's own submission, it's by the other person.
            // A more robust check would involve who made the last update if that data was tracked.
            const otherUserName = getOtherPerson(user.displayName || ''); 
            console.log(`Defence likely updated on your submission by ${otherUserName} (for in-app notification):`, submission);
            showLocalNotification(
                `${otherUserName} Responded`,
                `A defence was added/updated on your entry: "${submission.field1.substring(0, 30)}..."`
            );
          }
        }
      });
    }, (error) => {
      console.error("Error listening to submissions for in-app notifications:", error);
    });

    isListenerAttachedRef.current = true; 

    return () => {
      console.log("Cleaning up in-app notification listener.");
      unsubscribe();
      isListenerAttachedRef.current = false; 
    };
  }, [user, dbInstance, notificationPermissionStatus, getOtherPerson]);


  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex-1">
            {children}
          </div>
        </main>
        <footer className="text-center py-6 text-muted-foreground text-sm border-t border-border mt-auto">
          © {new Date().getFullYear()} Mendspace. All rights and wrongs reserved made with Love.
        </footer>
      </div>
    </AuthGuard>
  );
}
