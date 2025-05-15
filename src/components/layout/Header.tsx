"use client";

import React from 'react';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  const { user, loading } = useAuth();

  return (
    <header className="bg-card/80 backdrop-blur-md shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
        <Link href="/home" className="text-3xl font-bold text-primary hover:text-primary/80 transition-colors">
          Mendspace
        </Link>
        <div>
          {!loading && (
            user ? <SignOutButton /> : (
              <Button asChild variant="outline">
                <Link href="/signin">
                  <LogIn className="mr-2 h-4 w-4" /> Sign In
                </Link>
              </Button>
            )
          )}
        </div>
      </div>
    </header>
  );
}
