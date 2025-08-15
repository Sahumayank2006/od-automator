// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "od-nimbus",
  "appId": "1:633930719463:web:87b969c74d0644c7ee8242",
  "storageBucket": "od-nimbus.firebasestorage.app",
  "apiKey": "AIzaSyCB9c2DODy4ol9cesXaeTb3hI4fsaxpXlM",
  "authDomain": "od-nimbus.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "633930719463"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
