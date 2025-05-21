# DragonDare - The Lottery Game

An interactive multiplayer game based on "The Lottery" theme, set in Drexel University's Welcome Week 2025. The game requires 3 players to join before it starts automatically, selecting one player randomly for "the lottery."

## How to Run the Game

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Installation

1. Clone this repository:
```
git clone https://github.com/yourusername/dragondare-game.git
cd dragondare-game
```

2. Install dependencies:
```
npm install
```

3. Start the server:
```
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

### Deploying to a Hosting Service

#### GitHub Pages Setup
Since GitHub Pages only hosts static content, you'll need a different approach:

1. Consider using a service like Heroku, Glitch, or Render that can host Node.js applications.

2. For Heroku:
   - Install the Heroku CLI
   - Login to Heroku: `heroku login`
   - Create a new app: `heroku create your-app-name`
   - Push to Heroku: `git push heroku main`

3. For Glitch:
   - Create a new Glitch project
   - Import your GitHub repository

## How the Game Works

1. Three players need to join by entering their names
2. Once 3 players have joined, there's a 5-second countdown
3. The game randomly selects one player for "the lottery"
4. All players navigate through the story, but the selected player's choices have special significance
5. The game incorporates other players' names into the narrative to create a personalized experience

## File Structure

- `server.js` - Main server file that handles player connections and game state
- `package.json` - Project configuration and dependencies
- `public/index.html` - Main HTML file for the client
- `public/game.js` - Client-side game logic
- `public/` directory - Contains static assets like images and sounds

## Game Mechanics

- **Player Selection**: One random player is selected for "the lottery" when the game starts.
- **Real-time Updates**: All players see who joins and who is selected.
- **Shared Narrative**: The story dynamically includes other players' names.
- **Multiple Endings**: Depending on choices, players can reach good, bad, or neutral endings.

## Adding Custom Sounds and Images

1. Place your audio files (like `notify.mp3` and `crowd.mp3`) in the `public` directory
2. Add any image files you want to reference in the `public` directory
3. Update the HTML to reference your image files

## Customizing the Game

- Modify the story in `game.js`
- Change the styling in `index.html`
- Adjust the required player count in `server.js`