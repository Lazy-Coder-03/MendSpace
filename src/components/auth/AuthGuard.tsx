"use client";

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isAllowedUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user || !isAllowedUser) {
        // Store the intended path to redirect after successful login
        if (pathname !== '/signin') {
           // No need to store redirectPath, Firebase handles session persistence.
           // If user directly lands on protected page, after sign in, they might need manual navigation or a smart redirect from home.
        }
        router.push('/signin');
      }
    }
  }, [user, loading, isAllowedUser, router, pathname]);

  if (loading || (!user && pathname !== '/signin')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user || !isAllowedUser) {
    // This case should ideally be covered by the redirect, but as a fallback:
    return (
       <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    ); // Or a specific "Access Denied" component
  }

  return <>{children}</>;
}
