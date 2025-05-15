
"use client";

import React from 'react';
import { PaginatedTableSection } from '@/components/submissions/PaginatedTableSection';

export default function SubmissionsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-gray-700 dark:text-gray-300">All Submissions</h1>
        <p className="text-muted-foreground">
          View entries from Sayantan and Ashmi. Each section shows 5 entries per page.
        </p>
      </div>
      
      <PaginatedTableSection 
        participantSignature="Sayantan" 
        title="Sayantan’s Submissions" 
      />
      
      <PaginatedTableSection 
        participantSignature="Ashmi" 
        title="Ashmi’s Submissions" 
      />
    </div>
  );
}
