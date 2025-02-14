import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAyvYAWUuGN5LjD1igZNlQVRNgGIA2sJTU",
    authDomain: "francisco-moura.firebaseapp.com",
    projectId: "francisco-moura",
    storageBucket: "francisco-moura.firebaseapp.com",
    messagingSenderId: "431069332065",
    appId: "1:431069332065:web:6c2870fc5324530e60e020"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);
const auth = getAuth(app);

export { auth, storage, db };