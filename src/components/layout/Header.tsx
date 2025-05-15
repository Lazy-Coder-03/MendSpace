
"use client";

import React, { useState } from 'react';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { LogIn, Menu } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'; 
import { Navigation } from './Navigation'; 

export function Header() {
  const { user, loading } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleLinkClick = () => {
    setIsSheetOpen(false);
  };

  return (
    <header className="bg-card/80 backdrop-blur-md shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
        <div className="flex items-center gap-2">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="mr-2"> 
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="left" 
              className="w-[280px] sm:w-[320px] p-0 bg-secondary/20 backdrop-blur-md border-secondary/30" // Pastel pinkish, translucent background
            >
              <SheetHeader className="p-4 pb-2 border-b border-secondary/40">
                <SheetTitle className="text-secondary-foreground">Menu</SheetTitle> {/* Darker text for contrast */}
              </SheetHeader>
              <div className="p-4">
                 <Link href="/home" className="flex items-center gap-2 text-2xl font-bold text-primary hover:text-primary/80 transition-colors mb-6" onClick={handleLinkClick}>
                    <Image src="/logo.png" alt="Mendspace Logo" width={40} height={32} priority data-ai-hint="monogram letter M" />
                    <span>Mendspace</span>
                  </Link>
                <Navigation onLinkClick={handleLinkClick} />
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/home" className="flex items-center gap-2 text-3xl font-bold text-primary hover:text-primary/80 transition-colors">
            <Image src="/logo.png" alt="Mendspace Logo" width={49} height={40} priority data-ai-hint="monogram letter M" />
            <span className="hidden sm:inline">Mendspace</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-4">
          {!loading && (
            user ? <SignOutButton /> : (
              <Button asChild variant="outline" className="shadow-sm hover:shadow-md">
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
