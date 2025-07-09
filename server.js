// server.js - Node.js server for DragonDare game
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

// Game state
let players = [];
const REQUIRED_PLAYERS = 5;
let gameInProgress = false;
let currentSelectedPlayer = null;

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('New connection: ' + socket.id);

    // When a player joins
    socket.on('playerJoin', (playerName) => {
        // Check if name already exists
        if (players.find(p => p.name === playerName)) {
            socket.emit('nameError', 'Name already taken!');
            return;
        }

        const player = {
            id: socket.id,
            name: playerName,
            points: 100,
            status: 'waiting'
        };

        players.push(player);
        console.log(`${playerName} joined! Players: ${players.length}/${REQUIRED_PLAYERS}`);

        io.emit('playerUpdate', {
            players: players,
            count: players.length,
            required: REQUIRED_PLAYERS
        });

        // Start game if enough players
        if (players.length >= REQUIRED_PLAYERS && !gameInProgress) {
            gameInProgress = true;
            startNewRound();
        }
    });

    // Handle dare response
    socket.on('dareResponse', (data) => {
        const player = players.find(p => p.name === data.playerName);
        if (!player || player.name !== currentSelectedPlayer) return;

        if (data.accepted) {
            player.points += 100;
            player.status = 'brave';
            console.log(`${player.name} accepted the dare! +100 points`);
        } else {
            player.points -= 50;
            player.status = 'scared';
            console.log(`${player.name} rejected the dare! -50 points`);
        }

        // Check for elimination
        if (player.points <= 0) {
            player.status = 'eliminated';
            io.emit('playerEliminated', {
                player: player.name,
                players: players,
                remaining: players.filter(p => p.points > 0).length
            });
        }

        // Remove eliminated players from the game
        players = players.filter(p => p.points > 0);

        // Broadcast the result
        io.emit('dareResult', {
            player: player.name,
            accepted: data.accepted,
            points: player.points,
            status: player.status,
            players: players.sort((a, b) => b.points - a.points)
        });

        // Update leaderboard
        io.emit('leaderboardUpdate', {
            players: players.sort((a, b) => b.points - a.points)
        });

        // Check for game over
        if (players.length === 1) {
            gameInProgress = false;
            io.emit('gameOver', {
                winner: players[0].name,
                players: players
            });
            return;
        } else if (players.length < REQUIRED_PLAYERS) {
            // Not enough to continue, but not a winner yet
            gameInProgress = false;
            currentSelectedPlayer = null;
            return;
        }

        // Start next round after 3 seconds
        setTimeout(() => {
            startNewRound();
        }, 3000);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const index = players.findIndex(player => player.id === socket.id);
        if (index !== -1) {
            console.log(`${players[index].name} disconnected`);
            players.splice(index, 1);

            // Reset game if not enough players
            if (players.length < REQUIRED_PLAYERS) {
                gameInProgress = false;
                currentSelectedPlayer = null;
            }

            io.emit('playerUpdate', {
                players: players,
                count: players.length,
                required: REQUIRED_PLAYERS
            });

            io.emit('leaderboardUpdate', {
                players: players.sort((a, b) => b.points - a.points)
            });
        }
    });

    // Game choice made by a player (for story progression)
    socket.on('playerChoice', (data) => {
        io.emit('gameUpdate', {
            player: data.playerName,
            choice: data.choice
        });
    });
});

// Function to start a new dare round
function startNewRound() {
    if (players.length < REQUIRED_PLAYERS) {
        gameInProgress = false;
        return;
    }

    // Select a random player for the dare
    const selectedPlayerIndex = Math.floor(Math.random() * players.length);
    currentSelectedPlayer = players[selectedPlayerIndex].name;

    console.log(`New round! Selected player: ${currentSelectedPlayer}`);

    // Generate random dare
    const dares = [
        "Post a video of yourself doing the Drexel Dragon dance in the DAC!",
        "Sing the Drexel Fight Song in front of the Mario statue!",
        "Wear a ridiculous costume to your next CCI class!",
        "Post a TikTok of yourself coding while doing jumping jacks!",
        "Do 20 push-ups in the Rush Building lobby!",
        "Record yourself giving a dramatic speech about why pineapple belongs on pizza!",
        "Wear your clothes backwards for the entire day!",
        "Post a video of yourself attempting to breakdance!",
        "Sing 'Happy Birthday' to a random stranger on campus!",
        "Do the 'floss' dance in front of the Drexel library!"
    ];

    const randomDare = dares[Math.floor(Math.random() * dares.length)];

    // Send dare to all players
    io.emit('newDare', {
        selectedPlayer: currentSelectedPlayer,
        dare: randomDare,
        players: players.sort((a, b) => b.points - a.points)
    });
}

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
