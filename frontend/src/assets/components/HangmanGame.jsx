import React, { useEffect, useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Row, Col, Button, Input, Typography, message, Modal, Card } from "antd";
import { GithubOutlined } from "@ant-design/icons";
import { provider, moduleAddress, initializeGame, makeGuess, resetGame, fetchGameState } from "../utils/aptos";
import HangmanFigure from "./HangmanFigure";

const { Title, Text } = Typography;

function HangmanGame() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [word, setWord] = useState<string>("");
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [remainingAttempts, setRemainingAttempts] = useState<number>(6);
  const [gameInitialized, setGameInitialized] = useState<boolean>(false);
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [showFailure, setShowFailure] = useState<boolean>(false);
  

  useEffect(() => {
    if (account) {
      fetchGameState(account).then((gameState) => {
        if (gameState) {
          setWord(gameState.word);
          setGuessedLetters(gameState.guessedLetters);
          setRemainingAttempts(gameState.remainingAttempts);
          setGameOver(gameState.gameOver);
          setGameInitialized(true);

          checkGameEndCondition(gameState.word, gameState.guessedLetters, gameState.remainingAttempts);
        } else {
          setGameInitialized(false);
        }
      });
    } else {
      setGameInitialized(false);
    }
  }, [account]);

  const checkGameEndCondition = (word: string, guessedLetters: string[], remainingAttempts: number) => {
    if (isWordGuessed(word, guessedLetters)) {
      setShowCelebration(true);
      setGameOver(true);
    } else if (remainingAttempts === 0) {
      setShowFailure(true);
      setGameOver(true);
    }
  };

  const isWordGuessed = (word: string, guessedLetters: string[]): boolean => {
    return word.split('').every(letter => guessedLetters.includes(letter));
  };

  const handleInitializeGame = async () => {
    if (!account) return;
    try {
      await initializeGame(signAndSubmitTransaction);
      const gameState = await fetchGameState(account);
      if (gameState) {
        setWord(gameState.word);
        setGuessedLetters(gameState.guessedLetters);
        setRemainingAttempts(gameState.remainingAttempts);
        setGameOver(false);
        setGameInitialized(true);
        setShowCelebration(false);
        setShowFailure(false);
      }
      message.success("Game initialized successfully!");
    } catch (error: any) {
      console.error("Error initializing game:", error);
      message.error("Failed to initialize game");
    }
  };

  const handleMakeGuess = async () => {
    if (!account || !currentGuess || gameOver) return;
    
    const guess = currentGuess.toLowerCase();
    if (!/^[a-z]$/.test(guess)) {
      message.error("Please enter a single alphabetic character");
      return;
    }
  
    try {
      await makeGuess(signAndSubmitTransaction, guess);
      const gameState = await fetchGameState(account);
      if (gameState) {
        setWord(gameState.word);
        setGuessedLetters(gameState.guessedLetters);
        setRemainingAttempts(gameState.remainingAttempts);
        setGameOver(gameState.gameOver);
        checkGameEndCondition(gameState.word, gameState.guessedLetters, gameState.remainingAttempts);
      }
      setCurrentGuess("");
    } catch (error: any) {
      console.error("Error making guess:", error);
      message.error("Failed to make guess");
    }
  };

  const handleResetGame = async () => {
    if (!account) return;
    try {
      await resetGame(signAndSubmitTransaction);
      const gameState = await fetchGameState(account);
      if (gameState) {
        setWord(gameState.word);
        setGuessedLetters(gameState.guessedLetters);
        setRemainingAttempts(gameState.remainingAttempts);
        setGameOver(false);
        setShowCelebration(false);
        setShowFailure(false);
      }
      message.success("Game reset successfully!");
    } catch (error: any) {
      console.error("Error resetting game:", error);
      message.error("Failed to reset game");
    }
  };

  const displayWord = word
    .split("")
    .map(letter => (guessedLetters.includes(letter) ? letter : "_"))
    .join(" ");

  return (
    <>
      <Row justify="center" style={{ marginTop: "50px" }}>
        <Col xs={22} sm={20} md={16} lg={12}>
          <Card
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "15px",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
            }}
          >
            {!account ? (
              <Text style={{ color: "#fff", fontSize: "18px", textAlign: "center", display: "block" }}>
                Please connect your wallet to play.
              </Text>
            ) : !gameInitialized ? (
              <Button
                onClick={handleInitializeGame}
                type="primary"
                size="large"
                style={{
                  width: "100%",
                  height: "60px",
                  fontSize: "20px",
                  fontWeight: "bold",
                  background: "#4CAF50",
                  border: "none",
                }}
              >
                Start New Game
              </Button>
            ) : (
              <>
                <HangmanFigure remainingAttempts={remainingAttempts} />
                <Title level={3} style={{ color: "#fff", textAlign: "center", fontFamily: "'Roboto Mono', monospace" }}>
                  {displayWord}
                </Title>
                <Text style={{ color: "#fff", display: "block", textAlign: "center", marginBottom: "20px", fontSize: "18px" }}>
                  Remaining Attempts: {remainingAttempts}
                </Text>
                <Row gutter={16}>
                  <Col span={18}>
                    <Input
                      placeholder="Enter a letter"
                      value={currentGuess}
                      onChange={(e) => setCurrentGuess(e.target.value.toLowerCase())}
                      maxLength={1}
                      style={{ width: "100%", height: "50px", fontSize: "18px" }}
                      disabled={gameOver}
                    />
                  </Col>
                  <Col span={6}>
                    <Button
                      onClick={handleMakeGuess}
                      type="primary"
                      style={{ width: "100%", height: "50px", fontSize: "18px", background: "#2196F3", border: "none" }}
                      disabled={gameOver}
                    >
                      Guess
                    </Button>
                  </Col>
                </Row>
                <Text style={{ color: "#fff", display: "block", marginTop: "20px", fontSize: "16px" }}>
                  Guessed Letters: {guessedLetters.join(", ")}
                </Text>
                <Row justify="center" style={{ marginTop: "20px" }}>
                  <Col span={12}>
                    <Button
                      onClick={handleResetGame}
                      type="primary"
                      style={{ width: "100%", height: "50px", fontSize: "18px", background: "#FF5722", border: "none" }}
                    >
                      Reset Game
                    </Button>
                  </Col>
                </Row>
              </>
            )}
          </Card>
        </Col>
      </Row>
      {/* <Row justify="center" style={{ marginTop: "30px" }}>
        <Col>
          <a href="https://github.com/Biku213/Hangman-Game" target="_blank" rel="noopener noreferrer">
            <Button type="link" icon={<GithubOutlined />} style={{ color: "#fff", fontSize: "18px" }}>
              View on GitHub
            </Button>
          </a>
        </Col>
      </Row> */}
      <Modal
        title="Congratulations!"
        visible={showCelebration}
        onOk={() => {
          setShowCelebration(false);
          handleResetGame();
        }}
        onCancel={() => {
          setShowCelebration(false);
          handleResetGame();
        }}
        footer={[
          <Button key="reset" type="primary" onClick={handleResetGame}>
            Play Again
          </Button>,
        ]}
      >
        <p>You've successfully guessed the word: {word}</p>
        <p>Great job! 🎉🎊</p>
      </Modal>
      <Modal
        title="Game Over"
        visible={showFailure}
        onOk={() => {
          setShowFailure(false);
          handleResetGame();
        }}
        onCancel={() => {
          setShowFailure(false);
          handleResetGame();
        }}
        footer={[
          <Button key="reset" type="primary" onClick={handleResetGame}>
            Try Again
          </Button>,
        ]}
      >
        <p>Sorry, you've run out of attempts. The word was: {word}</p>
        <p>Better luck next time! 😢</p>
      </Modal>
    </>
  );
}

export default HangmanGame;
