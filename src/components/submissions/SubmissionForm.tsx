
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
import { Loader2, Send } from 'lucide-react';
import { 
  getField1LabelForm, getField1PlaceholderForm,
  getField2LabelForm, getField2PlaceholderForm,
  getField3LabelForm, getField3PlaceholderForm,
  getCommentsLabelForm, getCommentsPlaceholderForm
} from '@/lib/dynamicFields';

const formSchema = z.object({
  field1: z.string().min(1, 'This field is required.'),
  field2: z.string().min(1, 'This field is required.'),
  field3: z.string().min(1, 'This field is required.'),
  comments: z.string().optional(),
});

type SubmissionFormValues = z.infer<typeof formSchema>;

interface SubmissionFormProps {
  onSubmit: (data: SubmissionFormValues, signature: string) => Promise<void>;
  initialData?: EditableSubmissionFields;
  isEditing?: boolean;
  isLoading?: boolean;
}

export function SubmissionForm({ onSubmit, initialData, isEditing = false, isLoading = false }: SubmissionFormProps) {
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
      form.reset(); 
    }
  };

  return (
    <Card className="w-full shadow-xl bg-card/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-primary">{isEditing ? 'Edit Submission' : 'New Submission'}</CardTitle>
        <CardDescription className="text-muted-foreground">{isEditing ? 'Update your entry details below.' : 'Fill in the details for your new submission.'}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="field1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/90">{getField1LabelForm(user?.displayName)}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={getField1PlaceholderForm(user?.displayName)} {...field} className="bg-input min-h-[100px]"/>
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
                  <FormLabel className="text-foreground/90">{getField2LabelForm()}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={getField2PlaceholderForm()} {...field} className="bg-input min-h-[100px]"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="field3"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/90">{getField3LabelForm(user?.displayName)}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={getField3PlaceholderForm(user?.displayName)} {...field} className="bg-input min-h-[100px]"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/90">{getCommentsLabelForm()}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={getCommentsPlaceholderForm()} {...field} className="min-h-[100px] bg-input"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel className="text-foreground/90">Signature</FormLabel>
              <Input value={user?.displayName || 'Loading...'} readOnly disabled className="bg-muted/50 cursor-not-allowed" />
            </FormItem>
            <Button 
              type="submit" 
              variant="default" /* This will now apply the gradient */
              className="w-full py-3 text-base shadow-lg" 
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Send className="mr-2 h-5 w-5" />
              )}
              {isLoading ? (isEditing ? 'Updating...' : 'Submitting...') : (isEditing ? 'Update Submission' : 'Submit Entry')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

    