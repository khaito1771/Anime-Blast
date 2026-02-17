// Player module for Anime Blast Arena

// Player object - declared globally so it can be accessed from sketch.js
let player;

// ---------------- CREATE PLAYER ----------------
function createPlayer() {
  player = {
    x: 1,
    y: 1,
    lives: 3
  };
  return player;
}

// ---------------- DRAW PLAYER ----------------
function drawPlayer() {
  if (player && playerImg) {
    image(playerImg, player.x * TILE, player.y * TILE, TILE, TILE);
  }
}

// ---------------- MOVE PLAYER ----------------
function movePlayer(nx, ny) {
  // Check bounds and empty cell
  if (grid[ny] && grid[ny][nx] === "empty") {
    player.x = nx;
    player.y = ny;
    return true;
  }
  return false;
}

// ---------------- PLAYER HIT ----------------
function playerHit() {
  player.lives--;
  player.x = 1;
  player.y = 1;
  
  if (player.lives <= 0) {
    if (typeof gameOverSound !== 'undefined' && gameOverSound) {
      gameOverSound.play();
    }
    gameState = "gameover";
  }
}

// ---------------- GET PLAYER POSITION ----------------
function getPlayerPosition() {
  return { x: player.x, y: player.y };
}
