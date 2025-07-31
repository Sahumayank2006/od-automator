
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "od-nimbus",
  appId: "1:633930719463:web:87b969c74d0644c7ee8242",
  storageBucket: "od-nimbus.firebasestorage.app",
  apiKey: "AIzaSyCB9c2DODy4ol9cesXaeTb3hI4fsaxpXlM",
  authDomain: "od-nimbus.firebaseapp.com",
  messagingSenderId: "633930719463",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
