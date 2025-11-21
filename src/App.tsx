import { useState, useEffect, useCallback, useRef } from 'react';
import { Grid } from './components/Grid';
import { generateLevel } from './game/generator';
import { initializeGame, makeMove } from './game/logic';
import type { GameState, Coordinate } from './game/types';
import { saveScore, getBestTimeForDifficulty, getScores } from './game/scores';

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showNameEntry, setShowNameEntry] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const timerRef = useRef<number | null>(null);

  const startNewGame = useCallback(() => {
    const level = generateLevel(6, 6, difficulty);
    const initialState = initializeGame(level);
    setGameState(initialState);
    setElapsedTime(0);
    setIsGameStarted(false);
    setBestTime(getBestTimeForDifficulty(difficulty));
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [difficulty]);

  useEffect(() => {
    startNewGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startNewGame]);

  // Stop timer when puzzle completes and show name entry
  useEffect(() => {
    if (gameState?.isComplete && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      // Show name entry modal
      setShowNameEntry(true);
    }
  }, [gameState?.isComplete]);

  const handleMove = (target: Coordinate) => {
    if (!gameState || gameState.isComplete) return;

    const newState = makeMove(gameState, target);
    setGameState(newState);

    // Check if puzzle just completed
    if (newState.isComplete && !gameState.isComplete) {
      console.log('🎉 Puzzle completed!', {
        elapsedTime,
        difficulty,
        pathLength: newState.currentPath.length,
        totalCells: newState.level.rows * newState.level.cols
      });
    }
  };

  const handleReset = () => {
    if (!gameState) return;
    setGameState(initializeGame(gameState.level));
    // Do not reset elapsed time, keep it running for the same puzzle
  };

  const handleStart = () => {
    setIsGameStarted(true);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  };

  const handleSaveName = () => {
    const name = playerName.trim() || 'Anonymous';
    saveScore(difficulty, elapsedTime, name);
    setShowNameEntry(false);
    setPlayerName('');
    // Update best time
    const currentBest = getBestTimeForDifficulty(difficulty);
    setBestTime(currentBest);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!gameState) return <div>Loading...</div>;

  return (
    <div className="game-container">
      <div className="header">
        <h1>Justin's Top Zip Puzzle</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="timer">Time: {formatTime(elapsedTime)}</div>
          {bestTime !== null && (
            <div className="best-time">Best: {formatTime(bestTime)}</div>
          )}
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as any)}
            style={{ padding: '5px', borderRadius: '4px' }}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        {!isGameStarted && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--color-surface)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            borderRadius: '8px',
            border: '2px solid var(--color-grid-line)'
          }}>
            <h2 style={{ marginBottom: '20px' }}>Ready?</h2>
            <button onClick={handleStart} style={{ fontSize: '1.2rem', padding: '15px 40px' }}>
              Start Game
            </button>
          </div>
        )}
        <div style={{ filter: isGameStarted ? 'none' : 'blur(10px)', pointerEvents: isGameStarted ? 'auto' : 'none' }}>
          <Grid gameState={gameState} onMove={handleMove} />
        </div>
      </div>

      {gameState.isComplete && (
        <div className="win-message">
          🎉 Puzzle Solved in {formatTime(elapsedTime)}!
        </div>
      )}

      <div className="controls">
        <button className="secondary" onClick={handleReset}>Reset</button>
        <button onClick={startNewGame}>New Game</button>
        <button className="secondary" onClick={() => setShowLeaderboard(true)}>Leaderboard</button>
      </div>

      <div style={{ marginTop: '20px', fontSize: '0.9rem', color: '#666', textAlign: 'center' }}>
        <p>Draw a path connecting numbers in order.</p>
        <p>Visit every square exactly once.</p>
      </div>

      {showNameEntry && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>🎉 Puzzle Complete!</h2>
            <p style={{ fontSize: '1.2rem', margin: '20px 0' }}>
              Time: <strong>{formatTime(elapsedTime)}</strong>
            </p>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="nameInput" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Enter your name:
              </label>
              <input
                id="nameInput"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                placeholder="Your name"
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '1rem',
                  border: '2px solid var(--color-grid-line)',
                  borderRadius: 'var(--radius-md)',
                  outline: 'none'
                }}
              />
            </div>
            <button onClick={handleSaveName} style={{ width: '100%' }}>Save Score</button>
          </div>
        </div>
      )}

      {showLeaderboard && (
        <div className="modal-overlay" onClick={() => setShowLeaderboard(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Leaderboard - {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</h2>
            <div className="leaderboard-list">
              {getScores()
                .filter(s => s.difficulty === difficulty)
                .sort((a, b) => a.time - b.time)
                .slice(0, 10)
                .map((score, idx) => (
                  <div key={idx} className="leaderboard-item">
                    <span className="rank">#{idx + 1}</span>
                    <span className="name">{score.playerName}</span>
                    <span className="time">{formatTime(score.time)}</span>
                  </div>
                ))}
              {getScores().filter(s => s.difficulty === difficulty).length === 0 && (
                <p style={{ textAlign: 'center', color: '#999' }}>No scores yet. Complete a puzzle to get started!</p>
              )}
            </div>
            <div style={{ marginTop: '20px' }}>
              <button onClick={() => setShowLeaderboard(false)} style={{ width: '100%' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
