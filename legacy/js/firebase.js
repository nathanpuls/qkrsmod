// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDFP5GAwTNqLyaySh_t_2j8NFiulHTeFy8",
  authDomain: "fwdng-1d5f9.firebaseapp.com",
  databaseURL: "https://fwdng-1d5f9.firebaseio.com",
  projectId: "fwdng-1d5f9",
  storageBucket: "fwdng-1d5f9.firebasestorage.app",
  messagingSenderId: "250477002363",
  appId: "1:250477002363:web:95a89409c8d5991a9aacde"
};

// Initialize app & database
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// Get a reference to a note path
export function getNoteRef(path) {
  return ref(db, `notes/${path}`);
}

// Listen for changes on a note
export function listenToNote(path, callback) {
  const noteRef = getNoteRef(path);
  onValue(noteRef, snapshot => callback(snapshot.val()));
  return noteRef;
}

// Save data to a note path
export function saveNote(path, value) {
  const noteRef = getNoteRef(path);
  // If value is a string, store as object with content and updatedAt
  if (typeof value === 'string') {
    return set(noteRef, {
      content: value,
      updatedAt: Date.now()
    });
  } else if (typeof value === 'object' && value !== null) {
    // If value is already an object, add/update updatedAt
    return set(noteRef, {
      ...value,
      updatedAt: Date.now()
    });
  } else {
    // Fallback: store as object with updatedAt
    return set(noteRef, {
      value,
      updatedAt: Date.now()
    });
  }
}
