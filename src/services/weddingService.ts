import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
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
  // Helpers for local storage fallback
  _getLocalGroups(): GuestGroup[] {
    const saved = localStorage.getItem('wedding_guests_fallback');
    return saved ? JSON.parse(saved) : [];
  },
  _saveLocalGroups(groups: GuestGroup[]) {
    localStorage.setItem('wedding_guests_fallback', JSON.stringify(groups));
  },
  _getLocalSettings(): WeddingSettings | null {
    const saved = localStorage.getItem('wedding_settings_fallback');
    return saved ? JSON.parse(saved) : null;
  },
  _saveLocalSettings(settings: WeddingSettings) {
    localStorage.setItem('wedding_settings_fallback', JSON.stringify(settings));
  },

  async getSettings(): Promise<WeddingSettings | null> {
    try {
      if (!db || !db.type) throw new Error("No DB");
      const docSnap = await getDoc(doc(db, 'settings/event'));
      if (docSnap.exists()) {
        const data = docSnap.data() as WeddingSettings;
        this._saveLocalSettings(data);
        return data;
      }
      return this._getLocalSettings();
    } catch (error) {
      console.warn("Using local settings fallback");
      return this._getLocalSettings();
    }
  },

  async updateSettings(settings: WeddingSettings) {
    this._saveLocalSettings(settings);
    try {
      if (!db || !db.type) return;
      await setDoc(doc(db, 'settings/event'), settings);
    } catch (error) {
      console.error("Failed to sync settings to cloud, saved locally only");
    }
  },

  async getGroup(token: string): Promise<GuestGroup | null> {
    try {
      if (!db || !db.type || db.type === 'mock') throw new Error("No DB");
      const docSnap = await getDoc(doc(db, 'guestGroups', token));
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as GuestGroup;
        // Cache found remote group locally
        const local = this._getLocalGroups();
        if (!local.find(l => l.id === token)) {
          local.push(data);
          this._saveLocalGroups(local);
        }
        return data;
      }
      // If not in cloud, maybe it's only in local storage
      const local = this._getLocalGroups();
      return local.find(g => g.id === token) || null;
    } catch (error) {
      console.warn("Firestore fetch failed, checking local storage", error);
      const local = this._getLocalGroups();
      return local.find(g => g.id === token) || null;
    }
  },

  async confirmGroup(token: string, guests: GuestGroup['guests']) {
    // Update local first
    const groups = this._getLocalGroups();
    const idx = groups.findIndex(g => g.id === token);
    if (idx !== -1) {
      groups[idx].guests = guests;
      this._saveLocalGroups(groups);
    }

    try {
      if (!db || !db.type) return;
      await updateDoc(doc(db, 'guestGroups', token), {
        guests,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Failed to sync confirmation to cloud");
    }
  },

  async getAllGroups(): Promise<GuestGroup[]> {
    const local = this._getLocalGroups();
    try {
      if (!db || !db.type || db.type === 'mock') return local;
      const q = collection(db, 'guestGroups'); 
      const querySnapshot = await getDocs(q);
      const remote = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GuestGroup));
      
      // Merge: remote has priority, but keep local items not yet synced
      const merged = [...remote];
      local.forEach(l => {
        if (!merged.find(m => m.id === l.id)) {
          merged.push(l);
        }
      });
      
      this._saveLocalGroups(merged);
      return merged;
    } catch (error) {
      console.error("Failed to fetch groups from Firebase", error);
      return local;
    }
  },

  async createGroup(group: Omit<GuestGroup, 'id'>) {
    const token = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newGroup = { ...group, id: token };
    
    // Save locally first so it's not lost
    const groups = this._getLocalGroups();
    groups.push(newGroup);
    this._saveLocalGroups(groups);

    try {
      if (!db || !db.type || db.type === 'mock') {
        console.warn("Firebase not ready, group saved ONLY locally.");
        return token;
      }
      
      await setDoc(doc(db, 'guestGroups', token), {
        familyName: group.familyName,
        guests: group.guests,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return token;
    } catch (error) {
      console.error("Firestore sync failed:", error);
      // We return the token because it's saved locally, but we should probably alert the user
      throw new Error("Local save OK, but failed to sync to Cloud. Check Firebase rules.");
    }
  },

  async deleteGroup(token: string) {
    // Delete local
    const groups = this._getLocalGroups();
    const filtered = groups.filter(g => g.id !== token);
    this._saveLocalGroups(filtered);

    try {
      if (!db || !db.type || db.type === 'mock') return;
      await deleteDoc(doc(db, 'guestGroups', token));
    } catch (error) {
      console.error("Failed to delete group from cloud:", error);
    }
  },

  async updateGroup(token: string, group: Partial<GuestGroup>) {
    // Update local
    const groups = this._getLocalGroups();
    const idx = groups.findIndex(g => g.id === token);
    if (idx !== -1) {
      groups[idx] = { ...groups[idx], ...group };
      this._saveLocalGroups(groups);
    }

    try {
      if (!db || !db.type || db.type === 'mock') return;
      await updateDoc(doc(db, 'guestGroups', token), {
        ...group,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Failed to update group in cloud:", error);
    }
  }
};
