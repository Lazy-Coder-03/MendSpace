
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  Timestamp as FirestoreTimestamp,
  where,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Submission, EditableSubmissionFields } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from 'date-fns';
import {
  getField1DisplayLabel,
  getField2DisplayLabel,
  getField3DisplayLabel,
  getCommentsDisplayLabel,
  getOtherPerson,
} from '@/lib/dynamicFields';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { EditSubmissionDialog } from '@/components/submissions/EditSubmissionDialog';
import { useToast } from '@/hooks/use-toast';

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
  const { user } = useAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSubmissionForEdit, setSelectedSubmissionForEdit] = useState<Submission | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, 'submissions'),
        where('signature', '>=', participantFirstName),
        where('signature', '<=', participantFirstName + '\uf8ff'),
        orderBy('signature', 'asc'),
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

  const handleOpenEditDialog = (submission: Submission) => {
    setSelectedSubmissionForEdit(submission);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (submissionId: string, data: EditableSubmissionFields) => {
    if (!user || !selectedSubmissionForEdit) return;
    setIsSavingEdit(true);
    try {
      const submissionRef = doc(db, 'submissions', submissionId);
      const dataToUpdate: Partial<Submission> = {
        updatedAt: serverTimestamp() as any,
      };

      const originalAuthorName = selectedSubmissionForEdit.displayName || selectedSubmissionForEdit.signature;
      const isCurrentUserTheOtherPersonForSelected = user.uid !== selectedSubmissionForEdit.uid && 
                                               user.displayName?.toLowerCase().startsWith(getOtherPerson(originalAuthorName).toLowerCase());

      if (isCurrentUserTheOtherPersonForSelected) {
        dataToUpdate.field3 = data.field3;
      } else {
         toast({ title: 'Permission Denied', description: 'You can only edit the defence for an entry you did not author.', variant: 'destructive' });
         setIsSavingEdit(false);
         return;
      }

      await updateDoc(submissionRef, dataToUpdate);
      toast({
        title: 'Success',
        description: 'Defence updated successfully.',
        className: 'bg-green-100 border-green-400 text-green-700',
      });
      setIsEditDialogOpen(false);
      setSelectedSubmissionForEdit(null);
      fetchSubmissions(); 
    } catch (error) {
      console.error('Error updating submission: ', error);
      toast({ title: 'Error', description: 'Failed to update defence.', variant: 'destructive' });
    } finally {
      setIsSavingEdit(false);
    }
  };


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
    <>
      <Card className="mb-8 shadow-lg bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
 <TableHead className="text-center border-r px-2 py-3 min-w-[50px]">#</TableHead>
 <TableHead className="border-r px-2 py-3 whitespace-pre-wrap break-words min-w-[150px] max-w-[250px]">{getField1DisplayLabel(participantFirstName)}</TableHead>
 <TableHead className="border-r px-2 py-3 whitespace-pre-wrap break-words min-w-[150px] max-w-[250px]">{getField2DisplayLabel(participantFirstName)}</TableHead>
 <TableHead className="border-r px-2 py-3 whitespace-pre-wrap break-words min-w-[150px] max-w-[250px]">{getField3DisplayLabel(participantFirstName)}</TableHead>
 <TableHead className="border-r px-2 py-3 whitespace-pre-wrap break-words min-w-[150px] max-w-[250px]">{getCommentsDisplayLabel()}</TableHead>
 <TableHead className="px-2 py-3 whitespace-pre-wrap break-words min-w-[160px]">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub, index) => {
                  const submissionAuthorName = sub.displayName || sub.signature;
                  const otherPersonName = getOtherPerson(submissionAuthorName);
                  const isCurrentUserTheOtherPerson = user &&
                    user.uid !== sub.uid &&
                    user.displayName?.toLowerCase().startsWith(otherPersonName.toLowerCase());

                  return (
                    <TableRow key={sub.id} className="hover:bg-accent/50">
                      <TableCell className="text-center font-medium border-r px-2 py-3 min-w-[50px]">{index + 1}</TableCell>
                      <TableCell className="font-medium whitespace-pre-wrap break-words border-r px-2 py-3 min-w-[150px] max-w-[250px]">{sub.field1 || 'N/A'}</TableCell>
                      <TableCell className="whitespace-pre-wrap break-words border-r px-2 py-3 min-w-[150px] max-w-[250px]">{sub.field2 || 'N/A'}</TableCell>
                      <TableCell
                        className={cn(
                          "whitespace-pre-wrap break-words border-r px-2 py-3",
                          isCurrentUserTheOtherPerson && "cursor-pointer hover:bg-accent/70 focus:bg-accent/70"
                        )}
                        onClick={() => {
                          if (isCurrentUserTheOtherPerson) {
                            handleOpenEditDialog(sub);
                          }
                        }}
                        tabIndex={isCurrentUserTheOtherPerson ? 0 : -1}
                        onKeyDown={(e) => {
                          if (isCurrentUserTheOtherPerson && (e.key === 'Enter' || e.key === ' ')) {
                            handleOpenEditDialog(sub);
                          }
                        }}
                      >
                        {sub.field3 || (isCurrentUserTheOtherPerson ? '(Click to add defence)' : 'N/A')}
                      </TableCell>
                      <TableCell className="whitespace-pre-wrap break-words border-r px-2 py-3 min-w-[150px] max-w-[250px]">{sub.comments || 'N/A'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-pre-wrap break-words px-2 py-3 min-w-[160px]">{formatTimestamp(sub.createdAt)}</TableCell>
                    </TableRow>
                  );
                })}
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
      {selectedSubmissionForEdit && isEditDialogOpen && user && (
        <EditSubmissionDialog
          submission={selectedSubmissionForEdit}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={(id, data) => handleSaveEdit(id, data)}
          isLoading={isSavingEdit}
        />
      )}
    </>
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
