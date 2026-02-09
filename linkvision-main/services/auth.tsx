import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    User,
    signOut,
    signInWithPopup,
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    signInWithRedirect,
    getRedirectResult
} from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';

interface UserData {
    status?: 'active' | 'em analise' | 'blocked';
    [key: string]: any;
}

interface AuthContextType {
    user: User | null;
    userData: UserData | null;
    loading: boolean;
    loginWithGoogle: () => Promise<void>;
    loginWithEmail: (email: string, pass: string, remember: boolean) => Promise<void>;
    signupWithEmail: (name: string, email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    isTrialActive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isTrialActive, setIsTrialActive] = useState(false);

    useEffect(() => {
        let unsubDoc: (() => void) | undefined;

        const unsubscribe = onAuthStateChanged(auth, (authUser) => {
            setUser(authUser);

            // Cleanup previous document listener if exists
            if (unsubDoc) {
                unsubDoc();
                unsubDoc = undefined;
            }

            if (authUser) {
                // Calculate trial active state
                const creationTime = authUser.metadata.creationTime;
                if (creationTime) {
                    const createdDate = new Date(creationTime).getTime();
                    const now = new Date().getTime();
                    const diffDays = (now - createdDate) / (1000 * 60 * 60 * 24);
                    setIsTrialActive(diffDays <= 15);
                } else {
                    setIsTrialActive(false);
                }

                try {
                    const customerRef = doc(db, 'customers', authUser.uid);
                    unsubDoc = onSnapshot(customerRef, (docSnap) => {
                        if (docSnap.exists()) {
                            const data = docSnap.data() as UserData;
                            console.log("Fetched User Data from Firestore:", data);
                            setUserData(data);
                        } else {
                            console.log("User document does not exist in Firestore at:", customerRef.path);
                            setUserData({});
                        }
                        setLoading(false);
                    }, (error) => {
                        console.error("Firestore snapshot error:", error);
                        setUserData({});
                        setLoading(false);
                    });
                } catch (err) {
                    console.error("Error setting up listener:", err);
                    setUserData({});
                    setLoading(false);
                }
            } else {
                setUserData(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribe();
            if (unsubDoc) unsubDoc();
        };
    }, []);

    // NEW: Listen for Subscriptions and Payments subcollections to auto-activate
    useEffect(() => {
        let unsubSubs: (() => void) | undefined;
        let unsubPayments: (() => void) | undefined;

        if (user) {
            import('firebase/firestore').then(({ collection, query, where, onSnapshot }) => {
                // 1. Listen for Subscriptions (Active OR Canceled)
                try {
                    const subsRef = collection(db, 'customers', user.uid, 'subscriptions');
                    // Removed 'where' clause to listen to ALL changes
                    unsubSubs = onSnapshot(subsRef, (snapshot) => {
                        if (snapshot.empty) {
                            console.log("No subscriptions found.");
                            return;
                        }

                        // Check if ANY subscription is active
                        const hasActiveSub = snapshot.docs.some(doc => {
                            const data = doc.data();
                            return ['active', 'trialing'].includes(data.status);
                        });

                        if (hasActiveSub) {
                            console.log("Active Subscription found! Unlocking app...");
                            setUserData((prev) => ({ ...prev, status: 'active' }));
                        } else {
                            console.log("No active subscription found (Canceled/Expired). Locking app...");
                            // If no active subscription, revert status (unless lifetime payment exists)
                            // We should check payments too, but for now, strict subscription check
                            setUserData((prev) => ({ ...prev, status: 'blocked' }));
                        }
                    });
                } catch (e) {
                    console.error("Error listening to subscriptions:", e);
                }

                // 2. Listen for successful Payments (one-time)
                try {
                    const paymentsRef = collection(db, 'customers', user.uid, 'payments');
                    const qPayments = query(paymentsRef, where('status', '==', 'succeeded'));
                    unsubPayments = onSnapshot(qPayments, (snapshot) => {
                        if (!snapshot.empty) {
                            console.log("Successful Payment found! Unlocking app...");
                            setUserData((prev) => ({ ...prev, status: 'active' }));
                        }
                    });
                } catch (e) {
                    console.error("Error listening to payments:", e);
                }
            });
        }

        return () => {
            if (unsubSubs) unsubSubs();
            if (unsubPayments) unsubPayments();
        };
    }, [user]);

    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        try {
            await setPersistence(auth, browserLocalPersistence);
            try {
                await signInWithPopup(auth, provider);
            } catch (error: any) {
                if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
                    console.log("Popup blocked or cancelled, trying redirect...");
                    await signInWithRedirect(auth, provider);
                } else {
                    throw error;
                }
            }
        } catch (error: any) {
            console.error("Error logging in with Google", error);
            throw error;
        }
    };

    const loginWithEmail = async (email: string, pass: string, remember: boolean) => {
        try {
            await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (error: any) {
            console.error("Error logging in with email", error);
            throw error;
        }
    };

    const signupWithEmail = async (name: string, email: string, pass: string) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            await updateProfile(userCredential.user, { displayName: name });
        } catch (error: any) {
            console.error("Error signing up", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error: any) {
            console.error("Error logging out", error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, userData, loading, loginWithGoogle, loginWithEmail, signupWithEmail, logout, isTrialActive }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

