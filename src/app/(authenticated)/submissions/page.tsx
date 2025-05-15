
"use client";

import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp as FirestoreTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Submission } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from 'date-fns';
import { 
  getField1DisplayLabel, 
  getField2DisplayLabel, 
  getField3DisplayLabel,
  getCommentsDisplayLabel
} from '@/lib/dynamicFields';

// Helper to format Firestore Timestamp
const formatTimestamp = (timestamp: FirestoreTimestamp | undefined): string => {
  if (!timestamp) return 'N/A';
  return format(timestamp.toDate(), 'PPpp'); // e.g., Aug 21, 2024, 4:30:00 PM
};


const SubmissionsTable = ({ title, submissions, isLoading }: { title: string, submissions: Submission[], isLoading: boolean }) => {
  let submissionAuthorName = '';
  if (title.toLowerCase().includes('sayantan')) {
    submissionAuthorName = 'Sayantan';
  } else if (title.toLowerCase().includes('ashmi')) {
    submissionAuthorName = 'Ashmi';
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading submissions...</p>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <Alert className="my-4 border-primary/30 bg-primary/5">
        <Inbox className="h-5 w-5 text-primary" />
        <AlertTitle className="text-primary/90">It's Quiet Here</AlertTitle>
        <AlertDescription className="text-foreground/70">
          No submissions found for {title.replace("'s Submissions", "").replace("’s Submissions", "")} yet.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="mb-8 shadow-lg bg-card/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[200px] min-w-[150px]">{getField1DisplayLabel(submissionAuthorName)}</TableHead>
                <TableHead className="w-[200px] min-w-[150px]">{getField2DisplayLabel(submissionAuthorName)}</TableHead>
                <TableHead className="w-[200px] min-w-[150px]">{getField3DisplayLabel(submissionAuthorName)}</TableHead>
                <TableHead className="min-w-[200px]">{getCommentsDisplayLabel()}</TableHead>
                <TableHead className="w-[150px] min-w-[120px]">Signature</TableHead>
                <TableHead className="w-[200px] min-w-[180px]">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((sub) => (
                <TableRow key={sub.id} className="hover:bg-accent/50">
                  <TableCell className="font-medium truncate max-w-xs">{sub.field1}</TableCell>
                  <TableCell className="truncate max-w-xs">{sub.field2}</TableCell>
                  <TableCell className="truncate max-w-xs">{sub.field3}</TableCell>
                  <TableCell className="truncate max-w-md">{sub.comments || 'N/A'}</TableCell>
                  <TableCell className="text-muted-foreground">{sub.signature}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatTimestamp(sub.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};


export default function SubmissionsPage() {
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, 'submissions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const subs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
        setAllSubmissions(subs);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching submissions: ", err);
        setError("Failed to load submissions. Please try again later.");
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const sayantanSubmissions = allSubmissions.filter(sub => 
    (sub.displayName?.toLowerCase().startsWith('sayantan') || sub.signature?.toLowerCase().startsWith('sayantan'))
  );
  const ashmiSubmissions = allSubmissions.filter(sub => 
    (sub.displayName?.toLowerCase().startsWith('ashmi') || sub.signature?.toLowerCase().startsWith('ashmi'))
  );

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-gray-700 dark:text-gray-300">All Submissions</h1>
        <p className="text-muted-foreground">View entries from Sayantan and Ashmi.</p>
      </div>
      <SubmissionsTable title="Sayantan’s Submissions" submissions={sayantanSubmissions} isLoading={isLoading} />
      <SubmissionsTable title="Ashmi’s Submissions" submissions={ashmiSubmissions} isLoading={isLoading} />
    </div>
  );
}
