import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if config is valid (at least apiKey and projectId)
const isConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

let app;
let auth;
let db;

if (isConfigured) {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
    } catch (error) {
        console.error("Firebase initialization error:", error);
        // Fallback to avoid crash on import
        app = null;
        auth = null;
        db = null;
    }
} else {
    console.warn("Firebase configuration missing. App will not function correctly.");
}

export { auth, db, isConfigured, firebaseConfig };
export default app;
