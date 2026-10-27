import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  type Auth,
  type User,
} from 'firebase/auth';

// Read config from firebase-applet-config.json or environment variables
let rawConfig: Record<string, any> = {};

try {
  // @ts-ignore - JSON module import
  const appletConfig = await import('../../firebase-applet-config.json', { with: { type: 'json' } }).catch(() => null);
  if (appletConfig?.default) {
    rawConfig = appletConfig.default;
  }
} catch {
  // Fallback if dynamic import fails
}

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyARDhCu1enTQ5oSsUl5IveYG7609sPwnKo',
  authDomain: 'sandbox-studio-1533a.firebaseapp.com',
  projectId: 'sandbox-studio-1533a',
  storageBucket: 'sandbox-studio-1533a.firebasestorage.app',
  messagingSenderId: '152350767316',
  appId: '1:152350767316:web:0d19d513090c878f5ba341',
  measurementId: 'G-R25HNLY8EE',
};

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || rawConfig.apiKey || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || rawConfig.authDomain || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || rawConfig.projectId || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || rawConfig.storageBucket || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || rawConfig.messagingSenderId || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || rawConfig.appId || DEFAULT_FIREBASE_CONFIG.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || rawConfig.measurementId || DEFAULT_FIREBASE_CONFIG.measurementId,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey.length > 10 &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
);

// Initialize Firebase App singleton safely
export const app: FirebaseApp | null = isFirebaseConfigured
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp())
  : null;

// Initialize Firebase Auth singleton safely
export const auth: Auth | null = app ? getAuth(app) : null;

// Setup persistent browser local auth
if (auth) {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('[Firebase Auth] Failed to enable browserLocalPersistence:', err);
  });
}

// Google Auth Provider configured with account selection prompt
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

/**
 * Maps Firebase Auth errors into clear, actionable human-readable messages.
 */
export function formatFirebaseAuthError(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'The Google sign-in popup was closed before completing authentication.';
    case 'auth/popup-blocked':
      return 'The Google sign-in popup was blocked by your browser. Please allow popups for this domain and try again.';
    case 'auth/cancelled-popup-request':
      return 'Another sign-in attempt was already in progress.';
    case 'auth/unauthorized-domain':
      return `This domain (${window.location.hostname}) is not authorized in Firebase Console. Please add "${window.location.hostname}" to Firebase Console -> Authentication -> Settings -> Authorized domains.`;
    case 'auth/operation-not-allowed':
      return 'Google Sign-In is not enabled in the Firebase Console. Please navigate to Firebase Console -> Authentication -> Sign-in method and enable Google.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please verify your internet connection and try again.';
    case 'auth/user-disabled':
      return 'This user account has been disabled by an administrator.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with the same email address but different sign-in credentials.';
    default:
      return error?.message || 'Failed to authenticate with Google. Please try again.';
  }
}

/**
 * Triggers the official Google Sign-In popup flow.
 */
export async function signInWithGoogle(): Promise<User> {
  if (!auth) {
    throw new Error(
      'Firebase is not configured. Please verify that firebase-applet-config.json or VITE_FIREBASE_* environment variables are set.'
    );
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('[Firebase Auth] Google Sign-In error:', error);
    const friendlyMessage = formatFirebaseAuthError(error);
    const customError = new Error(friendlyMessage);
    (customError as any).code = error?.code;
    throw customError;
  }
}

/**
 * Signs out the current Firebase user.
 */
export async function signOutFromFirebase(): Promise<void> {
  if (auth && auth.currentUser) {
    await firebaseSignOut(auth);
  }
}

/**
 * Subscribes to Firebase auth state changes.
 */
export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
