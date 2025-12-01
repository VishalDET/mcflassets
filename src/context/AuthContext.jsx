import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../services/firebase";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    function signup(email, password) {
        return createUserWithEmailAndPassword(auth, email, password);
    }

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function logout() {
        return signOut(auth);
    }

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Fetch user role from Firestore
                try {
                    // Query users collection for the email
                    // Note: This assumes emails are stored in lowercase or exact match
                    const q = query(collection(db, "users"), where("email", "==", user.email));
                    const querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                        const userDoc = querySnapshot.docs[0].data();
                        user.role = userDoc.role;
                        user.dbId = querySnapshot.docs[0].id;
                        console.log("User role found:", user.role);
                    } else {
                        console.log("No user document found for email:", user.email);
                        // Default role
                        user.role = "Viewer";
                    }
                } catch (error) {
                    console.error("Error fetching user role:", error);
                    user.role = "Viewer";
                }
            }
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // Session Timeout Logic (2 Hours)
    useEffect(() => {
        if (!currentUser) return;

        const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
        let timeoutId;

        const logoutUser = () => {
            console.log("Session expired due to inactivity.");
            logout();
            localStorage.removeItem("lastActivity");
            alert("Your session has expired due to inactivity. Please login again.");
        };

        const resetTimer = () => {
            if (!currentUser) return;

            localStorage.setItem("lastActivity", Date.now().toString());

            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(logoutUser, SESSION_TIMEOUT);
        };

        // Check for existing session on mount
        const lastActivity = localStorage.getItem("lastActivity");
        if (lastActivity) {
            const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
            if (timeSinceLastActivity > SESSION_TIMEOUT) {
                logoutUser();
                return;
            } else {
                // Resume timer with remaining time
                timeoutId = setTimeout(logoutUser, SESSION_TIMEOUT - timeSinceLastActivity);
            }
        } else {
            resetTimer();
        }

        // Event listeners to detect activity
        const events = ["mousedown", "keydown", "scroll", "touchstart"];
        const handleActivity = () => {
            // Throttle: only reset if we have a valid timer running or need to start one
            // We can just call resetTimer, but let's debounce slightly if needed. 
            // For simplicity and robustness, calling resetTimer is fine as it just clears/sets timeout.
            resetTimer();
        };

        events.forEach(event => window.addEventListener(event, handleActivity));

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            events.forEach(event => window.removeEventListener(event, handleActivity));
        };
    }, [currentUser]);

    const value = {
        currentUser,
        signup,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
