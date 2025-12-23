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
let foods = [];
let obstacles = [];
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
    for (let part of snake) {
        if (part.x === x && part.y === y) return true;
    }
    for (let f of foods) {
        if (f.x === x && f.y === y) return true;
    }
    for (let obs of obstacles) {
        if (obs.x === x && obs.y === y) return true;
    }
    return false;
}

function spawnFoods() {
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

    let targetObstacleCount = 5;

    while (obstacles.length < targetObstacleCount) {
        let pos = getRandomPos();
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
    ctx.fillStyle = '#334155';
    ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x * GRID_SIZE + 4, y * GRID_SIZE + 4);
    ctx.lineTo(x * GRID_SIZE + GRID_SIZE - 6, y * GRID_SIZE + GRID_SIZE - 6);
    ctx.moveTo(x * GRID_SIZE + GRID_SIZE - 6, y * GRID_SIZE + 4);
    ctx.lineTo(x * GRID_SIZE + 4, y * GRID_SIZE + GRID_SIZE - 6);
    ctx.stroke();
}

function draw() {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    obstacles.forEach(obs => drawObstacle(obs.x, obs.y));
    foods.forEach(f => drawRect(f.x, f.y, f.color));
    snake.forEach((part, index) => {
        drawRect(part.x, part.y, currentSnakeColor);
    });
}

function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        gameOver();
        return;
    }

    for (let part of snake) {
        if (head.x === part.x && head.y === part.y) {
            gameOver();
            return;
        }
    }

    for (let obs of obstacles) {
        if (head.x === obs.x && head.y === obs.y) {
            gameOver();
            return;
        }
    }

    snake.unshift(head);

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
        foods.splice(eatenIndex, 1);
        spawnFoods();
        spawnObstacles();
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

function changeDirection(direction) {
    if (!isGameRunning) return;

    switch (direction) {
        case 'up':
            if (dy !== 1) { dx = 0; dy = -1; }
            break;
        case 'down':
            if (dy !== -1) { dx = 0; dy = 1; }
            break;
        case 'left':
            if (dx !== 1) { dx = -1; dy = 0; }
            break;
        case 'right':
            if (dx !== -1) { dx = 1; dy = 0; }
            break;
    }
}

// Keyboard input handling
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !isGameRunning && !isGameOver) {
        startGame();
    }

    if (!isGameRunning) return;

    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            changeDirection('up');
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            changeDirection('down');
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            changeDirection('left');
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            changeDirection('right');
            break;
    }
});

// Touch input handling for mobile
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    
    if (!isGameRunning && !isGameOver) {
        startGame();
        return;
    }

    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    
    if (!isGameRunning) return;

    const touch = e.changedTouches[0];
    const touchEndX = touch.clientX;
    const touchEndY = touch.clientY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    const minSwipeDistance = 30;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {
                changeDirection('right');
            } else {
                changeDirection('left');
            }
        }
    } else {
        if (Math.abs(deltaY) > minSwipeDistance) {
            if (deltaY > 0) {
                changeDirection('down');
            } else {
                changeDirection('up');
            }
        }
    }
}, { passive: false });

// Virtual D-Pad button handling
const dpadButtons = document.querySelectorAll('.dpad-btn');
dpadButtons.forEach(btn => {
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const direction = btn.dataset.direction;
        
        if (!isGameRunning && !isGameOver) {
            startGame();
        } else {
            changeDirection(direction);
        }
    }, { passive: false });

    // Also support mouse clicks for testing
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const direction = btn.dataset.direction;
        
        if (!isGameRunning && !isGameOver) {
            startGame();
        } else {
            changeDirection(direction);
        }
    });
});

// Start screen tap to start (mobile)
startScreen.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!isGameRunning && !isGameOver) {
        startGame();
    }
}, { passive: false });

restartBtn.addEventListener('click', () => {
    startGame();
});

// Prevent scrolling on mobile
document.body.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

// Initial draw
initGame();
draw();