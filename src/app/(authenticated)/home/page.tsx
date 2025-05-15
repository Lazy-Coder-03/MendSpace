
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

  const handleNewSubmission = async (data: Omit<NewSubmission, 'uid' | 'displayName' | 'signature' | 'createdAt'>, signature: string) => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to submit.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const submissionData: NewSubmission = {
        ...data,
        uid: user.uid,
        displayName: user.displayName || 'Anonymous',
        signature: signature,
        createdAt: serverTimestamp() as any, // Firestore will convert this
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

  return (
    <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-primary">
            Welcome, <span className="font-semibold">{user.displayName}</span>!
        </h1>
        <p className="text-lg text-muted-foreground mb-10 text-center">
            Ready to share something new? Fill out the form below.
        </p>
      <SubmissionForm onSubmit={handleNewSubmission} isLoading={isLoading} />
    </div>
  );
}

    