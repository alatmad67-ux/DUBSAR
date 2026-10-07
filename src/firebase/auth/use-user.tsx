'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth, useFirestore } from '../provider';
import { UserProfile } from '@/lib/types/roles';

/**
 * @fileOverview Identity Resolver for 'saas-prod' Database on 'dubsar-bb6e6'.
 */
export function useUser() {
  const auth = useAuth();
  const db = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UID الخاص بالـ Super Admin في المشروع الجديد
  const SUPER_ADMIN_UID = 'rQR8k4ZzIZVtvkQ2pUHNlvIDSI13';

  useEffect(() => {
    if (!auth || !db) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const profileRef = doc(db, 'accountProfiles', firebaseUser.uid);
      
      const unsubscribeProfile = onSnapshot(profileRef, 
        (snap) => {
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          } else {
            setProfile(null);
          }
          setLoading(false);
        }, 
        (err) => {
          console.error("Identity Fetch Failed in New Project:", err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsubscribeProfile();
    });

    return () => unsubscribeAuth();
  }, [auth, db]);

  const isSuperAdmin = user?.uid === SUPER_ADMIN_UID || profile?.role === 'super_admin' || profile?.accountType === 'super_admin';

  return { 
    user, 
    profile, 
    loading,
    error,
    isSuperAdmin,
    tenantId: profile?.tenantId || null,
    isAuthenticated: !!user
  };
}
