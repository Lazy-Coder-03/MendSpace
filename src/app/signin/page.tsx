
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup } from 'firebase/auth'; // Changed from signInWithRedirect
import { auth, googleProvider } from '@/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

// Simple SVG for Google icon
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2">
    <path fill="#4285F4" d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.19,4.73C14.03,4.73 15.69,5.36 16.95,6.57L19.05,4.48C17.19,2.72 14.84,1.73 12.19,1.73C6.67,1.73 2.5,6.15 2.5,12C2.5,17.85 6.67,22.27 12.19,22.27C17.62,22.27 21.5,18.33 21.5,12.33C21.5,11.76 21.45,11.43 21.35,11.1Z"/>
  </svg>
);


export default function SignInPage() {
  const { user, loading, isAllowedUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSigningIn, setIsSigningIn] = React.useState(false);

  useEffect(() => {
    if (!loading && user && isAllowedUser) {
      router.replace('/home');
    }
  }, [user, loading, isAllowedUser, router]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider); // Changed to signInWithPopup
      // After signInWithPopup resolves, onAuthStateChanged in FirebaseProvider
      // will handle the user state and potential redirect to /home.
    } catch (error: any) {
      if (error.code === 'auth/network-request-failed') {
        console.error(
          "Firebase Sign-In Error: Network request failed. This often indicates an issue with your internet connection, a firewall/proxy blocking Google's services, or a browser extension (like an ad blocker) interfering. Please check these and try again. Full error object:",
          error
        );
        toast({
          title: 'Sign In Failed: Network Issue',
          description: `A network request failed. Please check your internet connection, firewall, or browser extensions. (Code: ${error.code})`,
          variant: 'destructive',
        });
      } else if (error.code === 'auth/popup-closed-by-user') {
        console.warn("Google Sign-In was cancelled by the user or an external factor (e.g., popup blocker). This could also be due to Authorized Domain misconfiguration in Firebase project settings or browser extensions. Full error object:", error);
        // User closed popup or it was blocked - often no toast is needed for this specific case.
      } else if (error.code === 'auth/cancelled-popup-request') {
         console.warn("Google Sign-In popup request was cancelled (e.g., multiple popups). No error toast shown. Full error object:", error);
      } else {
        console.error("Google Sign-In with popup Error:", error);
        toast({
          title: 'Sign In Failed',
          description: `Error: ${error.message || 'Could not sign in with Google. Please try again.'} (Code: ${error.code || 'N/A'})`,
          variant: 'destructive',
        });
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  if (loading || (user && isAllowedUser)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-[var(--gradient-start-color)] to-[var(--gradient-end-color)]">
      <Card className="w-full max-w-md shadow-xl bg-card/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-6">
            <Image 
              src="/logo.png" 
              alt="Mendspace Logo" 
              width={185} 
              height={150} 
              className="rounded-md" 
              priority
            />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Welcome to Mendspace</CardTitle>
          <CardDescription className="text-muted-foreground pt-2">
            Please sign in with Google to continue. Access is restricted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleSignIn} 
            className="w-full text-base py-6 shadow-lg btn-primary-gradient" 
            variant="default"
            disabled={isSigningIn}
          >
            {isSigningIn ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {isSigningIn ? 'Opening Google Sign-In...' : 'Sign In with Google'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
