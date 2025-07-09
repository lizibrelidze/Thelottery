DragonDare - The Lottery Game

An interactive multiplayer game inspired by "The Lottery," set during Drexel University's Welcome Week 2025. The game requires 3 players to join before it starts automatically, randomly selecting one player for "the lottery."

Live Demo:
https://serene-hollows-48056-21177addadc0.herokuapp.com/

Table of Contents

- How to Run the Game
- Deploying to a Hosting Service
- How the Game Works
- File Structure
- Game Mechanics
- Adding Custom Sounds and Images
- Customizing the Game
- Live Demo

How to Run the Game

Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

Installation

1. Clone this repository:
   git clone https://github.com/lizibrelidze/dragondare-game.git
   cd dragondare-game

2. Install dependencies:
   npm install

3. Start the server:
   npm start

4. Open your browser and go to:
   http://localhost:3000

Deploying to a Hosting Service

Node.js-Friendly Hosting

- Heroku (already deployed!):
  Visit: https://serene-hollows-48056-21177addadc0.herokuapp.com/

  Or to deploy your own:
  1. Install the Heroku CLI
  2. Login: heroku login
  3. Create app: heroku create your-app-name
  4. Push: git push heroku main

- Glitch:
  1. Create a new Glitch project
  2. Import your GitHub repo

How the Game Works

- Three players join by entering their names
- Once 3 players have joined, a 5-second countdown starts
- The game randomly selects one player for "the lottery"
- All players experience the story, but the selected player's choices are especially significant
- Other players' names are woven into the narrative for a personalized experience

File Structure

File/Directory         Purpose
---------------------  -----------------------------------------------------
server.js              Main server file (player connections, game state)
package.json           Project configuration and dependencies
public/index.html      Main HTML file for the client
public/game.js         Client-side game logic
public/                Static assets (images, sounds)

Game Mechanics

- Player Selection: One random player is chosen for "the lottery" at game start.
- Real-time Updates: All players see who joins and who is selected.
- Shared Narrative: The story dynamically includes players' names.
- Multiple Endings: Choices lead to good, bad, or neutral endings.

Adding Custom Sounds and Images

1. Place audio files (e.g., notify.mp3, crowd.mp3) in public/
2. Add image files to public/
3. Update HTML to reference your images

Customizing the Game

- Edit the story in game.js
- Change styles in index.html
- Adjust required player count in server.js

Live Demo

https://serene-hollows-48056-21177addadc0.herokuapp.com/
