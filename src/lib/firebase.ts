import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

let app;
let db: any;
let auth: any;
let googleProvider: any;

try {
  // Check if config is dummy
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'REQUIRED_TO_START') {
    throw new Error('Firebase configuration is incomplete. Please complete setup in the Firebase panel.');
  }
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
} catch (error) {
  console.warn("Firebase initialization failed:", error);
  // Provide mock objects to prevent total breakdown, though functionality won't work
  db = {};
  auth = { currentUser: null };
}

export { db, auth, googleProvider };

export async function loginWithGoogle() {
  if (!auth.signInWithPopup) {
    alert("Firebase não está configurado. Não é possível fazer login.");
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
  if (!db.type) return; // Not initialized properly
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
