let players = [];
let requiredPlayersToStart = 3;
let selectedPlayer = null;
let gameStarted = false;

function setupGameHandlers(io) {
    io.on('connection', (socket) => {
        console.log('Player connected:', socket.id);

        socket.on('playerJoin', (playerName) => {
            if (!players.includes(playerName)) {
                players.push(playerName);
            }

            io.emit('playerUpdate', {
                players,
                count: players.length,
                required: requiredPlayersToStart,
            });

            if (!gameStarted && players.length >= requiredPlayersToStart) {
                selectedPlayer = players[Math.floor(Math.random() * players.length)];
                gameStarted = true;

                io.emit('gameStart', {
                    players,
                    selectedPlayer,
                });
            }
        });

        socket.on('playerChoice', ({ playerName, choice }) => {
            io.emit('gameUpdate', {
                player: playerName,
                choice,
            });
        });

       socket.on('disconnect', () => {
    console.log('Disconnected:', socket.id);

    // Optionally, remove player by socket ID mapping if you store it
    // Or if you want to remove by playerName, you should track player names per socket

    // For example:
    // find and remove player associated with this socket from players array

    // Then emit updated player list:
    io.emit('playerUpdate', {
        players,
        count: players.length,
        required: requiredPlayersToStart,
    });
});
        socket.on('resetGame', () => {
            players = [];
            selectedPlayer = null;
            gameStarted = false;

            io.emit('gameReset');
        });
    });
}

module.exports = setupGameHandlers;
