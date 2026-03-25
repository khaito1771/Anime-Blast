// ============================================================
// firebase.js — Firebase init + Firestore leaderboard helpers
// Uses CDN imports — works directly in the browser
// ============================================================

import { initializeApp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import { getFirestore, collection, addDoc, getDocs, orderBy, query, limit }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── Your Firebase config ──────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyAL61-1GMN-7OscBd6Z-jEFQmkwM1RF9fc",
  authDomain:        "anime-blast-fdeb5.firebaseapp.com",
  projectId:         "anime-blast-fdeb5",
  storageBucket:     "anime-blast-fdeb5.firebasestorage.app",
  messagingSenderId: "495523653886",
  appId:             "1:495523653886:web:0e1aadcf82f20df1379daf"
};

// ── Initialize ────────────────────────────────────────────────
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ── Save a score to Firestore ─────────────────────────────────
window.saveScoreToFirebase = async function(name, score) {
  try {
    await addDoc(collection(db, "leaderboard"), {
      name:      name,
      score:     score,
      timestamp: new Date()
    });
    console.log("Score saved to Firebase!");
  } catch (e) {
    console.error("Error saving score:", e);
  }
};

// ── Fetch top 10 scores from Firestore ───────────────────────
window.getLeaderboardFromFirebase = async function() {
  try {
    const q = query(
      collection(db, "leaderboard"),
      orderBy("score", "desc"),
      limit(10)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  } catch (e) {
    console.error("Error fetching leaderboard:", e);
    return [];
  }
};