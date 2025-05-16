
"use client";

import React from 'react';
import { SubmissionForm } from '@/components/submissions/SubmissionForm';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { NewSubmission } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleNewSubmission = async (data: Omit<NewSubmission, 'uid' | 'displayName' | 'signature' | 'createdAt' | 'photoURL' | 'field3'>, signature: string) => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to submit.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      // field3 is intentionally omitted here as it's not part of the initial submission by the author
      const submissionData: NewSubmission = {
        field1: data.field1,
        field2: data.field2,
        comments: data.comments || '', // Ensure comments is an empty string if not provided
        field3: '', // Initialize field3 as empty; to be filled by the other person
        uid: user.uid,
        displayName: user.displayName || 'Anonymous',
        photoURL: user.photoURL || null,
        signature: signature,
        createdAt: serverTimestamp() as any, 
      };
      await addDoc(collection(db, 'submissions'), submissionData);
      toast({
        title: 'Submission Successful!',
        description: 'Your entry has been saved.',
        className: 'bg-green-100 border-green-400 text-green-700', 
      });
    } catch (error) {
      console.error('Error adding document: ', error);
      toast({ title: 'Submission Failed', description: 'Could not save your entry. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!user) {
    return ( 
      <Card className="m-auto mt-10 max-w-lg">
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>Please sign in to access this page.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const firstName = user.displayName?.split(' ')[0] || 'User';

  return (
    <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-center mb-8 space-x-3">
          <h1 className="text-4xl font-bold text-primary">
              Welcome, <span className="font-semibold">{firstName}</span>!
          </h1>
        </div>
        <p className="text-lg text-muted-foreground mb-10 text-center">
            Ready to share something new? Fill out the form below.
        </p>
      <SubmissionForm 
        onSubmit={handleNewSubmission as any} // Cast as any because the form data type for new submissions won't include field3
        isLoading={isLoading} 
        originalAuthorDisplayName={user.displayName} // For consistency, though not strictly needed for new form
      />
    </div>
  );
}
