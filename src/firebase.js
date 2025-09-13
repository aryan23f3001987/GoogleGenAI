import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Note: For local development, replace this with your actual Firebase config
// from the Firebase console, likely using environment variables.
// Example:
// const firebaseConfig = {
//   apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
//   authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
//   //... rest of your config
// };
const firebaseConfig = {
  apiKey: "AIzaSyAU6UWpw5nU7As9F7S5azpvOhzVSkksx88",
  authDomain: "gen-ai-596a5.firebaseapp.com",
  projectId: "gen-ai-596a5",
  storageBucket: "gen-ai-596a5.firebasestorage.app",
  messagingSenderId: "275734473351",
  appId: "1:275734473351:web:a60403485f41d2a163e622",
  measurementId: "G-SBSR5BT8J6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
