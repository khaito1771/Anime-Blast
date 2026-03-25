// Enemy module for Anime Blast Arena

// Enemies array - declared globally so it can be accessed from sketch.js
let enemies = [];

// ---------------- CREATE ENEMIES ----------------
function createEnemies() {
  enemies = [];

  let enemyCount = level + 2;

  for (let i = 0; i < enemyCount; i++) {

    let type;

    // Boss appears at level 5
    if (level >= 5 && i === 0) {
      type = "boss";
    } else {
      type = floor(random(1, 5));
    }

    let x, y;

    // Find random empty tile
    do {
      x = floor(random(1, COLS - 1));
      y = floor(random(1, ROWS - 1));
    } while (
      grid[y][x] !== "empty" ||     // must be empty tile
      (x <= 2 && y <= 2) ||         // avoid player spawn area
      isEnemyAt(x, y)               // avoid overlapping enemies
    );

    enemies.push({
      x: x,
      y: y,
      alive: true,
      type: type,
      hp: type === "boss" ? 3 : 1,
      score: enemyData[type].score
    });
  }

  return enemies;
}
// ---------------- DRAW ENEMIES ----------------
function drawEnemies() {
  enemies.forEach((e) => {
    if (e.alive) {
      let img = enemyImgs[e.type] || enemyImgs[1];
      image(img, e.x * TILE, e.y * TILE, TILE, TILE);
    }
  });
}
// ---------------- UPDATE ENEMIES ----------------
function updateEnemies() {
  enemies.forEach((e) => {
    if (!e.alive) return;

    if (frameCount % max(10, 35 - level * 2) === 0) {
      let playerPos = getPlayerPosition();

      let dx = playerPos.x - e.x;
      let dy = playerPos.y - e.y;

      let moveX = dx !== 0 ? dx / abs(dx) : 0;
      let moveY = dy !== 0 ? dy / abs(dy) : 0;

      if (abs(dx) > abs(dy)) {
        if (
          grid[e.y][e.x + moveX] === "empty" &&
          !isEnemyAt(e.x + moveX, e.y)
        ) {
          e.x += moveX;
        } else if (
          grid[e.y + moveY][e.x] === "empty" &&
          !isEnemyAt(e.x, e.y + moveY)
        ) {
          e.y += moveY;
        }
      } else {
        if (
          grid[e.y + moveY][e.x] === "empty" &&
          !isEnemyAt(e.x, e.y + moveY)
        ) {
          e.y += moveY;
        } else if (
          grid[e.y][e.x + moveX] === "empty" &&
          !isEnemyAt(e.x + moveX, e.y)
        ) {
          e.x += moveX;
        }
      }
    }

    // Check collision with player
    let playerPos = getPlayerPosition();

    if (e.x === playerPos.x && e.y === playerPos.y) {
      playerHit();
    }
  });
}

// ---------------- KILL ENEMY ----------------
function killEnemyAt(x, y) {
  enemies.forEach((e) => {
    if (e.alive && e.x === x && e.y === y) {
      e.alive = false;
    }
  });
}

// ---------------- CHECK ALL ENEMIES DEAD ----------------
function allEnemiesDead() {
  return enemies.every((e) => !e.alive);
}

// ---------------- GET ENEMIES ----------------
function getEnemies() {
  return enemies;
}

// ---------------- CHECK IF ENEMY AT POSITION ----------------
function isEnemyAt(x, y) {
  return enemies.some((e) => e.alive && e.x === x && e.y === y);
}