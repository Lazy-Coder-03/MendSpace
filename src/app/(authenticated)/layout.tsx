
"use client"; // Must be a client component to use hooks like useEffect and custom hooks

import React, { useEffect, useRef } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Header } from '@/components/layout/Header';
import { useNotifications } from '@/hooks/useNotifications'; // Import the new hook
import { useAuth } from '@/hooks/useAuth';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import type { Submission } from '@/lib/types';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { requestNotificationPermission, showNotification, notificationPermission } = useNotifications();
  const { user, dbInstance } = useAuth();
  const initialLoadTimeRef = useRef<Timestamp | null>(null);
  const isListenerAttachedRef = useRef(false);

  useEffect(() => {
    // Request permission once when component mounts (or when user becomes available)
    if (user) {
      requestNotificationPermission();
    }
  }, [requestNotificationPermission, user]);

  useEffect(() => {
    if (!user || !dbInstance || notificationPermission !== 'granted' || isListenerAttachedRef.current) {
      // If listener is already attached, or conditions not met, do nothing.
      if (notificationPermission !== 'granted' && notificationPermission !== null) {
          console.log(`Notification permission is ${notificationPermission}. Listener not attached.`);
      }
      return;
    }
    
    // Set initial load time only once per session or when relevant dependencies change
    if (!initialLoadTimeRef.current) {
        initialLoadTimeRef.current = Timestamp.now();
    }
    
    console.log(`Setting up notification listener. Will only react to submissions after ${initialLoadTimeRef.current.toDate()}`);

    const q = query(
      collection(dbInstance, 'submissions'),
      where('createdAt', '>', initialLoadTimeRef.current), // Only docs created after listener started
      orderBy('createdAt', 'desc') 
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const submission = { id: change.doc.id, ...change.doc.data() } as Submission;
          // Check if submission's createdAt is indeed after initialLoadTime to be absolutely sure
          // This client-side check helps if there's a slight delay or if Firestore initially returns docs
          // that are very close to the initialLoadTime due to eventual consistency or query behavior.
          if (submission.createdAt && submission.createdAt.toMillis() > initialLoadTimeRef.current!.toMillis()) {
            if (submission.uid !== user.uid) {
              console.log('New submission by other user detected:', submission);
              showNotification(
                'New Mendspace Entry',
                `${submission.displayName || 'Someone'} just shared their feelings.`
              );
            }
          }
        }
      });
    }, (error) => {
      console.error("Error listening to submissions for notifications:", error);
    });

    isListenerAttachedRef.current = true; // Mark listener as attached

    // Cleanup function
    return () => {
      console.log("Cleaning up notification listener.");
      unsubscribe();
      isListenerAttachedRef.current = false; // Reset on cleanup
      // initialLoadTimeRef.current = null; // Optional: reset if you want fresh time on next setup
    };
  // Key dependencies: if user, db, or permission changes to 'granted', re-evaluate listener setup.
  }, [user, dbInstance, notificationPermission, showNotification]);


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
