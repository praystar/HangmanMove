import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HangmanGame = () => {
    const [word, setWord] = useState('');
    const [guesses, setGuesses] = useState([]);
    const [turns, setTurns] = useState(10);
    const [result, setResult] = useState('');
    const [gameOver, setGameOver] = useState(false);
    const [guess, setGuess] = useState('');  // Track input guess

    useEffect(() => {
        startNewGame();
    }, []);

    const startNewGame = async () => {
        try {
            const response = await axios.post('http://localhost:5000/start-game');
            setWord(response.data.word);
            setGuesses([]);
            setTurns(10);
            setResult('');
            setGameOver(false);
        } catch (error) {
            console.error('Error starting game:', error);
        }
    };

    const makeGuess = async () => {
        if (gameOver || guess.length !== 1) return;  // Prevent if game over or invalid input

        try {
            const response = await axios.post('http://localhost:5000/make-guess', {
                word,
                guesses,
                turns,
                guess,
            });
            const { word: updatedWord, guesses: updatedGuesses, turns: updatedTurns, message, gameOver: isGameOver } = response.data;

            setWord(updatedWord);
            setGuesses(updatedGuesses);
            setTurns(updatedTurns);
            setResult(message);
            setGameOver(isGameOver);
            setGuess(''); // Clear input after guess
        } catch (error) {
            console.error('Error making guess:', error);
        }
    };

    const displayWord = () => {
        return word.split('').map((char, index) =>
            guesses.includes(char) ? char : '_'
        ).join(' ');
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
            <h1 className="text-3xl font-bold mb-6 text-center text-primary">Hangman Game</h1>
            <div className="text-2xl font-mono text-center mb-4">{displayWord()}</div>
            <div className="text-center mb-4">Guesses: {guesses.join(', ')}</div>
            <div className="text-center mb-4">Turns Left: {turns}</div>
            {result && <div className="text-center mb-4">{result}</div>}
            <input
                type="text"
                id="guess-input"
                maxLength="1"
                className="w-full p-2 border rounded-md"
                placeholder="Enter a letter"
                value={guess}  // Controlled input
                onChange={(e) => setGuess(e.target.value.toLowerCase())}
            />
            <button
                onClick={makeGuess}  // Trigger makeGuess on button click
                className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary-dark transition-colors mt-4"
            >
                Guess
            </button>
            {gameOver && (
                <button
                    onClick={startNewGame}
                    className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition-colors mt-4"
                >
                    New Game
                </button>
            )}
        </div>
    );
};

export default HangmanGame;
