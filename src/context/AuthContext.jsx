import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore";
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
        localStorage.removeItem("lastActivity");
        return signInWithEmailAndPassword(auth, email, password);
    }

    function logout() {
        localStorage.removeItem("lastActivity");
        return signOut(auth);
    }

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    console.log("Auth State Changed: User logged in", user.email, "UID:", user.uid);

                    // 1. Try to fetch by UID (best practice for rules)
                    const userDocRef = doc(db, "users", user.uid);
                    let userFound = false;
                    try {
                        const userDoc = await getDoc(userDocRef);
                        if (userDoc.exists()) {
                            const data = userDoc.data();
                            user.role = data.role;
                            user.dbId = userDoc.id;
                            console.log("User document found by UID. Role:", user.role);
                            userFound = true;
                        }
                    } catch (uidErr) {
                        console.warn("Could not fetch user by UID (this is normal if UID is not document ID):", uidErr.message);
                    }

                    if (!userFound) {
                        // 2. Fallback to query by email
                        const userEmail = user.email.toLowerCase();
                        console.log("Attempting query by email:", userEmail);
                        const q = query(collection(db, "users"), where("email", "==", userEmail));
                        const querySnapshot = await getDocs(q);

                        if (!querySnapshot.empty) {
                            const userDoc = querySnapshot.docs[0].data();
                            user.role = userDoc.role;
                            user.dbId = querySnapshot.docs[0].id;
                            console.log("User document found by email query. Role:", user.role);
                            userFound = true;
                        } else {
                            // Try exact match Case Sensitive
                            console.log("No match for lowercase. Trying exact match:", user.email);
                            const q2 = query(collection(db, "users"), where("email", "==", user.email));
                            const qs2 = await getDocs(q2);
                            if (!qs2.empty) {
                                const userDoc = qs2.docs[0].data();
                                user.role = userDoc.role;
                                user.dbId = qs2.docs[0].id;
                                console.log("User document found by exact email query. Role:", user.role);
                                userFound = true;
                            }
                        }
                    }

                    if (!userFound) {
                        console.warn("No user document found in Firestore for email:", user.email);
                        user.role = "Viewer";
                        console.log("Defaulting to role:", user.role);
                    }
                } catch (error) {
                    console.error("CRITICAL: Error fetching user role from Firestore:", error);
                    // If it's a permission error on the USERS collection, we are in trouble
                    if (error.code === 'permission-denied') {
                        console.error("FATAL: Permission denied to read 'users' collection. Please check your Firestore Rules.");
                    }
                    user.role = "Viewer";
                    console.log("Defaulting to role due to error:", user.role);
                }
            }
            // Use a shallow copy to ensure React detects the property changes (role, dbId)
            setCurrentUser(user ? { ...user, role: user.role, dbId: user.dbId } : null);
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
