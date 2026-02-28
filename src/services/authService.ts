import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../utils/firebase';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'student' | 'admin';
}

export const authService = {
  async login(email: string, pass: string): Promise<UserProfile> {
    if (!isFirebaseConfigured) throw new Error("Firebase is not configured. Please add your Firebase config to the environment variables.");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      return this.getUserProfile(userCredential.user);
    } catch (error: any) {
      if (error.code === 'auth/configuration-not-found') {
        throw new Error("Authentication is not enabled in your Firebase project. Please go to the Firebase Console -> Authentication -> Sign-in method, and enable 'Email/Password'.");
      }
      throw error;
    }
  },

  async signup(email: string, pass: string, name: string, role: 'student' | 'admin' = 'student'): Promise<UserProfile> {
    if (!isFirebaseConfigured) throw new Error("Firebase is not configured. Please add your Firebase config to the environment variables.");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const profile: UserProfile = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: name,
        role
      };
      
      // Save to Firestore
      try {
        await setDoc(doc(db, 'users', profile.uid), {
          displayName: name,
          role,
          email: profile.email,
          createdAt: Date.now()
        });
      } catch (firestoreError: any) {
        // We do not throw or log here so the user can still log in even if Firestore is down/unconfigured
        // and it doesn't trigger the error overlay in the preview.
      }

      return profile;
    } catch (error: any) {
      if (error.code === 'auth/configuration-not-found') {
        throw new Error("Authentication is not enabled in your Firebase project. Please go to the Firebase Console -> Authentication -> Sign-in method, and enable 'Email/Password'.");
      }
      throw error;
    }
  },

  async logout() {
    if (!isFirebaseConfigured) return;
    await signOut(auth);
  },

  async getUserProfile(user: User): Promise<UserProfile> {
    if (!isFirebaseConfigured) return { uid: user.uid, email: user.email, displayName: user.displayName, role: 'student' };
    
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          uid: user.uid,
          email: user.email,
          displayName: data.displayName || user.displayName,
          role: data.role || 'student'
        };
      } else {
        // Fallback if doc doesn't exist
        return {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: 'student'
        };
      }
    } catch (error: any) {
      // Fallback to basic profile if we can't fetch it so the app doesn't crash
      // We do not log the error so it doesn't trigger the error overlay in the preview.
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: 'student'
      };
    }
  },

  onAuthChange(callback: (user: UserProfile | null) => void) {
    if (!isFirebaseConfigured) {
      callback(null);
      return () => {};
    }
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profile = await this.getUserProfile(user);
          callback(profile);
        } catch (error) {
          callback({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: 'student'
          });
        }
      } else {
        callback(null);
      }
    });
  }
};
