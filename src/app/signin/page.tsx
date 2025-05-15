
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup } from 'firebase/auth';
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
      console.log("Attempting Google Sign-In...");
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Google Sign-In successful for user:", result.user?.displayName, "(UID:", result.user?.uid, ")");
      // The AuthProvider's onAuthStateChanged will handle redirection and access checks.
    } catch (error: any) {
      console.error("Google Sign-In Error Raw:", error); 
      if (error.code === 'auth/popup-closed-by-user') {
        console.warn(
          "Google Sign-In: Firebase reported 'auth/popup-closed-by-user'. " +
          "This can happen if you manually closed the sign-in window, or more likely due to: \n" +
          "1. Browser extensions (like popup blockers or privacy tools).\n" +
          "2. Network issues or firewalls.\n" +
          "3. CRITICAL: Your Firebase project's 'Authorized Domains' list in the Firebase Console (Authentication -> Sign-in method) might not include the domain you are running this app from.\n" +
          "4. Other interference with the popup.\n" +
          "If you did not close it, please check your Firebase project's 'Authorized Domains' list first. Then, try disabling browser extensions or using an incognito window."
        );
        // No toast for this specific error, as it's often not a direct user fault or code bug.
      } else {
        console.error("Google Sign-In Error Processed: ", error.code, error.message);
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
              data-ai-hint="company logo monogram M"
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
            {isSigningIn ? 'Signing In...' : 'Sign In with Google'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

