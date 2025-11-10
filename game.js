const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const claimBtn = document.getElementById('claimBtn');
const claimSection = document.getElementById('claimSection');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let gameRunning = false;
let gamePaused = false;
let gameEnded = false;

// Crypto coin types with values
const cryptoCoins = [
    { name: 'BTC', symbol: '₿', color: '#f7931a', value: 100 },
    { name: 'ETH', symbol: 'Ξ', color: '#627eea', value: 50 },
    { name: 'BNB', symbol: 'B', color: '#f3ba2f', value: 30 },
    { name: 'SOL', symbol: 'S', color: '#14f195', value: 40 },
    { name: 'DOGE', symbol: 'Ð', color: '#c2a633', value: 20 }
];

// Single player
const player = {
    snake: [{ x: 15, y: 15 }],
    dx: 0,
    dy: 0,
    score: 0,
    crypto: 0,
    color: '#00b4d8',
    headColor: '#48cae4'
};

let food = {
    x: 10,
    y: 10,
    coin: cryptoCoins[0]
};

let gameSpeed = 100; // ms per frame

// Keyboard controls
document.addEventListener('keydown', (e) => {
    // Arrow keys
    if (e.key === 'ArrowUp' && player.dy === 0) {
        player.dx = 0;
        player.dy = -1;
    } else if (e.key === 'ArrowDown' && player.dy === 0) {
        player.dx = 0;
        player.dy = 1;
    } else if (e.key === 'ArrowLeft' && player.dx === 0) {
        player.dx = -1;
        player.dy = 0;
    } else if (e.key === 'ArrowRight' && player.dx === 0) {
        player.dx = 1;
        player.dy = 0;
    }
    
    // WASD keys (alternative)
    if (e.key === 'w' && player.dy === 0) {
        player.dx = 0;
        player.dy = -1;
    } else if (e.key === 's' && player.dy === 0) {
        player.dx = 0;
        player.dy = 1;
    } else if (e.key === 'a' && player.dx === 0) {
        player.dx = -1;
        player.dy = 0;
    } else if (e.key === 'd' && player.dx === 0) {
        player.dx = 1;
        player.dy = 0;
    }
});

function drawSnake() {
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

function moveSnake() {
    const head = { x: player.snake[0].x + player.dx, y: player.snake[0].y + player.dy };
    player.snake.unshift(head);
    
    // Check if ate food
    if (head.x === food.x && head.y === food.y) {
        player.score += 10;
        player.crypto += food.coin.value;
        updateScore();
        generateFood();
        
        // Increase speed slightly as score increases
        if (player.score % 50 === 0 && gameSpeed > 50) {
            gameSpeed -= 5;
        }
    } else {
        player.snake.pop();
    }
}

function checkCollision() {
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
    
    return false;
}

function generateFood() {
    let validPosition = false;
    
    while (!validPosition) {
        food.x = Math.floor(Math.random() * tileCount);
        food.y = Math.floor(Math.random() * tileCount);
        
        // Check if food is not on snake
        validPosition = !player.snake.some(segment => 
            segment.x === food.x && segment.y === food.y
        );
    }
    
    food.coin = cryptoCoins[Math.floor(Math.random() * cryptoCoins.length)];
}

function updateScore() {
    document.getElementById('score').textContent = player.score;
    document.getElementById('crypto').textContent = player.crypto;
}

function gameOver() {
    gameRunning = false;
    gameEnded = true;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 40);
    
    ctx.font = 'bold 30px Arial';
    ctx.fillText(`Score: ${player.score}`, canvas.width / 2, canvas.height / 2 + 20);
    
    ctx.font = '20px Arial';
    ctx.fillText(`Crypto Value: $${player.crypto}`, canvas.width / 2, canvas.height / 2 + 60);
    
    // Show claim section
    showClaimSection();
}

function showClaimSection() {
    const finalScore = player.score;
    
    // Calculate estimated reward (same formula as backend)
    const estimatedReward = Math.floor((finalScore * 1.0) / 100);
    
    // Update UI
    document.getElementById('finalScore').textContent = finalScore;
    document.getElementById('estimatedReward').textContent = estimatedReward;
    
    // Show claim section
    if (claimSection) {
        claimSection.style.display = 'block';
    }
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
    drawSnake();
}

let lastFrameTime = 0;

function gameLoop(currentTime) {
    if (!gameRunning || gamePaused) {
        if (gameRunning) {
            requestAnimationFrame(gameLoop);
        }
        return;
    }
    
    const deltaTime = currentTime - lastFrameTime;
    
    if (deltaTime >= gameSpeed) {
        lastFrameTime = currentTime;
        
        moveSnake();
        
        if (checkCollision()) {
            gameOver();
            return;
        }
        
        draw();
    }
    
    requestAnimationFrame(gameLoop);
}

function resetGame() {
    gameRunning = false;
    gamePaused = false;
    gameEnded = false;
    
    player.snake = [{ x: 15, y: 15 }];
    player.dx = 0;
    player.dy = 0;
    player.score = 0;
    player.crypto = 0;
    gameSpeed = 100;
    
    updateScore();
    generateFood();
    draw();
    
    // Hide claim section
    if (claimSection) {
        claimSection.style.display = 'none';
    }
}

startBtn.addEventListener('click', () => {
    if (!gameRunning) {
        gameRunning = true;
        gamePaused = false;
        gameEnded = false;
        lastFrameTime = 0;
        requestAnimationFrame(gameLoop);
        startBtn.textContent = 'Running...';
        
        // Hide claim section if visible
        if (claimSection) {
            claimSection.style.display = 'none';
        }
    }
});

pauseBtn.addEventListener('click', () => {
    if (gameRunning && !gameEnded) {
        gamePaused = !gamePaused;
        pauseBtn.textContent = gamePaused ? 'Resume' : 'Pause';
        
        if (!gamePaused) {
            lastFrameTime = 0;
            requestAnimationFrame(gameLoop);
        }
    }
});

resetBtn.addEventListener('click', () => {
    resetGame();
    startBtn.textContent = 'Start Game';
    pauseBtn.textContent = 'Pause';
});

// Claim button handler
if (claimBtn) {
    claimBtn.addEventListener('click', async () => {
        if (!window.cryptoSnake || !window.cryptoSnake.isConnected()) {
            alert('Please connect your wallet first!');
            return;
        }
        
        const finalScore = player.score;
        
        if (finalScore === 0) {
            alert('Score is too low to claim rewards!');
            return;
        }
        
        // Disable button during claim
        claimBtn.disabled = true;
        claimBtn.textContent = 'Claiming...';
        
        try {
            // Call wallet function to submit and claim
            const success = await window.cryptoSnake.submitScoreAndClaim(finalScore);
            
            if (success) {
                // Hide claim section after successful claim
                claimSection.style.display = 'none';
                
                // Reset game
                resetGame();
                startBtn.textContent = 'Start Game';
                pauseBtn.textContent = 'Pause';
            }
        } catch (error) {
            console.error('Claim error:', error);
        } finally {
            // Re-enable button
            claimBtn.disabled = false;
            claimBtn.textContent = 'Submit Score & Claim Rewards';
        }
    });
}

// Initial draw
resetGame();