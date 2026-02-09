import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDMmM4RF-dZtQ57k65JWiiPxxqCfvGNNGk",
  authDomain: "app-tennis-6167a.firebaseapp.com",
  projectId: "app-tennis-6167a",
  storageBucket: "app-tennis-6167a.firebasestorage.app",
  messagingSenderId: "790338104802",
  appId: "1:790338104802:web:5e26fad38a63f9dc3b5dbb",
  measurementId: "G-Z130LHGBXV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export { app, auth, db, analytics };
