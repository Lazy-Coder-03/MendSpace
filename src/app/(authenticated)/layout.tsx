
"use client"; 

import React, { useEffect, useRef } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Header } from '@/components/layout/Header';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import type { Submission } from '@/lib/types';
import { getOtherPerson } from '@/lib/dynamicFields';

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
    if (user) {
      requestNotificationPermission();
    }
  }, [requestNotificationPermission, user]);

  useEffect(() => {
    if (!user || !dbInstance || notificationPermission !== 'granted' || isListenerAttachedRef.current) {
      if (notificationPermission !== 'granted' && notificationPermission !== null && notificationPermission !== undefined) {
          console.log(`Notification permission is ${notificationPermission}. Listener not attached.`);
      }
      return;
    }
    
    if (!initialLoadTimeRef.current) {
        initialLoadTimeRef.current = Timestamp.now();
        console.log(`Initial load time set to: ${initialLoadTimeRef.current.toDate()}`);
    }
    
    console.log(`Setting up notification listener. Will only react to submissions created/modified after ${initialLoadTimeRef.current.toDate()}`);

    // Listen for submissions created after the listener was initialized for this session.
    const q = query(
      collection(dbInstance, 'submissions'),
      where('createdAt', '>', initialLoadTimeRef.current), 
      orderBy('createdAt', 'desc') 
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const submission = { id: change.doc.id, ...change.doc.data() } as Submission;
        
        // Double check client-side if this change is relevant (created or updated after initial load time)
        const relevantTimestamp = submission.updatedAt || submission.createdAt;
        if (!relevantTimestamp || relevantTimestamp.toMillis() < initialLoadTimeRef.current!.toMillis()) {
            return;
        }

        if (change.type === 'added') {
          if (submission.uid !== user.uid) { // New submission by another user
            console.log('New submission by other user detected:', submission);
            showNotification(
              'New Mendspace Entry',
              `${submission.displayName || 'Someone'} just shared their feelings.`
            );
          }
        } else if (change.type === 'modified') {
          // If the current user is the original author of the submission,
          // and field3 (defence) is present and non-empty,
          // assume the other person added/edited the defence.
          if (submission.uid === user.uid && submission.field3 && submission.field3.trim() !== '') {
            // This heuristic assumes that if the user's own submission is modified and field3 is populated,
            // it was due to the other person's action (as per UI restrictions).
            const isRecentDefenceUpdate = submission.updatedAt && 
                                      submission.createdAt &&
                                      (submission.updatedAt.toMillis() > submission.createdAt.toMillis() - 5000); // Allow 5s for initial save with defence

            if(isRecentDefenceUpdate || !submission.updatedAt) { // If defence was added/updated recently or if updatedAt isn't set (less likely)
                const otherUserName = getOtherPerson(user.displayName || ''); 
                console.log(`Defence likely updated on your submission by ${otherUserName}:`, submission);
                showNotification(
                    `${otherUserName} Responded`,
                    `A defence was added/updated on your entry: "${submission.field1.substring(0, 30)}..."`
                );
            }
          }
        }
      });
    }, (error) => {
      console.error("Error listening to submissions for notifications:", error);
    });

    isListenerAttachedRef.current = true; 

    return () => {
      console.log("Cleaning up notification listener.");
      unsubscribe();
      isListenerAttachedRef.current = false; 
    };
  // Ensure getOtherPerson is stable or memoized if its definition changes frequently
  }, [user, dbInstance, notificationPermission, showNotification, getOtherPerson]);


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
