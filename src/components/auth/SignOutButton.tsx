"use client";

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function SignOutButton() {
  const { signOut, loading } = useAuth();

  return (
    <Button onClick={signOut} disabled={loading} variant="outline" className="shadow-sm hover:shadow-md">
      <LogOut className="mr-2 h-4 w-4" />
      Sign Out
    </Button>
  );
}
