import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "fresh-balancer-448901-m0.firebaseapp.com",
  projectId: "fresh-balancer-448901-m0",
  storageBucket: "fresh-balancer-448901-m0.appspot.com",
  messagingSenderId: "301021771346",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const messaging = getMessaging(app);
