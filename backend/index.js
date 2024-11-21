const express = require('express');
const axios = require('axios');  // To call the Move backend
const app = express();
const port = 5000;

app.use(express.json());

// Assuming your Move backend is exposed via an HTTP API
const MOVE_API_URL = 'http://localhost:8000/move';  // Adjust this URL if needed

// Start a new game (Call Move backend)
app.post('/start-game', async (req, res) => {
    try {
        // Call the Move backend to get a new random word
        const response = await axios.post(MOVE_API_URL, { action: 'start_game' });
        // Example response format from Move backend
        const gameState = {
            word: response.data.word,
            guesses: [],
            turns: 10,
            message: 'Game Started!',
        };
        res.json(gameState);
    } catch (error) {
        console.error('Error starting game:', error);
        res.status(500).send('Error starting the game');
    }
});

// Handle player guesses (Call Move backend to process guess)
app.post('/make-guess', async (req, res) => {
    const { word, guesses, turns, guess } = req.body;

    try {
        const response = await axios.post(MOVE_API_URL, {
            action: 'make_guess',
            word,
            guesses,
            turns,
            guess,
        });

        const updatedGameState = response.data;  // Assuming the Move backend returns updated game state
        res.json(updatedGameState);
    } catch (error) {
        console.error('Error making guess:', error);
        res.status(500).send('Error making the guess');
    }
});

app.listen(port, () => {
    console.log(`Backend listening at http://localhost:${port}`);
});
