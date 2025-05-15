"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { SubmissionForm } from './SubmissionForm';
import type { Submission, EditableSubmissionFields } from '@/lib/types';
import { Button } from '../ui/button';

interface EditSubmissionDialogProps {
  submission: Submission;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (submissionId: string, data: EditableSubmissionFields, signature: string) => Promise<void>;
  isLoading?: boolean;
}

export function EditSubmissionDialog({ submission, isOpen, onOpenChange, onSave, isLoading }: EditSubmissionDialogProps) {
  
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-primary">Edit Submission</DialogTitle>
          <DialogDescription>
            Make changes to your submission. Fields like signature and original timestamp will remain unchanged.
          </DialogDescription>
        </DialogHeader>
        
        <SubmissionForm 
          onSubmit={handleFormSubmit} 
          initialData={initialData} 
          isEditing={true}
          isLoading={isLoading}
        />
        {/* The submit button is part of SubmissionForm. If an external close button is needed: */}
        {/* <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
}
