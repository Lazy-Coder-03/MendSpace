
"use client";

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const { user, loading, isAllowedUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user && isAllowedUser) {
        router.replace('/home');
      } else {
        router.replace('/signin');
      }
    }
  }, [user, loading, isAllowedUser, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-4 text-lg text-foreground">Loading Mendspace...</p>
    </div>
  );
}
