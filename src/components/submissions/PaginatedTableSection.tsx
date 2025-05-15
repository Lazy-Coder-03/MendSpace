
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
  if (!timestamp) return 'N/A';
  return format(timestamp.toDate(), 'PPpp');
};

interface PaginatedTableSectionProps {
  participantSignature: string; // This will now be the first name
  title: string;
}

export function PaginatedTableSection({ participantSignature, title }: PaginatedTableSectionProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [firstVisibleDoc, setFirstVisibleDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);


  const fetchSubmissions = useCallback(async (direction: 'initial' | 'next' | 'prev' = 'initial') => {
    setIsLoading(true);
    setError(null);
    
    console.log(`Fetching submissions for: ${participantSignature} (first name), direction: ${direction}, currentPage: ${currentPage}`);

    try {
      // Query for signatures that start with the participantSignature (first name)
      // This requires an index on `signature` (ascending) and `createdAt` (descending).
      // Firestore error message will provide a link if the index is missing.
      const constraints: QueryConstraint[] = [
        where('signature', '>=', participantSignature),
        where('signature', '<=', participantSignature + '\uf8ff'), // '\uf8ff' is a high Unicode character for "starts with"
        orderBy('signature', 'asc'), // Primary order by signature for the range scan
        orderBy('createdAt', 'desc') // Secondary order by creation time
      ];

      if (direction === 'next' && lastVisibleDoc) {
        constraints.push(startAfter(lastVisibleDoc));
        constraints.push(limit(SUBMISSIONS_PER_PAGE + 1));
      } else if (direction === 'prev' && firstVisibleDoc) {
         // For 'prev', we need to reverse the orderBy for createdAt to go backwards effectively
         // and use endBefore with limitToLast.
         // Firestore sorts ASC with limitToLast on a DESC primary sort, so this needs careful handling.
         // The primary sort is on 'signature', then 'createdAt'.
         // To go "previous" from a set sorted by `signature` ASC then `createdAt` DESC:
         // We need items whose `signature` is the same or less, and then `createdAt` is greater.
         // This gets complex. A simpler approach for "prev" is to re-query from the start and skip.
         // However, for true cursor-based "prev" with composite orders:
         constraints.pop(); // remove orderBy('createdAt', 'desc')
         constraints.pop(); // remove orderBy('signature', 'asc')
         constraints.push(orderBy('signature', 'desc')); // Reverse signature order
         constraints.push(orderBy('createdAt', 'asc'));   // Reverse createdAt order
         constraints.push(endBefore(firstVisibleDoc));
         constraints.push(limitToLast(SUBMISSIONS_PER_PAGE + 1));
      } else { // Initial load
        constraints.push(limit(SUBMISSIONS_PER_PAGE + 1));
      }
      
      const q = query(collection(db, 'submissions'), ...constraints);
      const querySnapshot = await getDocs(q);
      let fetchedDocs = querySnapshot.docs;
      
      console.log(`Fetched ${fetchedDocs.length} documents for ${participantSignature}`);

      let newSubmissionsData: Submission[];
      let newFirstDoc: QueryDocumentSnapshot<DocumentData> | null = null;
      let newLastDoc: QueryDocumentSnapshot<DocumentData> | null = null;
      let newHasNext = false;
      let newHasPrev = false;

      if (direction === 'prev') {
        // Docs are fetched in reverse order for 'prev', so reverse them back for display
        fetchedDocs = fetchedDocs.reverse();
        newHasPrev = fetchedDocs.length > SUBMISSIONS_PER_PAGE;
        newSubmissionsData = (newHasPrev ? fetchedDocs.slice(1) : fetchedDocs);
         // If we went back, there's usually a next page (current page we came from)
        newHasNext = newSubmissionsData.length > 0 || currentPage > 1; // More robust check for next
      } else { // 'initial' or 'next'
        newHasNext = fetchedDocs.length > SUBMISSIONS_PER_PAGE;
        newSubmissionsData = fetchedDocs.slice(0, SUBMISSIONS_PER_PAGE);
        newHasPrev = direction === 'next' || (direction === 'initial' && currentPage > 1) ; 
      }

      setSubmissions(newSubmissionsData);
      
      if (newSubmissionsData.length > 0) {
          newFirstDoc = newSubmissionsData[0]; // The actual first doc of the current page
          newLastDoc = newSubmissionsData[newSubmissionsData.length - 1]; // The actual last doc
      } else { // No data fetched for this page
        if (direction === 'prev' && currentPage > 1) {
            // Stayed on the same page logically, or went to an empty previous one
        } else if (direction === 'next') {
            newHasNext = false; // No more next pages
        } else if (direction === 'initial') {
            newHasNext = false;
            newHasPrev = false;
        }
      }
      
      setFirstVisibleDoc(newFirstDoc);
      setLastVisibleDoc(newLastDoc);
      setHasNextPage(newHasNext);

      if (direction === 'initial') {
        setHasPrevPage(false);
        setCurrentPage(1);
      } else if (direction === 'next') {
        if (newSubmissionsData.length > 0) setCurrentPage(prev => prev + 1);
        setHasPrevPage(true); // If we moved next, there's a previous
      } else if (direction === 'prev') {
        if (newSubmissionsData.length > 0) setCurrentPage(prev => Math.max(1, prev - 1));
        // hasPrevPage for 'prev' direction depends on if more were fetched than needed
        setHasPrevPage(newHasPrev);
      }


    } catch (err: any) {
      console.error(`Error fetching submissions for ${participantSignature}: `, err);
      let detailedError = `Failed to load submissions. Please try again. ${err.message}`;
      if (err.code === 'failed-precondition' && err.message.includes('index')) {
        const match = err.message.match(/(https:\/\/console\.firebase\.google\.com\/[^"]+)/);
        if (match && match[1]) {
          detailedError = `${detailedError} The query requires an index. You can create it here: ${match[1]}`;
        }
      }
      setError(detailedError);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantSignature, currentPage]); // Removed lastVisibleDoc, firstVisibleDoc dependency to avoid re-fetch loops. Navigation triggers fetch.

  useEffect(() => {
    fetchSubmissions('initial');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantSignature]); // Only re-fetch from initial if participantSignature changes


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
        <div className="flex justify-between items-center mt-6">
          <Button 
            onClick={() => fetchSubmissions('prev')} 
            disabled={!hasPrevPage || isLoading}
            variant="outline"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {currentPage}</span>
          <Button 
            onClick={() => fetchSubmissions('next')} 
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
