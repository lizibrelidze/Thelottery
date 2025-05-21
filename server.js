// server.js - Node.js server for DragonDare game
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Game state
let players = [];
const REQUIRED_PLAYERS = 3;

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('New connection: ' + socket.id);

    // When a player joins
    socket.on('playerJoin', (playerName) => {
        const player = {
            id: socket.id,
            name: playerName
        };
        
        players.push(player);
        console.log(`${playerName} joined! Players: ${players.length}/${REQUIRED_PLAYERS}`);
        
        // Broadcast updated player list to all clients
        io.emit('playerUpdate', {
            players: players.map(p => p.name),
            count: players.length,
            required: REQUIRED_PLAYERS
        });
        
        // Start game if we have enough players
        if (players.length >= REQUIRED_PLAYERS) {
            // Select a random player for "the lottery"
            const selectedPlayerIndex = Math.floor(Math.random() * players.length);
            const selectedPlayer = players[selectedPlayerIndex];
            
            console.log(`Game starting! Selected player: ${selectedPlayer.name}`);
            
            // Let everyone know the game is starting
            io.emit('gameStart', {
                players: players.map(p => p.name),
                selectedPlayer: selectedPlayer.name
            });
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const index = players.findIndex(player => player.id === socket.id);
        if (index !== -1) {
            console.log(`${players[index].name} disconnected`);
            players.splice(index, 1);
            
            // Update remaining players
            io.emit('playerUpdate', {
                players: players.map(p => p.name),
                count: players.length,
                required: REQUIRED_PLAYERS
            });
        }
    });

    // Game choice made by a player
    socket.on('playerChoice', (data) => {
        // Broadcast the choice to all players
        io.emit('gameUpdate', {
            player: data.playerName,
            choice: data.choice
        });
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});