
"use client";

// src/lib/dynamicFields.ts

export const getOtherPerson = (name?: string | null): string => {
  if (!name) return 'Other';
  const lowerName = name.toLowerCase();
  if (lowerName.startsWith('sayantan')) return 'Ashmi';
  if (lowerName.startsWith('ashmi')) return 'Sayantan';
  return 'Other'; // Fallback
};

// For SubmissionForm (context: current logged-in user creating a new submission)
// field1 and field2 are part of the new submission form
export const getField1LabelForm = (currentUserDisplayName?: string | null): string => `What ${getOtherPerson(currentUserDisplayName)} Said`;
export const getField1PlaceholderForm = (currentUserDisplayName?: string | null): string => `Describe what ${getOtherPerson(currentUserDisplayName)} stated or did.`;

export const getField2LabelForm = (): string => "What You Felt";
export const getField2PlaceholderForm = (): string => "Describe your emotions and reactions in response.";

// For SubmissionForm (context: editing an existing submission)
// field3 is only editable by the "other person", not the original author in this form
export const getField3LabelForm_Edit = (
  isCurrentUserAuthor: boolean,
  originalAuthorDisplayName?: string | null
): string => {
  if (isCurrentUserAuthor) {
    // Author is viewing/editing their submission, field3 is for the other person's defence
    return `Defence by ${getOtherPerson(originalAuthorDisplayName)} (Optional, Read-Only for you)`;
  } else {
    // The "other person" is editing, adding their defence for the original author
    return `Your Defence of ${originalAuthorDisplayName || 'them'} (Optional)`;
  }
};
export const getField3PlaceholderForm_Edit = (
  isCurrentUserAuthor: boolean,
  originalAuthorDisplayName?: string | null
): string => {
  if (isCurrentUserAuthor) {
    return `This field is for ${getOtherPerson(originalAuthorDisplayName)} to fill.`;
  } else {
    return `Explain ${originalAuthorDisplayName || 'their'} perspective or actions, seeing it from their side. (Optional)`;
  }
};


export const getCommentsLabelForm = (): string => "Comments (Optional)";
export const getCommentsPlaceholderForm = (): string => "Any additional thoughts, context, or reflections?";


// For SubmissionCard and SubmissionsTable (context: the author of the submission)
export const getField1DisplayLabel = (submissionAuthorName?: string | null): string => `What ${getOtherPerson(submissionAuthorName)} Said`;
export const getField2DisplayLabel = (submissionAuthorName?: string | null): string => `What ${submissionAuthorName || 'They'} Felt`;
// For SubmissionCard, field3 is the defence of the "other person's" actions, written by the "other person"
export const getField3DisplayLabel = (submissionAuthorName?: string | null): string => `In Defence of ${getOtherPerson(submissionAuthorName)}`;
export const getCommentsDisplayLabel = (): string => "Comments";

