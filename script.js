const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('finalScore');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const restartBtn = document.getElementById('restartBtn');

const GRID_SIZE = 20;
const TILE_COUNT = canvas.width / GRID_SIZE;

let score = 0;
let snake = [];
let foods = []; // Changed from single food to array
let obstacles = []; // Array for obstacles
let currentSnakeColor = '#4ade80';
let dx = 0;
let dy = 0;
let gameLoop;
let isGameRunning = false;
let isGameOver = false;

const COLORS = [
    '#f87171', '#fb923c', '#fbbf24', '#facc15', '#a3e635',
    '#4ade80', '#34d399', '#2dd4bf', '#22d3ee', '#38bdf8',
    '#60a5fa', '#818cf8', '#a78bfa', '#c084fc', '#e879f9',
    '#f472b6', '#fb7185'
];

// Initialize game state
function initGame() {
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    score = 0;
    dx = 1;
    dy = 0;
    currentSnakeColor = '#4ade80';
    scoreElement.innerText = score;
    isGameOver = false;
    foods = [];
    obstacles = [];
    spawnFoods();
}

function getRandomPos() {
    return {
        x: Math.floor(Math.random() * TILE_COUNT),
        y: Math.floor(Math.random() * TILE_COUNT)
    };
}

function isOccupied(x, y) {
    // Check snake
    for (let part of snake) {
        if (part.x === x && part.y === y) return true;
    }
    // Check foods
    for (let f of foods) {
        if (f.x === x && f.y === y) return true;
    }
    // Check obstacles
    for (let obs of obstacles) {
        if (obs.x === x && obs.y === y) return true;
    }
    return false;
}

function spawnFoods() {
    // Level 1: 1 food
    // Level 2 (Score >= 100): 3 foods
    let targetFoodCount = score >= 100 ? 3 : 1;

    while (foods.length < targetFoodCount) {
        let pos = getRandomPos();
        while (isOccupied(pos.x, pos.y)) {
            pos = getRandomPos();
        }
        foods.push({
            x: pos.x,
            y: pos.y,
            color: COLORS[Math.floor(Math.random() * COLORS.length)]
        });
    }
}

function spawnObstacles() {
    if (score < 200) return;

    // Level 3 (Score >= 200): Spawn obstacles
    // Let's maintain a certain number of obstacles, e.g., 5
    let targetObstacleCount = 5;

    // Add more obstacles as score increases? Let's keep it simple first.
    // Or maybe spawn a new one every time food is eaten?
    // The requirement says "randomly appear". 
    // Let's just ensure we have enough obstacles.

    while (obstacles.length < targetObstacleCount) {
        let pos = getRandomPos();
        // Ensure not too close to snake head to avoid instant death
        while (isOccupied(pos.x, pos.y) || (Math.abs(pos.x - snake[0].x) < 5 && Math.abs(pos.y - snake[0].y) < 5)) {
            pos = getRandomPos();
        }
        obstacles.push({ x: pos.x, y: pos.y });
    }
}

function drawRect(x, y, color, glow) {
    ctx.fillStyle = color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
    ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);
    ctx.shadowBlur = 0;
}

function drawObstacle(x, y) {
    // Draw background block
    ctx.fillStyle = '#334155'; // Dark slate
    ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);

    // Draw Death Icon (X)
    ctx.strokeStyle = '#ef4444'; // Red
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x * GRID_SIZE + 4, y * GRID_SIZE + 4);
    ctx.lineTo(x * GRID_SIZE + GRID_SIZE - 6, y * GRID_SIZE + GRID_SIZE - 6);
    ctx.moveTo(x * GRID_SIZE + GRID_SIZE - 6, y * GRID_SIZE + 4);
    ctx.lineTo(x * GRID_SIZE + 4, y * GRID_SIZE + GRID_SIZE - 6);
    ctx.stroke();
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Obstacles
    obstacles.forEach(obs => drawObstacle(obs.x, obs.y));

    // Draw Foods
    foods.forEach(f => drawRect(f.x, f.y, f.color));

    // Draw Snake
    snake.forEach((part, index) => {
        drawRect(part.x, part.y, currentSnakeColor);
    });
}

function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Wall Collision
    if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        gameOver();
        return;
    }

    // Self Collision
    for (let part of snake) {
        if (head.x === part.x && head.y === part.y) {
            gameOver();
            return;
        }
    }

    // Obstacle Collision
    for (let obs of obstacles) {
        if (head.x === obs.x && head.y === obs.y) {
            gameOver();
            return;
        }
    }

    snake.unshift(head);

    // Eat Food
    let eatenIndex = -1;
    for (let i = 0; i < foods.length; i++) {
        if (head.x === foods[i].x && head.y === foods[i].y) {
            eatenIndex = i;
            break;
        }
    }

    if (eatenIndex !== -1) {
        score += 10;
        scoreElement.innerText = score;
        currentSnakeColor = foods[eatenIndex].color;
        foods.splice(eatenIndex, 1); // Remove eaten food
        spawnFoods(); // Spawn new food(s)
        spawnObstacles(); // Check if obstacles need to spawn
    } else {
        snake.pop();
    }
}

function update() {
    if (!isGameRunning) return;
    moveSnake();
    if (!isGameOver) {
        draw();
    }
}

function startGame() {
    if (isGameRunning) return;
    initGame();
    isGameRunning = true;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');

    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, 100);
}

function gameOver() {
    isGameRunning = false;
    isGameOver = true;
    clearInterval(gameLoop);
    finalScoreElement.innerText = score;
    gameOverScreen.classList.remove('hidden');
}

// Input handling
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !isGameRunning && !isGameOver) {
        startGame();
    }

    if (!isGameRunning) return;

    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (dy !== 1) { dx = 0; dy = -1; }
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (dy !== -1) { dx = 0; dy = 1; }
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (dx !== 1) { dx = -1; dy = 0; }
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (dx !== -1) { dx = 1; dy = 0; }
            break;
    }
});

restartBtn.addEventListener('click', () => {
    startGame();
});

// Initial draw
initGame();
draw();
