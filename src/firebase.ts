import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  };
  
// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Authentication functions
export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Firestore functions
export const getCaminoPoints = (caminoId: string, callback: (points: any[]) => void) => {
  const pointsRef = collection(db, 'caminos', caminoId, 'points');
  const q = query(pointsRef, orderBy('timestamp', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const points = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(points);
  }, (error) => {
    console.error('❌ Firestore connection failed:', error);
  });
};

export const addCaminoPoint = async (caminoId: string, pointData: {
  title: string;
  coordinates: { latitude: number; longitude: number };
  cover: string;
  timestamp: Date;
  url?: string;
}) => {
  try {
    const pointsRef = collection(db, 'caminos', caminoId, 'points');
    
    // Filter out undefined values to avoid Firestore errors
    const cleanPointData = Object.fromEntries(
      Object.entries(pointData).filter(([_, value]) => value !== undefined)
    );
    
    const docData = {
      ...cleanPointData,
      timestamp: serverTimestamp(), // Use server timestamp for consistency
    };
    
    const docRef = await addDoc(pointsRef, docData);
    return { id: docRef.id, error: null };
  } catch (error: any) {
    console.error('❌ Failed to add point to Firestore:', error);
    return { id: null, error: error.message };
  }
};

export default app;
