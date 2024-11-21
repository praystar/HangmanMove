import React, { useEffect, useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { message } from "antd";
import {
  fetchGameState,
  initializeGame,
  makeGuess,
  resetGame,
} from "../utils/aptos"; // Adjust to your utils path

const Hangman = () => {
  const { account, signAndSubmitTransaction } = useWallet();

  const [selectedWord, setSelectedWord] = useState("");
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [maxGuesses, setMaxGuesses] = useState(6);
  const [gameOver, setGameOver] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [gameInitialized, setGameInitialized] = useState(false);

  useEffect(() => {
    if (account) {
      fetchGameStateFromBlockchain();
    }
  }, [account]);

  const fetchGameStateFromBlockchain = async () => {
    try {
      const gameState = await fetchGameState(account);
      if (gameState) {
        setSelectedWord(gameState.word);
        setGuessedLetters(gameState.guessedLetters || []);
        setWrongGuesses(gameState.wrongGuesses || 0);
        setMaxGuesses(gameState.maxGuesses || 6);
        setGameOver(gameState.gameOver);
        setIsWinner(gameState.isWinner);
        setGameInitialized(true);
      } else {
        resetGameState();
      }
    } catch (error) {
      console.error("Error fetching game state:", error);
      message.error("Failed to fetch game state from blockchain.");
    }
  };

  const resetGameState = () => {
    setSelectedWord("");
    setGuessedLetters([]);
    setWrongGuesses(0);
    setGameOver(false);
    setIsWinner(false);
    setGameInitialized(false);
  };

  const handleInitializeGame = async () => {
    if (!account) {
      message.error("Please connect your wallet first!");
      return;
    }

    try {
      await initializeGame(signAndSubmitTransaction);
      fetchGameStateFromBlockchain();
      message.success("Game initialized successfully!");
    } catch (error) {
      console.error("Error initializing game:", error);
      message.error("Failed to initialize game.");
    }
  };

  const handleMakeGuess = async (letter) => {
    if (!account || guessedLetters.includes(letter) || gameOver) return;

    try {
      await makeGuess(signAndSubmitTransaction, letter);
      fetchGameStateFromBlockchain();
    } catch (error) {
      console.error("Error making guess:", error);
      message.error("Failed to make guess.");
    }
  };

  const handleResetGame = async () => {
    if (!account) {
      message.error("Please connect your wallet first!");
      return;
    }

    try {
      await resetGame(signAndSubmitTransaction);
      fetchGameStateFromBlockchain();
      message.success("Game reset successfully!");
    } catch (error) {
      console.error("Error resetting game:", error);
      message.error("Failed to reset game.");
    }
  };

  const renderWord = () => {
    return selectedWord
      .split("")
      .map((letter, idx) =>
        guessedLetters.includes(letter) ? (
          <span key={idx} className="text-xl font-bold mx-1">
            {letter}
          </span>
        ) : (
          <span key={idx} className="text-xl font-bold mx-1">
            _
          </span>
        )
      );
  };

  const renderKeyboard = () => {
    const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
    return alphabet.map((letter) => (
      <button
        key={letter}
        className={`m-1 px-3 py-2 rounded-md ${
          guessedLetters.includes(letter)
            ? "bg-gray-400 text-white cursor-not-allowed"
            : "bg-blue-500 text-white hover:bg-blue-700"
        }`}
        onClick={() => handleMakeGuess(letter)}
        disabled={guessedLetters.includes(letter)}
      >
        {letter}
      </button>
    ));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">Hangman Game</h1>
      {!account ? (
        <p className="text-red-500 text-xl">Please connect your wallet to play.</p>
      ) : !gameInitialized ? (
        <button
          onClick={handleInitializeGame}
          className="px-6 py-3 bg-green-500 text-white text-xl rounded-md hover:bg-green-600"
        >
          Start Game
        </button>
      ) : (
        <>
          <div className="text-center mb-6">
            <p className="text-2xl">Guess the word:</p>
            <div className="mt-2 flex gap-2">{renderWord()}</div>
            <p className="text-red-600 mt-2">
              Wrong guesses: {wrongGuesses} / {maxGuesses}
            </p>
          </div>
          {!gameOver && !isWinner && (
            <div className="flex flex-wrap justify-center mt-4">
              {renderKeyboard()}
            </div>
          )}
          {(gameOver || isWinner) && (
            <div className="text-center mt-4">
              {gameOver && (
                <p className="text-2xl text-red-600">
                  Game Over! The word was <strong>{selectedWord}</strong>.
                </p>
              )}
              {isWinner && (
                <p className="text-2xl text-green-600">
                  Congratulations! You guessed the word{" "}
                  <strong>{selectedWord}</strong>!
                </p>
              )}
              <button
                onClick={handleResetGame}
                className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Play Again
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Hangman;
