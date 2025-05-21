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

// Game state
let playerName = "";
let isGameStarted = false;
let selectedPlayer = "";
let allPlayers = [];

// Sound functions
function playSound(type) {
    if (type === 'notify') {
        notify.play().catch(() => {});
    } else if (type === 'crowd') {
        crowd.play().catch(() => {});
    }
}

// Join the game
joinButton.addEventListener('click', () => {
    const name = playerNameInput.value.trim();
    if (name) {
        playerName = name;
        joinSection.style.display = 'none';
        waitingSection.style.display = 'block';
        playersList.style.display = 'block';
        
        // Notify server about new player
        socket.emit('playerJoin', playerName);
        playSound('notify');
    } else {
        alert('Please enter your name');
    }
});

// Update player list when server sends updates
socket.on('playerUpdate', (data) => {
    allPlayers = data.players;
    playerCount.textContent = data.count;
    requiredPlayers.textContent = data.required;
    
    // Update player list
    updatePlayersList();
});

// Game start event
socket.on('gameStart', (data) => {
    allPlayers = data.players;
    selectedPlayer = data.selectedPlayer;
    
    // Countdown before starting the game
    let seconds = 5;
    countdown.style.display = 'block';
    countdown.textContent = `Game starting in ${seconds} seconds...`;
    
    const countdownInterval = setInterval(() => {
        seconds--;
        countdown.textContent = `Game starting in ${seconds} seconds...`;
        
        if (seconds <= 0) {
            clearInterval(countdownInterval);
            startGame();
        }
    }, 1000);
    
    // Update player list with selected player highlighted
    updatePlayersList();
    playSound('notify');
});

// Game update event when players make choices
socket.on('gameUpdate', (data) => {
    // Handle game updates here if needed
    console.log(`${data.player} chose: ${data.choice}`);
});

// Update the displayed list of connected players
function updatePlayersList() {
    playersUl.innerHTML = '';
    allPlayers.forEach(p => {
        const li = document.createElement('li');
        li.textContent = p;
        
        if (p === playerName) {
            li.textContent += ' (You)';
            li.style.fontWeight = 'bold';
            li.style.color = 'var(--drexel-gold)';
        }
        
        if (p === selectedPlayer) {
            li.classList.add('selected');
            li.textContent += ' 🐉 Selected';
        }
        
        playersUl.appendChild(li);
    });

    // Update progress bar according to players count
    const percent = Math.min(100, (allPlayers.length / Number(requiredPlayers.textContent)) * 100);
    document.getElementById('playerProgress').style.width = percent + '%';
}


// Start the game
function startGame() {
    isGameStarted = true;
    countdown.style.display = 'none';

    // Optionally hide join controls or disable input
    playerNameInput.disabled = true;
    joinButton.disabled = true;

    // Show a message or enable game interaction here
    alert(`Game started! Selected player is ${selectedPlayer}.`);
    // Determine if the current player is the selected one
    const isSelected = playerName === selectedPlayer;
    const messagePrefix = isSelected ? "YOU HAVE BEEN SELECTED! " : "";
    
    gameDiv.innerHTML = `<p>${messagePrefix}Hey, ${playerName}, you're a CCI freshman. In Rush Building, Jamie says, "DragonDare's epic, ${playerName}! You in?" </p>
        <p>You laugh at a dare where someone swiped their DragonCard at the DAC for a TikTok, but rumors say dares can tank co-op interviews.</p>
        ${isSelected ? '<p class="selected">As the selected player, your choices will affect everyone!</p>' : ''}
        <button onclick="choose('join')">Join DragonDare</button>
        <button onclick="choose('ask')">Ask if dares hurt co-op chances</button>
        <button onclick="choose('no')">Say no, it could mess with your rep</button>`;
    
    // Update player list with selected player highlighted
    updatePlayersList();
}

// Player makes a choice
function choose(choice) {
    playSound(choice.includes('bad') || choice.includes('neutral') ? 'crowd' : 'notify');
    
    // Send choice to server
    socket.emit('playerChoice', {
        playerName: playerName,
        choice: choice
    });
    
    // Game progression based on choices
    if (choice === 'join') {
        gameDiv.innerHTML = `<p>You join DragonDare, and it's a rush! You draw ${getRandomPlayerExcept(playerName)}, a CCI classmate. The app says, "Make them post a video coding a bad app in public." Jamie cheers, "Do it, ${playerName}!"</p>
            <p>Notification: "200 likes for the last dare!" You're all in.</p>
            <button onclick="choose('post')">Post the dare</button>
            <button onclick="choose('warn')">Warn them</button>
            <button onclick="choose('skip')">Skip the dare</button>`;
    } else if (choice === 'ask') {
        gameDiv.innerHTML = `<p>Jamie says, "Nobody's lost a co-op over DragonDare!" But you hear ${getRandomPlayerExcept(playerName)} dropped out after a viral dare. The Rush classroom buzzes.</p>
            <button onclick="choose('join')">Join DragonDare</button>
            <button onclick="choose('group')">Start a CCI group against peer pressure</button>
            <button onclick="choose('walk')">Walk away</button>`;
    } else if (choice === 'no') {
        gameDiv.innerHTML = `<p>You skip DragonDare, and Jamie's annoyed. At Welcome Week's DAC party, ${getRandomPlayerExcept(playerName)}'s dare goes viral, and they're crushed.</p>
            <button onclick="choose('join')">Join to fit in</button>
            <button onclick="choose('warnOthers')">Warn CCI peers</button>`;
    } else if (choice === 'post') {
        gameDiv.innerHTML = `<p>${getRandomPlayerExcept(playerName)}'s video goes viral on Drexel's X feed: "Worst coder!" They skip CS171. You earn a "Dare Dragon" badge. Then, *your* name's drawn: "Post a video in nerdy Drexel merch."</p>
            <p>Your co-op dreams flash—you loved DragonDare until now.</p>
            <button onclick="choose('postVideo')">Post the video</button>
            <button onclick="choose('callOut')">Post on X that DragonDare's toxic</button>
            <button onclick="choose('fake')">Fake the video with a meme</button>`;
    } else if (choice === 'warn') {
        gameDiv.innerHTML = `<p>${getRandomPlayerExcept(playerName)} thanks you. Another student's dare gets 500 likes, but they're roasted online. Jamie says, "It's CCI fun!"</p>
            <button onclick="choose('postNew')">Post a new dare</button>
            <button onclick="choose('expose')">Expose DragonDare on X</button>
            <button onclick="choose('prof')">Report to a CCI professor</button>`;
    } else if (choice === 'skip') {
        gameDiv.innerHTML = `<p>You skip the dare, but DragonDare pulls you back. Your dare: "Post a video dancing at the DAC." Jamie: "Show Drexel pride!"</p>
            <button onclick="choose('dance')">Post the dance video</button>
            <button onclick="choose('quit')">Quit and tell CCI friends</button>
            <button onclick="choose('ignore')">Ignore it</button>`;
    } else if (choice === 'postVideo' || choice === 'dance') {
        gameDiv.innerHTML = `<p>Your video's mocked across Drexel: "Dork alert!" Recruiters see it, and co-op apps tank.</p>
            <p><strong>Bad Ending:</strong> You, ${playerName}, loved DragonDare until it hit you, like Tessie in *The Lottery*. What Drexel 'lotteries' do you ignore?</p>
            <button onclick="resetGame()">Play Again</button>`;
    } else if (choice === 'callOut' || choice === 'expose' || choice === 'group' || choice === 'warnOthers' || choice === 'quit') {
        gameDiv.innerHTML = `<p>Your X post, "DragonDare's bullying!" sparks a protest by the Mario statue. CCI bans the app.</p>
            <p><strong>Good Ending:</strong> You, ${playerName}, spoke up late but saved Drexel's vibe! What 'lotteries' will you challenge?</p>
            <button onclick="resetGame()">Play Again</button>`;
    } else if (choice === 'fake' || choice === 'ignore') {
        gameDiv.innerHTML = `<p>Your meme video gets laughs, but ${getRandomPlayerExcept(playerName)}'s gone. You keep your co-op rep but feel guilty.</p>
            <p><strong>Neutral Ending:</strong> You, ${playerName}, stayed quiet, like Drexel's village. What now?</p>
            <button onclick="resetGame()">Play Again</button>`;
    } else if (choice === 'prof' || choice === 'walk') {
        gameDiv.innerHTML = `<p>The professor bans DragonDare quietly. Some call you a snitch, others thank you.</p>
            <p><strong>Neutral Ending:</strong> You, ${playerName}, acted late, like Tessie's protest. What Drexel trends will you challenge?</p>
            <button onclick="resetGame()">Play Again</button>`;
    } else if (choice === 'postNew') {
        gameDiv.innerHTML = `<p>Your dare humiliates ${getRandomPlayerExcept(playerName)}. Then, *your* name's drawn: "Confess your worst co-op interview fail."</p>
            <button onclick="choose('postFail')">Post the video</button>
            <button onclick="choose('callOut')">Quit and call out DragonDare</button>`;
    } else if (choice === 'postFail') {
        gameDiv.innerHTML = `<p>Your video's a campus joke. CCI peers shun you, and co-op offers dry up.</p>
            <p><strong>Bad Ending:</strong> You, ${playerName}, fueled DragonDare until it burned you, like Tessie. What 'lotteries' do you fuel?</p>
            <button onclick="resetGame()">Play Again</button>`;
    }
}

const playerSockets = {}; // socket.id -> playerName

socket.on('playerJoin', (playerName) => {
    if (!players.includes(playerName)) {
        players.push(playerName);
        playerSockets[socket.id] = playerName;
    }
    // ...
});

socket.on('disconnect', () => {
    const playerName = playerSockets[socket.id];
    if (playerName) {
        players = players.filter(p => p !== playerName);
        delete playerSockets[socket.id];
    }
    io.emit('playerUpdate', {
        players,
        count: players.length,
        required: requiredPlayersToStart,
    });
});


// Reset the game
function resetGame() {
    window.location.reload();
}