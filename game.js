import {
  CANVAS_SIZE,
  GRID_SIZE,
  GameState,
} from './gameLogic.js';

const LS_KEY = 'snakeHighScore';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const restartBtn = document.getElementById('restartBtn');

const state = new GameState();
state.highScore = parseInt(localStorage.getItem(LS_KEY) || '0', 10);

// Expose state for E2E tests
window.__gameState = state;

let gameLoop;
let inputLocked = false;

function startLoop() {
  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(gameStep, state.speed);
}

function resetGame() {
  state.reset();
  scoreEl.textContent = state.score;
  highScoreEl.textContent = state.highScore;
  restartBtn.style.display = 'none';
  inputLocked = false;
  startLoop();
}

function gameStep() {
  if (state.isGameOver) return;

  const result = state.step();
  draw();

  if (result.gameOver) {
    clearInterval(gameLoop);
    drawGameOver();
    restartBtn.style.display = 'inline-block';
  } else if (result.ate) {
    scoreEl.textContent = state.score;
    if (result.highScoreUpdated) {
      localStorage.setItem(LS_KEY, state.highScore);
      highScoreEl.textContent = state.highScore;
    }
    if (result.speedChanged) {
      startLoop();
    }
  }

  inputLocked = false;
}

function handleInput(event) {
  if (state.isGameOver || inputLocked) return;
  const changed = state.changeDirection(event.key);
  if (changed) inputLocked = true;
}

function draw() {
  // Background
  ctx.fillStyle = '#0f3460';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Snake
  state.snake.forEach((segment, index) => {
    ctx.fillStyle = index === 0 ? '#4ecca3' : '#3db38c';
    const x = segment.x * GRID_SIZE;
    const y = segment.y * GRID_SIZE;
    const size = GRID_SIZE - 2;
    ctx.fillRect(x + 1, y + 1, size, size);

    if (index === 0) {
      ctx.fillStyle = '#1a1a2e';
      const eyeSize = 3;
      const { dx, dy } = state;
      if (dx === 1) {
        ctx.fillRect(x + 12, y + 4,  eyeSize, eyeSize);
        ctx.fillRect(x + 12, y + 12, eyeSize, eyeSize);
      } else if (dx === -1) {
        ctx.fillRect(x + 4, y + 4,  eyeSize, eyeSize);
        ctx.fillRect(x + 4, y + 12, eyeSize, eyeSize);
      } else if (dy === -1) {
        ctx.fillRect(x + 4,  y + 4, eyeSize, eyeSize);
        ctx.fillRect(x + 12, y + 4, eyeSize, eyeSize);
      } else if (dy === 1) {
        ctx.fillRect(x + 4,  y + 12, eyeSize, eyeSize);
        ctx.fillRect(x + 12, y + 12, eyeSize, eyeSize);
      }
    }
  });

  // Food
  ctx.fillStyle = '#ff6b6b';
  ctx.beginPath();
  ctx.arc(
    state.food.x * GRID_SIZE + GRID_SIZE / 2,
    state.food.y * GRID_SIZE + GRID_SIZE / 2,
    GRID_SIZE / 2 - 2,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 20);

  ctx.font = '20px Arial';
  ctx.fillText(`Final Score: ${state.score}`, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 20);
  ctx.fillText('Click Restart to play again', CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 50);
}

// Initialize
highScoreEl.textContent = state.highScore;
restartBtn.addEventListener('click', resetGame);
document.addEventListener('keydown', handleInput);
resetGame();
