
'use client';

import React, { useEffect, useState } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const [firebase, setFirebase] = useState<{
    app: FirebaseApp;
    firestore: Firestore;
    auth: Auth;
  } | null>(null);

  useEffect(() => {
    try {
      const initialized = initializeFirebase();
      setFirebase(initialized);
    } catch (e) {
      console.warn("Firebase initialization warning:", e);
    }
  }, []);

  return (
    <FirebaseProvider 
      app={firebase?.app || (null as any)} 
      firestore={firebase?.firestore || (null as any)} 
      auth={firebase?.auth || (null as any)}
    >
      {children}
    </FirebaseProvider>
  );
}
