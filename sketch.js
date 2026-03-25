// ANIME BLAST ARENA

const COLS = 13;
const ROWS = 11;

// Dynamically compute TILE so the canvas fits any screen
// Reserves vertical space for the mobile touch controls (120px)
function computeTile() {
  const TOUCH_RESERVE = window.innerWidth < 768 ? 130 : 0;
  const tileW = Math.floor(window.innerWidth  / COLS);
  const tileH = Math.floor((window.innerHeight - TOUCH_RESERVE) / ROWS);
  return Math.max(32, Math.min(tileW, tileH)); // clamp: 32–unlimited
}

let TILE = computeTile();

// scale factor for wall/box sprites relative to TILE; >1 makes them larger than
// the nominal cell size so they can cover grid lines or bleed into neighboring
// cells if desired.
const TILE_SCALE = 1.5; // adjust this value (e.g. 1.0 = same size; 1.5 = 50% bigger)

let musicVolume = 0.5;
let soundVolume = 0.7;

let grid = [];
let player;

let bombs = [];
let explosions = [];
let score = 0;

let gameState = "start";
let level = 1;

let playerInvul = 0; // frames of temporary invulnerability
const INVUL_FRAMES = 60; // 1 second at 60 FPS

// ---------------- TUTORIAL ----------------
let tutorialActive = false;
let tutorialStep = 0;
let tutorialMoved = false;
let tutorialBombPlaced = false;
let tutorialBombExploded = false;
let tutorialEnemyKilled = false;
let tutorialPulse = 0; // for pulsing highlight animation

const TUTORIAL_STEPS = [
  {
    title: "MOVE YOUR CHARACTER",
    body: "Use the  ← ↑ → ↓  Arrow Keys\nto move around the arena.",
    highlight: "move",
    waitFor: "move"
  },
  {
    title: "PLACE A BOMB",
    body: "Press  SPACE  to drop a bomb.\nRun away before it explodes!",
    highlight: "bomb",
    waitFor: "bomb"
  },
  {
    title: "WATCH THE EXPLOSION",
    body: "The bomb blasts in a + shape.\nStay out of the blast zone!",
    highlight: "explode",
    waitFor: "explode"
  },
  {
    title: "DESTROY ENEMIES",
    body: "Catch an enemy in the blast\nto earn points and clear the level.",
    highlight: "enemy",
    waitFor: "kill"
  },
  {
    title: "READY TO FIGHT!",
    body: "Avoid enemies touching you.\nClear all enemies to advance!\n\nPress  ENTER  to start!",
    highlight: "none",
    waitFor: "enter"
  }
];
// Assets
let playerImg, bombImg, mapImg, blockImg, boxImg;
let heartImg, explosionImg;
let isPaused = false;
let pauseImg;
let tickSound, explosionSound, gameOverSound;
let bgMusic;
let menuMusic;
let enemyImgs = {};
const enemyData = {
  1: { score: 300 },
  2: { score: 400 },
  3: { score: 500 },
  4: { score: 600 },
  boss: { score: 1000 }
};
// Animation variables
let playerFrameWidth, playerFrameHeight;
let playerFrameCount = 4;
let playerCurrentFrame = 0;
let playerAnimSpeed = 10; // Frames between animation updates
let heartBeat = 0;      // heartbeat animation
let heartBeatDirection = 1; 
// ---------------- PRELOAD ----------------
function preload() {
  mapImg = loadImage("assets/arena1.png");
  playerImg = loadImage("assets/player.gif");

  // ✅ Load all enemy variants
  enemyImgs = {
    1: loadImage("assets/enemy.gif"),
    2: loadImage("assets/enemy2.gif"),
    3: loadImage("assets/enemy3.gif"),
    4: loadImage("assets/enemy4.gif"),
    boss: loadImage("assets/boss-enemy.gif")
  };
  

  bombImg = loadImage("assets/bomb.gif");
  blockImg = loadImage("assets/block.png");
  boxImg = loadImage("assets/box.png");
  heartImg = loadImage("assets/heart.png");
  explosionImg = loadImage("assets/explosion.png"); // explosion sprite
  pauseImg = loadImage("assets/pause-btn.png");
  tickSound = loadSound("assets/bomb.wav");
  explosionSound = loadSound("assets/explosion.wav");
  gameOverSound = loadSound("assets/gameover.wav");
  bgMusic = loadSound("assets/bgm.mp3");
  menuMusic = loadSound("assets/menu.mp3");
}

// ---------------- SETUP ----------------
function setup() {
  TILE = computeTile();
  createCanvas(COLS * TILE, ROWS * TILE);
  pixelDensity(1);
  noSmooth(); // keeps pixel art sharp when scaled
  centerCanvas();
  startLevel();

  // Hide canvas until the player clicks Play
  let c = document.querySelector("canvas");
  c.style.display = "none";
}

// ---------------- CENTER CANVAS ----------------
function centerCanvas() {
  const TOUCH_RESERVE = window.innerWidth < 768 ? 130 : 0;
  let x = (windowWidth  - width)  / 2;
  let y = (windowHeight - TOUCH_RESERVE - height) / 2;
  y = Math.max(0, y); // never go above screen
  let c = document.querySelector("canvas");
  c.style.position = "absolute";
  c.style.left = x + "px";
  c.style.top  = y + "px";
}

function windowResized() {
  TILE = computeTile();
  resizeCanvas(COLS * TILE, ROWS * TILE);
  centerCanvas();
}

// ---------------- LEVEL ----------------
function startLevel() {
  bombs = [];
  explosions = [];
  playerInvul = 0;
  createGrid();
  // Preserve lives when advancing levels; only reset on a fresh game (level 1)
  let currentLives = (player && level > 1) ? player.lives : 3;
  player = { x: 1, y: 1, lives: currentLives };
  createEnemies();

  // Start tutorial only on level 1
  if (level === 1) {
    tutorialActive = true;
    tutorialStep = 0;
    tutorialMoved = false;
    tutorialBombPlaced = false;
    tutorialBombExploded = false;
    tutorialEnemyKilled = false;
  } else {
    tutorialActive = false;
  }
}

// ---------------- GRID ----------------
function createGrid() {
  grid = [];

  for (let y = 0; y < ROWS; y++) {
    let row = [];

    for (let x = 0; x < COLS; x++) {
      if (
        x === 0 ||
        y === 0 ||
        x === COLS - 1 ||
        y === ROWS - 1 ||
        (x % 2 === 0 && y % 2 === 0)
      )
        row.push("wall");
      else if (random() < 0.3 + level * 0.05 && !(x < 3 && y < 3))
        row.push("block");
      else row.push("empty");
    }

    grid.push(row);
  }
}

// ---------------- ENEMIES ----------------


// ---------------- DRAW ----------------
function draw() {
  if (gameState === "start") return; // canvas is hidden, nothing to draw

  background(18, 18, 30);

  if (gameState === "play") {
    drawGame();
    if (!isPaused) {
      if (!tutorialActive) updateGame(); // freeze game during tutorial
      else updateTutorial();             // only update tutorial logic
    } else {
      drawPauseOverlay();
    }
    if (tutorialActive) drawTutorial();
  } else if (gameState === "gameover") {
    drawGameOver();
  }
}

// ---------------- SCREENS ----------------
function drawStart() {}

function drawGameOver() {
  // Handled by HTML overlay — nothing to draw on canvas
}

function showGameOver() {
  let overlay = document.getElementById("gameOverOverlay");
  let scoreEl = document.getElementById("gameOverScoreDisplay");
  let levelEl = document.getElementById("gameOverLevelDisplay");
  if (overlay) overlay.style.display = "flex";
  if (scoreEl) scoreEl.textContent   = "Score: " + score.toLocaleString();
  if (levelEl) levelEl.textContent   = "Reached Level " + level;
}

// ---------------- DRAW GAME ----------------
function drawGame() {
  drawGrid();

  // Draw player — blink every 6 frames during invulnerability
  if (playerInvul === 0 || frameCount % 6 < 3) {
    image(playerImg, player.x * TILE, player.y * TILE, TILE, TILE);
  }

  enemies.forEach(e => {
  if (e.alive) {
    let img = enemyImgs[e.type] || enemyImgs[1]; // fallback safety
    image(img, e.x * TILE, e.y * TILE, TILE, TILE);
  }
});

  bombs.forEach((b) => {
    image(bombImg, b.x * TILE, b.y * TILE, TILE, TILE);
  });

  explosions.forEach((e) => {
    // Animated explosion: scale up then fade out based on remaining timer
    let progress = 1 - (e.timer / 30); // 0 = just started, 1 = dying
    let scale = 0.8 + progress * 0.5;  // grows from 0.8x to 1.3x
    let alpha = map(e.timer, 0, 30, 0, 255); // fades out as timer → 0

    push();
    tint(255, alpha);
    let drawW = TILE * scale;
    let drawH = TILE * scale;
    let offX = (TILE - drawW) / 2;
    let offY = (TILE - drawH) / 2;

    if (explosionImg) {
      image(explosionImg, e.x * TILE + offX, e.y * TILE + offY, drawW, drawH);
    } else {
      // Fallback: glowing orange rect if image not loaded
      noStroke();
      fill(255, 160 + e.timer * 4, 0, alpha);
      rect(e.x * TILE + offX, e.y * TILE + offY, drawW, drawH, 8);
    }
    pop();
  });

  // ── HUD ──────────────────────────────────────────────────────
  // Pause button drawn on canvas, top-left corner
  let pauseSize = 48;
  let pauseX = 8;
  let pauseY = 8;
  if (pauseImg) {
    image(pauseImg, pauseX, pauseY, pauseSize, pauseSize);
  }

  // Hearts sit right after the pause button
  let heartStartX = pauseX + pauseSize + 8; // 8 + 48 + 8 = 64
  for (let i = 0; i < player.lives; i++) {
    image(heartImg, heartStartX + i * 30, 5, 100, 70);
  }
fill(255, 215, 0); // gold color
stroke(0);
strokeWeight(3);
textSize(20);
textAlign(RIGHT);

text("Score: " + score, width - 15, 25);
fill(0, 255, 255);  // cyan for visibility
stroke(0);
strokeWeight(3);
textSize(22);
textAlign(CENTER);
text("Level " + level, width / 2, 35);
}

// ---------------- TUTORIAL DRAW ----------------
function drawTutorial() {
  if (!tutorialActive || tutorialStep >= TUTORIAL_STEPS.length) return;

  let step = TUTORIAL_STEPS[tutorialStep];
  tutorialPulse += 0.07;

  // ── Dim overlay (semi-transparent dark layer) ──
  push();
  fill(0, 0, 0, 160);
  noStroke();
  rect(0, 0, width, height);
  pop();

  // ── Highlight specific area ──
  drawTutorialHighlight(step.highlight);

  // ── Tutorial card panel ──
  let panelW = 480;
  let panelH = 175;
  let panelX = width / 2 - panelW / 2;
  let panelY = height / 2 - panelH / 2 + 60;

  push();
  // Panel shadow
  fill(0, 0, 0, 120);
  noStroke();
  rect(panelX + 6, panelY + 6, panelW, panelH, 18);

  // Panel background gradient effect (layered rects)
  fill(15, 15, 35, 240);
  rect(panelX, panelY, panelW, panelH, 18);
  fill(30, 30, 60, 180);
  rect(panelX + 2, panelY + 2, panelW - 4, panelH / 2, 16);

  // Glowing border
  let borderGlow = (sin(tutorialPulse) + 1) / 2; // 0–1
  let borderAlpha = 180 + borderGlow * 75;
  stroke(0, 200, 255, borderAlpha);
  strokeWeight(2.5);
  noFill();
  rect(panelX, panelY, panelW, panelH, 18);

  // Step indicator dots
  for (let i = 0; i < TUTORIAL_STEPS.length; i++) {
    let dotX = panelX + panelW / 2 - (TUTORIAL_STEPS.length * 18) / 2 + i * 18 + 7;
    let dotY = panelY + 14;
    noStroke();
    if (i === tutorialStep) {
      fill(0, 200, 255);
      ellipse(dotX, dotY, 10, 10);
    } else if (i < tutorialStep) {
      fill(0, 255, 140);
      ellipse(dotX, dotY, 8, 8);
    } else {
      fill(80, 80, 120);
      ellipse(dotX, dotY, 8, 8);
    }
  }

  // Title
  noStroke();
  fill(0, 220, 255);
  textAlign(CENTER);
  textStyle(BOLD);
  textSize(19);
  text(step.title, width / 2, panelY + 42);

  // Body text
  fill(220, 230, 255);
  textStyle(NORMAL);
  textSize(14);
  textLeading(22);
  text(step.body, width / 2, panelY + 72);

  // "TAP TO CONTINUE" hint (only on last step show nothing extra)
  if (step.waitFor !== "enter") {
    let hintAlpha = 140 + sin(tutorialPulse * 1.5) * 80;
    fill(160, 160, 200, hintAlpha);
    textSize(12);
    text("( Do the action above to continue )", width / 2, panelY + panelH - 14);
  }

  pop();
}

// ---------------- TUTORIAL HIGHLIGHT ----------------
function drawTutorialHighlight(type) {
  let pulse = (sin(tutorialPulse * 2) + 1) / 2;

  push();
  noFill();

  if (type === "move") {
    // Highlight the player + surrounding tiles
    let px = player.x * TILE;
    let py = player.y * TILE;
    stroke(0, 255, 180, 180 + pulse * 75);
    strokeWeight(3);
    rect(px - 4, py - 4, TILE + 8, TILE + 8, 8);

    // Arrow keys diagram above panel
    drawArrowKeys(width / 2, height / 2 - 60);

  } else if (type === "bomb") {
    // Highlight player position
    let px = player.x * TILE;
    let py = player.y * TILE;
    stroke(255, 200, 0, 180 + pulse * 75);
    strokeWeight(3);
    rect(px - 4, py - 4, TILE + 8, TILE + 8, 8);
    drawSpacebarKey(width / 2, height / 2 - 55);

  } else if (type === "explode") {
    // Show blast cross pattern over player
    let cx = player.x;
    let cy = player.y;
    let blastTiles = [
      {x: cx,   y: cy},
      {x: cx+1, y: cy}, {x: cx-1, y: cy},
      {x: cx,   y: cy+1}, {x: cx,   y: cy-1}
    ];
    blastTiles.forEach(t => {
      if (t.x >= 0 && t.x < COLS && t.y >= 0 && t.y < ROWS) {
        fill(255, 100, 0, 60 + pulse * 60);
        noStroke();
        rect(t.x * TILE, t.y * TILE, TILE, TILE);
        stroke(255, 160, 0, 160 + pulse * 95);
        strokeWeight(2);
        noFill();
        rect(t.x * TILE + 2, t.y * TILE + 2, TILE - 4, TILE - 4, 4);
      }
    });

  } else if (type === "enemy") {
    // Highlight first alive enemy
    let target = enemies.find(e => e.alive);
    if (target) {
      stroke(255, 60, 60, 180 + pulse * 75);
      strokeWeight(3);
      rect(target.x * TILE - 4, target.y * TILE - 4, TILE + 8, TILE + 8, 8);
      // Arrow pointing to enemy
      fill(255, 60, 60, 200 + pulse * 55);
      noStroke();
      textAlign(CENTER);
      textSize(22);
      text("↑  ENEMY", target.x * TILE + TILE / 2, target.y * TILE - 10);
    }
  }
  pop();
}

// ── Arrow keys diagram ──
function drawArrowKeys(cx, cy) {
  let kw = 36, kh = 32, gap = 4;
  push();
  textAlign(CENTER);
  textStyle(NORMAL);

  let keys = [
    { label: "↑", dx: 0,        dy: -(kh + gap) },
    { label: "←", dx: -(kw + gap), dy: 0 },
    { label: "↓", dx: 0,        dy: 0 },
    { label: "→", dx: (kw + gap),  dy: 0 }
  ];

  keys.forEach(k => {
    let x = cx + k.dx - kw / 2;
    let y = cy + k.dy - kh / 2;

    // Key shadow
    fill(0, 0, 0, 120);
    noStroke();
    rect(x + 3, y + 4, kw, kh, 6);

    // Key body
    fill(30, 30, 60);
    stroke(0, 200, 255, 200);
    strokeWeight(1.5);
    rect(x, y, kw, kh, 6);

    // Key label
    fill(0, 220, 255);
    noStroke();
    textSize(16);
    text(k.label, cx + k.dx, cy + k.dy + 6);
  });
  pop();
}

// ── Spacebar key diagram ──
function drawSpacebarKey(cx, cy) {
  let kw = 140, kh = 32;
  push();
  let x = cx - kw / 2;
  let y = cy - kh / 2;

  fill(0, 0, 0, 120);
  noStroke();
  rect(x + 3, y + 4, kw, kh, 6);

  fill(30, 30, 60);
  stroke(255, 200, 0, 200);
  strokeWeight(1.5);
  rect(x, y, kw, kh, 6);

  fill(255, 215, 0);
  noStroke();
  textAlign(CENTER);
  textStyle(NORMAL);
  textSize(13);
  text("S P A C E", cx, cy + 6);
  pop();
}

// ---------------- TUTORIAL UPDATE ----------------
function updateTutorial() {
  // Bombs still tick during tutorial so explosion step can complete
  for (let i = bombs.length - 1; i >= 0; i--) {
    bombs[i].timer--;
    if (bombs[i].timer <= 0) {
      explode(bombs[i]);
      bombs.splice(i, 1);
      tutorialBombExploded = true;
    }
  }

  if (bombs.length > 0) {
    if (!tickSound.isPlaying()) tickSound.loop();
  } else {
    tickSound.stop();
  }

  explosions = explosions.filter(e => { e.timer--; return e.timer > 0; });

  // Auto-advance steps based on what happened
  let step = TUTORIAL_STEPS[tutorialStep];

  if (step.waitFor === "move"    && tutorialMoved)        advanceTutorial();
  if (step.waitFor === "bomb"    && tutorialBombPlaced)   advanceTutorial();
  if (step.waitFor === "explode" && tutorialBombExploded) advanceTutorial();
  if (step.waitFor === "kill"    && tutorialEnemyKilled)  advanceTutorial();
}

function advanceTutorial() {
  tutorialStep++;
  if (tutorialStep >= TUTORIAL_STEPS.length) {
    tutorialActive = false; // tutorial complete, game runs normally
  }
}

function dismissTutorial() {
  tutorialActive = false;
  tutorialStep = TUTORIAL_STEPS.length;
}

function drawGrid() {
  image(mapImg, 0, 0, width, height);

  const drawSize = TILE * TILE_SCALE;

  // ✅ Get block aspect ratio (reference size)
  const blockRatio = blockImg.width / blockImg.height;

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (x === 0 || x === COLS - 1 || y === 0 || y === ROWS - 1) continue;

      if (grid[y][x] === "wall" || grid[y][x] === "block") {
        push();

        clip(() => {
          rect(x * TILE, y * TILE, TILE, TILE);
        });

        let drawWidth = drawSize;
        let drawHeight = drawSize;

        if (grid[y][x] === "wall") {
          drawWidth = drawSize;
          drawHeight = drawSize / blockRatio;

          image(
            blockImg,
            x * TILE + (TILE - drawWidth) / 2,
            y * TILE + (TILE - drawHeight) / 2,
            drawWidth,
            drawHeight
          );
        } else {
          drawWidth = drawSize;
          drawHeight = drawSize / blockRatio;

          image(
            boxImg,
            x * TILE + (TILE - drawWidth) / 2,
            y * TILE + (TILE - drawHeight) / 2,
            drawWidth,
            drawHeight
          );
        }

        pop();
      }
    }
  }
}

// ---------------- UPDATE ----------------
function updateGame() {
  // Tick down invulnerability
  if (playerInvul > 0) playerInvul--;

  for (let i = bombs.length - 1; i >= 0; i--) {
    bombs[i].timer--;
    if (bombs[i].timer <= 0) {
      explode(bombs[i]);
      bombs.splice(i, 1);
    }
  }

  // Tick only if bomb exists
  if (bombs.length > 0) {
    if (!tickSound.isPlaying()) tickSound.loop();
  } else {
    tickSound.stop();
  }

  explosions = explosions.filter((e) => {
    e.timer--;
    return e.timer > 0;
  });

  // Enemies are frozen during tutorial steps 0–2 (move, bomb, explode)
  let enemiesActive = !(tutorialActive && tutorialStep <= 2);

  enemies.forEach((e) => {
    if (!e.alive) return;
    if (!enemiesActive) return;

    if (frameCount % max(10, 35 - level * 2) === 0) {
      let dx = player.x - e.x;
      let dy = player.y - e.y;

      let moveX = dx !== 0 ? dx / abs(dx) : 0;
      let moveY = dy !== 0 ? dy / abs(dy) : 0;

      // Try preferred direction first, then fallback — block if another enemy is there
      if (abs(dx) > abs(dy)) {
        let tx = e.x + moveX, ty = e.y;
        if (tx >= 0 && tx < COLS && grid[ty][tx] === "empty" && !isEnemyAt(tx, ty)) {
          e.x = tx;
        } else {
          tx = e.x; ty = e.y + moveY;
          if (ty >= 0 && ty < ROWS && grid[ty][tx] === "empty" && !isEnemyAt(tx, ty)) {
            e.y = ty;
          }
        }
      } else {
        let tx = e.x, ty = e.y + moveY;
        if (ty >= 0 && ty < ROWS && grid[ty][tx] === "empty" && !isEnemyAt(tx, ty)) {
          e.y = ty;
        } else {
          tx = e.x + moveX; ty = e.y;
          if (tx >= 0 && tx < COLS && grid[ty][tx] === "empty" && !isEnemyAt(tx, ty)) {
            e.x = tx;
          }
        }
      }
    }

    // Skip collision if player is invulnerable (just respawned)
    if (playerInvul > 0) return;

    // Enemy touches player → instant game over (lose a life then check)
    if (e.x === player.x && e.y === player.y) {
      player.lives--;
      if (player.lives <= 0) {
        if (bgMusic && bgMusic.isPlaying()) bgMusic.stop();
        if (tickSound && tickSound.isPlaying()) tickSound.stop();
        if (explosionSound && explosionSound.isPlaying()) explosionSound.stop();
        gameOverSound.play();
        showGameOver();
        if (typeof showNameEntry === "function") showNameEntry(score);
        gameState = "gameover";
      } else {
        // Still has lives — respawn player and flash invulnerability
        player.x = 1;
        player.y = 1;
        playerInvul = INVUL_FRAMES;
      }
    }
  });

  if (enemies.every((e) => !e.alive)) {
    level++;
    startLevel();
  }
}

// ---------------- EXPLOSION ----------------
function explode(bomb) {
  explosionSound.play();

  let tiles = [
    { x: bomb.x, y: bomb.y },
    { x: bomb.x + 1, y: bomb.y },
    { x: bomb.x - 1, y: bomb.y },
    { x: bomb.x, y: bomb.y + 1 },
    { x: bomb.x, y: bomb.y - 1 },
  ];

  tiles.forEach((t) => {
    if (gameState === "gameover") return; // stop processing after death
    if (grid[t.y] && grid[t.y][t.x] !== "wall") {
      explosions.push({ x: t.x, y: t.y, timer: 30 }); // 30 frames ≈ 0.5s

      if (grid[t.y][t.x] === "block") grid[t.y][t.x] = "empty";

      enemies.forEach((e) => {
        if (e.alive && e.x === t.x && e.y === t.y) {
          if (e.type === "boss") {
            e.hp--;
            if (e.hp <= 0) {
              e.alive = false;
              score += e.score;
              if (tutorialActive) tutorialEnemyKilled = true;
            }
          } else {
            e.alive = false;
            score += e.score;
            if (tutorialActive) tutorialEnemyKilled = true;
          }
        }
      });

      if (player.x === t.x && player.y === t.y) {
        player.lives--;
        player.x = 1;
        player.y = 1;

        if (player.lives <= 0) {
          if (bgMusic && bgMusic.isPlaying()) bgMusic.stop();
          if (tickSound && tickSound.isPlaying()) tickSound.stop();
          if (explosionSound && explosionSound.isPlaying()) explosionSound.stop();
          gameOverSound.play();
          showGameOver();
          if (typeof showNameEntry === "function") showNameEntry(score);
          gameState = "gameover";
        } else {
          playerInvul = INVUL_FRAMES;
        }
      }
    }
  });
}

// ---------------- INPUT ----------------
function keyPressed() {
  userStartAudio();
if (keyCode === ESCAPE && gameState === "play") {
  isPaused = !isPaused;
  let overlay = document.getElementById("pauseMenuOverlay");
  if (overlay) overlay.style.display = isPaused ? "flex" : "none";
  return;
}
  if (gameState !== "play") return;
  if (isPaused) return;

  let nx = player.x;
  let ny = player.y;

  if (keyCode === LEFT_ARROW)  nx--;
  if (keyCode === RIGHT_ARROW) nx++;
  if (keyCode === UP_ARROW)    ny--;
  if (keyCode === DOWN_ARROW)  ny++;

  if (grid[ny] && grid[ny][nx] === "empty" && !isBombAt(nx, ny)) {
    player.x = nx;
    player.y = ny;
    if (tutorialActive) tutorialMoved = true;
  }

  // LIMIT TO 1 BOMB
  if (key === " " && bombs.length === 0) {
    bombs.push({ x: player.x, y: player.y, timer: 60 });
    if (tutorialActive) tutorialBombPlaced = true; // track for tutorial step 2
  }

  // Last tutorial step: ENTER dismisses tutorial
  if (tutorialActive && tutorialStep === TUTORIAL_STEPS.length - 1 && keyCode === ENTER) {
    dismissTutorial();
  }
}

// ---------------- MOUSE CLICK (pause button on canvas) ----------------
function mousePressed() {
  if (gameState !== "play") return;

  // Pause button hit area: x 8–56, y 8–56
  if (mouseX >= 8 && mouseX <= 56 && mouseY >= 8 && mouseY <= 56) {
    isPaused = !isPaused;
    let overlay = document.getElementById("pauseMenuOverlay");
    if (overlay) overlay.style.display = isPaused ? "flex" : "none";
  }
}

// ---------------- BOMB COLLISION HELPER ----------------
function isBombAt(x, y) {
  return bombs.some(b => b.x === x && b.y === y);
}

function fadeMusic(fromTrack, toTrack) {
  if (!fromTrack || !toTrack) return;

  let fadeDuration = 1.5; // seconds

  // fade out menu music
  fromTrack.setVolume(0, fadeDuration);

  setTimeout(() => {
    fromTrack.stop();

    // start game music
    toTrack.setVolume(0);
    toTrack.loop();

    // fade in game music
    toTrack.setVolume(musicVolume, fadeDuration);
  }, fadeDuration * 1000);
}

function drawPauseOverlay() {
  // Pause UI is handled by the HTML #pauseMenuOverlay modal
}

// ---------------- TOUCH / MOBILE CONTROLS ----------------
// Called by the on-screen D-pad buttons in index.html
function handleTouchMove(dir) {
  if (gameState !== "play" || isPaused) return;
  userStartAudio();

  let nx = player.x;
  let ny = player.y;

  if (dir === "left")  nx--;
  if (dir === "right") nx++;
  if (dir === "up")    ny--;
  if (dir === "down")  ny++;

  if (grid[ny] && grid[ny][nx] === "empty" && !isBombAt(nx, ny)) {
    player.x = nx;
    player.y = ny;
    if (tutorialActive) tutorialMoved = true;
  }
}

function handleTouchBomb() {
  if (gameState !== "play" || isPaused) return;
  userStartAudio();
  if (bombs.length === 0) {
    bombs.push({ x: player.x, y: player.y, timer: 60 });
    if (tutorialActive) tutorialBombPlaced = true;
  }

  // Handle last tutorial step dismiss
  if (tutorialActive && tutorialStep === TUTORIAL_STEPS.length - 1) {
    dismissTutorial();
  }
}