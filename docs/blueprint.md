# **App Name**: Mendspace

## Core Features:

- User Authentication: User authentication with Google Sign-In using Firebase Authentication, restricting access to only users with display names starting with 'Sayantan' or 'Ashmi'.
- Submission Form: Form submission page for users to input 'field1', 'field2', 'field3', and 'comments'. The 'signature' field is auto-filled with the logged-in user's name and saves all fields with a timestamp.
- Main Page Form Display: Display the submission form on the main page for the logged-in user.
- Submissions Tables Page: Display two tables on a separate page: 'Sayantan’s Submissions' and 'Ashmi’s Submissions', showing all entries with Field 1, Field 2, Field 3, Comments, Signature, and Timestamp. A friendly message appears if a table is empty.
- Previous Submissions Page: Previous Submissions page allowing logged-in users to view all past entries grouped by user and edit only their own submissions (field1, field2, field3, comments). Other users’ entries are view-only.

## Style Guidelines:

- Pastel pink and pastel blue gradient for the theme.
- Accent color: Soft lavender (#E6E6FA) to highlight interactive elements.
- Soft-modern fonts such as Poppins or Quicksand.
- Rounded corners and soft drop shadows to create a gentle, inviting interface.
- Smooth animations on button hover, page transitions, and submission confirmation.