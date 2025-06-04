// Connect to the Socket.io server
const socket = io();

// DOM elements
const gameDiv = document.getElementById('game');
const joinSection = document.getElementById('joinSection');
const waitingSection = document.getElementById('waitingSection');
const playerNameInput = document.getElementById('playerName');
const joinButton = document.getElementById('joinButton');
const playerCount = document.getElementById('playerCount');
const requiredPlayers = document.getElementById('requiredPlayers');
const playersList = document.getElementById('playersList');
const playersUl = document.getElementById('players');
const countdown = document.getElementById('countdown');
const notify = document.getElementById('notify');
const crowd = document.getElementById('crowd');
const eliminated = document.getElementById('eliminated');
const leaderboard = document.getElementById('leaderboard');
const leaderboardList = document.getElementById('leaderboardList');
const dareSection = document.getElementById('dareSection');
const spectatorSection = document.getElementById('spectatorSection');
const currentDare = document.getElementById('currentDare');
const selectedPlayerName = document.getElementById('selectedPlayerName');
const acceptButton = document.getElementById('acceptDare');
const rejectButton = document.getElementById('rejectDare');
const dareResult = document.getElementById('dareResult');
const playerProgress = document.getElementById('playerProgress');

// Game state
let playerName = "";
let isGameStarted = false;
let allPlayers = [];
let myPoints = 100;
let isEliminated = false;
const MIN_PLAYERS = 7;
const MAX_PLAYERS = 10;

// Helper function to safely get player name
function getPlayerName(player) {
    if (typeof player === 'string') {
        return player;
    } else if (player && typeof player === 'object' && player.name) {
        return player.name;
    } else {
        console.error('Invalid player object:', player);
        return 'Unknown Player';
    }
}

// Helper function to safely get player points
function getPlayerPoints(player) {
    if (typeof player === 'object' && player.points !== undefined) {
        return player.points;
    }
    return 0;
}

// Sound functions
function playSound(type) {
    if (type === 'notify') {
        notify.play().catch(() => {});
    } else if (type === 'crowd') {
        crowd.play().catch(() => {});
    } else if (type === 'eliminated') {
        eliminated.play().catch(() => {});
    }
}

// Join the game
joinButton.addEventListener('click', () => {
    const name = playerNameInput.value.trim();
    if (name) {
        playerName = name;
        socket.emit('playerJoin', {
            name: playerName,
            minPlayers: MIN_PLAYERS,
            maxPlayers: MAX_PLAYERS
        });
        playSound('notify');
    } else {
        alert('Please enter your name');
    }
});

// Handle name error
socket.on('nameError', (message) => {
    alert(message);
});

// Accept dare button
acceptButton.addEventListener('click', () => {
    socket.emit('dareResponse', {
        playerName: playerName,
        accepted: true
    });
    dareSection.style.display = 'none';
});

// Reject dare button  
rejectButton.addEventListener('click', () => {
    socket.emit('dareResponse', {
        playerName: playerName,
        accepted: false
    });
    dareSection.style.display = 'none';
});

// Update player list when server sends updates
socket.on('playerUpdate', (data) => {
    allPlayers = data.players || [];
    playerCount.textContent = data.count || 0;
    requiredPlayers.textContent = data.required || MIN_PLAYERS;
    
    // Update progress bar
    const progress = Math.min((data.count / (data.required || MIN_PLAYERS)) * 100, 100);
    playerProgress.style.width = progress + '%';
    
    // Show join/waiting sections appropriately
    if (data.count >= (data.required || MIN_PLAYERS)) {
        joinSection.style.display = 'none';
        waitingSection.style.display = 'none';
        if (!isGameStarted && !isEliminated) {
            isGameStarted = true;
            gameDiv.innerHTML = '<h2>Game Starting Soon!</h2><p>Get ready for DragonDare challenges!</p>';
        }
    } else {
        if (allPlayers.find(p => getPlayerName(p) === playerName)) {
            joinSection.style.display = 'none';
            waitingSection.style.display = 'block';
        }
    }
    
    // Update player list and leaderboard
    updatePlayersList();
    updateLeaderboard();
    
    // Show player list and leaderboard if we have players
    if (data.count > 0) {
        playersList.style.display = 'block';
        leaderboard.style.display = 'block';
    }
});

// Player eliminated event
socket.on('playerEliminated', (data) => {
    allPlayers = data.players || [];
    
    const eliminatedPlayerName = getPlayerName(data.eliminatedPlayer);
    
    if (eliminatedPlayerName === playerName) {
        // This player was eliminated
        isEliminated = true;
        myPoints = 0;
        
        // Hide dare section and show spectator section
        dareSection.style.display = 'none';
        spectatorSection.style.display = 'block';
        
        gameDiv.innerHTML = `
            <div class="eliminated-banner">
                <h2>❌ GAME OVER ❌</h2>
                <p class="eliminated">You've been ELIMINATED from DragonDare!</p>
                <p>Your points dropped to 0 - you're out of the competition!</p>
                <p><em>But don't worry, you can watch the remaining players battle it out!</em></p>
            </div>
        `;
        
        playSound('eliminated');
    } else {
        // Another player was eliminated
        gameDiv.innerHTML = `
            <h2>Player Eliminated!</h2>
            <p class="eliminated">${eliminatedPlayerName} has been ELIMINATED!</p>
            <p>They reached 0 points and are out of the game!</p>
            <p class="waiting">Game continues with remaining players...</p>
        `;
    }
    
    updateLeaderboard();
    updatePlayersList();
});

// New dare event
socket.on('newDare', (data) => {
    allPlayers = data.players || [];
    updateLeaderboard();
    
    const selectedPlayerName = getPlayerName(data.selectedPlayer);
    const isSelected = playerName === selectedPlayerName;
    
    if (isEliminated) {
        // Show spectator view
        spectatorSection.style.display = 'block';
        dareSection.style.display = 'none';
        gameDiv.innerHTML = `
            <h2>🎭 Spectator View</h2>
            <p><strong>${selectedPlayerName}</strong> has been selected for a dare!</p>
            <p class="waiting">Watching from the sidelines...</p>
            <p><em>Dare: ${data.dare}</em></p>
        `;
    } else if (isSelected) {
        // Show dare to selected player
        document.getElementById('selectedPlayerName').textContent = playerName;
        currentDare.textContent = data.dare;
        dareSection.style.display = 'block';
        dareResult.style.display = 'none';
        spectatorSection.style.display = 'none';
        
        gameDiv.innerHTML = `
            <h2>🐉 YOU'VE BEEN SELECTED! 🐉</h2>
            <p class="selected">The DragonDare app has chosen you, ${playerName}!</p>
            <p>Will you accept this challenge and gain 100 points, or chicken out and lose 50 points?</p>
            <p><strong>⚠️ Warning: You have ${myPoints} points! Rejecting might eliminate you! ⚠️</strong></p>
        `;
        playSound('notify');
    } else {
        // Show waiting message to other active players
        dareSection.style.display = 'none';
        spectatorSection.style.display = 'none';
        gameDiv.innerHTML = `
            <h2>Dare in Progress...</h2>
            <p><strong>${selectedPlayerName}</strong> has been selected for a dare!</p>
            <p class="waiting">Waiting for their response...</p>
            <p><em>Dare: ${data.dare}</em></p>
        `;
    }
});

// Dare result event
socket.on('dareResult', (data) => {
    dareSection.style.display = 'none';
    
    const resultPlayerName = getPlayerName(data.player);
    let resultMessage = '';
    let resultClass = '';
    
    if (data.accepted) {
        resultMessage = `${resultPlayerName} accepted the dare! +100 points! 🎉`;
        resultClass = 'success';
        playSound('crowd');
    } else {
        resultMessage = `${resultPlayerName} chickened out! -50 points! 🐔`;
        resultClass = 'failure';
        playSound('notify');
    }
    
    if (isEliminated) {
        gameDiv.innerHTML = `
            <h2>🎭 Spectator View - Dare Result</h2>
            <p class="${resultClass}">${resultMessage}</p>
            <p>${resultPlayerName} now has ${data.points} points!</p>
            <p class="waiting">Watching the competition continue...</p>
        `;
    } else {
        gameDiv.innerHTML = `
            <h2>Dare Result</h2>
            <p class="${resultClass}">${resultMessage}</p>
            <p>${resultPlayerName} now has ${data.points} points!</p>
            <p class="waiting">Next dare coming up...</p>
        `;
    }
    
    // Update my points if it was me
    if (resultPlayerName === playerName) {
        myPoints = data.points;
    }
});

// Game over event
socket.on('gameOver', (data) => {
    dareSection.style.display = 'none';
    spectatorSection.style.display = 'none';
    
    const winnerName = getPlayerName(data.winner);
    
    gameDiv.innerHTML = `
        <h2>🏆 GAME OVER! 🏆</h2>
        <p class="success">Winner: ${winnerName}!</p>
        <p>Final Score: ${data.winnerPoints} points</p>
        <p><em>Congratulations to the DragonDare champion!</em></p>
        <button onclick="resetGame()">Play Again</button>
    `;
    
    playSound('crowd');
});

// Leaderboard update event
socket.on('leaderboardUpdate', (data) => {
    allPlayers = data.players || [];
    updateLeaderboard();
});

// Update the displayed list of connected players
function updatePlayersList() {
    playersUl.innerHTML = '';
    allPlayers.forEach(player => {
        const li = document.createElement('li');
        const playerNameStr = getPlayerName(player);
        const playerPoints = getPlayerPoints(player);
        const isPlayerEliminated = playerPoints <= 0;
        
        if (isPlayerEliminated) {
            li.classList.add('eliminated');
        }
        
        li.innerHTML = `
            <span class="player-name">${playerNameStr}${isPlayerEliminated ? ' (ELIMINATED)' : ''}</span>
            <span class="player-points ${isPlayerEliminated ? 'eliminated' : ''}">${playerPoints} pts</span>
            <span class="player-status">${getStatusEmoji(player.status, isPlayerEliminated)}</span>
        `;
        playersUl.appendChild(li);
    });
}

// Update leaderboard
function updateLeaderboard() {
    if (!leaderboardList) return;
    
    leaderboardList.innerHTML = '';
    
    // Sort players by points (active players first, then eliminated players)
    const sortedPlayers = [...allPlayers].sort((a, b) => {
        const aPoints = getPlayerPoints(a);
        const bPoints = getPlayerPoints(b);
        
        if (aPoints <= 0 && bPoints > 0) return 1;
        if (aPoints > 0 && bPoints <= 0) return -1;
        return bPoints - aPoints;
    });
    
    sortedPlayers.forEach((player, index) => {
        const li = document.createElement('li');
        const rank = index + 1;
        const playerNameStr = getPlayerName(player);
        const playerPoints = getPlayerPoints(player);
        const isMe = playerNameStr === playerName;
        const isPlayerEliminated = playerPoints <= 0;
        
        li.className = isMe ? 'my-rank' : '';
        if (isPlayerEliminated) {
            li.classList.add('eliminated');
        }
        
        let rankEmoji = '';
        if (isPlayerEliminated) {
            rankEmoji = '💀';
        } else if (rank === 1) {
            rankEmoji = '🥇';
        } else if (rank === 2) {
            rankEmoji = '🥈';
        } else if (rank === 3) {
            rankEmoji = '🥉';
        } else {
            rankEmoji = `${rank}.`;
        }
        
        li.innerHTML = `
            <span class="rank">${rankEmoji}</span>
            <span class="player-name">${playerNameStr}${isPlayerEliminated ? ' (OUT)' : ''}</span>
            <span class="player-points ${isPlayerEliminated ? 'eliminated' : ''}">${playerPoints} pts</span>
            <span class="player-status">${getStatusEmoji(player.status, isPlayerEliminated)} ${getStatusText(player.status, isPlayerEliminated)}</span>
        `;
        
        leaderboardList.appendChild(li);
    });
}

// Get status emoji
function getStatusEmoji(status, isEliminated = false) {
    if (isEliminated) return '💀';
    
    switch(status) {
        case 'brave': return '🦁';
        case 'scared': return '🐔';
        case 'waiting': return '⏳';
        default: return '⏳';
    }
}

// Get status text
function getStatusText(status, isEliminated = false) {
    if (isEliminated) return 'ELIMINATED';
    
    switch(status) {
        case 'brave': return 'BRAVE';
        case 'scared': return 'SCARED';
        case 'waiting': return 'WAITING';
        default: return 'WAITING';
    }
}

// Game choice (keep for story progression compatibility)
function choose(choice) {
    socket.emit('playerChoice', {
        playerName: playerName,
        choice: choice
    });
}

// Get a random player except the current one
function getRandomPlayerExcept(exceptName) {
    const availablePlayers = allPlayers.filter(p => {
        const pName = getPlayerName(p);
        const pPoints = getPlayerPoints(p);
        return pName !== exceptName && pPoints > 0;
    });
    
    if (availablePlayers.length === 0) return "Another student";
    
    const randomPlayer = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
    return getPlayerName(randomPlayer);
}

// Reset the game
function resetGame() {
    window.location.reload();
}