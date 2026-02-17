// ANIME BLAST ARENA



const TILE = 60;
const COLS = 13;
const ROWS = 11;

// scale factor for wall/box sprites relative to TILE; >1 makes them larger than
// the nominal cell size so they can cover grid lines or bleed into neighboring
// cells if desired.
const TILE_SCALE = 1.5; // adjust this value (e.g. 1.0 = same size; 1.5 = 50% bigger)

let grid = [];
let player;
let enemies = [];
let bombs = [];
let explosions = [];

let gameState = "start";
let level = 1;

// Assets
let playerImg, enemyImg, bombImg, mapImg, blockImg, boxImg;
let tickSound, explosionSound, gameOverSound;

// Animation variables
let playerFrameWidth, playerFrameHeight;
let playerFrameCount = 4;
let playerCurrentFrame = 0;
let playerAnimSpeed = 10; // Frames between animation updates

// ---------------- PRELOAD ----------------
function preload() {
  mapImg = loadImage("assets/arena1.png");
  playerImg = loadImage("assets/player.gif");
  enemyImg = loadImage("assets/enemy.gif");
  bombImg = loadImage("assets/bomb.png");
  blockImg = loadImage("assets/block.png");  // Undestructible wall
  boxImg = loadImage("assets/box.png");      // Destructible block

  // Get dimensions for sprite animation
  if (playerImg) {
    playerFrameWidth = playerImg.width / 4; // 4 frame animation
    playerFrameHeight = playerImg.height;
  }

  tickSound = loadSound("assets/bomb.wav");
  explosionSound = loadSound("assets/explosion.wav");
  gameOverSound = loadSound("assets/gameover.wav");
}

// ---------------- SETUP ----------------
function setup() {
  createCanvas(COLS * TILE, ROWS * TILE);
  pixelDensity(1);
  noSmooth();   // keeps pixel art sharp when scaled

  centerCanvas();
  startLevel();
}

// ---------------- CENTER CANVAS ----------------
function centerCanvas() {
  let x = (windowWidth - width) / 2;
  let y = (windowHeight - height) / 2;

  let c = document.querySelector("canvas");
  c.style.position = "absolute";
  c.style.left = x + "px";
  c.style.top = y + "px";
}

function windowResized() {
  centerCanvas();
}

// ---------------- LEVEL ----------------
function startLevel() {
  bombs = [];
  explosions = [];
  createGrid();
  player = { x: 1, y: 1, lives: 3 };
  createEnemies();
}

// ---------------- GRID ----------------
function createGrid() {
  grid = [];
  for (let y = 0; y < ROWS; y++) {
    let row = [];
    for (let x = 0; x < COLS; x++) {
      if (
        x === 0 || y === 0 ||
        x === COLS - 1 || y === ROWS - 1 ||
        (x % 2 === 0 && y % 2 === 0)
      ) row.push("wall");
      else if (random() < 0.3 + level * 0.05 && !(x < 3 && y < 3))
        row.push("block");
      else row.push("empty");
    }
    grid.push(row);
  }
}

// ---------------- ENEMIES ----------------
function createEnemies() {
  enemies = [];
  for (let i = 0; i < level + 2; i++) {
    enemies.push({
      x: COLS - 2,
      y: ROWS - 2 - i,
      alive: true
    });
  }
}

// ---------------- DRAW ----------------
function draw() {
  background(18, 18, 30);

  if (gameState === "start") drawStart();
  else if (gameState === "play") {
    drawGame();
    updateGame();
  }
  else if (gameState === "gameover") drawGameOver();
}

// ---------------- SCREENS ----------------
function drawStart() {
  fill(255);
  textAlign(CENTER);
  textSize(30);
  text("Anime Blast Arena", width / 2, height / 2 - 40);
  textSize(18);
  text("Arrow Keys: Move\nSpace: Bomb\nENTER: Start", width / 2, height / 2 + 30);
}

function drawGameOver() {
  fill(255, 80, 80);
  textAlign(CENTER);
  textSize(30);
  text("Game Over", width / 2, height / 2);
  textSize(18);
  text("Press ENTER to Restart", width / 2, height / 2 + 40);
}

// ---------------- DRAW GAME ----------------
function drawGame() {
  drawGrid();

  image(playerImg, player.x * TILE, player.y * TILE, TILE, TILE);

  enemies.forEach(e => {
    if (e.alive)
      image(enemyImg, e.x * TILE, e.y * TILE, TILE, TILE);
  });

  bombs.forEach(b => {
    image(bombImg, b.x * TILE, b.y * TILE, TILE, TILE);
  });

  explosions.forEach(e => {
    fill(255, 200, 0);
    rect(e.x * TILE, e.y * TILE, TILE, TILE);
  });

  fill(255);
  textSize(16);
  text(`Lives: ${player.lives}   Level: ${level}`, 15, 25);
}

function drawGrid() {
  // Draw the full map image as background, stretched to fill the entire canvas
  image(mapImg, 0, 0, width, height);

  // Draw walls and blocks on top, but skip the outer border entirely
  // apply scaling so the sprites can grow to fill or overlap the grid cell
  const drawSize = TILE * TILE_SCALE;
  
  // Offset to center the scaled sprite within the cell (removes gap between block and box)
  const offset = (drawSize - TILE) / 2;

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      // skip edges: any tile at x=0, x=COLS-1, y=0 or y=ROWS-1
      if (x === 0 || x === COLS - 1 || y === 0 || y === ROWS - 1) {
        continue;
      }

      if (grid[y][x] === "wall") {
        image(blockImg, x * TILE - offset, y * TILE - offset, drawSize, drawSize);
      } else if (grid[y][x] === "block") {
        image(boxImg, x * TILE - offset, y * TILE - offset, drawSize, drawSize);
      }
    }
  }

  // grid lines are hidden for a cleaner look
  // stroke(0, 50);
  // noFill();
  // for (let y = 0; y < ROWS; y++) {
  //   for (let x = 0; x < COLS; x++) {
  //     rect(x * TILE, y * TILE, TILE, TILE);
  //   }
  // }
  // noStroke();
}

// ---------------- UPDATE ----------------
function updateGame() {

  bombs.forEach((b, i) => {
    b.timer--;

    if (b.timer <= 0) {
      explode(b);
      bombs.splice(i, 1);
    }
  });

  // Tick only if bomb exists
  if (bombs.length > 0) {
    if (!tickSound.isPlaying()) tickSound.loop();
  } else {
    tickSound.stop();
  }

  explosions = explosions.filter(e => {
    e.timer--;
    return e.timer > 0;
  });

  enemies.forEach(e => {
    if (!e.alive) return;

    if (frameCount % max(10, 35 - level * 2) === 0) {
      let dx = player.x - e.x;
      let dy = player.y - e.y;

      let moveX = dx !== 0 ? dx / abs(dx) : 0;
      let moveY = dy !== 0 ? dy / abs(dy) : 0;

      if (abs(dx) > abs(dy)) {
        if (grid[e.y][e.x + moveX] === "empty") e.x += moveX;
        else if (grid[e.y + moveY][e.x] === "empty") e.y += moveY;
      } else {
        if (grid[e.y + moveY][e.x] === "empty") e.y += moveY;
        else if (grid[e.y][e.x + moveX] === "empty") e.x += moveX;
      }
    }

    if (e.x === player.x && e.y === player.y) {
      player.lives--;
      player.x = 1;
      player.y = 1;
      if (player.lives <= 0) {
        gameOverSound.play();
        gameState = "gameover";
      }
    }
  });

  if (enemies.every(e => !e.alive)) {
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
    { x: bomb.x, y: bomb.y - 1 }
  ];

  tiles.forEach(t => {
    if (grid[t.y] && grid[t.y][t.x] !== "wall") {

      explosions.push({ x: t.x, y: t.y, timer: 20 });

      if (grid[t.y][t.x] === "block")
        grid[t.y][t.x] = "empty";

      enemies.forEach(e => {
        if (e.alive && e.x === t.x && e.y === t.y)
          e.alive = false;
      });

      if (player.x === t.x && player.y === t.y) {
        player.lives--;
        player.x = 1;
        player.y = 1;
        if (player.lives <= 0) {
          gameOverSound.play();
          gameState = "gameover";
        }
      }
    }
  });
}

// ---------------- INPUT ----------------
function keyPressed() {

  if (gameState === "start" && keyCode === ENTER)
    gameState = "play";

  if (gameState === "gameover" && keyCode === ENTER) {
    level = 1;
    startLevel();
    gameState = "play";
  }

  if (gameState !== "play") return;

  let nx = player.x;
  let ny = player.y;

  if (keyCode === LEFT_ARROW) nx--;
  if (keyCode === RIGHT_ARROW) nx++;
  if (keyCode === UP_ARROW) ny--;
  if (keyCode === DOWN_ARROW) ny++;

  if (grid[ny] && grid[ny][nx] === "empty") {
    player.x = nx;
    player.y = ny;
  }

  // ✅ LIMIT TO 1 BOMB
  if (key === " " && bombs.length === 0) {
    bombs.push({ x: player.x, y: player.y, timer: 60 });
  }
}
