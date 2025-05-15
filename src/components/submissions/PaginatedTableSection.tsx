
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
  participantSignature: string;
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
    
    // Temporary log for debugging
    console.log(`Fetching submissions for: ${participantSignature}, direction: ${direction}, currentPage: ${currentPage}`);

    try {
      const constraints: QueryConstraint[] = [
        where('signature', '==', participantSignature),
        orderBy('createdAt', 'desc')
      ];

      if (direction === 'next' && lastVisibleDoc) {
        constraints.push(startAfter(lastVisibleDoc));
        constraints.push(limit(SUBMISSIONS_PER_PAGE + 1));
      } else if (direction === 'prev' && firstVisibleDoc) {
         constraints.pop(); // Remove the default orderBy('createdAt', 'desc')
         constraints.push(orderBy('createdAt', 'desc')); // Keep it desc for endBefore
         constraints.push(endBefore(firstVisibleDoc));
         constraints.push(limitToLast(SUBMISSIONS_PER_PAGE + 1)); // Fetch N+1 to check if there are more previous items
      } else { // Initial load
        constraints.push(limit(SUBMISSIONS_PER_PAGE + 1));
      }
      
      const q = query(collection(db, 'submissions'), ...constraints);
      const querySnapshot = await getDocs(q);
      const fetchedDocs = querySnapshot.docs;
      
      console.log(`Fetched ${fetchedDocs.length} documents for ${participantSignature}`);

      let newSubmissionsData: Submission[];
      let newFirstDoc: QueryDocumentSnapshot<DocumentData> | null = null;
      let newLastDoc: QueryDocumentSnapshot<DocumentData> | null = null;
      let newHasNext = false;
      let newHasPrev = false;


      if (direction === 'prev') {
        // Firestore returns docs in ascending order with limitToLast on a desc query. Reverse them.
        // Then slice if we fetched an extra one for hasPrevPage check.
        const mappedDocs = fetchedDocs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
        newHasPrev = fetchedDocs.length > SUBMISSIONS_PER_PAGE;
        newSubmissionsData = (newHasPrev ? mappedDocs.slice(1) : mappedDocs).reverse();
        newHasNext = true; // If we went back, there's usually a next page (current page we came from)
      } else { // 'initial' or 'next'
        newHasNext = fetchedDocs.length > SUBMISSIONS_PER_PAGE;
        newSubmissionsData = fetchedDocs.map(doc => ({ id: doc.id, ...doc.data() } as Submission)).slice(0, SUBMISSIONS_PER_PAGE);
        // For 'initial', prev is false. For 'next', prev is true.
        newHasPrev = direction === 'next'; 
      }


      setSubmissions(newSubmissionsData);
      
      if (newSubmissionsData.length > 0) {
        if (direction === 'prev') {
            // For prev, firstVisibleDoc is the first of the reversed newSubmissionsData
            // and lastVisibleDoc is the last of the reversed newSubmissionsData
            newFirstDoc = fetchedDocs[newHasPrev ? 1 : 0]; // original first doc from potentially sliced set
            newLastDoc = fetchedDocs[fetchedDocs.length -1]; // original last doc
        } else {
            newFirstDoc = fetchedDocs[0];
            newLastDoc = fetchedDocs[newSubmissionsData.length - 1];
        }
      } else {
        if (direction === 'prev' && currentPage > 1) newHasPrev = false;
        if (direction === 'next') newHasNext = false;
        if (direction === 'initial') {
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
        setHasPrevPage(true);
        setCurrentPage(prev => prev + 1);
      } else if (direction === 'prev') {
        setHasPrevPage(newHasPrev); // Determined by query result
        setCurrentPage(prev => Math.max(1, prev - 1));
      }


    } catch (err: any) {
      console.error(`Error fetching submissions for ${participantSignature}: `, err);
      setError(`Failed to load submissions. Please try again. ${err.message}`);
      // If it's an index error, provide the link
      if (err.code === 'failed-precondition' && err.message.includes('index')) {
        // Extract the index creation URL from the error message if possible
        const match = err.message.match(/(https:\/\/console\.firebase\.google\.com\/project\/[^/]+\/firestore\/indexes\?create_composite=[a-zA-Z0-9%_=-]+)/);
        if (match && match[1]) {
          setError(prevError => `${prevError} The query requires an index. You can create it here: ${match[1]}`);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [participantSignature, currentPage]); // Removed lastVisibleDoc, firstVisibleDoc to avoid re-fetching on their change if currentPage is the source of truth for navigation trigger

  useEffect(() => {
    fetchSubmissions('initial');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantSignature]);


  if (isLoading && submissions.length === 0 && currentPage === 1) { // Show initial loader only
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
              No submissions found for {participantSignature} yet.
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
