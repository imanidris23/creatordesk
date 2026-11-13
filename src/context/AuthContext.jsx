import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

import { auth, db, firebaseReady } from "../firebase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(firebaseReady);
  const [profileLoading, setProfileLoading] = useState(firebaseReady);

  // Watch Firebase authentication state
  useEffect(() => {
    if (!firebaseReady || !auth || !db) {
      setAuthLoading(false);
      setProfileLoading(false);
      return undefined;
    }

    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);

      if (!nextUser) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);

      try {
        const profileRef = doc(db, "users", nextUser.uid);
        const profileSnap = await getDoc(profileRef);

        setProfile(profileSnap.exists() ? profileSnap.data() : null);
      } catch (error) {
        console.error("Unable to load user profile:", error);
        setProfile(null);
      } finally {
        setProfileLoading(false);
      }
    });
  }, []);

  // Register using email and password
  const register = async (email, password, fullName, workspaceName) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);

    await updateProfile(result.user, {
      displayName: fullName,
    });

    const userProfile = {
      uid: result.user.uid,
      fullName,
      workspaceName,
      email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, "users", result.user.uid), userProfile);

    setUser(result.user);
    setProfile(userProfile);

    return result;
  };

  // Login using email and password
  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  // Login using Google
  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, new GoogleAuthProvider());

    const googleUser = result.user;

    const profileRef = doc(db, "users", googleUser.uid);
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      const existingProfile = profileSnap.data();
      setProfile(existingProfile);

      return {
        needsWorkspaceSetup: false,
        user: googleUser,
      };
    }

    // New Google account or account without a saved profile
    setProfile(null);

    return {
      needsWorkspaceSetup: true,
      user: googleUser,
    };
  };

  // Save workspace profile after Google registration
  const saveUserProfile = async (workspaceName) => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("No authenticated user found.");
    }

    const userProfile = {
      uid: currentUser.uid,
      fullName: currentUser.displayName || "Creator",
      workspaceName,
      email: currentUser.email || "",
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, "users", currentUser.uid), userProfile, {
      merge: true,
    });

    setProfile(userProfile);

    return userProfile;
  };

  // Logout
  const logout = () => signOut(auth);

  const value = useMemo(
    () => ({
      user,
      profile,
      authLoading,
      profileLoading,
      firebaseReady,
      register,
      login,
      loginWithGoogle,
      saveUserProfile,
      logout,
    }),
    [user, profile, authLoading, profileLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
