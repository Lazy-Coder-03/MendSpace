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
import type { EditableSubmissionFields, Submission } from '@/lib/types';
import { Loader2, Send } from 'lucide-react';

const formSchema = z.object({
  field1: z.string().min(1, 'Field 1 is required.'),
  field2: z.string().min(1, 'Field 2 is required.'),
  field3: z.string().min(1, 'Field 3 is required.'),
  comments: z.string().min(1, 'Comments are required.'),
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
      // This should ideally not happen if AuthGuard is working
      console.error("User not available for submission");
      return;
    }
    await onSubmit(values, user.displayName);
    if (!isEditing) {
      form.reset(); // Reset form only on new submission
    }
  };

  return (
    <Card className="w-full shadow-xl bg-card/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-primary">{isEditing ? 'Edit Submission' : 'New Submission'}</CardTitle>
        <CardDescription>{isEditing ? 'Update your entry details below.' : 'Fill in the details for your new submission.'}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="field1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Field 1</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter value for Field 1" {...field} className="bg-background/70"/>
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
                  <FormLabel>Field 2</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter value for Field 2" {...field} className="bg-background/70"/>
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
                  <FormLabel>Field 3</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter value for Field 3" {...field} className="bg-background/70"/>
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
                  <FormLabel>Comments</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter your comments" {...field} className="min-h-[100px] bg-background/70"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>Signature</FormLabel>
              <Input value={user?.displayName || 'Loading...'} readOnly disabled className="bg-muted/50 cursor-not-allowed" />
            </FormItem>
            <Button type="submit" className="w-full py-3 text-base bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg" disabled={isLoading}>
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
