
"use client";

import React from 'react';
import { PaginatedTableSection } from '@/components/submissions/PaginatedTableSection';

export default function SubmissionsPage() {
  // IMPORTANT: Ensure these participantSignature values EXACTLY MATCH 
  // the 'signature' field stored in Firestore for these users.
  // This typically comes from user.displayName during submission.
  const sayantanSignature = "Sayantan Ghosh";
  // TODO: Update this with Ashmi's actual displayName used for signatures if different.
  const ashmiSignature = "Ashmi Ghosh"; 

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-gray-700 dark:text-gray-300">All Submissions</h1>
        <p className="text-muted-foreground">
          View entries from {sayantanSignature} and {ashmiSignature}. Each section shows 5 entries per page.
        </p>
      </div>
      
      <PaginatedTableSection 
        participantSignature={sayantanSignature} 
        title={`${sayantanSignature}’s Submissions`} 
      />
      
      <PaginatedTableSection 
        participantSignature={ashmiSignature} 
        title={`${ashmiSignature}’s Submissions`} 
      />
    </div>
  );
}
