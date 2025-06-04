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
const shame = document.getElementById('shame');
const leaderboard = document.getElementById('leaderboard');
const leaderboardList = document.getElementById('leaderboardList');
const dareSection = document.getElementById('dareSection');
const currentDare = document.getElementById('currentDare');
const selectedPlayerName = document.getElementById('selectedPlayerName');
const acceptButton = document.getElementById('acceptDare');
const rejectButton = document.getElementById('rejectDare');
const dareResult = document.getElementById('dareResult');

// Game state
let playerName = "";
let isGameStarted = false;
let allPlayers = [];
let myPoints = 100;

// Sound functions
function playSound(type) {
    if (type === 'notify') {
        notify.play().catch(() => {});
    } else if (type === 'crowd') {
        crowd.play().catch(() => {});
    } else if (type === 'shame') {
        shame.play().catch(() => {});
    }
}

// Join the game
joinButton.addEventListener('click', () => {
    const name = playerNameInput.value.trim();
    if (name) {
        playerName = name;
        socket.emit('playerJoin', playerName);
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
    allPlayers = data.players;
    playerCount.textContent = data.count;
    requiredPlayers.textContent = data.required;
    
    // Show join/waiting sections appropriately
    if (data.count >= data.required) {
        joinSection.style.display = 'none';
        waitingSection.style.display = 'none';
        if (!isGameStarted) {
            isGameStarted = true;
            gameDiv.innerHTML = '<h2>Game Starting Soon!</h2><p>Get ready for DragonDare challenges!</p>';
        }
    } else {
        if (allPlayers.find(p => p.name === playerName)) {
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

// New dare event
socket.on('newDare', (data) => {
    allPlayers = data.players;
    updateLeaderboard();
    
    const isSelected = playerName === data.selectedPlayer;
    
    if (isSelected) {
        // Show dare to selected player
        selectedPlayerName.textContent = playerName;
        currentDare.textContent = data.dare;
        dareSection.style.display = 'block';
        dareResult.style.display = 'none';
        
        gameDiv.innerHTML = `
            <h2>🐉 YOU'VE BEEN SELECTED! 🐉</h2>
            <p class="selected">The DragonDare app has chosen you, ${playerName}!</p>
            <p>Will you accept this challenge and gain 100 points, or chicken out and lose 50 points? Don't hit 0, or you're canceled!</p>
        `;
        playSound('notify');
    } else {
        // Show waiting message to other players
        dareSection.style.display = 'none';
        gameDiv.innerHTML = `
            <h2>Dare in Progress...</h2>
            <p><strong>${data.selectedPlayer}</strong> has been selected for a dare!</p>
            <p class="waiting">Waiting for their response...</p>
            <p><em>Dare: ${data.dare}</em></p>
        `;
    }
});

// Dare result event
socket.on('dareResult', (data) => {
    dareSection.style.display = 'none';
    
    let resultMessage = '';
    let resultClass = '';
    
    if (data.accepted) {
        resultMessage = `${data.player} accepted the dare! +100 points! 🎉`;
        resultClass = 'success';
        playSound('crowd');
    } else {
        resultMessage = `${data.player} chickened out! -50 points! 🐔 Risking cancellation!`;
        resultClass = 'failure';
        playSound('notify');
    }
    
    gameDiv.innerHTML = `
        <h2>Dare Result</h2>
        <p class="${resultClass}">${resultMessage}</p>
        <p>${data.player} now has ${data.points} points!</p>
        <p class="waiting">Next dare coming up...</p>
    `;
    
    // Update my points if it was me
    if (data.player === playerName) {
        myPoints = data.points;
    }
    
    // Update players and leaderboard
    allPlayers = data.players;
    updatePlayersList();
    updateLeaderboard();
});

// Player eliminated event
socket.on('playerEliminated', (data) => {
    allPlayers = data.players;
    updatePlayersList();
    updateLeaderboard();
    
    const isMe = data.player === playerName;
    
    gameDiv.innerHTML = `
        <h2>😱 CANCELED! 😱</h2>
        <p class="eliminated">${data.player} has been CANCELED!</p>
        <p>The internet has spoken: "${data.player} flopped hard and is out of the game! 📸 #DragonDare #Canceled"</p>
        <p class="waiting">${data.remaining} players remain. Next dare incoming...</p>
    `;
    
    playSound('shame');
    
    if (isMe) {
        setTimeout(() => {
            alert('You’ve been canceled! Your points hit 0, and you’re out of the game!');
            resetGame();
        }, 2000);
    }
});

// Game over event
socket.on('gameOver', (data) => {
    allPlayers = data.players;
    updatePlayersList();
    updateLeaderboard();
    
    gameDiv.innerHTML = `
        <h2>🏆 Game Over! 🏆</h2>
        <p class="winner">${data.winner} is the Ultimate DragonDare Champion!</p>
        <p>Congrats for surviving the cancel culture storm! 🎉</p>
        <button onclick="resetGame()">Play Again</button>
    `;
    
    playSound('crowd');
});

// Leaderboard update event
socket.on('leaderboardUpdate', (data) => {
    allPlayers = data.players;
    updateLeaderboard();
});

// Update the displayed list of connected players
function updatePlayersList() {
    playersUl.innerHTML = '';
    allPlayers.forEach(player => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="player-name">${player.name}</span>
            <span class="player-points">${player.points} pts</span>
            <span class="player-status">${getStatusEmoji(player.status)}</span>
        `;
        playersUl.appendChild(li);
    });
}

// Update leaderboard
function updateLeaderboard() {
    if (!leaderboardList) return;
    
    leaderboardList.innerHTML = '';
    allPlayers.forEach((player, index) => {
        const li = document.createElement('li');
        const rank = index + 1;
        const isMe = player.name === playerName;
        
        li.className = isMe ? 'my-rank' : '';
        
        let rankEmoji = '';
        if (rank === 1) rankEmoji = '🥇';
        else if (rank === 2) rankEmoji = '🥈';
        else if (rank === 3) rankEmoji = '🥉';
        else rankEmoji = `${rank}.`;
        
        li.innerHTML = `
            <span class="rank">${rankEmoji}</span>
            <span class="player-name">${player.name}</span>
            <span class="player-points">${player.points} pts</span>
            <span class="player-status">${getStatusEmoji(player.status)} ${getStatusText(player.status)}</span>
        `;
        
        leaderboardList.appendChild(li);
    });
}

// Get status emoji
function getStatusEmoji(status) {
    switch(status) {
        case 'brave': return '🦁';
        case 'scared': return '🐔';
        case 'waiting': return '⏳';
        case 'eliminated': return '😱';
        default: return '⏳';
    }
}

// Get status text
function getStatusText(status) {
    switch(status) {
        case 'brave': return 'BRAVE';
        case 'scared': return 'SCARED';
        case 'waiting': return 'WAITING';
        case 'eliminated': return 'CANCELED';
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
    const availablePlayers = allPlayers.filter(p => p.name !== exceptName && p.status !== 'eliminated');
    if (availablePlayers.length === 0) return "Another student";
    return availablePlayers[Math.floor(Math.random() * availablePlayers.length)].name;
}

// Reset the game
function resetGame() {
    window.location.reload();
}