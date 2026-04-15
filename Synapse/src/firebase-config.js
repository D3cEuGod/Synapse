//Config file for Firebase (our db/collections tool)

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDloPoJ6z-gNgv9bSIGUjrTNh48ZLvrPHo",
    authDomain: "synapse21.firebaseapp.com",
    projectId: "synapse21",
    storageBucket: "synapse21.firebasestorage.app",
    messagingSenderId: "1026510421512",
    appId: "1:1026510421512:web:551d0bf8af2d9e14085bbd"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
