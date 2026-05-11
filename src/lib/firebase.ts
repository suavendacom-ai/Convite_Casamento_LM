import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import configData from './firebase-applet-config.json';

// Support both JSON config (AI Studio) and Env Vars (Vercel)
const firebaseConfig: any = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || configData.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || configData.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || configData.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || configData.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || configData.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || configData.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || (configData as any).firestoreDatabaseId,
};

let app;
let db: any;
let auth: any;
let googleProvider: any;

const isConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== 'REQUIRED_TO_START';

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  } catch (error) {
    console.warn("Firebase initialization failed:", error);
    db = { type: 'mock' };
    auth = { currentUser: null };
  }
} else {
  db = { type: 'mock' };
  auth = { currentUser: null };
}

export { db, auth, googleProvider, isConfigured };

export async function loginWithGoogle() {
  if (!isConfigured || !auth.signInWithPopup) {
    alert("Firebase não está configurado. Configure as variáveis de ambiente VITE_FIREBASE_* no Vercel ou ative o Firebase no AI Studio.");
    return null;
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
}

async function testConnection() {
  if (!isConfigured || !db.type || db.type === 'mock') return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    console.warn("Firebase connection test failed. This is expected if rules aren't deployed yet.");
  }
}
testConnection();
