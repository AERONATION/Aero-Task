import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
  AuthError,
} from 'firebase/auth';
import { app } from './config';

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

/**
 * Maps Firebase Auth error codes to user-friendly messages
 */
export function getFriendlyAuthErrorMessage(error: any): string {
  if (!error) return 'An unknown error occurred.';
  const code = (error as AuthError)?.code || '';

  switch (code) {
    case 'auth/invalid-email':
      return 'The email address is invalid.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again in a moment.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing.';
    case 'auth/popup-blocked':
      return 'Popup was blocked by the browser. Please allow popups for this site.';
    case 'auth/cancelled-popup-request':
      return 'Only one popup request allowed at a time.';
    default:
      return error.message || 'Authentication failed. Please try again.';
  }
}

export async function loginWithEmail(email: string, pass: string) {
  return signInWithEmailAndPassword(auth, email.trim(), pass);
}

export async function registerWithEmail(email: string, pass: string) {
  return createUserWithEmailAndPassword(auth, email.trim(), pass);
}

export async function loginWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function sendPasswordReset(email: string) {
  return sendPasswordResetEmail(auth, email.trim());
}

export async function logOut() {
  return signOut(auth);
}

export async function updateFirebaseProfile(user: FirebaseUser, updates: { displayName?: string; photoURL?: string }) {
  return updateProfile(user, updates);
}
