import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAXLY4wygsfeXB_kv_e4w0VoxhUmYlxym4",
  authDomain: "faceauthsystem.firebaseapp.com",
  projectId: "faceauthsystem",
  storageBucket: "faceauthsystem.firebasestorage.app",
  messagingSenderId: "869404140254",
  appId: "1:869404140254:web:c76b2f45f2db3b7796984f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider(); 