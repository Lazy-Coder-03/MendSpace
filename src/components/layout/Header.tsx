
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { LogIn, Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Navigation } from './Navigation';
import { useRouter, usePathname } from 'next/navigation'; // Added usePathname
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function Header() {
  const { user, loading, signOut } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const router = useRouter();
  // const pathname = usePathname(); // Not strictly needed if we show avatar dropdown on all auth pages

  // Easter egg state
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [easterEggActive, setEasterEggActive] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [showRedirectMessage, setShowRedirectMessage] = useState(false);

  const handleLinkClick = () => {
    setIsSheetOpen(false);
  };

  const handleLogoClick = (event: React.MouseEvent) => {
    if (easterEggActive) { 
      event.preventDefault();
      return;
    }

    const newClickCount = logoClickCount + 1;
    setLogoClickCount(newClickCount);

    if (newClickCount >= 5) {
      event.preventDefault(); 
      setEasterEggActive(true);
      setShowRedirectMessage(true);
      setCountdown(5);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (easterEggActive && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
      }, 1000);
    } else if (easterEggActive && countdown === 0) {
      router.push('https://drive.google.com/drive/folders/1QMxJFmkSkFO1egrtTD4HfeP25pTEp6SW?usp=sharing');
      setEasterEggActive(false);
      setShowRedirectMessage(false);
      setLogoClickCount(0); 
    }
    return () => clearInterval(timer);
  }, [easterEggActive, countdown, router]);


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
              className="w-[280px] sm:w-[320px] p-0 bg-[hsl(270,60%,75%)] border-r border-[hsl(270,60%,65%)] flex flex-col" 
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
              <Separator className="my-2 bg-[hsl(270,60%,65%)]" />
              <ScrollArea className="flex-grow p-4 overflow-y-auto">
                <Accordion type="multiple" className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-md font-semibold text-accent-foreground/90 hover:text-accent-foreground">
                      Terms and Conditions
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-xs leading-relaxed text-accent-foreground/80">
                        The parties involved do not intend on attack or blame or to defend , they just intend on vocalising their feelings. They intend on feeling heard , and their needs being met . Anybody’s feeling is not to be taken as an attack , as it is not, it's merely an unmet need.  Refrain from trying to fix your language or feeling, anything you feel is something you write .  Use of any language, to fill this is allowed . Both parties are required to fill this up after every argument/disagreement because they love each other and are willing to make this work.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger className="text-md font-semibold text-accent-foreground/90 hover:text-accent-foreground">
                      Rules
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="text-xs leading-relaxed text-accent-foreground/80 space-y-2">
                        <p>When making an entry, you will fill out:</p>
                        <ul className="list-disc list-inside pl-4">
                          <li>What the other person said or did.</li>
                          <li>What you felt in response.</li>
                          <li>Any additional comments (optional).</li>
                        </ul>
                        <p>The 'In Your Defence' field is to be filled out later by the other participant when they view the entry.</p>
                        <p>You can customise your table with any colour/font of your liking.</p>
                        <p>After an entry is complete (both sides shared), a discussion should follow where both parties are given space and time to feel justified and talk about things that bother them.</p>
                        <p>Entries should be made as soon as conveniently possible after a conflict or disagreement.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>

        {/* Center: Logo and App Name */}
        <div className="flex-1 flex justify-center">
          <Link 
            href="/home" 
            className="flex items-center gap-2 text-3xl font-bold text-primary hover:text-primary/80 transition-colors"
            onClick={handleLogoClick}
          >
            <Image src="/logo.png" alt="Mendspace Logo" width={49} height={40} priority data-ai-hint="monogram letter M" />
            {showRedirectMessage ? (
              <span className="text-xl sm:text-2xl">taking you back..... {countdown > 0 ? `${countdown}s` : ''}</span>
            ) : (
              <span>Mendspace</span>
            )}
          </Link>
        </div>

        {/* Right: User Actions */}
        <div className="flex-shrink-0 flex items-center gap-3 sm:gap-4">
          {!loading && user ? (
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

