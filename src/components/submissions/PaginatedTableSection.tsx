
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  endBefore,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData,
  Timestamp as FirestoreTimestamp,
  QueryConstraint,
  where,
  limitToLast
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Submission } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Inbox, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import {
  getField1DisplayLabel,
  getField2DisplayLabel,
  getField3DisplayLabel,
  getCommentsDisplayLabel
} from '@/lib/dynamicFields';

const SUBMISSIONS_PER_PAGE = 5;

const formatTimestamp = (timestamp: FirestoreTimestamp | undefined): string => {
  if (!timestamp || typeof timestamp.toDate !== 'function') {
    console.warn('Invalid timestamp received by formatTimestamp:', timestamp);
    return 'N/A';
  }
  try {
    return format(timestamp.toDate(), 'PPpp');
  } catch (e) {
    console.error('Error formatting timestamp:', e, timestamp);
    return 'N/A';
  }
};

interface PaginatedTableSectionProps {
  participantSignature: string; // This will now be the first name
  title: string;
}

export function PaginatedTableSection({ participantSignature, title }: PaginatedTableSectionProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [firstDocSnapshot, setFirstDocSnapshot] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [lastDocSnapshot, setLastDocSnapshot] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);


  const fetchSubmissionsData = useCallback(async (direction: 'initial' | 'next' | 'prev' = 'initial') => {
    setIsLoading(true);
    setError(null);
    
    // console.log(`PaginatedTableSection: Fetching for ${participantSignature}, direction: ${direction}, currentPage: ${currentPage}`);
    // if (direction === 'next' && lastDocSnapshot) console.log('Using lastDocSnapshot ID for startAfter:', lastDocSnapshot?.id);
    // if (direction === 'prev' && firstDocSnapshot) console.log('Using firstDocSnapshot ID for endBefore:', firstDocSnapshot?.id);

    try {
      // Firebase might require an index: signature (ASC), createdAt (ASC)
      // We query createdAt ASC and then reverse client-side for display.
      const constraints: QueryConstraint[] = [
        where('signature', '>=', participantSignature),
        where('signature', '<=', participantSignature + '\uf8ff'),
        orderBy('signature', 'asc'), // Must be the first orderBy if ranged on
        orderBy('createdAt', 'asc'), // Query ASC to match index, then reverse for UI
      ];

      if (direction === 'next' && lastDocSnapshot) {
        constraints.push(startAfter(lastDocSnapshot));
        constraints.push(limit(SUBMISSIONS_PER_PAGE + 1));
      } else if (direction === 'prev' && firstDocSnapshot) {
         constraints.push(endBefore(firstDocSnapshot));
         constraints.push(limitToLast(SUBMISSIONS_PER_PAGE + 1));
      } else { // Initial load
        constraints.push(limit(SUBMISSIONS_PER_PAGE + 1));
      }
      
      const q = query(collection(db, 'submissions'), ...constraints);
      const querySnapshot = await getDocs(q);
      let fetchedDocs = querySnapshot.docs; 
      
      // console.log(`PaginatedTableSection: Fetched ${fetchedDocs.length} raw documents for ${participantSignature}.`);

      let docsForCurrentPage: QueryDocumentSnapshot<DocumentData>[] = [];
      let newHasNext = false;
      let newHasPrev = false;

      if (direction === 'prev') {
        // When using limitToLast, Firestore returns documents in the specified orderBy.
        // If it's createdAt ASC, these are the *last N items* in ascending order.
        newHasPrev = fetchedDocs.length > SUBMISSIONS_PER_PAGE;
        docsForCurrentPage = newHasPrev ? fetchedDocs.slice(1) : fetchedDocs; // Oldest is at fetchedDocs[0]
      } else { // 'initial' or 'next'
        // Fetched in createdAt ASC order.
        newHasNext = fetchedDocs.length > SUBMISSIONS_PER_PAGE;
        docsForCurrentPage = newHasNext ? fetchedDocs.slice(0, -1) : fetchedDocs;
      }

      const newSubmissionsData = docsForCurrentPage.map(doc => {
        // console.log(`PaginatedTableSection: Mapping doc ID: ${doc.id}, Data signature: ${doc.data().signature}, createdAt: ${doc.data().createdAt?.toDate()}`);
        return { id: doc.id, ...doc.data() } as Submission;
      });

      // IMPORTANT: Reverse the array here to display newest first, as we queried oldest first
      newSubmissionsData.reverse();

      if (newSubmissionsData.length > 0) {
        setSubmissions(newSubmissionsData);
        // Snapshots must correspond to the order *before* client-side reversal if they are used for cursors
        // For createdAt ASC: firstDocSnapshot is the oldest, lastDocSnapshot is the newest of this batch.
        setFirstDocSnapshot(docsForCurrentPage[0]);
        setLastDocSnapshot(docsForCurrentPage[docsForCurrentPage.length - 1]);

        if (direction === 'initial') {
          setCurrentPage(1);
          setHasPrevPage(false);
          setHasNextPage(newHasNext);
        } else if (direction === 'next') {
          setCurrentPage(prev => prev + 1);
          setHasPrevPage(true);
          setHasNextPage(newHasNext);
        } else { // direction === 'prev'
          setCurrentPage(prev => Math.max(1, prev - 1));
          setHasPrevPage(newHasPrev); 
          setHasNextPage(true);    
        }
      } else { 
        setSubmissions([]); 
        setFirstDocSnapshot(null);
        setLastDocSnapshot(null);

        if (direction === 'initial') {
          setCurrentPage(1);
          setHasPrevPage(false);
          setHasNextPage(false);
        } else if (direction === 'next') {
          // Tried to go next, but page was empty. Current page does not change.
          // Or, if it should reset to page 1 if next fails, then: setCurrentPage(currentPage);
          setHasNextPage(false); 
        } else { // direction === 'prev'
          // Tried to go prev, but page was empty.
          // Current page should ideally reflect the failed attempt to go back.
          const targetPrevPage = Math.max(1, currentPage - 1);
          setCurrentPage(targetPrevPage);
          setHasPrevPage(targetPrevPage > 1 && newHasPrev); // Only true if targetPrevPage > 1 AND original newHasPrev was true
                                                             // Or more simply, set based on if we *could* have fetched something:
          setHasPrevPage(false); // Since this page is empty, cannot go further back from here.
          setHasNextPage(true); // The page we came from is still 'next' (unless it was the only page)
        }
      }
    } catch (err: any) {
      console.error(`PaginatedTableSection: Error fetching submissions for ${participantSignature}: `, err);
      let detailedError = `Failed to load submissions. Please try again. ${err.message}`;
      if (err.code === 'failed-precondition' && err.message.includes('index')) {
        const match = err.message.match(/(https:\/\/console\.firebase\.google\.com\/[^"]+)/);
        if (match && match[1]) {
          detailedError = `The query requires an index: ${match[1]}. Please create this index in your Firebase console. It might take a few minutes to build. The required index likely involves 'signature' (ASC) and 'createdAt' (ASC).`;
        }
      }
      setError(detailedError);
      setSubmissions([]); 
    } finally {
      setIsLoading(false);
    }
  }, [participantSignature, currentPage, firstDocSnapshot, lastDocSnapshot]); // Dependencies for useCallback


  useEffect(() => {
    // console.log(`PaginatedTableSection: Initial load effect for ${participantSignature}. Resetting state.`);
    setSubmissions([]);
    setFirstDocSnapshot(null);
    setLastDocSnapshot(null);
    setCurrentPage(1); 
    setHasNextPage(false); 
    setHasPrevPage(false); 
    fetchSubmissionsData('initial');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantSignature]); // Rerun only when participantSignature changes


  if (isLoading && submissions.length === 0 && currentPage === 1) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading {title}...</p>
      </div>
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
  
  if (submissions.length === 0 && !isLoading) {
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
              No submissions found for names starting with "{participantSignature}" yet.
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
                <TableHead className="w-[200px] min-w-[150px]">{getField1DisplayLabel(participantSignature)}</TableHead>
                <TableHead className="w-[200px] min-w-[150px]">{getField2DisplayLabel(participantSignature)}</TableHead>
                <TableHead className="w-[200px] min-w-[150px]">{getField3DisplayLabel(participantSignature)}</TableHead>
                <TableHead className="min-w-[200px]">{getCommentsDisplayLabel()}</TableHead>
                <TableHead className="w-[150px] min-w-[120px]">Signature</TableHead>
                <TableHead className="w-[200px] min-w-[180px]">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((sub, index) => (
                <TableRow key={sub.id} className="hover:bg-accent/50">
                  <TableCell className="text-center font-medium">{(currentPage - 1) * SUBMISSIONS_PER_PAGE + index + 1}</TableCell>
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
        <div className="flex justify-between items-center mt-6">
          <Button 
            onClick={() => fetchSubmissionsData('prev')} 
            disabled={!hasPrevPage || isLoading}
            variant="outline"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {currentPage}</span>
          <Button 
            onClick={() => fetchSubmissionsData('next')} 
            disabled={!hasNextPage || isLoading}
            variant="outline"
          >
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
         {isLoading && submissions.length > 0 && <div className="flex justify-center mt-2"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
      </CardContent>
    </Card>
  );
}

