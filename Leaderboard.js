// ============================================================
// leaderboard.js — Name entry popup + leaderboard display
// ============================================================

window.addEventListener("load", function () {

  // ── Element refs ──────────────────────────────────────────────
  const nameEntryPopup    = document.getElementById("nameEntryPopup");
  const finalScoreDisplay = document.getElementById("finalScoreDisplay");
  const playerNameInput   = document.getElementById("playerNameInput");
  const submitScoreBtn    = document.getElementById("submitScoreBtn");
  const skipScoreBtn      = document.getElementById("skipScoreBtn");

  const leaderboardPopup  = document.getElementById("leaderboardPopup");
  const leaderboardList   = document.getElementById("leaderboardList");
  const closeLeaderboard  = document.getElementById("closeLeaderboard");
  const leaderboardBtn    = document.getElementById("leaderboardBtnImg");

  const MEDALS     = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
  const RANK_CLASS = ["first", "second", "third", "", "", "", "", "", "", ""];

  let pendingScore = 0;

  // ── Show name entry popup only if score qualifies for top 10 ──
  window.showNameEntry = async function(finalScore) {
    // Wait for Firebase to be ready
    const ready = await waitForFirebase();

    if (ready) {
      const scores = await window.getLeaderboardFromFirebase();

      // If leaderboard has fewer than 10 entries, always qualify
      // If 10 entries exist, only qualify if score beats the lowest
      const qualifies = scores.length < 10 ||
                        finalScore > scores[scores.length - 1].score;

      if (!qualifies) return; // score doesn't make the board — skip popup
    }

    pendingScore = finalScore;
    finalScoreDisplay.textContent = "Your Score: " + finalScore.toLocaleString();
    playerNameInput.value = "";
    nameEntryPopup.style.display = "flex";
    setTimeout(() => playerNameInput.focus(), 100);
  };

  // ── Submit score ──────────────────────────────────────────────
  submitScoreBtn.addEventListener("click", async function () {
    const name = playerNameInput.value.trim() || "Anonymous";
    submitScoreBtn.textContent = "Saving...";
    submitScoreBtn.disabled = true;

    if (typeof window.saveScoreToFirebase === "function") {
      await window.saveScoreToFirebase(name, pendingScore);
    }

    submitScoreBtn.textContent = "SUBMIT SCORE";
    submitScoreBtn.disabled = false;
    nameEntryPopup.style.display = "none";
  });

  // Allow pressing Enter to submit
  playerNameInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") submitScoreBtn.click();
  });

  // ── Skip without saving ───────────────────────────────────────
  skipScoreBtn.addEventListener("click", function () {
    nameEntryPopup.style.display = "none";
  });

  // ── Open leaderboard popup ────────────────────────────────────
  if (leaderboardBtn) {
    leaderboardBtn.addEventListener("click", function () {
      renderLeaderboard();
      leaderboardPopup.style.display = "block";
    });
  }

  // ── Close leaderboard popup ───────────────────────────────────
  if (closeLeaderboard) {
    closeLeaderboard.addEventListener("click", function () {
      leaderboardPopup.style.display = "none";
    });
  }

// ── Render leaderboard from Firebase ─────────────────────────
  async function renderLeaderboard() {
    leaderboardList.innerHTML = '<div class="lb-empty">Loading...</div>';

    // Wait up to 5 seconds for Firebase to finish initializing
    const ready = await waitForFirebase();
    if (!ready) {
      leaderboardList.innerHTML = '<div class="lb-empty">Could not connect to Firebase.</div>';
      return;
    }

    const scores = await window.getLeaderboardFromFirebase();

    if (!scores.length) {
      leaderboardList.innerHTML = '<div class="lb-empty">No scores yet — play a game first!</div>';
      return;
    }

    leaderboardList.innerHTML = scores.map((s, i) => `
      <div class="lb-row ${RANK_CLASS[i] || ''}">
        <span class="lb-rank">${MEDALS[i]}</span>
        <span class="lb-name">${escapeHtml(s.name)}</span>
        <span class="lb-score">${Number(s.score).toLocaleString()}</span>
      </div>
    `).join("");
  }

  // ── Wait for firebase.js to expose its window functions ──────
  function waitForFirebase(timeout = 5000) {
    return new Promise(resolve => {
      if (typeof window.getLeaderboardFromFirebase === "function") {
        resolve(true);
        return;
      }
      const interval = setInterval(() => {
        if (typeof window.getLeaderboardFromFirebase === "function") {
          clearInterval(interval);
          resolve(true);
        }
      }, 100);
      setTimeout(() => { clearInterval(interval); resolve(false); }, timeout);
    });
  }

  // ── Safety: escape user-entered names to prevent XSS ─────────
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

});