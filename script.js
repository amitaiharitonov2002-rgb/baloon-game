// Balloon Pop Game

class BalloonGame {
    constructor() {
        this.gameArea = document.getElementById('gameArea');
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.timerElement = document.getElementById('timer');
        this.heartsElement = document.getElementById('hearts');
        this.finalScoreElement = document.getElementById('finalScore');
        this.gameOverElement = document.getElementById('gameOver');

        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.playAgainBtn = document.getElementById('playAgainBtn');

        this.score = 0;
        this.level = 1;
        this.balloonsPoppedInLevel = 0;
        this.balloonsNeededForNextLevel = 5; // כמה בלונים צריך לפוצץ לעליית שלב
        this.lives = 3;
        this.timeLeft = 60;
        this.gameRunning = false;
        this.gamePaused = false;
        this.balloons = [];
        this.balloonInterval = null;
        this.timerInterval = null;

        // הגדרות קושי לפי שלב
        this.levelSettings = {
            1: { spawnRate: 1500, fallSpeed: { min: 2, max: 4 }, timeBonus: 0 },
            2: { spawnRate: 1300, fallSpeed: { min: 2.5, max: 4.5 }, timeBonus: 5 },
            3: { spawnRate: 1100, fallSpeed: { min: 3, max: 5 }, timeBonus: 10 },
            4: { spawnRate: 900, fallSpeed: { min: 3.5, max: 5.5 }, timeBonus: 15 },
            5: { spawnRate: 750, fallSpeed: { min: 4, max: 6 }, timeBonus: 20 },
            6: { spawnRate: 600, fallSpeed: { min: 4.5, max: 6.5 }, timeBonus: 25 },
            7: { spawnRate: 500, fallSpeed: { min: 5, max: 7 }, timeBonus: 30 },
            8: { spawnRate: 400, fallSpeed: { min: 5.5, max: 7.5 }, timeBonus: 35 },
            9: { spawnRate: 350, fallSpeed: { min: 6, max: 8 }, timeBonus: 40 },
            10: { spawnRate: 300, fallSpeed: { min: 6.5, max: 8.5 }, timeBonus: 45 }
        };

        // Initialize sounds
        this.popSound = new Audio('pop.wav');
        this.winSound = new Audio('win.wav');
        this.gameOverSound = new Audio('gameover.wav');

        this.init();
    }

    init() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.pauseBtn.addEventListener('click', () => this.pauseGame());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        this.playAgainBtn.addEventListener('click', () => this.resetGame());

        // Mouse tracking for crosshair
        this.gameArea.addEventListener('mousemove', (e) => this.updateCrosshair(e));
        this.gameArea.addEventListener('click', (e) => this.handleClick(e));
    }

    startGame() {
        if (this.gameRunning) return;

        this.gameRunning = true;
        this.gamePaused = false;
        this.startBtn.style.display = 'none';
        this.pauseBtn.style.display = 'inline-block';

        this.startBalloonSpawner();
        this.startTimer();
    }

    pauseGame() {
        if (!this.gameRunning) return;

        this.gamePaused = !this.gamePaused;
        this.pauseBtn.textContent = this.gamePaused ? '▶️ המשך' : '⏸️ השהה';

        if (this.gamePaused) {
            clearInterval(this.balloonInterval);
            clearInterval(this.timerInterval);
        } else {
            this.startBalloonSpawner();
            this.startTimer();
        }
    }

    resetGame() {
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.level = 1;
        this.balloonsPoppedInLevel = 0;
        this.balloonsNeededForNextLevel = 5;
        this.lives = 3;
        this.timeLeft = 60;

        this.scoreElement.textContent = this.score;
        this.levelElement.textContent = this.level;
        this.timerElement.textContent = this.timeLeft;
        this.updateHearts();

        this.startBtn.style.display = 'inline-block';
        this.pauseBtn.style.display = 'none';
        this.gameOverElement.style.display = 'none';

        // Remove all balloons
        this.balloons.forEach(balloon => balloon.remove());
        this.balloons = [];

        clearInterval(this.balloonInterval);
        clearInterval(this.timerInterval);
    }

    startBalloonSpawner() {
        const currentLevelSettings = this.levelSettings[this.level] || this.levelSettings[Object.keys(this.levelSettings).length];
        this.balloonInterval = setInterval(() => {
            if (!this.gamePaused && this.gameRunning) {
                this.createBalloon();
            }
        }, currentLevelSettings.spawnRate);
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            if (!this.gamePaused && this.gameRunning) {
                this.timeLeft--;
                this.timerElement.textContent = this.timeLeft;

                if (this.timeLeft <= 0) {
                    this.endGame();
                }
            }
        }, 1000);
    }

    createBalloon() {
        const balloon = document.createElement('div');
        balloon.className = 'balloon';
        balloon.style.left = Math.random() * (this.gameArea.offsetWidth - 60) + 'px';
        balloon.style.top = '-80px';

        // Random balloon color variation (we'll use CSS filters)
        const colors = ['hue-rotate(0deg)', 'hue-rotate(60deg)', 'hue-rotate(120deg)', 'hue-rotate(180deg)', 'hue-rotate(240deg)', 'hue-rotate(300deg)'];
        balloon.style.filter = colors[Math.floor(Math.random() * colors.length)];

        this.gameArea.appendChild(balloon);
        this.balloons.push(balloon);

        // Animate balloon falling
        let position = -80;
        const currentLevelSettings = this.levelSettings[this.level] || this.levelSettings[Object.keys(this.levelSettings).length];
        const fallSpeed = currentLevelSettings.fallSpeed.min + Math.random() * (currentLevelSettings.fallSpeed.max - currentLevelSettings.fallSpeed.min);

        const fallInterval = setInterval(() => {
            if (this.gamePaused || !this.gameRunning) return;

            position += fallSpeed;
            balloon.style.top = position + 'px';

            // Check if balloon reached bottom
            if (position > this.gameArea.offsetHeight) {
                clearInterval(fallInterval);
                balloon.remove();
                this.balloons = this.balloons.filter(b => b !== balloon);
                this.loseLife();
            }
        }, 16); // ~60fps

        // Click to pop balloon
        balloon.addEventListener('click', (e) => {
            e.stopPropagation();
            this.popBalloon(balloon, fallInterval);
        });
    }

    popBalloon(balloon, fallInterval) {
        clearInterval(fallInterval);
        balloon.classList.add('popping');

        // Play pop sound effect
        this.popSound.currentTime = 0; // Reset sound to beginning
        this.popSound.play().catch(e => console.log('Audio play failed:', e));

        this.createPopEffect(balloon.offsetLeft + 30, balloon.offsetTop + 40);

        // Remove balloon after animation
        setTimeout(() => {
            balloon.remove();
            this.balloons = this.balloons.filter(b => b !== balloon);
        }, 300);

        // Increase score
        this.score += 10;
        this.scoreElement.textContent = this.score;

        this.balloonsPoppedInLevel++;

        // Check for level advancement
        if (this.balloonsPoppedInLevel >= this.balloonsNeededForNextLevel) {
            this.level++;
            this.balloonsPoppedInLevel = 0;
            this.levelElement.textContent = this.level;

            // Show level up message
            this.showLevelUpMessage(`עלית לשלב ${this.level}!`);

            // Update spawn rate and speed for new level
            clearInterval(this.balloonInterval);
            this.startBalloonSpawner();
        }
    }

    createPopEffect(x, y) {
        // Create visual pop effect
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.width = '4px';
            particle.style.height = '4px';
            particle.style.background = '#FFD700';
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '999';

            this.gameArea.appendChild(particle);

            // Animate particle
            const angle = (i / 8) * Math.PI * 2;
            const distance = 30;
            const targetX = x + Math.cos(angle) * distance;
            const targetY = y + Math.sin(angle) * distance;

            particle.animate([
                { transform: 'scale(1)', opacity: 1 },
                { transform: `translate(${targetX - x}px, ${targetY - y}px) scale(0)`, opacity: 0 }
            ], {
                duration: 500,
                easing: 'ease-out'
            });

            setTimeout(() => particle.remove(), 500);
        }
    }

    loseLife() {
        this.lives--;
        this.updateHearts();

        if (this.lives <= 0) {
            this.endGame();
        }
    }

    updateHearts() {
        this.heartsElement.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const heart = document.createElement('span');
            heart.className = 'heart';
            heart.textContent = i < this.lives ? '❤️' : '🤍';
            this.heartsElement.appendChild(heart);
        }
    }

    updateCrosshair(e) {
        const rect = this.gameArea.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const crosshair = document.getElementById('crosshair');
        crosshair.style.left = (x - 15) + 'px';
        crosshair.style.top = (y - 15) + 'px';
    }

    handleClick(e) {
        // Visual feedback for misses
        if (this.gameRunning && !this.gamePaused) {
            this.createMissEffect(e.offsetX, e.offsetY);
        }
    }

    createMissEffect(x, y) {
        const ripple = document.createElement('div');
        ripple.style.position = 'absolute';
        ripple.style.left = (x - 20) + 'px';
        ripple.style.top = (y - 20) + 'px';
        ripple.style.width = '40px';
        ripple.style.height = '40px';
        ripple.style.border = '2px solid rgba(255, 255, 255, 0.5)';
        ripple.style.borderRadius = '50%';
        ripple.style.pointerEvents = 'none';
        ripple.style.zIndex = '999';

        this.gameArea.appendChild(ripple);

        ripple.animate([
            { transform: 'scale(0)', opacity: 1 },
            { transform: 'scale(2)', opacity: 0 }
        ], {
            duration: 300,
            easing: 'ease-out'
        });

        setTimeout(() => ripple.remove(), 300);
    }

    showLevelUpMessage(message) {
        // Play win sound effect
        this.winSound.currentTime = 0; // Reset sound to beginning
        this.winSound.play().catch(e => console.log('Audio play failed:', e));

        const levelUpMsg = document.createElement('div');
        levelUpMsg.textContent = message;
        levelUpMsg.style.position = 'absolute';
        levelUpMsg.style.top = '50%';
        levelUpMsg.style.left = '50%';
        levelUpMsg.style.transform = 'translate(-50%, -50%)';
        levelUpMsg.style.fontSize = '2rem';
        levelUpMsg.style.fontWeight = 'bold';
        levelUpMsg.style.color = '#FFD700';
        levelUpMsg.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        levelUpMsg.style.zIndex = '1000';
        levelUpMsg.style.pointerEvents = 'none';

        this.gameArea.appendChild(levelUpMsg);

        // Animate the message
        levelUpMsg.animate([
            { transform: 'translate(-50%, -50%) scale(0)', opacity: 0 },
            { transform: 'translate(-50%, -50%) scale(1.2)', opacity: 1 },
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 }
        ], {
            duration: 800,
            easing: 'ease-out'
        });

        setTimeout(() => levelUpMsg.remove(), 2000);
    }

    endGame() {
        this.gameRunning = false;
        clearInterval(this.balloonInterval);
        clearInterval(this.timerInterval);

        // Play game over sound effect
        this.gameOverSound.currentTime = 0; // Reset sound to beginning
        this.gameOverSound.play().catch(e => console.log('Audio play failed:', e));

        this.finalScoreElement.textContent = this.score;
        this.gameOverElement.style.display = 'block';

        // Remove remaining balloons
        this.balloons.forEach(balloon => balloon.remove());
        this.balloons = [];
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BalloonGame();
});