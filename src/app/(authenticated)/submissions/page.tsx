
"use client";

import React from 'react';
import { PaginatedTableSection } from '@/components/submissions/PaginatedTableSection';

export default function SubmissionsPage() {
  // Use only the first name for filtering, as the query will be a "starts with"
  const sayantanFirstName = "Sayantan";
  const ashmiFirstName = "Ashmi"; 

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-gray-700 dark:text-gray-300">All Submissions</h1>
        <p className="text-muted-foreground">
          View entries starting with the name "{sayantanFirstName}" and "{ashmiFirstName}". Each section shows 5 entries per page.
        </p>
      </div>
      
      <PaginatedTableSection 
        participantSignature={sayantanFirstName} 
        title={`${sayantanFirstName}’s Submissions`} 
      />
      
      <PaginatedTableSection 
        participantSignature={ashmiFirstName} 
        title={`${ashmiFirstName}’s Submissions`} 
      />
    </div>
  );
}
