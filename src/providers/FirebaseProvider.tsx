"use client";

import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';
import React, { createContext, useEffect, useState, useMemo } from 'react';
import { auth, db } from '@/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAllowedUser: boolean;
  authInstance: Auth;
  dbInstance: Firestore;
  signInWithGoogle: () => Promise<void>; // Placeholder, actual implementation in signin page
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ALLOWED_DISPLAY_NAME_PREFIXES = ['Sayantan', 'Ashmi'];

export const FirebaseProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAllowedUser, setIsAllowedUser] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        const displayName = currentUser.displayName || '';
        const userIsAllowed = ALLOWED_DISPLAY_NAME_PREFIXES.some(prefix => displayName.toLowerCase().startsWith(prefix.toLowerCase()));
        
        if (userIsAllowed) {
          setUser(currentUser);
          setIsAllowedUser(true);
        } else {
          setUser(null);
          setIsAllowedUser(false);
          await firebaseSignOut(auth);
          toast({
            title: 'Access Denied',
            description: 'This application is restricted to authorized users only.',
            variant: 'destructive',
          });
        }
      } else {
        setUser(null);
        setIsAllowedUser(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setIsAllowedUser(false);
      toast({ title: 'Signed Out', description: 'You have been signed out successfully.' });
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({ title: 'Sign Out Error', description: 'Failed to sign out.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };
  
  // signInWithGoogle will be primarily initiated from the SignIn page component,
  // but we can keep a placeholder or basic structure here if needed for context.
  // For now, it's handled in the SignIn page.
  const signInWithGoogle = async () => {
    // This function is practically handled by the SignInPage,
    // but context needs a definition.
    console.warn("signInWithGoogle called from AuthContext, usually handled by SignInPage");
  };


  const value = useMemo(() => ({
    user,
    loading,
    isAllowedUser,
    authInstance: auth,
    dbInstance: db,
    signInWithGoogle, // This will be effectively overridden or called by specific components
    signOut,
  }), [user, loading, isAllowedUser]);

  if (loading && typeof window !== 'undefined' && window.location.pathname !== '/signin') {
    // Show a full-page loader if not on the sign-in page and loading auth state
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
