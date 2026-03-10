const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const statusEl = document.getElementById("status");

const GRAVITY = 0.8;
const GROUND_Y = 320;
const JUMP_FORCE = -14;
const OBSTACLE_SPEED_START = 6;

let score = 0;
let gameOver = false;
let frameCount = 0;
let obstacleSpeed = OBSTACLE_SPEED_START;

const player = {
  x: 100,
  y: GROUND_Y - 60,
  width: 45,
  height: 60,
  velocityY: 0,
  jumping: false
};

const obstacles = [];

function resetGame() {
  score = 0;
  gameOver = false;
  frameCount = 0;
  obstacleSpeed = OBSTACLE_SPEED_START;
  obstacles.length = 0;

  player.y = GROUND_Y - player.height;
  player.velocityY = 0;
  player.jumping = false;

  statusEl.textContent = "Running";
}

function jump() {
  if (!player.jumping && !gameOver) {
    player.velocityY = JUMP_FORCE;
    player.jumping = true;
  } else if (gameOver) {
    resetGame();
  }
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    jump();
  }
});

function spawnObstacle() {
  const height = 30 + Math.random() * 40;
  const width = 20 + Math.random() * 30;

  obstacles.push({
    x: canvas.width,
    y: GROUND_Y - height,
    width,
    height
  });
}

function updatePlayer() {
  player.velocityY += GRAVITY;
  player.y += player.velocityY;

  if (player.y >= GROUND_Y - player.height) {
    player.y = GROUND_Y - player.height;
    player.velocityY = 0;
    player.jumping = false;
  }
}

function updateObstacles() {
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].x -= obstacleSpeed;

    if (obstacles[i].x + obstacles[i].width < 0) {
      obstacles.splice(i, 1);
      score++;
      scoreEl.textContent = `Score: ${score}`;

      if (score % 5 === 0) {
        obstacleSpeed += 0.3;
      }
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

function detectCollisions() {
  for (const obstacle of obstacles) {
    if (checkCollision(player, obstacle)) {
      gameOver = true;
      statusEl.textContent = "Game Over - Press Space to Restart";
    }
  }
}

function drawGround() {
  ctx.fillStyle = "#444";
  ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
}

function drawPlayer() {
  // Simple minifigure-style body
  ctx.fillStyle = "#d4af37";
  ctx.fillRect(player.x + 10, player.y, 25, 20); // head

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(player.x + 5, player.y + 20, 35, 25); // torso

  ctx.fillStyle = "#66ccff";
  ctx.fillRect(player.x + 5, player.y + 45, 12, 15); // left leg
  ctx.fillRect(player.x + 28, player.y + 45, 12, 15); // right leg

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(player.x, player.y + 22, 5, 18); // left arm
  ctx.fillRect(player.x + 40, player.y + 22, 5, 18); // right arm

  // Sunglasses
  ctx.fillStyle = "#000";
  ctx.fillRect(player.x + 13, player.y + 7, 19, 5);
}

function drawObstacles() {
  ctx.fillStyle = "#ff4d4d";
  for (const obstacle of obstacles) {
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  }
}

function drawBackground() {
  ctx.fillStyle = "#1e1e1e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
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
    detectCollisions();

    // Random obstacle generation
    if (frameCount > 50 && Math.random() < 0.02) {
      spawnObstacle();
    }
  }

  requestAnimationFrame(gameLoop);
}

resetGame();
gameLoop();
