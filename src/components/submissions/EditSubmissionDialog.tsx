
"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { SubmissionForm } from './SubmissionForm';
import type { Submission, EditableSubmissionFields } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { getOtherPerson } from '@/lib/dynamicFields';


interface EditSubmissionDialogProps {
  submission: Submission;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (submissionId: string, data: EditableSubmissionFields, signature: string) => Promise<void>;
  isLoading?: boolean;
}

export function EditSubmissionDialog({ submission, isOpen, onOpenChange, onSave, isLoading }: EditSubmissionDialogProps) {
  const { user } = useAuth();
  
  const handleFormSubmit = async (data: EditableSubmissionFields, signature: string) => {
    await onSave(submission.id, data, signature);
    // onOpenChange(false); // Optionally close dialog on successful save, can be handled by parent
  };

  const initialData: EditableSubmissionFields = {
    field1: submission.field1,
    field2: submission.field2,
    field3: submission.field3,
    comments: submission.comments,
  };

  const isCurrentUserAuthor = user?.uid === submission.uid;
  const originalAuthorName = submission.displayName || submission.signature;
  const otherPersonName = getOtherPerson(originalAuthorName);

  let dialogTitle = "Edit Entry";
  let dialogDescription = "Make changes to the entry.";

  if (isCurrentUserAuthor) {
    dialogTitle = "Edit Your Submission";
    dialogDescription = `Update your statements and comments. ${otherPersonName}'s defence will be read-only.`;
  } else {
    dialogTitle = `Add/Edit Defence`; // Changed this line
    dialogDescription = `You are adding or editing the defence for ${originalAuthorName}'s entry. Other fields are read-only.`;
  }


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-blue-200 border-border max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-black">{dialogTitle}</DialogTitle>
          <DialogDescription className="text-black">
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>
        
        <SubmissionForm 
          onSubmit={handleFormSubmit} 
          initialData={initialData} 
          isEditing={true}
          isLoading={isLoading}
          originalAuthorUid={submission.uid}
          originalAuthorDisplayName={originalAuthorName}
        />
      </DialogContent>
    </Dialog>
  );
}
