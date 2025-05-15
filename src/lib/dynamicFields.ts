// src/lib/dynamicFields.ts
'use server';

export const getOtherPerson = (name?: string | null): string => {
  if (!name) return 'Other';
  if (name.toLowerCase().startsWith('sayantan')) return 'Ashmi';
  if (name.toLowerCase().startsWith('ashmi')) return 'Sayantan';
  return 'Other'; // Fallback
};

// For SubmissionForm (context: current logged-in user)
export const getField1LabelForm = (currentUserDisplayName?: string | null): string => `What ${getOtherPerson(currentUserDisplayName)} Said`;
export const getField1PlaceholderForm = (currentUserDisplayName?: string | null): string => `Describe what ${getOtherPerson(currentUserDisplayName)} stated or did.`;

export const getField2LabelForm = (): string => "What You Felt";
export const getField2PlaceholderForm = (): string => "Describe your emotions and reactions in response.";

export const getField3LabelForm = (currentUserDisplayName?: string | null): string => `In Defence of ${getOtherPerson(currentUserDisplayName)}`;
export const getField3PlaceholderForm = (currentUserDisplayName?: string | null): string => `Try to explain ${getOtherPerson(currentUserDisplayName)}'s perspective or actions, seeing it from their side.`;

export const getCommentsLabelForm = (): string => "Comments (Optional)";
export const getCommentsPlaceholderForm = (): string => "Any additional thoughts, context, or reflections?";


// For SubmissionCard and SubmissionsTable (context: the author of the submission)
export const getField1DisplayLabel = (submissionAuthorName?: string | null): string => `What ${getOtherPerson(submissionAuthorName)} Said`;
export const getField2DisplayLabel = (submissionAuthorName?: string | null): string => `What ${submissionAuthorName || 'They'} Felt`;
export const getField3DisplayLabel = (submissionAuthorName?: string |null): string => `In Defence of ${getOtherPerson(submissionAuthorName)}`;
export const getCommentsDisplayLabel = (): string => "Comments";
