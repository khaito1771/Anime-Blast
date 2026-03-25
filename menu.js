window.addEventListener("load", function () {

  // ── Element refs ──────────────────────────────────────────────
  const homeScreen        = document.getElementById("homeScreen");
  const playBtn           = document.getElementById("playBtnImg");
  const settingsBtn       = document.getElementById("settingsBtnImg");
  const closeSettings     = document.getElementById("closeSettings");
  const settingsPopup     = document.getElementById("settingsPopup");
  const musicRange        = document.getElementById("musicRange");
  const soundRange        = document.getElementById("soundRange");

  const pauseMenuOverlay    = document.getElementById("pauseMenuOverlay");
  const resumeBtn           = document.getElementById("resumeBtn");
  const restartBtn          = document.getElementById("restartBtn");
  const settingsPauseBtn    = document.getElementById("settingsPauseBtn");
  const mainMenuBtn         = document.getElementById("mainMenuBtn");

  const gameOverOverlay     = document.getElementById("gameOverOverlay");
  const gameOverRestartBtn  = document.getElementById("gameOverRestartBtn");
  const gameOverMenuBtn     = document.getElementById("gameOverMenuBtn");

  const settingsPopupGame = document.getElementById("settingsPopupGame");
  const closeSettingsGame = document.getElementById("closeSettingsGame");
  const musicRangeGame    = document.getElementById("musicRangeGame");
  const soundRangeGame    = document.getElementById("soundRangeGame");

  // ── Audio unlock on first click ───────────────────────────────
  function startMenuAudio() {
    if (typeof userStartAudio === "function") userStartAudio();
    if (typeof menuMusic !== "undefined" && !menuMusic.isPlaying()) {
      menuMusic.setVolume(musicVolume);
      menuMusic.loop();
    }
    document.removeEventListener("click", startMenuAudio);
  }
  document.addEventListener("click", startMenuAudio);

  // ── Helper: show/hide pause overlay ──────────────────────────
  function openPauseMenu() {
    isPaused = true;
    pauseMenuOverlay.style.display = "flex";
  }
  function closePauseMenu() {
    isPaused = false;
    pauseMenuOverlay.style.display = "none";
  }

  // ── PLAY BUTTON ───────────────────────────────────────────────
  if (playBtn) {
    playBtn.addEventListener("click", function () {
      if (typeof userStartAudio === "function") userStartAudio();

      // Hide home screen
      homeScreen.style.display = "none";

      // Show the game canvas
      let canvas = document.querySelector("canvas");
      if (canvas) canvas.style.display = "block";

      // Stop menu music, start game music
      if (typeof menuMusic !== "undefined" && menuMusic.isPlaying()) {
        menuMusic.stop();
      }
      if (typeof bgMusic !== "undefined" && !bgMusic.isPlaying()) {
        bgMusic.setVolume(musicVolume);
        bgMusic.loop();
      }

      // Start game
      if (typeof gameState !== "undefined") gameState = "play";

      document.removeEventListener("click", startMenuAudio);
    });
  }

  // ── HOME SCREEN SETTINGS ─────────────────────────────────────
  if (settingsBtn) {
    settingsBtn.addEventListener("click", function () {
      settingsPopup.style.display = "block";
    });
  }
  if (closeSettings) {
    closeSettings.addEventListener("click", function () {
      settingsPopup.style.display = "none";
    });
  }

  // ── HOME SCREEN SLIDERS ───────────────────────────────────────
  function updateSliderFill(slider) {
    const percent = (slider.value / slider.max) * 100 + "%";
    slider.style.setProperty("--value", percent);
  }

  if (musicRange) {
    updateSliderFill(musicRange);
    musicRange.addEventListener("input", function () {
      musicVolume = this.value / 100;
      updateSliderFill(this);
      if (typeof menuMusic !== "undefined") menuMusic.setVolume(musicVolume);
      if (typeof bgMusic    !== "undefined") bgMusic.setVolume(musicVolume);
      // keep in-game slider in sync
      if (musicRangeGame) { musicRangeGame.value = this.value; updateSliderFill(musicRangeGame); }
    });
  }

  if (soundRange) {
    updateSliderFill(soundRange);
    soundRange.addEventListener("input", function () {
      soundVolume = this.value / 100;
      updateSliderFill(this);
      if (typeof tickSound       !== "undefined") tickSound.setVolume(soundVolume);
      if (typeof explosionSound  !== "undefined") explosionSound.setVolume(soundVolume);
      if (typeof gameOverSound   !== "undefined") gameOverSound.setVolume(soundVolume);
      if (soundRangeGame) { soundRangeGame.value = this.value; updateSliderFill(soundRangeGame); }
    });
  }

  // ── GAME OVER BUTTONS ─────────────────────────────────────────
  function hideGameOverOverlay() {
    if (gameOverOverlay) gameOverOverlay.style.display = "none";
  }

  if (gameOverRestartBtn) {
    gameOverRestartBtn.addEventListener("click", function () {
      hideGameOverOverlay();
      if (typeof score       !== "undefined") score = 0;
      if (typeof level       !== "undefined") level = 1;
      if (typeof playerInvul !== "undefined") playerInvul = 0;
      if (typeof startLevel  !== "undefined") startLevel();
      if (typeof gameState   !== "undefined") gameState = "play";
      if (typeof bgMusic !== "undefined" && !bgMusic.isPlaying()) {
        bgMusic.setVolume(musicVolume);
        bgMusic.loop();
      }
    });
  }

  if (gameOverMenuBtn) {
    gameOverMenuBtn.addEventListener("click", function () {
      hideGameOverOverlay();
      if (typeof score       !== "undefined") score = 0;
      if (typeof level       !== "undefined") level = 1;
      if (typeof playerInvul !== "undefined") playerInvul = 0;
      if (typeof startLevel  !== "undefined") startLevel();
      if (typeof gameState   !== "undefined") gameState = "start";
      if (typeof bgMusic    !== "undefined" && bgMusic.isPlaying()) bgMusic.stop();

      let canvas = document.querySelector("canvas");
      if (canvas) canvas.style.display = "none";
      homeScreen.style.display = "flex";

      if (typeof menuMusic !== "undefined" && !menuMusic.isPlaying()) {
        menuMusic.setVolume(musicVolume);
        menuMusic.loop();
      }
    });
  }

  // ── PAUSE MENU BUTTONS ────────────────────────────────────────
  if (resumeBtn) {
    resumeBtn.addEventListener("click", function () {
      closePauseMenu();
    });
  }

  if (restartBtn) {
    restartBtn.addEventListener("click", function () {
      closePauseMenu();
      if (typeof score       !== "undefined") score = 0;
      if (typeof level       !== "undefined") level = 1;
      if (typeof playerInvul !== "undefined") playerInvul = 0;
      if (typeof startLevel  !== "undefined") startLevel();
      if (typeof gameState   !== "undefined") gameState = "play";
      if (typeof bgMusic !== "undefined" && !bgMusic.isPlaying()) {
        bgMusic.setVolume(musicVolume);
        bgMusic.loop();
      }
    });
  }

  if (settingsPauseBtn) {
    settingsPauseBtn.addEventListener("click", function () {
      // Sync sliders from home-screen values
      if (musicRangeGame) { musicRangeGame.value = musicRange ? musicRange.value : 50; updateSliderFill(musicRangeGame); }
      if (soundRangeGame) { soundRangeGame.value = soundRange ? soundRange.value : 70; updateSliderFill(soundRangeGame); }
      settingsPopupGame.style.display = "block";
    });
  }

  if (mainMenuBtn) {
    mainMenuBtn.addEventListener("click", function () {
      closePauseMenu();
      if (typeof score       !== "undefined") score = 0;
      if (typeof level       !== "undefined") level = 1;
      if (typeof playerInvul !== "undefined") playerInvul = 0;
      if (typeof startLevel  !== "undefined") startLevel();
      if (typeof gameState   !== "undefined") gameState = "start";
      if (typeof bgMusic    !== "undefined" && bgMusic.isPlaying()) bgMusic.stop();

      // Hide canvas, show home screen
      let canvas = document.querySelector("canvas");
      if (canvas) canvas.style.display = "none";
      homeScreen.style.display = "flex";

      // Restart menu music
      if (typeof menuMusic !== "undefined" && !menuMusic.isPlaying()) {
        menuMusic.setVolume(musicVolume);
        menuMusic.loop();
      }
    });
  }

  // ── IN-GAME SETTINGS ─────────────────────────────────────────
  if (closeSettingsGame) {
    closeSettingsGame.addEventListener("click", function () {
      settingsPopupGame.style.display = "none";
    });
  }

  if (musicRangeGame) {
    updateSliderFill(musicRangeGame);
    musicRangeGame.addEventListener("input", function () {
      musicVolume = this.value / 100;
      updateSliderFill(this);
      if (typeof bgMusic    !== "undefined") bgMusic.setVolume(musicVolume);
      if (typeof menuMusic  !== "undefined") menuMusic.setVolume(musicVolume);
      if (musicRange) { musicRange.value = this.value; updateSliderFill(musicRange); }
    });
  }

  if (soundRangeGame) {
    updateSliderFill(soundRangeGame);
    soundRangeGame.addEventListener("input", function () {
      soundVolume = this.value / 100;
      updateSliderFill(this);
      if (typeof tickSound      !== "undefined") tickSound.setVolume(soundVolume);
      if (typeof explosionSound !== "undefined") explosionSound.setVolume(soundVolume);
      if (typeof gameOverSound  !== "undefined") gameOverSound.setVolume(soundVolume);
      if (soundRange) { soundRange.value = this.value; updateSliderFill(soundRange); }
    });
  }

});