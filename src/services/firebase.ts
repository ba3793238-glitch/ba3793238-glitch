import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;

async function initFirebase() {
  try {
    const response = await fetch('/firebase-applet-config.json').catch(() => null);
    
    if (response && response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const firebaseConfig = await response.json();
        app = initializeApp(firebaseConfig);
        db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
        auth = getAuth();
        console.log('Firebase initialized successfully');
      } else {
        console.warn('Firebase config found but is not JSON. It might be a fallback HTML page.');
      }
    } else {
      console.warn('Firebase config missing or failed to fetch. This is expected if Firebase is not yet set up via the AI Studio UI.');
    }
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
}

initFirebase();

export { app, db, auth };
