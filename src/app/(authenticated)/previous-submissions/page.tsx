
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Submission } from '@/lib/types';
import { SubmissionCard } from '@/components/submissions/SubmissionCard';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Inbox, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export default function PreviousSubmissionsPage() {
  const { user } = useAuth();
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSubmissions = useCallback(() => {
    setIsLoading(true);
    const q = query(collection(db, 'submissions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const subs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
        setAllSubmissions(subs);
        setFilteredSubmissions(subs); 
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching submissions: ", err);
        setError("Failed to load submissions. Please try again later.");
        setIsLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = fetchSubmissions();
    return () => unsubscribe && unsubscribe();
  }, [fetchSubmissions]);

  useEffect(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = allSubmissions.filter(sub => 
      sub.field1.toLowerCase().includes(lowerSearchTerm) ||
      sub.field2.toLowerCase().includes(lowerSearchTerm) ||
      sub.field3.toLowerCase().includes(lowerSearchTerm) ||
      (sub.comments && sub.comments.toLowerCase().includes(lowerSearchTerm)) || // Check if comments exist
      sub.signature.toLowerCase().includes(lowerSearchTerm) ||
      (sub.displayName && sub.displayName.toLowerCase().includes(lowerSearchTerm))
    );
    setFilteredSubmissions(filtered);
  }, [searchTerm, allSubmissions]);

  const submissionsByUser: Record<string, Submission[]> = {};
  filteredSubmissions.forEach(sub => {
    const key = sub.displayName || sub.signature || 'Unknown User';
    if (!submissionsByUser[key]) {
      submissionsByUser[key] = [];
    }
    submissionsByUser[key].push(sub);
  });
  
  const handleSubmissionUpdate = () => {
    // onSnapshot should handle updates.
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading previous entries...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  // User edit permission check is handled within SubmissionCard now
  const userIsAdmin = user?.displayName?.toLowerCase().startsWith('sayantan') || user?.displayName?.toLowerCase().startsWith('ashmi');


  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-gray-700 dark:text-gray-300">Previous Submissions</h1>
        <p className="text-muted-foreground">
          Browse through all past entries. {userIsAdmin ? "You can edit your own." : "Entries are view-only for you."}
        </p>
      </div>

      <div className="relative mb-6">
        <Input 
          type="text"
          placeholder="Search entries by statements, feelings, defences, comments, or signature..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 py-3 text-base bg-card border-border/70 focus:border-primary focus:ring-primary"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      </div>

      {Object.keys(submissionsByUser).length === 0 && !isLoading && (
         <Alert className="my-4 border-primary/30 bg-primary/5">
            <Inbox className="h-5 w-5 text-primary" />
            <AlertTitle className="text-primary/90">No Entries Yet</AlertTitle>
            <AlertDescription className="text-foreground/70">
              {searchTerm ? `No submissions match your search criteria "${searchTerm}".` : "There are no submissions to display at the moment."}
            </AlertDescription>
        </Alert>
      )}

      {Object.entries(submissionsByUser).map(([userName, subs]) => (
        <div key={userName}>
          <h2 className="text-2xl font-semibold mb-6 pb-2 border-b-2 border-primary/30 text-primary">
            Entries by: <span className="font-bold">{userName}</span>
          </h2>
          {subs.map((sub) => (
            <SubmissionCard key={sub.id} submission={sub} onSubmissionUpdate={handleSubmissionUpdate} />
          ))}
        </div>
      ))}
    </div>
  );
}
