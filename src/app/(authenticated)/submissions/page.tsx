
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  Timestamp as FirestoreTimestamp,
  where
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Submission } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from 'date-fns';
import {
  getField1DisplayLabel,
  getField2DisplayLabel,
  getField3DisplayLabel,
  getCommentsDisplayLabel
} from '@/lib/dynamicFields';

const SUBMISSIONS_TO_SHOW = 5;

const formatTimestamp = (timestamp: FirestoreTimestamp | undefined): string => {
  if (!timestamp || typeof timestamp.toDate !== 'function') {
    return 'N/A';
  }
  try {
    return format(timestamp.toDate(), 'PPpp');
  } catch (e) {
    return 'N/A';
  }
};

interface ParticipantSectionProps {
  participantFirstName: string;
  title: string;
}

function ParticipantSubmissionsSection({ participantFirstName, title }: ParticipantSectionProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Query for signatures that start with the participantFirstName
      const q = query(
        collection(db, 'submissions'),
        where('signature', '>=', participantFirstName),
        where('signature', '<=', participantFirstName + '\uf8ff'), // \uf8ff is a very high code point in Unicode
        orderBy('signature', 'asc'), // Necessary for the range filter on signature
        orderBy('createdAt', 'desc'),
        limit(SUBMISSIONS_TO_SHOW)
      );
      const querySnapshot = await getDocs(q);
      const fetchedSubmissions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
      setSubmissions(fetchedSubmissions);
    } catch (err: any) {
      console.error(`Error fetching submissions for ${participantFirstName}: `, err);
      let detailedError = `Failed to load submissions. Please try again. ${err.message}`;
      // Enhanced error message for missing index
      if (err.code === 'failed-precondition' && err.message.includes('index')) {
        const match = err.message.match(/(https:\/\/console\.firebase\.google\.com\/[^"]+)/);
        if (match && match[1]) {
          detailedError = `The query requires an index: ${match[1]}. Please create this index in your Firebase console. It might take a few minutes to build. The required index likely involves 'signature' (ASC) and 'createdAt' (DESC).`;
        }
      }
      setError(detailedError);
      setSubmissions([]); // Clear submissions on error
    } finally {
      setIsLoading(false);
    }
  }, [participantFirstName]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  if (isLoading) {
    return (
      <Card className="mb-8 shadow-lg bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Loading {title}...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-8 shadow-lg bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Submissions</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (submissions.length === 0) {
    return (
      <Card className="mb-8 shadow-lg bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="my-4 border-primary/30 bg-primary/5">
            <Inbox className="h-5 w-5 text-primary" />
            <AlertTitle className="text-primary/90">It's Quiet Here</AlertTitle>
            <AlertDescription className="text-foreground/70">
              No submissions found for names starting with "{participantFirstName}" yet.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8 shadow-lg bg-card/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border"> {/* This div allows horizontal scroll if content is still too wide */}
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[50px] text-center border-r">#</TableHead>
                <TableHead className="border-r whitespace-pre-wrap break-words">{getField1DisplayLabel(participantFirstName)}</TableHead>
                <TableHead className="border-r whitespace-pre-wrap break-words">{getField2DisplayLabel(participantFirstName)}</TableHead>
                <TableHead className="border-r whitespace-pre-wrap break-words">{getField3DisplayLabel(participantFirstName)}</TableHead>
                <TableHead className="border-r whitespace-pre-wrap break-words">{getCommentsDisplayLabel()}</TableHead>
                <TableHead className="w-[180px]">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((sub, index) => (
                <TableRow key={sub.id} className="hover:bg-accent/50">
                  <TableCell className="text-center font-medium border-r">{index + 1}</TableCell>
                  <TableCell className="font-medium whitespace-pre-wrap break-words border-r">{sub.field1 || 'N/A'}</TableCell>
                  <TableCell className="whitespace-pre-wrap break-words border-r">{sub.field2 || 'N/A'}</TableCell>
                  <TableCell className="whitespace-pre-wrap break-words border-r">{sub.field3 || 'N/A'}</TableCell>
                  <TableCell className="whitespace-pre-wrap break-words border-r">{sub.comments || 'N/A'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{formatTimestamp(sub.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {submissions.length === SUBMISSIONS_TO_SHOW && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Showing the {SUBMISSIONS_TO_SHOW} most recent entries. For older entries, please see the "All Entries" page.
          </p>
        )}
      </CardContent>
    </Card>
  );
}


export default function SubmissionsPage() {
  // Using only the first name for filtering
  const sayantanFirstName = "Sayantan";
  const ashmiFirstName = "Ashmi"; 

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-gray-700 dark:text-gray-300">Recent Submissions</h1>
        <p className="text-muted-foreground">
          Displaying the {SUBMISSIONS_TO_SHOW} most recent entries for names starting with "{sayantanFirstName}" and "{ashmiFirstName}".
        </p>
      </div>

      <ParticipantSubmissionsSection
        participantFirstName={sayantanFirstName}
        title={`${sayantanFirstName}’s Recent Submissions`}
      />

      <ParticipantSubmissionsSection
        participantFirstName={ashmiFirstName}
        title={`${ashmiFirstName}’s Recent Submissions`}
      />
    </div>
  );
}

