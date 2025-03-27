import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider} from "firebase/auth"
import {getFirestore} from "firebase/firestore"


const firebaseConfig = {
  apiKey: "AIzaSyDxDTuCpnhWaZuvLpnZpVvGvs7QvvgyQLA",
  authDomain: "final-project-5843f.firebaseapp.com",
  projectId: "final-project-5843f",
  storageBucket: "final-project-5843f.firebasestorage.app",
  messagingSenderId: "886602518542",
  appId: "1:886602518542:web:0924413ae4e142d6da6c5f",
  measurementId: "G-5J2FD731ED"
};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app)
export const auth = getAuth(app)
export { GoogleAuthProvider, signInWithPopup }
