const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const statusEl = document.getElementById("status");

const GRAVITY = 0.8;
const GROUND_Y = 320;
const JUMP_FORCE = -14;
const OBSTACLE_SPEED_START = 6;
const MIN_OBSTACLE_GAP = 140;
const MAX_OBSTACLE_GAP = 220;
const SPEED_INCREASE_INTERVAL = 5;
const SPEED_INCREASE_FACTOR = 1.12;
const MAX_OBSTACLES_ON_SCREEN = 2;
const DECOR_SPEED_FACTOR = 0.4;
const MIN_DECOR_GAP = 80;
const MAX_DECOR_GAP = 150;

let score = 0;
let gameOver = false;
let frameCount = 0;
let obstacleSpeed = OBSTACLE_SPEED_START;
let nextObstacleAt = MIN_OBSTACLE_GAP;
let nextDecorAt = MIN_DECOR_GAP;
let jumpQueued = false;

const HIGH_SCORE_KEY = "mini_runner_high_score";
let highScore = Number.parseInt(localStorage.getItem(HIGH_SCORE_KEY) || "0", 10);
if (Number.isNaN(highScore)) {
  highScore = 0;
}

const player = {
  x: 100,
  y: GROUND_Y - 70,
  width: 50,
  height: 70,
  velocityY: 0,
  jumping: false
};

const obstacles = [];
const desertDecor = [];

function resetGame() {
  score = 0;
  gameOver = false;
  frameCount = 0;
  obstacleSpeed = OBSTACLE_SPEED_START;
  obstacles.length = 0;
  desertDecor.length = 0;
  nextObstacleAt = MIN_OBSTACLE_GAP;
  nextDecorAt = MIN_DECOR_GAP;

  player.y = GROUND_Y - player.height;
  player.velocityY = 0;
  player.jumping = false;

  scoreEl.textContent = "Score: 0";
  highScoreEl.textContent = `High Score: ${highScore}`;
  statusEl.textContent = "Running";
}

function jump() {
  if (gameOver) {
    resetGame();
    return;
  }

  if (!player.jumping) {
    player.velocityY = JUMP_FORCE;
    player.jumping = true;
    jumpQueued = false;
  }
}

function queueJump() {
  jumpQueued = true;
  jump();
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    queueJump();
  }
});

document.addEventListener("keyup", (e) => {
  if (e.code === "Space") {
    jumpQueued = false;
  }
});

function spawnObstacle() {
  const height = 58 + Math.random() * 12;
  const width = 36 + Math.random() * 14;

  obstacles.push({
    x: canvas.width,
    y: GROUND_Y - height,
    width,
    height
  });

  nextObstacleAt = frameCount + MIN_OBSTACLE_GAP + Math.random() * (MAX_OBSTACLE_GAP - MIN_OBSTACLE_GAP);
}

function spawnDesertDecor() {
  const types = ["rock", "bush", "bones"];
  const type = types[Math.floor(Math.random() * types.length)];
  const scale = 0.7 + Math.random() * 0.8;

  desertDecor.push({
    x: canvas.width + 10,
    y: GROUND_Y - (28 + Math.random() * 42),
    type,
    scale
  });

  nextDecorAt = frameCount + MIN_DECOR_GAP + Math.random() * (MAX_DECOR_GAP - MIN_DECOR_GAP);
}

function updatePlayer() {
  player.velocityY += GRAVITY;
  player.y += player.velocityY;

  if (player.y >= GROUND_Y - player.height) {
    player.y = GROUND_Y - player.height;
    player.velocityY = 0;
    player.jumping = false;

    if (jumpQueued && !gameOver) {
      jump();
    }
  }
}

function updateObstacles() {
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].x -= obstacleSpeed;

    if (obstacles[i].x + obstacles[i].width < 0) {
      obstacles.splice(i, 1);
      score++;
      scoreEl.textContent = `Score: ${score}`;

      if (score > highScore) {
        highScore = score;
        localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
        highScoreEl.textContent = `High Score: ${highScore}`;
      }

      if (score % SPEED_INCREASE_INTERVAL === 0) {
        obstacleSpeed *= SPEED_INCREASE_FACTOR;
      }
    }
  }
}

function updateDesertDecor() {
  for (let i = desertDecor.length - 1; i >= 0; i--) {
    const decor = desertDecor[i];
    decor.x -= obstacleSpeed * DECOR_SPEED_FACTOR;

    if (decor.x < -80) {
      desertDecor.splice(i, 1);
    }
  }
}

function checkCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}


function getCactusHitboxes(obstacle) {
  const { x, y, width, height } = obstacle;
  const armWidth = Math.max(8, width * 0.28);
  const armHeight = height * 0.42;

  return [
    { x: x + width * 0.28, y, width: width * 0.44, height },
    { x: x + width * 0.08, y: y + height * 0.3, width: armWidth, height: armHeight },
    { x: x + width * 0.08, y: y + height * 0.28, width: width * 0.22, height: armWidth * 0.65 },
    { x: x + width * 0.7, y: y + height * 0.2, width: armWidth, height: armHeight },
    { x: x + width * 0.62, y: y + height * 0.18, width: width * 0.22, height: armWidth * 0.65 }
  ];
}

function detectCollisions() {
  for (const obstacle of obstacles) {
    const cactusHitboxes = getCactusHitboxes(obstacle);
    const hit = cactusHitboxes.some((hitbox) => checkCollision(player, hitbox));

    if (hit) {
      gameOver = true;
      statusEl.textContent = "Game Over - Press Space to Restart";
      break;
    }
  }
}

function drawGround() {
  const groundGradient = ctx.createLinearGradient(0, GROUND_Y, 0, canvas.height);
  groundGradient.addColorStop(0, "#6e4621");
  groundGradient.addColorStop(1, "#4f2d12");
  ctx.fillStyle = groundGradient;
  ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);

  ctx.strokeStyle = "rgba(255, 222, 173, 0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + 16);
  for (let x = 0; x <= canvas.width; x += 30) {
    ctx.lineTo(x, GROUND_Y + 14 + Math.sin((x + frameCount) * 0.03) * 3);
  }
  ctx.stroke();
}

function drawPlayer() {
  const x = player.x;
  const y = player.y;
  const isRunning = !player.jumping && !gameOver;
  const runCycle = Math.sin(frameCount * 0.45);
  const legSwing = isRunning ? runCycle * 4 : 0;
  const shoeSwing = isRunning ? runCycle * 5 : 0;
  const armSwing = isRunning ? -runCycle * 3 : 0;

  // Shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.beginPath();
  ctx.ellipse(x + 25, GROUND_Y + 5, 20 + Math.abs(legSwing) * 0.5, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = "#1f1f26";
  ctx.fillRect(x + 12, y + 46 + legSwing, 11, 24 - legSwing);
  ctx.fillRect(x + 27, y + 46 - legSwing, 11, 24 + legSwing);

  // Shoes
  ctx.fillStyle = "#f5f5f5";
  ctx.fillRect(x + 10, y + 66 + shoeSwing, 14, 4);
  ctx.fillRect(x + 25, y + 66 - shoeSwing, 14, 4);

  // Jacket
  const jacketGradient = ctx.createLinearGradient(x + 6, y + 22, x + 44, y + 48);
  jacketGradient.addColorStop(0, "#f7f7f7");
  jacketGradient.addColorStop(1, "#d8d8d8");
  ctx.fillStyle = jacketGradient;
  ctx.fillRect(x + 8, y + 22, 34, 26);

  // Arms
  ctx.fillStyle = "#5b3c2d";
  ctx.fillRect(x + 4, y + 25 + armSwing, 6, 19);
  ctx.fillRect(x + 40, y + 25 - armSwing, 6, 19);

  // Neck
  ctx.fillRect(x + 21, y + 18, 8, 6);

  // Head
  const skinGradient = ctx.createRadialGradient(x + 24, y + 10, 3, x + 25, y + 12, 16);
  skinGradient.addColorStop(0, "#9b6a4f");
  skinGradient.addColorStop(1, "#5b3c2d");
  ctx.fillStyle = skinGradient;
  ctx.beginPath();
  ctx.ellipse(x + 25, y + 12, 13, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hairline
  ctx.fillStyle = "#201712";
  ctx.beginPath();
  ctx.ellipse(x + 25, y + 4, 11, 4, 0, Math.PI, 0);
  ctx.fill();

  // Eyes + eyebrows
  ctx.fillStyle = "#111";
  ctx.fillRect(x + 19, y + 10, 3, 2);
  ctx.fillRect(x + 28, y + 10, 3, 2);
  ctx.fillRect(x + 18, y + 8, 4, 1);
  ctx.fillRect(x + 28, y + 8, 4, 1);

  // Nose
  ctx.fillStyle = "rgba(40, 20, 12, 0.45)";
  ctx.fillRect(x + 24, y + 12, 2, 3);

  // Beard / goatee detail
  ctx.fillStyle = "#1f1612";
  ctx.fillRect(x + 22, y + 16, 6, 2);

  // Sunglasses for style
  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(x + 17, y + 9, 16, 4);
}

function drawCactus(x, y, width, height) {
  const bodyColor = "#2f9c3f";
  const highlightColor = "#58c35d";
  const armWidth = Math.max(8, width * 0.28);
  const armHeight = height * 0.42;

  // Main trunk
  ctx.fillStyle = bodyColor;
  ctx.fillRect(x + width * 0.28, y, width * 0.44, height);

  // Left arm
  ctx.fillRect(x + width * 0.08, y + height * 0.3, armWidth, armHeight);
  ctx.fillRect(x + width * 0.08, y + height * 0.28, width * 0.22, armWidth * 0.65);

  // Right arm
  ctx.fillRect(x + width * 0.7, y + height * 0.2, armWidth, armHeight);
  ctx.fillRect(x + width * 0.62, y + height * 0.18, width * 0.22, armWidth * 0.65);

  // Highlights
  ctx.fillStyle = highlightColor;
  ctx.fillRect(x + width * 0.34, y + 6, width * 0.06, height - 12);
  ctx.fillRect(x + width * 0.14, y + height * 0.34, width * 0.05, armHeight - 4);
  ctx.fillRect(x + width * 0.76, y + height * 0.24, width * 0.05, armHeight - 4);

  // Spikes
  ctx.strokeStyle = "#d6f5cf";
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const spikeY = y + 8 + i * (height / 7);
    ctx.beginPath();
    ctx.moveTo(x + width * 0.28, spikeY);
    ctx.lineTo(x + width * 0.23, spikeY - 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + width * 0.72, spikeY);
    ctx.lineTo(x + width * 0.77, spikeY - 2);
    ctx.stroke();
  }
}

function drawObstacles() {
  for (const obstacle of obstacles) {
    drawCactus(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  }
}

function drawBackground() {
  const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  skyGradient.addColorStop(0, "#7d4d2a");
  skyGradient.addColorStop(1, "#5c361d");
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Sun glow
  const sunGlow = ctx.createRadialGradient(740, 85, 10, 740, 85, 110);
  sunGlow.addColorStop(0, "rgba(255, 211, 138, 0.85)");
  sunGlow.addColorStop(1, "rgba(255, 211, 138, 0)");
  ctx.fillStyle = sunGlow;
  ctx.beginPath();
  ctx.arc(740, 85, 110, 0, Math.PI * 2);
  ctx.fill();

  // Distant hills
  ctx.fillStyle = "rgba(68, 36, 16, 0.55)";
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.quadraticCurveTo(180, 250, 350, GROUND_Y);
  ctx.quadraticCurveTo(500, 230, 700, GROUND_Y);
  ctx.quadraticCurveTo(790, 255, 900, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  drawDesertDecor();
}

function drawRock(decor) {
  const { x, y, scale } = decor;
  const rockWidth = 24 * scale;
  const rockHeight = 14 * scale;

  ctx.fillStyle = "rgba(78, 51, 28, 0.85)";
  ctx.beginPath();
  ctx.ellipse(x, y, rockWidth, rockHeight, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(116, 82, 51, 0.45)";
  ctx.beginPath();
  ctx.ellipse(x - rockWidth * 0.25, y - rockHeight * 0.15, rockWidth * 0.35, rockHeight * 0.25, -0.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawBush(decor) {
  const { x, y, scale } = decor;
  const w = 26 * scale;
  const h = 16 * scale;

  ctx.fillStyle = "rgba(103, 128, 66, 0.7)";
  ctx.beginPath();
  ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(89, 110, 58, 0.75)";
  ctx.beginPath();
  ctx.ellipse(x - w * 0.35, y + h * 0.1, w * 0.4, h * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + w * 0.32, y + h * 0.08, w * 0.35, h * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawBones(decor) {
  const { x, y, scale } = decor;
  const length = 28 * scale;

  ctx.strokeStyle = "rgba(225, 214, 186, 0.85)";
  ctx.lineWidth = 3 * scale;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(x - length * 0.4, y + length * 0.2);
  ctx.lineTo(x + length * 0.36, y - length * 0.16);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - length * 0.36, y - length * 0.16);
  ctx.lineTo(x + length * 0.4, y + length * 0.2);
  ctx.stroke();
}

function drawDesertDecor() {
  for (const decor of desertDecor) {
    if (decor.type === "rock") {
      drawRock(decor);
    } else if (decor.type === "bush") {
      drawBush(decor);
    } else {
      drawBones(decor);
    }
  }
}

function gameLoop() {
  drawBackground();
  drawGround();
  drawPlayer();
  drawObstacles();

  if (!gameOver) {
    frameCount++;

    updatePlayer();
    updateObstacles();
    updateDesertDecor();
    detectCollisions();

    if (frameCount >= nextObstacleAt && obstacles.length < MAX_OBSTACLES_ON_SCREEN) {
      spawnObstacle();
    }

    if (frameCount >= nextDecorAt) {
      spawnDesertDecor();
    }
  }

  requestAnimationFrame(gameLoop);
}

resetGame();
gameLoop();
