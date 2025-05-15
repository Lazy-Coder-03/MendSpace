
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Validate essential environment variables
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

if (!apiKey) {
  throw new Error(
    "Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is missing. " +
    "Please ensure it is set in your environment variables. " +
    "For local development, you can create a .env.local file in the root of your project and add NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here. " +
    "You can find this key in your Firebase project settings (Project Overview > Project settings > General). " +
    "The application cannot initialize Firebase without it."
  );
}

if (!projectId) {
  throw new Error(
    "Firebase Project ID (NEXT_PUBLIC_FIREBASE_PROJECT_ID) is missing. " +
    "Please ensure it is set in your environment variables. " +
    "For local development, add NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here to your .env.local file. " +
    "You can find this ID in your Firebase project settings (Project Overview > Project settings > General). " +
    "The application cannot initialize Firebase without it."
  );
}

// Warn if other potentially important variables are missing, but don't necessarily throw
if (!authDomain) {
  console.warn(
    "Firebase Auth Domain (NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) is missing. " +
    "This is usually your_project_id.firebaseapp.com. " +
    "Firebase Authentication might not function correctly without it. Consider adding it to your .env.local file."
  );
}


const firebaseConfig: FirebaseOptions = {
  apiKey: apiKey,
  authDomain: authDomain,
  projectId: projectId,
  storageBucket: storageBucket,
  messagingSenderId: messagingSenderId,
  appId: appId,
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };

