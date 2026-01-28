import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getAnalytics, Analytics } from "firebase/analytics";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBKAUehtjOJexxCi065jbYH2RtMUhgiW-I",
  authDomain: "montron-solutions.firebaseapp.com",
  projectId: "montron-solutions",
  storageBucket: "montron-solutions.firebasestorage.app",
  messagingSenderId: "796309691546",
  appId: "1:796309691546:web:79b58686dfca216f0f5323",
  measurementId: "G-WZWF03Q54Y"
};

// Initialize Firebase App
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Auth (for web, default persistence is fine)
const auth = getAuth(app);

// Ensure auth is properly initialized
if (typeof window !== "undefined") {
  // Set language to German for error messages
  auth.languageCode = "de";
}

// Initialize Analytics (only in browser environment)
let analytics: Analytics | undefined;
if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    // Analytics initialization can fail in development or if already initialized
    console.warn("Firebase Analytics initialization failed:", error);
  }
}

export { app, auth, analytics };
