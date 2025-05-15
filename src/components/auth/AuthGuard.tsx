
"use client";

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// Note: Next.js sometimes issues console warnings related to "params" or "searchParams"
// enumeration when routing hooks are used in Client Components during SSR.
// These are often framework-level warnings and may not indicate a direct error in this component.

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isAllowedUser } = useAuth();
  const router = useRouter();
  // const pathname = usePathname(); // pathname is not directly used for redirect logic here, can be removed if not needed for other purposes

  useEffect(() => {
    // Only perform actions once the loading state from Firebase is resolved
    if (!loading) {
      if (!user || !isAllowedUser) {
        // If user is not logged in, or not an allowed user,
        // redirect them to the sign-in page.
        router.push('/signin');
      }
      // If user IS logged in and IS allowed, this effect does nothing,
      // and the component will proceed to render 'children'.
    }
  }, [user, loading, isAllowedUser, router]);

  if (loading) {
    // While the authentication state is being determined, show a loader.
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAllowedUser) {
    // If, after loading, the user is still not authenticated or not allowed,
    // the useEffect above will have initiated a redirect to /signin.
    // Show a loader while this redirection is happening.
    // This state should be brief.
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If loading is false, and the user exists and is allowed, render the protected content.
  return <>{children}</>;
}
