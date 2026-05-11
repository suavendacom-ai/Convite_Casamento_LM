import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { GuestGroup, WeddingSettings } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const WeddingService = {
  async getSettings(): Promise<WeddingSettings | null> {
    if (!db || !db.type) return null;
    const path = 'settings/event';
    try {
      const docSnap = await getDoc(doc(db, path));
      return docSnap.exists() ? (docSnap.data() as WeddingSettings) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async updateSettings(settings: WeddingSettings) {
    if (!db || !db.type) {
      alert("Firebase não configurado.");
      return;
    }
    const path = 'settings/event';
    try {
      await setDoc(doc(db, path), settings);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getGroup(token: string): Promise<GuestGroup | null> {
    if (!db || !db.type) return null;
    const path = `guestGroups/${token}`;
    try {
      const docSnap = await getDoc(doc(db, 'guestGroups', token));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as GuestGroup;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async confirmGroup(token: string, guests: GuestGroup['guests']) {
    if (!db || !db.type) return;
    const path = `guestGroups/${token}`;
    try {
      await updateDoc(doc(db, 'guestGroups', token), {
        guests,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getAllGroups(): Promise<GuestGroup[]> {
    if (!db || !db.type) return [];
    const path = 'guestGroups';
    try {
      const q = query(collection(db, path));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GuestGroup));
    } catch (error) {
      handleFirestoreError(error, OperationType.QUERY as any, path);
      return [];
    }
  },

  async createGroup(group: Omit<GuestGroup, 'id'>) {
    if (!db || !db.type) return null;
    const path = `guestGroups/${group.familyName}`;
    const token = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      await setDoc(doc(db, 'guestGroups', token), {
        ...group,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return token;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
};
