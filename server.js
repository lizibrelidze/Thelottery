// server.js - Node.js server for DragonDare game
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const setupGameHandlers = require('./handlers/gameHandler'); // ✅ import your handler

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Set up the game logic
setupGameHandlers(io); // ✅ delegate game socket logic

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
