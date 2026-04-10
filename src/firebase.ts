import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBXtumHzvEWCZ5lX4RMbY9bgXyGl4_SWRc",
  authDomain: "code-matrix-01.firebaseapp.com",
  projectId: "code-matrix-01",
  storageBucket: "code-matrix-01.firebasestorage.app",
  messagingSenderId: "157255206958",
  appId: "1:157255206958:web:ab7c2155c1e941be4e37bf",
  measurementId: "G-Z8W500P56W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
