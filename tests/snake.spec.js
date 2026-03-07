import { test, expect } from '@playwright/test';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function waitForGame(page) {
  await page.waitForFunction(() => window.__gameState?.snake?.length > 0);
}

/** Place food exactly one step ahead of the snake head. */
async function placeFoodAhead(page) {
  await page.evaluate(() => {
    const s = window.__gameState;
    s.food = { x: s.snake[0].x + s.dx, y: s.snake[0].y + s.dy };
  });
}

/** Crash the snake into the right wall on the next tick. */
async function crashIntoWall(page) {
  await page.evaluate(() => {
    const s = window.__gameState;
    s.snake = [{ x: 19, y: 10 }, { x: 18, y: 10 }];
    s.dx = 1;
    s.dy = 0;
    s.food = { x: 0, y: 0 };
  });
}

// ─── Rendering ───────────────────────────────────────────────────────────────

test('game renders and canvas is visible', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('#gameCanvas');
  await expect(canvas).toBeVisible();

  const size = await canvas.evaluate(el => ({ w: el.width, h: el.height }));
  expect(size.w).toBe(400);
  expect(size.h).toBe(400);
});

test('initial score is 0', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#score')).toHaveText('0');
});

test('restart button is hidden at game start', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#restartBtn')).toBeHidden();
});

// ─── Snake movement ───────────────────────────────────────────────────────────

test('snake moves on arrow key press', async ({ page }) => {
  await page.goto('/');
  await waitForGame(page);

  const before = await page.evaluate(() => ({ ...window.__gameState.snake[0] }));

  // Turn down (valid from initial direction right)
  await page.keyboard.press('ArrowDown');

  // Wait for head position to change
  await page.waitForFunction(
    (b) => {
      const h = window.__gameState?.snake?.[0];
      return h && (h.x !== b.x || h.y !== b.y);
    },
    before,
    { timeout: 1000 }
  );

  const after = await page.evaluate(() => ({ ...window.__gameState.snake[0] }));
  // Snake moved down: y must have increased, x must not have changed
  expect(after.y).toBeGreaterThan(before.y);
  expect(after.x).toBe(before.x);
});

// ─── Scoring ─────────────────────────────────────────────────────────────────

test('score increases when food is eaten', async ({ page }) => {
  await page.goto('/');
  await waitForGame(page);

  await placeFoodAhead(page);

  await page.waitForFunction(() => window.__gameState.score >= 10, { timeout: 1000 });

  await expect(page.locator('#score')).toHaveText('10');
});

// ─── Game over ────────────────────────────────────────────────────────────────

test('game over screen appears on wall collision', async ({ page }) => {
  await page.goto('/');
  await waitForGame(page);

  await crashIntoWall(page);

  await page.waitForFunction(() => window.__gameState.isGameOver, { timeout: 1000 });
  await expect(page.locator('#restartBtn')).toBeVisible();
});

// ─── Restart ─────────────────────────────────────────────────────────────────

test('restart button resets the game', async ({ page }) => {
  await page.goto('/');
  await waitForGame(page);

  // Score something first
  await placeFoodAhead(page);
  await page.waitForFunction(() => window.__gameState.score >= 10, { timeout: 1000 });

  // Crash into wall
  await crashIntoWall(page);
  await page.waitForFunction(() => window.__gameState.isGameOver, { timeout: 1000 });

  // Restart
  await page.locator('#restartBtn').click();

  // Game should be live again with score reset
  await page.waitForFunction(() => !window.__gameState.isGameOver, { timeout: 1000 });
  await expect(page.locator('#score')).toHaveText('0');
  await expect(page.locator('#restartBtn')).toBeHidden();
});

// ─── High score ───────────────────────────────────────────────────────────────

test('high score persists after a restart', async ({ page }) => {
  await page.goto('/');
  await waitForGame(page);

  // Eat food to set a high score
  await placeFoodAhead(page);
  await page.waitForFunction(() => window.__gameState.score >= 10, { timeout: 1000 });

  // Crash
  await crashIntoWall(page);
  await page.waitForFunction(() => window.__gameState.isGameOver, { timeout: 1000 });

  const hs = await page.evaluate(() => window.__gameState.highScore);
  expect(hs).toBeGreaterThanOrEqual(10);

  // Restart
  await page.locator('#restartBtn').click();
  await page.waitForFunction(() => !window.__gameState.isGameOver, { timeout: 1000 });

  // High score should still be displayed
  const hsAfter = await page.evaluate(() => window.__gameState.highScore);
  expect(hsAfter).toBeGreaterThanOrEqual(10);
  await expect(page.locator('#highScore')).toHaveText(String(hsAfter));
});

test('high score is stored in localStorage', async ({ page }) => {
  await page.goto('/');
  await waitForGame(page);

  await placeFoodAhead(page);
  await page.waitForFunction(() => window.__gameState.score >= 10, { timeout: 1000 });

  const stored = await page.evaluate(() => localStorage.getItem('snakeHighScore'));
  expect(parseInt(stored)).toBeGreaterThanOrEqual(10);
});
