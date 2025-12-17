export const db = (() => {
  firebase.initializeApp({
    apiKey: "AIzaSyDFP5GAwTNqLyaySh_t_2j8NFiulHTeFy8",
    authDomain: "fwdng-1d5f9.firebaseapp.com",
    databaseURL: "https://fwdng-1d5f9.firebaseio.com",
    projectId: "fwdng-1d5f9",
    storageBucket: "fwdng-1d5f9.firebasestorage.app",
    messagingSenderId: "250477002363",
    appId: "1:250477002363:web:95a89409c8d5991a9aacde"
  });
  return firebase.database();
})();
