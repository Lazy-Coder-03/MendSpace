
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
      const q = query(
        collection(db, 'submissions'),
        where('signature', '>=', participantFirstName),
        where('signature', '<=', participantFirstName + '\uf8ff'),
        orderBy('signature', 'asc'), // Required for range filter on signature
        orderBy('createdAt', 'desc'),
        limit(SUBMISSIONS_TO_SHOW)
      );
      const querySnapshot = await getDocs(q);
      const fetchedSubmissions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
      setSubmissions(fetchedSubmissions);
    } catch (err: any) {
      console.error(`Error fetching submissions for ${participantFirstName}: `, err);
      let detailedError = `Failed to load submissions. Please try again. ${err.message}`;
      if (err.code === 'failed-precondition' && err.message.includes('index')) {
        const match = err.message.match(/(https:\/\/console\.firebase\.google\.com\/[^"]+)/);
        if (match && match[1]) {
          detailedError = `The query requires an index: ${match[1]}. Please create this index in your Firebase console. It might take a few minutes to build. The required index likely involves 'signature' (ASC) and 'createdAt' (DESC).`;
        }
      }
      setError(detailedError);
      setSubmissions([]);
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
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[50px] text-center">#</TableHead>
                <TableHead className="w-[200px] min-w-[150px]">{getField1DisplayLabel(participantFirstName)}</TableHead>
                <TableHead className="w-[200px] min-w-[150px]">{getField2DisplayLabel(participantFirstName)}</TableHead>
                <TableHead className="w-[200px] min-w-[150px]">{getField3DisplayLabel(participantFirstName)}</TableHead>
                <TableHead className="min-w-[200px]">{getCommentsDisplayLabel()}</TableHead>
                <TableHead className="w-[150px] min-w-[120px]">Full Signature</TableHead>
                <TableHead className="w-[200px] min-w-[180px]">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((sub, index) => (
                <TableRow key={sub.id} className="hover:bg-accent/50">
                  <TableCell className="text-center font-medium">{index + 1}</TableCell>
                  <TableCell className="font-medium truncate max-w-xs">{sub.field1 || 'N/A'}</TableCell>
                  <TableCell className="truncate max-w-xs">{sub.field2 || 'N/A'}</TableCell>
                  <TableCell className="truncate max-w-xs">{sub.field3 || 'N/A'}</TableCell>
                  <TableCell className="truncate max-w-md">{sub.comments || 'N/A'}</TableCell>
                  <TableCell className="text-muted-foreground">{sub.signature || 'N/A'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatTimestamp(sub.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {submissions.length === SUBMISSIONS_TO_SHOW && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Showing the {SUBMISSIONS_TO_SHOW} most recent entries. For older entries, please see the "Previous Entries" page.
          </p>
        )}
      </CardContent>
    </Card>
  );
}


export default function SubmissionsPage() {
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
