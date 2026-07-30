import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDNFRA_x7eyCtzAL0G8FA0nX9nzgGUBO3c",
  authDomain: "threasure-barberhouse-47923.firebaseapp.com",
  projectId: "threasure-barberhouse-47923",
  storageBucket: "threasure-barberhouse-47923.firebasestorage.app",
  messagingSenderId: "564496230496",
  appId: "1:564496230496:web:458974e3119888d45a7b05",
  measurementId: "G-0C0KYQ91N2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);