
"use client";

import React, { useState } from 'react';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { LogIn, Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Navigation } from './Navigation';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, loading, signOut } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const pathname = usePathname();

  const handleLinkClick = () => {
    setIsSheetOpen(false);
  };

  return (
    <header className="bg-card/80 backdrop-blur-md shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
        {/* Left: Hamburger Menu */}
        <div className="flex-shrink-0">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[280px] sm:w-[320px] p-0 bg-[hsl(270,60%,75%)] border-r border-[hsl(270,60%,65%)]"
            >
              <SheetHeader className="p-4 pb-2 border-b border-[hsl(270,60%,65%)]">
                <SheetTitle className="text-accent-foreground">Menu</SheetTitle>
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
        </div>

        {/* Center: Logo and App Name */}
        <div className="flex-1 flex justify-center">
          <Link href="/home" className="flex items-center gap-2 text-3xl font-bold text-primary hover:text-primary/80 transition-colors">
            <Image src="/logo.png" alt="Mendspace Logo" width={49} height={40} priority data-ai-hint="monogram letter M" />
            {/* "Mendspace" text is now always visible */}
            <span>Mendspace</span>
          </Link>
        </div>

        {/* Right: User Actions */}
        <div className="flex-shrink-0 flex items-center gap-3 sm:gap-4">
          {!loading && user ? (
            pathname === '/home' ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                      <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-amber-100 border-amber-200" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal text-amber-800">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.displayName || "User"}
                      </p>
                      {user.email && (
                        <p className="text-xs leading-none text-amber-700">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-amber-300" />
                  <DropdownMenuItem 
                    onSelect={signOut} 
                    className="cursor-pointer text-amber-800 hover:!bg-red-200 hover:!text-red-700 focus:!bg-red-200 focus:!text-red-700"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <SignOutButton />
            )
          ) : null}
          {!loading && !user && (
            <Button asChild variant="outline" className="shadow-sm hover:shadow-md">
              <Link href="/signin">
                <LogIn className="mr-2 h-4 w-4" /> Sign In
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
