import { describe, it, expect, beforeEach } from 'vitest';
import {
  GameState,
  generateFood,
  checkWallCollision,
  checkSelfCollision,
  checkFoodCollision,
  getValidDirection,
  TILE_COUNT,
  INITIAL_SPEED,
} from '../gameLogic.js';

// A deterministic RNG that always returns the same value far from typical snake positions.
// floor(0.99 * 20) = 19, so food lands at (19, 19) by default.
const FAR_RANDOM = () => 0.99;

// Helper: build a fresh GameState with deterministic food placement
function makeState(opts = {}) {
  return new GameState({ random: FAR_RANDOM, ...opts });
}

// ─── Snake movement ──────────────────────────────────────────────────────────

describe('Snake movement', () => {
  it('moves right by default each step', () => {
    const state = makeState();
    const x = state.snake[0].x;
    const y = state.snake[0].y;
    state.step();
    expect(state.snake[0]).toEqual({ x: x + 1, y });
  });

  it('moves left when direction is left', () => {
    const state = makeState();
    state.snake = [{ x: 15, y: 10 }, { x: 16, y: 10 }, { x: 17, y: 10 }];
    state.dx = -1;
    state.dy = 0;
    state.food = { x: 0, y: 0 }; // not in path
    state.step();
    expect(state.snake[0]).toEqual({ x: 14, y: 10 });
  });

  it('moves up when direction is up', () => {
    const state = makeState();
    state.snake = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
    state.dx = 0;
    state.dy = -1;
    state.food = { x: 0, y: 0 };
    state.step();
    expect(state.snake[0]).toEqual({ x: 10, y: 9 });
  });

  it('moves down when direction is down', () => {
    const state = makeState();
    state.snake = [{ x: 10, y: 5 }, { x: 10, y: 4 }, { x: 10, y: 3 }];
    state.dx = 0;
    state.dy = 1;
    state.food = { x: 0, y: 0 };
    state.step();
    expect(state.snake[0]).toEqual({ x: 10, y: 6 });
  });

  it('snake length stays the same when food is not eaten', () => {
    const state = makeState();
    state.food = { x: 0, y: 0 }; // far from default head at (10,10) going right
    const len = state.snake.length;
    state.step();
    expect(state.snake.length).toBe(len);
  });
});

// ─── Wall collision ──────────────────────────────────────────────────────────

describe('checkWallCollision', () => {
  it('detects left wall', () => {
    expect(checkWallCollision({ x: -1, y: 5 }, TILE_COUNT)).toBe(true);
  });

  it('detects right wall', () => {
    expect(checkWallCollision({ x: TILE_COUNT, y: 5 }, TILE_COUNT)).toBe(true);
  });

  it('detects top wall', () => {
    expect(checkWallCollision({ x: 5, y: -1 }, TILE_COUNT)).toBe(true);
  });

  it('detects bottom wall', () => {
    expect(checkWallCollision({ x: 5, y: TILE_COUNT }, TILE_COUNT)).toBe(true);
  });

  it('no collision within bounds', () => {
    expect(checkWallCollision({ x: 0, y: 0 }, TILE_COUNT)).toBe(false);
    expect(checkWallCollision({ x: TILE_COUNT - 1, y: TILE_COUNT - 1 }, TILE_COUNT)).toBe(false);
  });
});

describe('Wall collision ends game', () => {
  it('moving into right wall triggers game over', () => {
    const state = makeState();
    state.snake = [{ x: 19, y: 10 }, { x: 18, y: 10 }];
    state.dx = 1;
    state.dy = 0;
    state.food = { x: 0, y: 0 };
    const result = state.step();
    expect(result.gameOver).toBe(true);
    expect(state.isGameOver).toBe(true);
  });

  it('moving into left wall triggers game over', () => {
    const state = makeState();
    state.snake = [{ x: 0, y: 10 }, { x: 1, y: 10 }];
    state.dx = -1;
    state.dy = 0;
    state.food = { x: 19, y: 19 };
    const result = state.step();
    expect(result.gameOver).toBe(true);
  });

  it('moving into top wall triggers game over', () => {
    const state = makeState();
    state.snake = [{ x: 10, y: 0 }, { x: 10, y: 1 }];
    state.dx = 0;
    state.dy = -1;
    state.food = { x: 0, y: 19 };
    const result = state.step();
    expect(result.gameOver).toBe(true);
  });

  it('moving into bottom wall triggers game over', () => {
    const state = makeState();
    state.snake = [{ x: 10, y: 19 }, { x: 10, y: 18 }];
    state.dx = 0;
    state.dy = 1;
    state.food = { x: 0, y: 0 };
    const result = state.step();
    expect(result.gameOver).toBe(true);
  });
});

// ─── Self collision ──────────────────────────────────────────────────────────

describe('checkSelfCollision', () => {
  const snake = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];

  it('detects overlap with body', () => {
    expect(checkSelfCollision({ x: 4, y: 5 }, snake)).toBe(true);
  });

  it('no collision when clear', () => {
    expect(checkSelfCollision({ x: 6, y: 5 }, snake)).toBe(false);
  });
});

describe('Self collision ends game', () => {
  it('snake running into its own body triggers game over', () => {
    const state = makeState();
    // Snake forms a U; head going right will hit segment at (6,5)
    state.snake = [
      { x: 5, y: 5 },
      { x: 5, y: 6 },
      { x: 6, y: 6 },
      { x: 6, y: 5 }, // <-- head will move here
    ];
    state.dx = 1;
    state.dy = 0;
    state.food = { x: 0, y: 0 };
    const result = state.step();
    expect(result.gameOver).toBe(true);
    expect(state.isGameOver).toBe(true);
  });
});

// ─── Food generation ─────────────────────────────────────────────────────────

describe('generateFood', () => {
  it('never places food on a snake segment', () => {
    const snake = [{ x: 0, y: 0 }, { x: 1, y: 0 }];
    // First two calls return x=0,y=0 (on snake); subsequent calls return 10,10 (clear)
    let call = 0;
    const mockRandom = () => (++call <= 2 ? 0 : 0.5);
    const food = generateFood(snake, TILE_COUNT, mockRandom);
    expect(snake.some(s => s.x === food.x && s.y === food.y)).toBe(false);
    expect(food).toEqual({ x: 10, y: 10 });
  });

  it('places food within grid bounds', () => {
    const food = generateFood([], TILE_COUNT);
    expect(food.x).toBeGreaterThanOrEqual(0);
    expect(food.x).toBeLessThan(TILE_COUNT);
    expect(food.y).toBeGreaterThanOrEqual(0);
    expect(food.y).toBeLessThan(TILE_COUNT);
  });
});

// ─── Food collision ──────────────────────────────────────────────────────────

describe('checkFoodCollision', () => {
  it('detects collision', () => {
    expect(checkFoodCollision({ x: 3, y: 7 }, { x: 3, y: 7 })).toBe(true);
  });

  it('no collision when different position', () => {
    expect(checkFoodCollision({ x: 3, y: 7 }, { x: 4, y: 7 })).toBe(false);
  });
});

// ─── Food eating and scoring ──────────────────────────────────────────────────

describe('Food eating and score', () => {
  it('score increases by 10 when food eaten', () => {
    const state = makeState();
    // Put food directly in front of the default snake (head at 10,10 going right)
    state.food = { x: 11, y: 10 };
    const result = state.step();
    expect(result.ate).toBe(true);
    expect(state.score).toBe(10);
  });

  it('snake grows by one when food is eaten', () => {
    const state = makeState();
    const len = state.snake.length;
    state.food = { x: 11, y: 10 };
    state.step();
    expect(state.snake.length).toBe(len + 1);
  });

  it('snake does not grow when food is not eaten', () => {
    const state = makeState();
    state.food = { x: 0, y: 0 }; // not in path
    const len = state.snake.length;
    state.step();
    expect(state.snake.length).toBe(len);
  });

  it('new food is generated after eating', () => {
    const state = makeState();
    state.food = { x: 11, y: 10 };
    state.step();
    // Food should not still be at the eaten position
    expect(state.food).not.toEqual({ x: 11, y: 10 });
  });

  it('highScore is updated when score exceeds it', () => {
    const state = makeState();
    state.food = { x: 11, y: 10 };
    const result = state.step();
    expect(result.highScoreUpdated).toBe(true);
    expect(state.highScore).toBe(10);
  });

  it('highScore is not updated when score does not exceed it', () => {
    const state = makeState();
    state.highScore = 100; // already high
    state.food = { x: 11, y: 10 };
    const result = state.step();
    expect(result.highScoreUpdated).toBe(false);
    expect(state.highScore).toBe(100);
  });
});

// ─── Speed progression ────────────────────────────────────────────────────────

describe('Speed progression', () => {
  it('speed is INITIAL_SPEED at the start', () => {
    const state = makeState();
    expect(state.speed).toBe(INITIAL_SPEED);
  });

  it('speed decreases by 5 after reaching 50 points', () => {
    const state = makeState();
    // Eat 5 foods manually (score: 10, 20, 30, 40, 50)
    for (let i = 0; i < 5; i++) {
      state.food = { x: state.snake[0].x + 1, y: state.snake[0].y };
      state.step();
    }
    expect(state.score).toBe(50);
    expect(state.speed).toBe(INITIAL_SPEED - 5);
  });

  it('speedChanged flag is true when speed changes', () => {
    const state = makeState();
    state.score = 40; // next food will bring score to 50 → speed change
    state.food = { x: state.snake[0].x + 1, y: state.snake[0].y };
    const result = state.step();
    expect(result.speedChanged).toBe(true);
  });

  it('speed does not go below 50ms', () => {
    const state = makeState();
    state.speed = 55;
    state.score = 40;
    state.food = { x: state.snake[0].x + 1, y: state.snake[0].y };
    state.step(); // score → 50, speed 55 → 50
    expect(state.speed).toBe(50);

    // Next milestone: speed is already 50, should not decrease further
    state.score = 90;
    state.food = { x: state.snake[0].x + 1, y: state.snake[0].y };
    const result = state.step(); // score → 100, but speed === 50 so condition fails
    expect(result.speedChanged).toBe(false);
    expect(state.speed).toBe(50);
  });
});

// ─── Direction change validation ──────────────────────────────────────────────

describe('getValidDirection', () => {
  it('allows turning up when going right', () => {
    expect(getValidDirection('ArrowUp', 1, 0)).toEqual({ dx: 0, dy: -1 });
  });

  it('allows turning down when going right', () => {
    expect(getValidDirection('ArrowDown', 1, 0)).toEqual({ dx: 0, dy: 1 });
  });

  it('allows turning left when going down', () => {
    expect(getValidDirection('ArrowLeft', 0, 1)).toEqual({ dx: -1, dy: 0 });
  });

  it('allows turning right when going up', () => {
    expect(getValidDirection('ArrowRight', 0, -1)).toEqual({ dx: 1, dy: 0 });
  });

  it('blocks reversing: left when going right', () => {
    expect(getValidDirection('ArrowLeft', 1, 0)).toBeNull();
  });

  it('blocks reversing: right when going left', () => {
    expect(getValidDirection('ArrowRight', -1, 0)).toBeNull();
  });

  it('blocks reversing: up when going down', () => {
    expect(getValidDirection('ArrowUp', 0, 1)).toBeNull();
  });

  it('blocks reversing: down when going up', () => {
    expect(getValidDirection('ArrowDown', 0, -1)).toBeNull();
  });

  it('WASD keys work like arrow keys', () => {
    expect(getValidDirection('w', 1, 0)).toEqual({ dx: 0, dy: -1 });
    expect(getValidDirection('W', 1, 0)).toEqual({ dx: 0, dy: -1 });
    expect(getValidDirection('s', 1, 0)).toEqual({ dx: 0, dy: 1 });
    expect(getValidDirection('a', 0, 1)).toEqual({ dx: -1, dy: 0 });
    expect(getValidDirection('d', 0, -1)).toEqual({ dx: 1, dy: 0 });
  });

  it('returns null for unrecognised keys', () => {
    expect(getValidDirection(' ', 1, 0)).toBeNull();
    expect(getValidDirection('Enter', 1, 0)).toBeNull();
    expect(getValidDirection('Escape', 1, 0)).toBeNull();
  });
});

describe('GameState.changeDirection', () => {
  it('returns true and updates direction for a valid key', () => {
    const state = makeState(); // dx=1, dy=0
    const changed = state.changeDirection('ArrowUp');
    expect(changed).toBe(true);
    expect(state.dx).toBe(0);
    expect(state.dy).toBe(-1);
  });

  it('returns false and does not change direction for a reverse key', () => {
    const state = makeState(); // dx=1, dy=0
    const changed = state.changeDirection('ArrowLeft');
    expect(changed).toBe(false);
    expect(state.dx).toBe(1);
    expect(state.dy).toBe(0);
  });
});

// ─── Game reset ───────────────────────────────────────────────────────────────

describe('Game reset', () => {
  it('restores initial state', () => {
    const state = makeState();

    // Play for a while
    for (let i = 0; i < 3; i++) {
      state.food = { x: state.snake[0].x + 1, y: state.snake[0].y };
      state.step();
    }
    expect(state.score).toBeGreaterThan(0);

    state.reset();

    expect(state.score).toBe(0);
    expect(state.speed).toBe(INITIAL_SPEED);
    expect(state.isGameOver).toBe(false);
    expect(state.snake).toHaveLength(3);
    expect(state.snake[0]).toEqual({ x: 10, y: 10 });
    expect(state.dx).toBe(1);
    expect(state.dy).toBe(0);
  });

  it('preserves highScore across reset', () => {
    const state = makeState();
    state.food = { x: 11, y: 10 };
    state.step(); // score = 10, highScore = 10
    expect(state.highScore).toBe(10);

    state.reset();

    expect(state.score).toBe(0);
    expect(state.highScore).toBe(10); // preserved
  });

  it('clears isGameOver flag', () => {
    const state = makeState();
    state.snake = [{ x: 19, y: 10 }, { x: 18, y: 10 }];
    state.dx = 1;
    state.food = { x: 0, y: 0 };
    state.step(); // hits right wall
    expect(state.isGameOver).toBe(true);

    state.reset();
    expect(state.isGameOver).toBe(false);
  });
});
