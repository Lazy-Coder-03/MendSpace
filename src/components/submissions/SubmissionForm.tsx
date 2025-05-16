
"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import type { EditableSubmissionFields } from '@/lib/types';
import { Loader2, Send, Edit3, ShieldCheck } from 'lucide-react';
import { 
  getField1LabelForm, getField1PlaceholderForm,
  getField2LabelForm, getField2PlaceholderForm,
  getField3LabelForm_Edit, getField3PlaceholderForm_Edit,
  getCommentsLabelForm, getCommentsPlaceholderForm,
  getOtherPerson
} from '@/lib/dynamicFields';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  field1: z.string().min(1, 'This field is required.'),
  field2: z.string().min(1, 'This field is required.'),
  field3: z.string().optional(), // Now optional for everyone
  comments: z.string().optional(),
});

type SubmissionFormValues = z.infer<typeof formSchema>;

interface SubmissionFormProps {
  onSubmit: (data: SubmissionFormValues, signature: string) => Promise<void>;
  initialData?: EditableSubmissionFields;
  isEditing?: boolean;
  isLoading?: boolean;
  originalAuthorUid?: string; 
  originalAuthorDisplayName?: string | null; 
}

export function SubmissionForm({ 
  onSubmit, 
  initialData, 
  isEditing = false, 
  isLoading = false,
  originalAuthorUid,
  originalAuthorDisplayName
}: SubmissionFormProps) {
  const { user } = useAuth();

  const form = useForm<SubmissionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      field1: '',
      field2: '',
      field3: '',
      comments: '',
    },
  });
  
  React.useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);


  const handleSubmit = async (values: SubmissionFormValues) => {
    if (!user || !user.displayName) {
      console.error("User not available for submission");
      return;
    }
    await onSubmit(values, user.displayName); 
    if (!isEditing) { 
      form.reset({ field1: '', field2: '', field3: '', comments: '' }); 
    }
  };

  const inDialog = isEditing; 
  const isCurrentUserTheOriginalAuthor = isEditing && user?.uid === originalAuthorUid;
  const otherPersonForThisSubmission = getOtherPerson(originalAuthorDisplayName);
  const isCurrentUserTheOtherPerson = isEditing && user?.displayName?.toLowerCase().startsWith(otherPersonForThisSubmission.toLowerCase()) && user?.uid !== originalAuthorUid;

  const canEditMainFields = !isEditing || isCurrentUserTheOriginalAuthor; 
  const canEditDefenceField = isEditing && isCurrentUserTheOtherPerson; 

  const labelClasses = inDialog ? "text-neutral-700" : "text-foreground/90";
  const getTextInputClasses = (isDisabled: boolean) => 
    cn(
      inDialog 
        ? "bg-white min-h-[100px] border-2 border-black text-black placeholder:text-neutral-500 focus-visible:ring-neutral-400" 
        : "bg-input min-h-[100px]",
      isDisabled && "opacity-70 cursor-not-allowed bg-neutral-100 dark:bg-neutral-800"
    );
    
  const signatureInputClasses = inDialog
    ? "bg-neutral-100 cursor-not-allowed border-2 border-black text-black opacity-70 focus-visible:ring-neutral-400"
    : "bg-muted/50 cursor-not-allowed";

  let submitButtonText = isEditing ? 'Update Entry' : 'Submit Entry';
  let SubmitIcon = isEditing ? Edit3 : Send;

  if (isCurrentUserTheOriginalAuthor && isEditing) {
    submitButtonText = 'Update Your Entry';
    SubmitIcon = Edit3;
  } else if (isCurrentUserTheOtherPerson && isEditing) {
    submitButtonText = 'Save Defence';
    SubmitIcon = ShieldCheck;
  }


  return (
    <Card className={`w-full shadow-xl ${inDialog ? 'bg-transparent border-0 shadow-none' : 'bg-card/90 backdrop-blur-sm'}`}>
      {!inDialog && ( 
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Share Your Feelings</CardTitle>
          <CardDescription className="text-muted-foreground">Fill in the details with honesty.</CardDescription>
        </CardHeader>
      )}
      <CardContent className={inDialog ? 'p-0' : ''}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="field1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClasses}>{getField1LabelForm(originalAuthorDisplayName || user?.displayName)}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={getField1PlaceholderForm(originalAuthorDisplayName || user?.displayName)} 
                      {...field} 
                      className={getTextInputClasses(!canEditMainFields)}
                      disabled={!canEditMainFields}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="field2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClasses}>{getField2LabelForm()}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={getField2PlaceholderForm()} 
                      {...field} 
                      className={getTextInputClasses(!canEditMainFields)}
                      disabled={!canEditMainFields}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {isEditing && ( 
              <FormField
                control={form.control}
                name="field3"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClasses}>
                      {getField3LabelForm_Edit(isCurrentUserTheOriginalAuthor, originalAuthorDisplayName)}
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={getField3PlaceholderForm_Edit(isCurrentUserTheOriginalAuthor, originalAuthorDisplayName)} 
                        {...field} 
                        className={getTextInputClasses(!canEditDefenceField)} 
                        disabled={!canEditDefenceField} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClasses}>{getCommentsLabelForm()}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={getCommentsPlaceholderForm()} 
                      {...field} 
                      className={getTextInputClasses(!canEditMainFields)}
                      disabled={!canEditMainFields}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel className={labelClasses}>{isEditing ? "Original Entry by" : "Your Signature"}</FormLabel>
              <Input 
                value={isEditing ? (originalAuthorDisplayName || 'Loading...') : (user?.displayName || 'Loading...')} 
                readOnly 
                disabled 
                className={signatureInputClasses} />
            </FormItem>
            
            <Button 
              type="submit" 
              variant="default" 
              className="w-full py-3 text-base shadow-lg" 
              disabled={isLoading || (isEditing && !canEditMainFields && !canEditDefenceField)} 
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <SubmitIcon className="mr-2 h-5 w-5" />
              )}
              {isLoading ? (isEditing ? (isCurrentUserTheOriginalAuthor ? 'Updating...' : 'Saving Defence...') : 'Submitting...') : submitButtonText}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

