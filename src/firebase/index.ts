'use client';

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

/**
 * Singleton Firebase Instance Manager
 * مرتبط حصرياً بقاعدة البيانات saas-prod في مشروع dubsar-bb6e6.
 */
let cachedApp: FirebaseApp | undefined;
let cachedFirestore: Firestore | undefined;
let cachedAuth: Auth | undefined;
let cachedStorage: FirebaseStorage | undefined;

// المعرف الخاص بقاعدة البيانات الجديدة saas-prod
const DATABASE_ID = 'saas-prod';

export function initializeFirebase() {
  if (typeof window !== 'undefined') {
    try {
      if (!cachedApp) {
        const existingApps = getApps();
        cachedApp = existingApps.length ? existingApps[0] : initializeApp(firebaseConfig);
        
        try {
          cachedFirestore = getFirestore(cachedApp, DATABASE_ID);
        } catch {
          cachedFirestore = getFirestore(cachedApp);
        }
        cachedAuth = getAuth(cachedApp);
        cachedStorage = getStorage(cachedApp);

        console.log(`[Firebase Init] Project: ${firebaseConfig.projectId}, DB: ${DATABASE_ID}`);
      }
      
      return { 
        app: cachedApp, 
        firestore: cachedFirestore, 
        auth: cachedAuth,
        storage: cachedStorage
      };
    } catch (e) {
      console.warn("[Firebase Init] Warning: Running in offline / desktop mode without Firebase connection", e);
      return { app: null as any, firestore: null as any, auth: null as any, storage: null as any };
    }
  }
  
  // SSR Path
  try {
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    return { 
      app, 
      firestore: getFirestore(app, DATABASE_ID), 
      auth: getAuth(app),
      storage: getStorage(app)
    };
  } catch (e) {
    return { app: null as any, firestore: null as any, auth: null as any, storage: null as any };
  }
}

export { FirebaseProvider, useFirebase, useFirebaseApp, useFirestore, useAuth } from './provider';
export { FirebaseClientProvider } from './client-provider';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { useUser } from './auth/use-user';
