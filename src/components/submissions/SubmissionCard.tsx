
"use client";

import React, { useState } from 'react';
import type { Submission, EditableSubmissionFields } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button'; 
import { useAuth } from '@/hooks/useAuth';
import { EditSubmissionDialog } from './EditSubmissionDialog';
import { Timestamp as FirestoreTimestamp, doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2, CheckCircle, Clock, UserCircle, MessageSquareText, Heart, Shield, AlertTriangle, Edit3 } from 'lucide-react';
import { format } from 'date-fns';
import { 
  getField1DisplayLabel, 
  getField2DisplayLabel, 
  getField3DisplayLabel,
  getCommentsDisplayLabel,
  getOtherPerson
} from '@/lib/dynamicFields';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from '@/lib/utils';

const formatTimestamp = (timestamp: FirestoreTimestamp | undefined, label: string = "Submitted"): string => {
  if (!timestamp) return `${label}: N/A`;
  try {
    if (timestamp && typeof timestamp.toDate === 'function') {
      return `${label}: ${format(timestamp.toDate(), 'MMM d, yyyy HH:mm')}`;
    }
    if (timestamp instanceof Date) {
      return `${label}: ${format(timestamp, 'MMM d, yyyy HH:mm')}`;
    }
    console.warn("Invalid timestamp format for submission:", timestamp);
    return `${label}: Invalid Date`;
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return `${label}: Date Error`;
  }
};


interface SubmissionCardProps {
  submission: Submission;
  onSubmissionUpdate: () => void; 
}

export function SubmissionCard({ submission, onSubmissionUpdate }: SubmissionCardProps) {
  const { user } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const authorName = submission.displayName || submission.signature;
  
  const isCurrentUserAuthor = user?.uid === submission.uid;
  const otherPersonForThisSubmission = getOtherPerson(authorName);
  const isCurrentUserTheOtherPerson = user?.displayName?.toLowerCase().startsWith(otherPersonForThisSubmission.toLowerCase());

  // User can "edit" if they are the author OR if they are the "other person" (to add/edit defence)
  const canOpenEditDialog = isCurrentUserAuthor || (isCurrentUserTheOtherPerson && user?.uid !== submission.uid);
  const canDelete = isCurrentUserAuthor; // Only original author can delete


  const handleSaveEdit = async (submissionId: string, data: EditableSubmissionFields) => {
    setIsSaving(true);
    try {
      const submissionRef = doc(db, 'submissions', submissionId);
      const dataToUpdate: Partial<Submission> = {
        updatedAt: serverTimestamp() as any,
      };

      if (isCurrentUserAuthor) {
        dataToUpdate.field1 = data.field1;
        dataToUpdate.field2 = data.field2;
        dataToUpdate.comments = data.comments;
        // Author does not edit field3 in this flow
      } else if (isCurrentUserTheOtherPerson && user?.uid !== submission.uid) {
        dataToUpdate.field3 = data.field3;
        // Other person only edits field3
      } else {
        toast({ title: 'Error', description: 'You do not have permission to save these changes.', variant: 'destructive' });
        setIsSaving(false);
        return;
      }

      await updateDoc(submissionRef, dataToUpdate);
      toast({ 
        title: 'Success', 
        description: 'Submission updated successfully.',
        className: 'bg-green-100 border-green-400 text-green-700',
      });
      setIsEditDialogOpen(false);
      onSubmissionUpdate(); 
    } catch (error) {
      console.error('Error updating submission: ', error);
      toast({ title: 'Error', description: 'Failed to update submission.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!canDelete) {
      toast({ title: 'Error', description: 'You do not have permission to delete this submission.', variant: 'destructive' });
      return;
    }
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'submissions', submission.id));
      toast({ 
        title: 'Success', 
        description: 'Submission removed successfully.',
        className: 'bg-green-100 border-green-400 text-green-700',
      });
      onSubmissionUpdate(); 
    } catch (error) {
      console.error('Error removing submission: ', error);
      toast({ title: 'Error', description: 'Failed to remove submission.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="mb-6 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10 border border-primary/30">
                <AvatarImage src={submission.photoURL || undefined} alt={authorName} />
                <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl text-primary">
                Entry by {authorName}
              </CardTitle>
            </div>
            <div className="flex items-center space-x-1">
              {canOpenEditDialog && (
                <Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(true)} className="text-primary hover:text-accent-foreground hover:bg-accent">
                  <Edit3 className="h-5 w-5" /> {/* Changed icon to Edit3 for variety */}
                  <span className="sr-only">Edit or Add Defence</span>
                </Button>
              )}
              {canDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive/70 hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-5 w-5" />
                      <span className="sr-only">Remove Submission</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-yellow-100 border-yellow-300">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this submission.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel 
                        className="bg-[linear-gradient(to_right,hsl(120,70%,85%),hsl(150,70%,80%))] text-primary-foreground border-transparent hover:brightness-105 shadow-md hover:shadow-lg"
                      >
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteConfirm} 
                        disabled={isDeleting}
                        className="bg-[linear-gradient(to_right,hsl(0,85%,88%),hsl(25,85%,85%))] text-primary-foreground border-transparent hover:brightness-105 shadow-md hover:shadow-lg"
                      >
                        {isDeleting ? 'Removing...' : 'Yes, remove it'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
          <CardDescription className="text-xs text-muted-foreground flex items-center space-x-4 pt-1 mt-2">
            <span><UserCircle className="inline-block mr-1 h-4 w-4" />UID: {submission.uid.substring(0,8)}...</span>
            <span><Clock className="inline-block mr-1 h-4 w-4" />{formatTimestamp(submission.createdAt, "Created")}</span>
            {submission.updatedAt && <span><CheckCircle className="inline-block mr-1 h-4 w-4" />{formatTimestamp(submission.updatedAt, "Updated")}</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <strong className="flex items-center"><MessageSquareText className="h-4 w-4 mr-2 text-primary/80" />{getField1DisplayLabel(authorName)}:</strong> 
            <p className="text-foreground/80 pl-6 mt-1 whitespace-pre-wrap break-words">{submission.field1}</p>
          </div>
          <div>
            <strong className="flex items-center"><Heart className="h-4 w-4 mr-2 text-primary/80" />{getField2DisplayLabel(authorName)}:</strong> 
            <p className="text-foreground/80 pl-6 mt-1 whitespace-pre-wrap break-words">{submission.field2}</p>
          </div>
          { (submission.field3 || (isCurrentUserTheOtherPerson && user?.uid !== submission.uid)) && ( // Show if field3 has content OR if current user is other person (to prompt adding defence)
            <div>
              <strong className="flex items-center"><Shield className="h-4 w-4 mr-2 text-primary/80" />{getField3DisplayLabel(authorName)}:</strong> 
              <p className="text-foreground/80 pl-6 mt-1 whitespace-pre-wrap break-words">{submission.field3 || (isCurrentUserTheOtherPerson ? '(You can add your defence by clicking edit)' : 'N/A')}</p>
            </div>
          )}
          {submission.comments && (
            <div className="pt-2">
              <strong className="block mb-1">{getCommentsDisplayLabel()}:</strong>
              <p className="text-foreground/80 bg-muted/30 p-3 rounded-md border border-border/50 whitespace-pre-wrap break-words">{submission.comments}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {canOpenEditDialog && (
        <EditSubmissionDialog
          submission={submission}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={(id, data) => handleSaveEdit(id, data, user?.displayName || '')} 
          isLoading={isSaving}
        />
      )}
    </>
  );
}
