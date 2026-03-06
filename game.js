// Game Constants
const CANVAS_SIZE = 400;
const GRID_SIZE = 20;
const TILE_COUNT = CANVAS_SIZE / GRID_SIZE;
const INITIAL_SPEED = 150;

// Game State
let canvas, ctx;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let snake = [];
let food = {};
let dx = 0;
let dy = 0;
let gameSpeed = INITIAL_SPEED;
let gameLoop;
let isGameOver = false;
let changingDirection = false;

// DOM Elements
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const restartBtn = document.getElementById('restartBtn');

// Initialize Game
function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Load high score
    highScoreEl.textContent = highScore;
    
    // Set up restart button
    restartBtn.addEventListener('click', resetGame);
    
    // Start the game
    resetGame();
    
    // Event listeners for controls
    document.addEventListener('keydown', handleInput);
}

// Reset Game State
function resetGame() {
    // Reset snake position
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    
    // Reset direction (moving right)
    dx = 1;
    dy = 0;
    
    // Reset score and speed
    score = 0;
    gameSpeed = INITIAL_SPEED;
    scoreEl.textContent = score;
    
    // Reset game state
    isGameOver = false;
    restartBtn.style.display = 'none';
    
    // Generate first food
    generateFood();
    
    // Start game loop
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(gameStep, gameSpeed);
}

// Generate Food
function generateFood() {
    // Generate random position
    let validPosition = false;
    while (!validPosition) {
        food = {
            x: Math.floor(Math.random() * TILE_COUNT),
            y: Math.floor(Math.random() * TILE_COUNT)
        };
        
        // Check if food spawned on snake
        validPosition = !snake.some(segment => segment.x === food.x && segment.y === food.y);
    }
}

// Draw Game Elements
function draw() {
    // Clear canvas
    ctx.fillStyle = '#0f3460';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // Draw snake
    snake.forEach((segment, index) => {
        // Head is brighter, body is slightly darker
        ctx.fillStyle = index === 0 ? '#4ecca3' : '#3db38c';
        
        // Draw rounded rectangle for snake segments
        const x = segment.x * GRID_SIZE;
        const y = segment.y * GRID_SIZE;
        const size = GRID_SIZE - 2;
        
        ctx.fillRect(x + 1, y + 1, size, size);
        
        // Add eyes to head
        if (index === 0) {
            ctx.fillStyle = '#1a1a2e';
            const eyeSize = 3;
            
            // Position eyes based on direction
            if (dx === 1) { // Right
                ctx.fillRect(x + 12, y + 4, eyeSize, eyeSize);
                ctx.fillRect(x + 12, y + 12, eyeSize, eyeSize);
            } else if (dx === -1) { // Left
                ctx.fillRect(x + 4, y + 4, eyeSize, eyeSize);
                ctx.fillRect(x + 4, y + 12, eyeSize, eyeSize);
            } else if (dy === -1) { // Up
                ctx.fillRect(x + 4, y + 4, eyeSize, eyeSize);
                ctx.fillRect(x + 12, y + 4, eyeSize, eyeSize);
            } else if (dy === 1) { // Down
                ctx.fillRect(x + 4, y + 12, eyeSize, eyeSize);
                ctx.fillRect(x + 12, y + 12, eyeSize, eyeSize);
            }
        }
    });
    
    // Draw food
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    const centerX = food.x * GRID_SIZE + GRID_SIZE / 2;
    const centerY = food.y * GRID_SIZE + GRID_SIZE / 2;
    const radius = GRID_SIZE / 2 - 2;
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw glow effect around food
    ctx.shadowColor = '#ff6b6b';
    ctx.shadowBlur = 10;
    ctx.shadowBlur = 0;
}

// Update Game State
function update() {
    // Move snake
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    
    // Check wall collision
    if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        gameOver();
        return;
    }
    
    // Check self collision
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }
    
    // Add new head
    snake.unshift(head);
    
    // Check if food eaten
    if (head.x === food.x && head.y === food.y) {
        // Increase score
        score += 10;
        scoreEl.textContent = score;
        
        // Update high score
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('snakeHighScore', highScore);
            highScoreEl.textContent = highScore;
        }
        
        // Increase speed slightly
        if (gameSpeed > 50 && score % 50 === 0) {
            clearInterval(gameLoop);
            gameSpeed -= 5;
            gameLoop = setInterval(gameStep, gameSpeed);
        }
        
        // Generate new food
        generateFood();
    } else {
        // Remove tail if no food eaten
        snake.pop();
    }
}

// Game Step
function gameStep() {
    if (changingDirection || isGameOver) return;
    
    changingDirection = true;
    update();
    draw();
    
    // Allow direction change again
    setTimeout(() => {
        changingDirection = false;
    }, 50);
}

// Handle Input
function handleInput(event) {
    if (isGameOver) return;
    
    const key = event.key;
    
    // Prevent multiple direction changes in one frame
    if (changingDirection) return;
    
    // Arrow keys and WASD
    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingRight = dx === 1;
    const goingLeft = dx === -1;
    
    if ((key === 'ArrowLeft' || key === 'a' || key === 'A') && !goingRight) {
        dx = -1;
        dy = 0;
        changingDirection = true;
    }
    if ((key === 'ArrowUp' || key === 'w' || key === 'W') && !goingDown) {
        dx = 0;
        dy = -1;
        changingDirection = true;
    }
    if ((key === 'ArrowRight' || key === 'd' || key === 'D') && !goingLeft) {
        dx = 1;
        dy = 0;
        changingDirection = true;
    }
    if ((key === 'ArrowDown' || key === 's' || key === 'S') && !goingUp) {
        dx = 0;
        dy = 1;
        changingDirection = true;
    }
}

// Game Over
function gameOver() {
    isGameOver = true;
    clearInterval(gameLoop);
    restartBtn.style.display = 'inline-block';
    
    // Draw game over text
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 20);
    
    ctx.font = '20px Arial';
    ctx.fillText(`Final Score: ${score}`, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 20);
    ctx.fillText('Click Restart to play again', CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 50);
}

// Start the game
initGame();
