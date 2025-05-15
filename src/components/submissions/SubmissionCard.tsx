"use client";

import React, { useState } from 'react';
import type { Submission, EditableSubmissionFields } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { EditSubmissionDialog } from './EditSubmissionDialog';
import { Timestamp as FirestoreTimestamp, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { Edit, CheckCircle, Clock, UserCircle } from 'lucide-react';
import { format } from 'date-fns';

// Helper to format Firestore Timestamp
const formatTimestamp = (timestamp: FirestoreTimestamp | undefined, label: string = "Submitted"): string => {
  if (!timestamp) return `${label}: N/A`;
  return `${label}: ${format(timestamp.toDate(), 'MMM d, yyyy HH:mm')}`;
};

interface SubmissionCardProps {
  submission: Submission;
  onSubmissionUpdate: () => void; // Callback to refresh list after update
}

export function SubmissionCard({ submission, onSubmissionUpdate }: SubmissionCardProps) {
  const { user } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const canEdit = user?.uid === submission.uid;

  const handleSaveEdit = async (submissionId: string, data: EditableSubmissionFields) => {
    setIsSaving(true);
    try {
      const submissionRef = doc(db, 'submissions', submissionId);
      await updateDoc(submissionRef, {
        ...data,
        updatedAt: serverTimestamp() as any,
      });
      toast({ title: 'Success', description: 'Submission updated successfully.' });
      setIsEditDialogOpen(false);
      onSubmissionUpdate(); // Trigger list refresh
    } catch (error) {
      console.error('Error updating submission: ', error);
      toast({ title: 'Error', description: 'Failed to update submission.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Card className="mb-6 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl text-primary flex justify-between items-center">
            Entry by {submission.signature}
            {canEdit && (
              <Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(true)} className="text-primary hover:text-accent-foreground hover:bg-accent">
                <Edit className="h-5 w-5" />
                <span className="sr-only">Edit Submission</span>
              </Button>
            )}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground flex items-center space-x-4 pt-1">
            <span><UserCircle className="inline-block mr-1 h-4 w-4" />UID: {submission.uid.substring(0,8)}...</span>
            <span><Clock className="inline-block mr-1 h-4 w-4" />{formatTimestamp(submission.createdAt, "Created")}</span>
            {submission.updatedAt && <span><CheckCircle className="inline-block mr-1 h-4 w-4" />{formatTimestamp(submission.updatedAt, "Updated")}</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div><strong>Field 1:</strong> <span className="text-foreground/80">{submission.field1}</span></div>
          <div><strong>Field 2:</strong> <span className="text-foreground/80">{submission.field2}</span></div>
          <div><strong>Field 3:</strong> <span className="text-foreground/80">{submission.field3}</span></div>
          <div className="pt-2">
            <strong className="block mb-1">Comments:</strong>
            <p className="text-foreground/80 bg-muted/30 p-3 rounded-md border border-border/50 whitespace-pre-wrap">{submission.comments}</p>
          </div>
        </CardContent>
      </Card>

      {canEdit && (
        <EditSubmissionDialog
          submission={submission}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={(id, data) => handleSaveEdit(id, data, submission.signature)} // signature not changed on edit
          isLoading={isSaving}
        />
      )}
    </>
  );
}
