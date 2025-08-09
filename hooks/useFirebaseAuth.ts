import { useState, useEffect } from 'react';
import {
    User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../config/firebase';

export const useFirebaseAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signIn = async (email: string, password: string) => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            return { user: result.user, error: null };
        } catch (error: any) {
            return { user: null, error: error.message };
        }
    };

    const signUp = async (email: string, password: string) => {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            return { user: result.user, error: null };
        } catch (error: any) {
            return { user: null, error: error.message };
        }
    };

    const logOut = async () => {
        try {
            await signOut(auth);
            return { error: null };
        } catch (error: any) {
            return { error: error.message };
        }
    };

    return {
        user,
        loading,
        signIn,
        signUp,
        logOut
    };
};
