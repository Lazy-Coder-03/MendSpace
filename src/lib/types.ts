import type { Timestamp } from 'firebase/firestore';

export interface Submission {
  id: string;
  uid: string;
  displayName: string;
  photoURL?: string | null; // Added photoURL
  field1: string;
  field2: string;
  field3: string;
  comments: string;
  signature: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export type NewSubmission = Omit<Submission, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt?: Timestamp; // Optional for client-side creation before server timestamp
  photoURL?: string | null; // Added photoURL
};

export type EditableSubmissionFields = Pick<Submission, 'field1' | 'field2' | 'field3' | 'comments'>;
