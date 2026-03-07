// Game Constants
export const CANVAS_SIZE = 400;
export const GRID_SIZE = 20;
export const TILE_COUNT = CANVAS_SIZE / GRID_SIZE; // 20
export const INITIAL_SPEED = 150;

/**
 * Generate food position not overlapping with snake.
 * @param {Array<{x:number,y:number}>} snake
 * @param {number} tileCount
 * @param {function} random - injectable RNG, defaults to Math.random
 * @returns {{x:number,y:number}}
 */
export function generateFood(snake, tileCount, random = Math.random) {
  let food;
  do {
    food = {
      x: Math.floor(random() * tileCount),
      y: Math.floor(random() * tileCount),
    };
  } while (snake.some(seg => seg.x === food.x && seg.y === food.y));
  return food;
}

/**
 * Returns true if head is outside the grid.
 * @param {{x:number,y:number}} head
 * @param {number} tileCount
 */
export function checkWallCollision(head, tileCount) {
  return head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount;
}

/**
 * Returns true if head overlaps any segment of the snake.
 * @param {{x:number,y:number}} head
 * @param {Array<{x:number,y:number}>} snake
 */
export function checkSelfCollision(head, snake) {
  return snake.some(seg => seg.x === head.x && seg.y === head.y);
}

/**
 * Returns true if head is on food.
 * @param {{x:number,y:number}} head
 * @param {{x:number,y:number}} food
 */
export function checkFoodCollision(head, food) {
  return head.x === food.x && head.y === food.y;
}

/**
 * Returns new {dx, dy} for a key press if the direction is valid (no reversal),
 * or null if invalid or unknown key.
 * @param {string} key
 * @param {number} dx
 * @param {number} dy
 * @returns {{dx:number,dy:number}|null}
 */
export function getValidDirection(key, dx, dy) {
  const goingRight = dx === 1;
  const goingLeft = dx === -1;
  const goingUp = dy === -1;
  const goingDown = dy === 1;

  if ((key === 'ArrowLeft' || key === 'a' || key === 'A') && !goingRight) return { dx: -1, dy: 0 };
  if ((key === 'ArrowUp'   || key === 'w' || key === 'W') && !goingDown)  return { dx: 0, dy: -1 };
  if ((key === 'ArrowRight'|| key === 'd' || key === 'D') && !goingLeft)  return { dx: 1,  dy: 0 };
  if ((key === 'ArrowDown' || key === 's' || key === 'S') && !goingUp)    return { dx: 0,  dy: 1 };
  return null;
}

/**
 * Pure game state — no DOM, no Canvas, no timers.
 */
export class GameState {
  /**
   * @param {{ tileCount?: number, random?: function }} options
   */
  constructor({ tileCount = TILE_COUNT, random = Math.random } = {}) {
    this.tileCount = tileCount;
    this.random = random;
    this.highScore = 0;
    this.reset();
  }

  reset() {
    this.snake = [
      { x: 10, y: 10 },
      { x: 9,  y: 10 },
      { x: 8,  y: 10 },
    ];
    this.dx = 1;
    this.dy = 0;
    this.score = 0;
    this.speed = INITIAL_SPEED;
    this.isGameOver = false;
    this.food = generateFood(this.snake, this.tileCount, this.random);
  }

  /**
   * Attempt a direction change from a key event.
   * @param {string} key
   * @returns {boolean} true if direction changed
   */
  changeDirection(key) {
    const result = getValidDirection(key, this.dx, this.dy);
    if (result) {
      this.dx = result.dx;
      this.dy = result.dy;
      return true;
    }
    return false;
  }

  /**
   * Advance the game by one tick.
   * @returns {{ ate: boolean, gameOver: boolean, speedChanged: boolean, highScoreUpdated: boolean }}
   */
  step() {
    const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };

    if (checkWallCollision(head, this.tileCount)) {
      this.isGameOver = true;
      return { ate: false, gameOver: true, speedChanged: false, highScoreUpdated: false };
    }

    if (checkSelfCollision(head, this.snake)) {
      this.isGameOver = true;
      return { ate: false, gameOver: true, speedChanged: false, highScoreUpdated: false };
    }

    this.snake.unshift(head);

    let ate = false;
    let speedChanged = false;
    let highScoreUpdated = false;

    if (checkFoodCollision(head, this.food)) {
      ate = true;
      this.score += 10;

      if (this.score > this.highScore) {
        this.highScore = this.score;
        highScoreUpdated = true;
      }

      if (this.speed > 50 && this.score % 50 === 0) {
        this.speed = Math.max(50, this.speed - 5);
        speedChanged = true;
      }

      this.food = generateFood(this.snake, this.tileCount, this.random);
    } else {
      this.snake.pop();
    }

    return { ate, gameOver: false, speedChanged, highScoreUpdated };
  }
}
