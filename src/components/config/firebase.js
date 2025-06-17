import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDxDTuCpnhWaZuvLpnZpVvGvs7QvvgyQLA",
  authDomain: "final-project-5843f.firebaseapp.com",
  projectId: "final-project-5843f",
  storageBucket: "final-project-5843f.appspot.com",
  messagingSenderId: "886602518542",
  appId: "1:886602518542:web:0924413ae4e142d6da6c5f",
  measurementId: "G-5J2FD731ED"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);
auth.useDeviceLanguage();
auth.settings.appVerificationDisabledForTesting = false;

// Initialize Firestore
const db = getFirestore(app);

// Configure Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
  // Add any additional scopes you need
  scopes: ['profile', 'email']
});

export { auth, db, googleProvider };
