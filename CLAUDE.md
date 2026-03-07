# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

Open `index.html` directly in any modern web browser — no build step, server, or package manager required.

## Architecture

This is a self-contained browser game with no dependencies, no bundler, and no framework. The three files map to clear responsibilities:

- `index.html` — minimal shell; defines the canvas (`#gameCanvas`), score display (`#score`, `#highScore`), and the hidden restart button (`#restartBtn`)
- `style.css` — all visual styling; dark glassmorphism theme with `#4ecca3` (teal) as the primary accent color
- `game.js` — all game logic; runs immediately via `initGame()` on load

### game.js structure

Global mutable state drives the game:
- `snake` — array of `{x, y}` grid coordinates, head at index 0
- `food` — single `{x, y}` grid coordinate
- `dx`, `dy` — current direction (grid units per step)
- `gameLoop` — the `setInterval` handle; cleared and re-created on speed changes and restarts
- `changingDirection` — debounce flag to prevent multiple direction changes per frame

Core function flow:
1. `initGame()` — one-time setup; attaches input listener and calls `resetGame()`
2. `resetGame()` — restores all state to defaults and starts the interval loop
3. `gameStep()` — called each interval; calls `update()` then `draw()`
4. `update()` — advances snake position, checks collisions, handles food consumption and speed increases
5. `draw()` — repaints the full canvas each frame (background, snake body with eyes, food circle)

### Key constants

| Constant | Value | Meaning |
|---|---|---|
| `CANVAS_SIZE` | 400px | Canvas width and height |
| `GRID_SIZE` | 20px | Size of each tile |
| `TILE_COUNT` | 20 | Tiles per row/column |
| `INITIAL_SPEED` | 150ms | Starting interval delay |
| Min speed | 50ms | Speed floor |

Speed decreases by 5ms for every 50 points scored. High score is persisted via `localStorage` key `snakeHighScore`.
