const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let gameRunning = false;
let gamePaused = false;
let gameLoop;

// Crypto coin types with values
const cryptoCoins = [
    { name: 'BTC', symbol: '₿', color: '#f7931a', value: 100 },
    { name: 'ETH', symbol: 'Ξ', color: '#627eea', value: 50 },
    { name: 'BNB', symbol: 'B', color: '#f3ba2f', value: 30 },
    { name: 'SOL', symbol: 'S', color: '#14f195', value: 40 },
    { name: 'DOGE', symbol: 'Ð', color: '#c2a633', value: 20 }
];

// Player 1 (Pink)
const player1 = {
    snake: [{ x: 10, y: 10 }],
    dx: 0,
    dy: 0,
    score: 0,
    crypto: 0,
    color: '#ff006e',
    headColor: '#ff4d94'
};

// Player 2 (Blue)
const player2 = {
    snake: [{ x: 20, y: 20 }],
    dx: 0,
    dy: 0,
    score: 0,
    crypto: 0,
    color: '#00b4d8',
    headColor: '#48cae4'
};

let food = {
    x: 15,
    y: 15,
    coin: cryptoCoins[0]
};

// Keyboard controls
document.addEventListener('keydown', (e) => {
    // Player 1 (WASD)
    if (e.key === 'w' && player1.dy === 0) {
        player1.dx = 0;
        player1.dy = -1;
    } else if (e.key === 's' && player1.dy === 0) {
        player1.dx = 0;
        player1.dy = 1;
    } else if (e.key === 'a' && player1.dx === 0) {
        player1.dx = -1;
        player1.dy = 0;
    } else if (e.key === 'd' && player1.dx === 0) {
        player1.dx = 1;
        player1.dy = 0;
    }
    
    // Player 2 (Arrow keys)
    if (e.key === 'ArrowUp' && player2.dy === 0) {
        player2.dx = 0;
        player2.dy = -1;
    } else if (e.key === 'ArrowDown' && player2.dy === 0) {
        player2.dx = 0;
        player2.dy = 1;
    } else if (e.key === 'ArrowLeft' && player2.dx === 0) {
        player2.dx = -1;
        player2.dy = 0;
    } else if (e.key === 'ArrowRight' && player2.dx === 0) {
        player2.dx = 1;
        player2.dy = 0;
    }
});

function drawSnake(player) {
    player.snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? player.headColor : player.color;
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
        
        // Add eyes to head
        if (index === 0) {
            ctx.fillStyle = 'white';
            ctx.fillRect(segment.x * gridSize + 5, segment.y * gridSize + 5, 3, 3);
            ctx.fillRect(segment.x * gridSize + 12, segment.y * gridSize + 5, 3, 3);
        }
    });
}

function drawFood() {
    ctx.fillStyle = food.coin.color;
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize / 2,
        food.y * gridSize + gridSize / 2,
        gridSize / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
    
    // Draw crypto symbol
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
        food.coin.symbol,
        food.x * gridSize + gridSize / 2,
        food.y * gridSize + gridSize / 2
    );
}

function moveSnake(player) {
    const head = { x: player.snake[0].x + player.dx, y: player.snake[0].y + player.dy };
    player.snake.unshift(head);
    
    // Check if ate food
    if (head.x === food.x && head.y === food.y) {
        player.score += 10;
        player.crypto += food.coin.value;
        updateScores();
        generateFood();
    } else {
        player.snake.pop();
    }
}

function checkCollision(player, otherPlayer) {
    const head = player.snake[0];
    
    // Wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        return true;
    }
    
    // Self collision
    for (let i = 1; i < player.snake.length; i++) {
        if (head.x === player.snake[i].x && head.y === player.snake[i].y) {
            return true;
        }
    }
    
    // Other player collision
    for (let segment of otherPlayer.snake) {
        if (head.x === segment.x && head.y === segment.y) {
            return true;
        }
    }
    
    return false;
}

function generateFood() {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);
    food.coin = cryptoCoins[Math.floor(Math.random() * cryptoCoins.length)];
}

function updateScores() {
    document.getElementById('score1').textContent = player1.score;
    document.getElementById('crypto1').textContent = player1.crypto;
    document.getElementById('score2').textContent = player2.score;
    document.getElementById('crypto2').textContent = player2.crypto;
}

function gameOver(winner) {
    gameRunning = false;
    clearInterval(gameLoop);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 40);
    
    ctx.font = 'bold 30px Arial';
    if (winner) {
        ctx.fillText(winner + ' Wins! 🎉', canvas.width / 2, canvas.height / 2 + 20);
    } else {
        ctx.fillText('Draw!', canvas.width / 2, canvas.height / 2 + 20);
    }
    
    ctx.font = '20px Arial';
    ctx.fillText('Press Reset to play again', canvas.width / 2, canvas.height / 2 + 60);
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = '#2a2a3e';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }
    
    drawFood();
    drawSnake(player1);
    drawSnake(player2);
}

function update() {
    if (!gameRunning || gamePaused) return;
    
    moveSnake(player1);
    moveSnake(player2);
    
    const p1Collision = checkCollision(player1, player2);
    const p2Collision = checkCollision(player2, player1);
    
    if (p1Collision && p2Collision) {
        gameOver(null);
    } else if (p1Collision) {
        gameOver('Player 2');
    } else if (p2Collision) {
        gameOver('Player 1');
    }
    
    draw();
}

function resetGame() {
    gameRunning = false;
    gamePaused = false;
    clearInterval(gameLoop);
    
    player1.snake = [{ x: 10, y: 10 }];
    player1.dx = 0;
    player1.dy = 0;
    player1.score = 0;
    player1.crypto = 0;
    
    player2.snake = [{ x: 20, y: 20 }];
    player2.dx = 0;
    player2.dy = 0;
    player2.score = 0;
    player2.crypto = 0;
    
    updateScores();
    generateFood();
    draw();
}

startBtn.addEventListener('click', () => {
    if (!gameRunning) {
        gameRunning = true;
        gamePaused = false;
        gameLoop = setInterval(update, 100);
        startBtn.textContent = 'Running...';
    }
});

pauseBtn.addEventListener('click', () => {
    gamePaused = !gamePaused;
    pauseBtn.textContent = gamePaused ? 'Resume' : 'Pause';
});

resetBtn.addEventListener('click', () => {
    resetGame();
    startBtn.textContent = 'Start Game';
    pauseBtn.textContent = 'Pause';
});

// Initial draw
resetGame();