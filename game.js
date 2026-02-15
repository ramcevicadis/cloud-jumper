// ==========================================
// CLOUD JUMPER - PHASE 2
// Setup + Gravity + Controls + Clouds + Jumping
// ==========================================

// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas dimensions
canvas.width = 400;
canvas.height = 600;

// Game variables
let score = 0;
let highScore = 0;
let gameOver = false;
let gameStarted = false;
let keys = {};
let clouds = [];
let notes = []; // Musical notes to collect
let cameraY = 0; // Camera Y position
let maxHeight = 0; // Track maximum height reached
let combo = 0; // Combo counter for consecutive notes

// Bird (Bilal) object
const bird = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 65,  // Reduced from 80 to 65
    height: 65, // Reduced from 80 to 65
    velocityY: 0,
    velocityX: 0,
    gravity: 0.5,
    jumpPower: -12,
    moveSpeed: 6,
    direction: 'right', // 'left' or 'right'
    
    // Sprite images (will load later)
    spriteLeft: null,
    spriteRight: null
};

// Cloud images
const cloudImages = {
    normal: null,
    spring: null,
    breaking: null,
    moving: null
};

// Note images
const noteImages = {
    white: null,
    gold: null
};

// Load bird sprites
function loadBirdSprites() {
    bird.spriteLeft = new Image();
    bird.spriteLeft.src = 'img/sprites/bilal-left80x80.png';
    
    bird.spriteRight = new Image();
    bird.spriteRight.src = 'img/sprites/bilal-right80x80.png';
    
    // Debug: Check if images loaded
    bird.spriteLeft.onload = () => console.log('✅ Left sprite loaded!');
    bird.spriteLeft.onerror = () => console.error('❌ Left sprite FAILED to load! Check path: img/sprites/bilal-left80x80.png');
    
    bird.spriteRight.onload = () => console.log('✅ Right sprite loaded!');
    bird.spriteRight.onerror = () => console.error('❌ Right sprite FAILED to load! Check path: img/sprites/bilal-right80x80.png');
}

// Load cloud images
function loadCloudImages() {
    cloudImages.normal = new Image();
    cloudImages.normal.src = 'img/clouds/oblak.png';
    
    cloudImages.spring = new Image();
    cloudImages.spring.src = 'img/clouds/oblak_feder.png';
    
    cloudImages.breaking = new Image();
    cloudImages.breaking.src = 'img/clouds/oblak_lomljeni.png';
    
    cloudImages.moving = new Image();
    cloudImages.moving.src = 'img/clouds/oblak_pokret.png';
    
    cloudImages.normal.onload = () => {
        console.log('✅ Normal cloud loaded!');
        // Store natural aspect ratio
        cloudImages.normalRatio = cloudImages.normal.height / cloudImages.normal.width;
    };
    cloudImages.normal.onerror = () => console.error('❌ Normal cloud FAILED to load!');
    
    cloudImages.spring.onload = () => {
        console.log('✅ Spring cloud loaded!');
        cloudImages.springRatio = cloudImages.spring.height / cloudImages.spring.width;
    };
    cloudImages.spring.onerror = () => console.error('❌ Spring cloud FAILED to load!');
    
    cloudImages.breaking.onload = () => {
        console.log('✅ Breaking cloud loaded!');
        cloudImages.breakingRatio = cloudImages.breaking.height / cloudImages.breaking.width;
    };
    cloudImages.breaking.onerror = () => console.error('❌ Breaking cloud FAILED to load!');
    
    cloudImages.moving.onload = () => {
        console.log('✅ Moving cloud loaded!');
        cloudImages.movingRatio = cloudImages.moving.height / cloudImages.moving.width;
    };
    cloudImages.moving.onerror = () => console.error('❌ Moving cloud FAILED to load!');
}

// Load note images
function loadNoteImages() {
    noteImages.white = new Image();
    noteImages.white.src = 'img/collectibles/nota_bela.png';
    
    noteImages.gold = new Image();
    noteImages.gold.src = 'img/collectibles/nota_zlatna.png';
    
    noteImages.white.onload = () => console.log('✅ White note loaded!');
    noteImages.white.onerror = () => console.error('❌ White note FAILED to load! Check path: img/collectibles/nota_bela.png');
    
    noteImages.gold.onload = () => console.log('✅ Gold note loaded!');
    noteImages.gold.onerror = () => console.error('❌ Gold note FAILED to load! Check path: img/collectibles/nota_zlatna.png');
}

// Create initial clouds
function createInitialClouds() {
    clouds = [];
    
    // Create clouds spread vertically with different types
    for (let i = 0; i < 8; i++) {
        const cloudType = getRandomCloudType();
        const cloudWidth = 100;
        const cloudHeight = getCloudHeight(cloudType, cloudWidth);
        
        const newCloud = {
            x: Math.random() * (canvas.width - cloudWidth),
            y: canvas.height - (i * 80) - 50,
            width: cloudWidth,
            height: cloudHeight,
            type: cloudType,
            broken: false, // For breaking clouds
            moveDirection: Math.random() < 0.5 ? 1 : -1, // For moving clouds
            moveSpeed: 1
        };
        clouds.push(newCloud);
    }
    
    // Add starting cloud directly below bird (always normal for easy start)
    clouds.push({
        x: canvas.width / 2 - 50,
        y: canvas.height / 2 + 100,
        width: 100,
        height: getCloudHeight('normal', 100),
        type: 'normal',
        broken: false,
        moveDirection: 1,
        moveSpeed: 1
    });
}

// Get cloud height based on type and width (maintaining aspect ratio)
function getCloudHeight(type, width) {
    // Default to 40 if image not loaded yet
    let ratio = 0.4; // default 100x40
    
    if (type === 'normal' && cloudImages.normalRatio) {
        ratio = cloudImages.normalRatio;
    } else if (type === 'spring' && cloudImages.springRatio) {
        ratio = cloudImages.springRatio;
    } else if (type === 'breaking' && cloudImages.breakingRatio) {
        ratio = cloudImages.breakingRatio;
    } else if (type === 'moving' && cloudImages.movingRatio) {
        ratio = cloudImages.movingRatio;
    }
    
    return width * ratio;
}

// Get random cloud type with weighted probability
function getRandomCloudType() {
    const rand = Math.random();
    
    // 70% normal, 15% spring, 10% breaking, 5% moving
    if (rand < 0.70) return 'normal';
    if (rand < 0.85) return 'spring';
    if (rand < 0.95) return 'breaking';
    return 'moving';
}

// Generate new cloud at top
function generateCloud() {
    // Find the highest (lowest Y value) cloud currently in the game
    const highestCloudY = Math.min(...clouds.map(c => c.y));
    
    // Generate new cloud 60-100 pixels above the highest cloud
    const newY = highestCloudY - (60 + Math.random() * 40);
    
    const cloudType = getRandomCloudType();
    const cloudWidth = 100;
    const cloudHeight = getCloudHeight(cloudType, cloudWidth);
    
    const newCloud = {
        x: Math.random() * (canvas.width - cloudWidth),
        y: newY,
        width: cloudWidth,
        height: cloudHeight,
        type: cloudType,
        broken: false, // For breaking clouds
        moveDirection: Math.random() < 0.5 ? 1 : -1, // 1 = right, -1 = left
        moveSpeed: 1 // Speed for moving clouds
    };
    
    // 30% chance to spawn a note on this cloud (but not on breaking clouds)
    if (Math.random() < 0.3 && cloudType !== 'breaking') {
        generateNote(newCloud);
    }
    
    return newCloud;
}

// Generate a note on a cloud
function generateNote(cloud) {
    // 10% chance for gold note, 90% for white note
    const isGold = Math.random() < 0.1;
    
    notes.push({
        x: cloud.x + cloud.width / 2,
        y: cloud.y - 35, // Adjusted higher because notes are bigger
        width: isGold ? 60 : 45,  // Gold: 60x60, White: 45x45 (increased from 40 and 30)
        height: isGold ? 60 : 45,
        type: isGold ? 'gold' : 'white',
        value: isGold ? 50 : 10,
        collected: false
    });
}

// Check collision between bird and note
function checkNoteCollision(bird, note) {
    if (note.collected) return false;
    
    const birdLeft = bird.x - bird.width / 2;
    const birdRight = bird.x + bird.width / 2;
    const birdTop = bird.y - bird.height / 2;
    const birdBottom = bird.y + bird.height / 2;
    
    const noteLeft = note.x - note.width / 2;
    const noteRight = note.x + note.width / 2;
    const noteTop = note.y - note.height / 2;
    const noteBottom = note.y + note.height / 2;
    
    // Check overlap
    if (birdRight > noteLeft && 
        birdLeft < noteRight && 
        birdBottom > noteTop && 
        birdTop < noteBottom) {
        return true;
    }
    
    return false;
}

// Update notes
function updateNotes() {
    // Remove notes that went off screen (reduced buffer to +50 to match game over)
    notes = notes.filter(note => !note.collected && note.y - cameraY < canvas.height + 50);
    
    // Check collision with each note
    notes.forEach(note => {
        if (checkNoteCollision(bird, note)) {
            // Collect the note!
            note.collected = true;
            score += note.value;
            combo++;
            
            // Combo bonus: every 3 notes = 2x, every 5 = 3x
            if (combo >= 5) {
                score += note.value * 2; // 3x total
            } else if (combo >= 3) {
                score += note.value; // 2x total
            }
            
            // Update combo display
            updateComboDisplay();
            
            console.log(`🎵 Collected ${note.type} note! +${note.value} points | Combo: ${combo}`);
        }
    });
}

// Update combo display
function updateComboDisplay() {
    const comboDisplay = document.getElementById('comboDisplay');
    const comboCount = document.getElementById('comboCount');
    
    if (combo >= 3) {
        comboDisplay.classList.remove('hidden');
        comboCount.textContent = combo;
    } else {
        comboDisplay.classList.add('hidden');
    }
}

// Initialize game
function init() {
    loadBirdSprites();
    loadCloudImages();
    loadNoteImages();
    loadHighScore();
    createInitialClouds();
    setupControls();
    
    // Show start screen
    document.getElementById('startScreen').classList.remove('hidden');
}

// Load high score from localStorage
function loadHighScore() {
    const saved = localStorage.getItem('cloudJumperHighScore');
    highScore = saved ? parseInt(saved) : 0;
    updateHighScoreDisplay();
}

// Save high score to localStorage
function saveHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('cloudJumperHighScore', highScore.toString());
        return true; // New high score!
    }
    return false;
}

// Update high score display
function updateHighScoreDisplay() {
    document.getElementById('highScore').textContent = highScore;
}

// Start the game
function startGame() {
    gameStarted = true;
    gameOver = false;
    
    // Hide start screen
    document.getElementById('startScreen').classList.add('hidden');
    
    // Show game UI
    document.getElementById('gameCanvas').classList.add('active');
    document.querySelector('.header').classList.add('active');
    document.querySelector('.game-info').classList.add('active');
    document.querySelector('.controls-info').classList.add('active');
    
    // Start game loop
    gameLoop();
}

// Check collision between bird and cloud
function checkCloudCollision(bird, cloud) {
    // Bird's bottom hitbox
    const birdBottom = bird.y + bird.height / 2;
    const birdLeft = bird.x - bird.width / 2;
    const birdRight = bird.x + bird.width / 2;
    
    // Cloud hitbox
    const cloudTop = cloud.y;
    const cloudBottom = cloud.y + cloud.height;
    const cloudLeft = cloud.x;
    const cloudRight = cloud.x + cloud.width;
    
    // Check if bird is falling (velocityY > 0)
    // Check if bird's bottom is touching cloud's top
    // Check horizontal overlap
    if (bird.velocityY > 0 && 
        birdBottom > cloudTop && 
        birdBottom < cloudTop + 20 &&
        birdRight > cloudLeft && 
        birdLeft < cloudRight) {
        return true;
    }
    
    return false;
}

// Update clouds
function updateClouds() {
    // Remove clouds that went off screen (too far down from camera view)
    // Also remove broken clouds
    clouds = clouds.filter(cloud => 
        cloud.y - cameraY < canvas.height + 50 && 
        (cloud.type !== 'breaking' || !cloud.broken)
    );
    
    // Update moving clouds
    clouds.forEach(cloud => {
        if (cloud.type === 'moving') {
            // Move cloud
            cloud.x += cloud.moveDirection * cloud.moveSpeed;
            
            // Bounce off walls
            if (cloud.x <= 0) {
                cloud.x = 0;
                cloud.moveDirection = 1; // Move right
            } else if (cloud.x + cloud.width >= canvas.width) {
                cloud.x = canvas.width - cloud.width;
                cloud.moveDirection = -1; // Move left
            }
        }
    });
    
    // Generate new clouds at top if needed
    // Use while loop to generate multiple clouds if needed
    let safetyCounter = 0; // Prevent infinite loop
    while (safetyCounter < 10) {
        const highestCloud = Math.min(...clouds.map(c => c.y));
        
        // If highest cloud is too close to camera view, add more clouds
        if (highestCloud - cameraY > -200) {
            clouds.push(generateCloud());
            safetyCounter++;
        } else {
            break; // We have enough clouds, exit loop
        }
    }
    
    // Check collision with each cloud
    clouds.forEach(cloud => {
        if (checkCloudCollision(bird, cloud)) {
            // Different jump power based on cloud type
            if (cloud.type === 'spring') {
                // Super jump! 2x power
                bird.velocityY = bird.jumpPower * 1.8;
                console.log('🔵 Spring jump!');
            } else if (cloud.type === 'breaking') {
                // Normal jump, but cloud breaks after
                bird.velocityY = bird.jumpPower;
                cloud.broken = true; // Mark as broken
                console.log('🔴 Breaking cloud - destroyed!');
            } else if (cloud.type === 'moving') {
                // Normal jump
                bird.velocityY = bird.jumpPower;
                console.log('🟢 Moving cloud jump!');
            } else {
                // Normal jump
                bird.velocityY = bird.jumpPower;
            }
        }
    });
}

// Update camera to follow bird
function updateCamera() {
    // Camera follows bird upward
    // Only when bird is in upper half of screen
    const birdScreenY = bird.y - cameraY;
    
    if (birdScreenY < canvas.height / 2) {
        cameraY = bird.y - canvas.height / 2;
    }
    
    // Update max height and score
    if (bird.y < maxHeight) {
        maxHeight = bird.y;
        score = Math.abs(Math.floor(maxHeight / 10));
    }
}

// Setup keyboard controls
function setupControls() {
    // Keyboard down
    document.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        
        // Prevent default scrolling
        if(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
            e.preventDefault();
        }
    });
    
    // Keyboard up
    document.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });
    
    // ==========================================
    // MOBILE TOUCH CONTROLS
    // ==========================================
    
    // Touch start
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleTouch(e.touches[0]);
    });
    
    // Touch move
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        handleTouch(e.touches[0]);
    });
    
    // Touch end
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        // Stop movement when touch ends
        keys['ArrowLeft'] = false;
        keys['ArrowRight'] = false;
    });
    
    // Mouse controls (for desktop clicking)
    canvas.addEventListener('mousedown', (e) => {
        handleClick(e.clientX);
    });
    
    canvas.addEventListener('mouseup', () => {
        keys['ArrowLeft'] = false;
        keys['ArrowRight'] = false;
    });
    
    // Restart button
    document.getElementById('restartBtn').addEventListener('click', restart);
    
    // Start button
    document.getElementById('startBtn').addEventListener('click', startGame);
}

// Handle touch input
function handleTouch(touch) {
    const rect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    
    // Left half = go left
    if (touchX < canvas.width / 2) {
        keys['ArrowLeft'] = true;
        keys['ArrowRight'] = false;
    }
    // Right half = go right
    else {
        keys['ArrowRight'] = true;
        keys['ArrowLeft'] = false;
    }
}

// Handle mouse click
function handleClick(clientX) {
    const rect = canvas.getBoundingClientRect();
    const clickX = clientX - rect.left;
    
    // Left half = go left
    if (clickX < canvas.width / 2) {
        keys['ArrowLeft'] = true;
        keys['ArrowRight'] = false;
    }
    // Right half = go right
    else {
        keys['ArrowRight'] = true;
        keys['ArrowLeft'] = false;
    }
}

// Update bird physics
function updateBird() {
    // Horizontal movement
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        bird.velocityX = -bird.moveSpeed;
        bird.direction = 'left';
    } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        bird.velocityX = bird.moveSpeed;
        bird.direction = 'right';
    } else {
        bird.velocityX = 0;
    }
    
    // Apply horizontal movement
    bird.x += bird.velocityX;
    
    // Keep bird within screen boundaries (invisible walls)
    const halfWidth = bird.width / 2;
    if (bird.x - halfWidth < 0) {
        bird.x = halfWidth; // Left wall
    } else if (bird.x + halfWidth > canvas.width) {
        bird.x = canvas.width - halfWidth; // Right wall
    }
    
    // Apply gravity
    bird.velocityY += bird.gravity;
    bird.y += bird.velocityY;
    
    // Check if bird fell below camera view (Game Over)
    // Reduced from +100 to +50 to prevent off-screen gameplay
    if (bird.y - cameraY > canvas.height + 50) {
        endGame();
    }
}

// Draw bird
function drawBird() {
    // Choose sprite based on direction
    const sprite = bird.direction === 'left' ? bird.spriteLeft : bird.spriteRight;
    
    // Bird position relative to camera
    const screenY = bird.y - cameraY;
    
    // Draw sprite if loaded
    if (sprite && sprite.complete) {
        ctx.drawImage(
            sprite,
            bird.x - bird.width / 2,
            screenY - bird.height / 2,
            bird.width,
            bird.height
        );
    } else {
        // Fallback: draw circle if sprite not loaded
        ctx.fillStyle = '#2C3E50';
        ctx.beginPath();
        ctx.arc(bird.x, screenY, bird.width / 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Draw clouds
function drawClouds() {
    // Use better image rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    clouds.forEach(cloud => {
        // Draw cloud relative to camera
        const screenY = cloud.y - cameraY;
        
        // Skip broken clouds (they fade out)
        if (cloud.type === 'breaking' && cloud.broken) return;
        
        // Choose image based on cloud type
        let cloudImage = cloudImages.normal;
        let fallbackColor = '#FFFFFF';
        
        if (cloud.type === 'spring') {
            cloudImage = cloudImages.spring;
            fallbackColor = '#87CEEB'; // Light blue
        } else if (cloud.type === 'breaking') {
            cloudImage = cloudImages.breaking;
            fallbackColor = '#D3D3D3'; // Light gray
        } else if (cloud.type === 'moving') {
            cloudImage = cloudImages.moving;
            fallbackColor = '#F0E68C'; // Khaki (yellowish)
        }
        
        if (cloudImage && cloudImage.complete) {
            ctx.drawImage(
                cloudImage,
                cloud.x,
                screenY,
                cloud.width,
                cloud.height
            );
        } else {
            // Fallback: draw colored rectangle
            ctx.fillStyle = fallbackColor;
            ctx.fillRect(cloud.x, screenY, cloud.width, cloud.height);
        }
    });
}

// Draw notes
function drawNotes() {
    notes.forEach(note => {
        if (note.collected) return; // Don't draw collected notes
        
        // Note position relative to camera
        const screenY = note.y - cameraY;
        
        // Choose image based on type
        const noteImage = note.type === 'gold' ? noteImages.gold : noteImages.white;
        
        if (noteImage && noteImage.complete) {
            ctx.drawImage(
                noteImage,
                note.x - note.width / 2,
                screenY - note.height / 2,
                note.width,
                note.height
            );
        } else {
            // Fallback: draw colored circle
            ctx.fillStyle = note.type === 'gold' ? '#FFD700' : '#FFFFFF';
            ctx.beginPath();
            ctx.arc(note.x, screenY, note.width / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

// Update score display
function updateScore() {
    document.getElementById('score').textContent = Math.floor(score);
}

// Game loop
function gameLoop() {
    if (gameOver || !gameStarted) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update
    updateBird();
    updateClouds();
    updateNotes();
    updateCamera();
    
    // Draw
    drawClouds();
    drawNotes();
    drawBird();
    
    // Update UI
    updateScore();
    
    // Next frame
    requestAnimationFrame(gameLoop);
}

// End game
function endGame() {
    gameOver = true;
    gameStarted = false;
    
    // Check for new high score
    const isNewHighScore = saveHighScore();
    
    // Update UI
    document.getElementById('finalScore').textContent = Math.floor(score);
    document.getElementById('finalHighScore').textContent = highScore;
    updateHighScoreDisplay();
    
    // Show/hide new high score message
    if (isNewHighScore) {
        document.getElementById('newHighScore').classList.remove('hidden');
    } else {
        document.getElementById('newHighScore').classList.add('hidden');
    }
    
    // Hide combo display
    document.getElementById('comboDisplay').classList.add('hidden');
    
    // Show game over screen
    document.getElementById('gameOver').classList.remove('hidden');
}

// Restart game
function restart() {
    // Reset bird
    bird.x = canvas.width / 2;
    bird.y = canvas.height / 2;
    bird.velocityY = 0;
    bird.velocityX = 0;
    bird.direction = 'right';
    
    // Reset clouds and notes
    createInitialClouds();
    notes = [];
    
    // Reset camera and score
    cameraY = 0;
    maxHeight = 0;
    score = 0;
    combo = 0;
    gameOver = false;
    gameStarted = true;
    
    // Hide game over screen and combo display
    document.getElementById('gameOver').classList.add('hidden');
    document.getElementById('comboDisplay').classList.add('hidden');
    
    // Restart loop
    gameLoop();
}

// Start game when page loads
window.addEventListener('load', init);
