import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Play, RotateCcw, Trophy, Target, X, Circle, Minus } from 'lucide-react';

type Player = 'X' | 'O';
type CellValue = Player | null;
type GameStatus = 'playing' | 'won' | 'draw' | 'waiting';

interface GameState {
  board: CellValue[][];
  currentPlayer: Player;
  gameStatus: GameStatus;
  winner: Player | null;
  winningLine: number[][] | null;
  score: number;
  bestScore: number;
  gameStartTime: number;
  timeElapsed: number;
  moves: number;
}

interface DifficultySettings {
  aiDelay: number;
  aiSkill: number;
  maxScore: number;
  timeBonus: number;
}

const DIFFICULTY_SETTINGS: Record<string, DifficultySettings> = {
  easy: {
    aiDelay: 1000,
    aiSkill: 0.3,
    maxScore: 1000,
    timeBonus: 0.2
  },
  medium: {
    aiDelay: 800,
    aiSkill: 0.6,
    maxScore: 2000,
    timeBonus: 0.3
  },
  hard: {
    aiDelay: 600,
    aiSkill: 0.8,
    maxScore: 3000,
    timeBonus: 0.4
  },
  extreme: {
    aiDelay: 400,
    aiSkill: 0.95,
    maxScore: 5000,
    timeBonus: 0.5
  }
};

const GravityTicTacToe: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const difficulty = searchParams.get('difficulty') || 'easy';
  const settings = DIFFICULTY_SETTINGS[difficulty];
  
  const [gameState, setGameState] = useState<GameState>({
    board: Array(3).fill(null).map(() => Array(3).fill(null)),
    currentPlayer: 'X',
    gameStatus: 'waiting',
    winner: null,
    winningLine: null,
    score: 0,
    bestScore: 0,
    gameStartTime: 0,
    timeElapsed: 0,
    moves: 0
  });

  const [showResults, setShowResults] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  // Initialize game
  useEffect(() => {
    loadBestScore();
  }, [difficulty]);

  const loadBestScore = async () => {
    try {
      const response = await fetch(`/api/games/best-scores?gameType=gravity-tic-tac-toe&difficulty=${difficulty}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.bestScore) {
          setGameState(prev => ({ ...prev, bestScore: data.bestScore.score }));
        }
      }
    } catch (error) {
      console.error('Failed to load best score:', error);
    }
  };

  const startGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      board: Array(3).fill(null).map(() => Array(3).fill(null)),
      currentPlayer: 'X',
      gameStatus: 'playing',
      winner: null,
      winningLine: null,
      score: 0,
      gameStartTime: Date.now(),
      timeElapsed: 0,
      moves: 0
    }));
    setShowResults(false);
  }, []);

  const resetGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      board: Array(3).fill(null).map(() => Array(3).fill(null)),
      currentPlayer: 'X',
      gameStatus: 'waiting',
      winner: null,
      winningLine: null,
      score: 0,
      timeElapsed: 0,
      moves: 0
    }));
    setShowResults(false);
    setFinalScore(0);
  }, []);

  const getLowestEmptyCell = useCallback((col: number): number => {
    for (let row = 2; row >= 0; row--) {
      if (gameState.board[row][col] === null) {
        return row;
      }
    }
    return -1; // Column is full
  }, [gameState.board]);

  const makeMove = useCallback((col: number) => {
    if (gameState.gameStatus !== 'playing') return;
    
    const row = getLowestEmptyCell(col);
    if (row === -1) return; // Column is full

    const newBoard = gameState.board.map(row => [...row]);
    newBoard[row][col] = gameState.currentPlayer;

    const newMoves = gameState.moves + 1;
    const newTimeElapsed = (Date.now() - gameState.gameStartTime) / 1000;

    setGameState(prev => ({
      ...prev,
      board: newBoard,
      moves: newMoves,
      timeElapsed: newTimeElapsed
    }));

    // Check for win
    const winningLine = checkWin(newBoard, row, col);
    if (winningLine) {
      handleGameEnd('won', gameState.currentPlayer, winningLine, newMoves, newTimeElapsed);
      return;
    }

    // Check for draw
    if (newMoves === 9) {
      handleGameEnd('draw', null, null, newMoves, newTimeElapsed);
      return;
    }

    // Switch player
    const nextPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
    setGameState(prev => ({ ...prev, currentPlayer: nextPlayer }));

    // AI move if it's AI's turn
    if (nextPlayer === 'O') {
      setTimeout(() => makeAIMove(newBoard), settings.aiDelay);
    }
  }, [gameState, getLowestEmptyCell, settings.aiDelay]);

  const makeAIMove = useCallback((currentBoard: CellValue[][]) => {
    if (gameState.gameStatus !== 'playing') return;

    // Simple AI: try to win, block player, or make random move
    const availableMoves: number[] = [];
    for (let col = 0; col < 3; col++) {
      if (getLowestEmptyCell(col) !== -1) {
        availableMoves.push(col);
      }
    }

    if (availableMoves.length === 0) return;

    let bestMove = availableMoves[0];
    let bestScore = -Infinity;

    // Check for winning move
    for (const col of availableMoves) {
      const row = getLowestEmptyCell(col);
      if (row !== -1) {
        const testBoard = currentBoard.map(row => [...row]);
        testBoard[row][col] = 'O';
        if (checkWin(testBoard, row, col)) {
          bestMove = col;
          break;
        }
      }
    }

    // If no winning move, check for blocking move
    if (bestMove === availableMoves[0]) {
      for (const col of availableMoves) {
        const row = getLowestEmptyCell(col);
        if (row !== -1) {
          const testBoard = currentBoard.map(row => [...row]);
          testBoard[row][col] = 'X';
          if (checkWin(testBoard, row, col)) {
            bestMove = col;
            break;
          }
        }
      }
    }

    // Add some randomness based on difficulty
    if (Math.random() > settings.aiSkill && availableMoves.length > 1) {
      const randomIndex = Math.floor(Math.random() * availableMoves.length);
      bestMove = availableMoves[randomIndex];
    }

    // Make the AI move
    const row = getLowestEmptyCell(bestMove);
    if (row !== -1) {
      const newBoard = currentBoard.map(row => [...row]);
      newBoard[row][bestMove] = 'O';

      const newMoves = gameState.moves + 2; // +2 because we're counting both moves
      const newTimeElapsed = (Date.now() - gameState.gameStartTime) / 1000;

      setGameState(prev => ({
        ...prev,
        board: newBoard,
        moves: newMoves,
        timeElapsed: newTimeElapsed
      }));

      // Check for win
      const winningLine = checkWin(newBoard, row, bestMove);
      if (winningLine) {
        handleGameEnd('won', 'O', winningLine, newMoves, newTimeElapsed);
        return;
      }

      // Check for draw
      if (newMoves === 9) {
        handleGameEnd('draw', null, null, newMoves, newTimeElapsed);
        return;
      }

      // Switch back to player
      setGameState(prev => ({ ...prev, currentPlayer: 'X' }));
    }
  }, [gameState.gameStatus, gameState.moves, gameState.gameStartTime, getLowestEmptyCell, settings.aiSkill]);

  const checkWin = useCallback((board: CellValue[][], row: number, col: number): number[][] | null => {
    const player = board[row][col];
    if (!player) return null;

    // Check horizontal
    if (board[row][0] === player && board[row][1] === player && board[row][2] === player) {
      return [[row, 0], [row, 1], [row, 2]];
    }

    // Check vertical
    if (board[0][col] === player && board[1][col] === player && board[2][col] === player) {
      return [[0, col], [1, col], [2, col]];
    }

    // Check diagonals
    if (row === col && board[0][0] === player && board[1][1] === player && board[2][2] === player) {
      return [[0, 0], [1, 1], [2, 2]];
    }

    if (row + col === 2 && board[0][2] === player && board[1][1] === player && board[2][0] === player) {
      return [[0, 2], [1, 1], [2, 0]];
    }

    return null;
  }, []);

  const handleGameEnd = useCallback(async (status: GameStatus, winner: Player | null, winningLine: number[][] | null, moves: number, timeElapsed: number) => {
    let score = 0;
    
    if (status === 'won') {
      if (winner === 'X') {
        // Player won
        const baseScore = settings.maxScore;
        const timeBonus = Math.max(0, (30 - timeElapsed) / 30) * settings.timeBonus;
        const moveBonus = Math.max(0, (9 - moves) / 9) * 0.3;
        score = Math.round(baseScore * (1 + timeBonus + moveBonus));
      } else {
        // AI won
        score = Math.round(settings.maxScore * 0.1); // Small consolation score
      }
    } else if (status === 'draw') {
      score = Math.round(settings.maxScore * 0.5); // Draw score
    }

    setGameState(prev => ({
      ...prev,
      gameStatus: status,
      winner,
      winningLine,
      score,
      timeElapsed
    }));

    setFinalScore(score);
    setShowResults(true);

    // Submit score if player won or drew
    if (score > 0) {
      try {
        const response = await fetch('/api/games/score', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            gameType: 'gravity-tic-tac-toe',
            difficulty,
            score,
            accuracy: status === 'won' && winner === 'X' ? 100 : status === 'draw' ? 50 : 10,
            timeTaken: timeElapsed,
            attempts: 1,
            gameData: {
              status,
              winner,
              moves,
              winningLine
            }
          })
        });
        
        if (response.ok) {
          toast.success('Score submitted successfully!');
          // Update best score if needed
          if (score > gameState.bestScore) {
            setGameState(prev => ({ ...prev, bestScore: score }));
          }
        }
      } catch (error) {
        toast.error('Failed to submit score');
      }
    }
  }, [settings, gameState.bestScore, difficulty]);

  const playAgain = useCallback(() => {
    resetGame();
    setTimeout(() => startGame(), 100);
  }, [resetGame, startGame]);

  const renderCell = useCallback((row: number, col: number) => {
    const value = gameState.board[row][col];
    const isWinningCell = gameState.winningLine?.some(([r, c]) => r === row && c === col);
    
    return (
      <button
        key={`${row}-${col}`}
        className={`
          w-20 h-20 border-2 border-gray-300 flex items-center justify-center text-3xl font-bold
          transition-all duration-200 hover:bg-gray-50
          ${isWinningCell ? 'bg-green-100 border-green-500' : ''}
          ${value === 'X' ? 'text-blue-600' : value === 'O' ? 'text-red-600' : 'text-gray-400'}
          ${gameState.gameStatus === 'playing' && gameState.currentPlayer === 'X' ? 'cursor-pointer' : 'cursor-default'}
        `}
        onClick={() => gameState.currentPlayer === 'X' && makeMove(col)}
        disabled={gameState.gameStatus !== 'playing' || gameState.currentPlayer !== 'X'}
      >
        {value === 'X' && <X className="w-8 h-8" />}
        {value === 'O' && <Circle className="w-8 h-8" />}
        {value === null && <Minus className="w-6 h-6 text-gray-300" />}
      </button>
    );
  }, [gameState, makeMove]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/games')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Games
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Gravity Tic-Tac-Toe</h1>
            <p className="text-muted-foreground">
              Connect 3 with gravity mechanics - pieces fall to the bottom
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Game Board */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Game Board</span>
                <div className="flex items-center space-x-2">
                  {gameState.gameStatus === 'waiting' && (
                    <Button onClick={startGame}>
                      <Play className="w-4 h-4 mr-2" />
                      Start Game
                    </Button>
                  )}
                  {gameState.gameStatus !== 'waiting' && (
                    <Button variant="outline" onClick={resetGame}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      New Game
                    </Button>
                  )}
                </div>
              </CardTitle>
              <CardDescription>
                {gameState.gameStatus === 'playing' 
                  ? `Current Player: ${gameState.currentPlayer === 'X' ? 'You (X)' : 'AI (O)'}`
                  : gameState.gameStatus === 'won'
                  ? `Winner: ${gameState.winner === 'X' ? 'You!' : 'AI!'}`
                  : gameState.gameStatus === 'draw'
                  ? "It's a draw!"
                  : 'Click Start Game to begin'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <div className="grid grid-cols-3 gap-1 bg-gray-200 p-2 rounded-lg">
                  {Array(3).fill(null).map((_, row) =>
                    Array(3).fill(null).map((_, col) => renderCell(row, col))
                  )}
                </div>
              </div>
              
              {/* Game Status */}
              {gameState.gameStatus === 'playing' && (
                <div className="text-center mt-6">
                  <div className="inline-flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                    <div className={`w-4 h-4 rounded-full ${gameState.currentPlayer === 'X' ? 'bg-blue-600' : 'bg-red-600'}`}></div>
                    <span className="font-medium">
                      {gameState.currentPlayer === 'X' ? 'Your turn' : 'AI thinking...'}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Game Info */}
        <div className="space-y-4">
          {/* Game Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="w-5 h-5" />
                <span>Game Stats</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Score:</span>
                <span className="font-bold text-primary">{gameState.score}</span>
              </div>
              <div className="flex justify-between">
                <span>Best Score:</span>
                <span className="font-bold text-green-600">{gameState.bestScore}</span>
              </div>
              <div className="flex justify-between">
                <span>Moves:</span>
                <span className="font-bold">{gameState.moves}/9</span>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span className="font-bold">{gameState.timeElapsed.toFixed(1)}s</span>
              </div>
            </CardContent>
          </Card>

          {/* Game Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>How to Play</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>• Click any column to place your piece (X)</p>
              <p>• Pieces fall to the bottom due to gravity</p>
              <p>• Connect 3 in a row, column, or diagonal</p>
              <p>• You play as X, AI plays as O</p>
              <p>• Score based on speed and efficiency</p>
            </CardContent>
          </Card>

          {/* Difficulty Info */}
          <Card>
            <CardHeader>
              <CardTitle>Difficulty: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>• AI Skill: {Math.round(settings.aiSkill * 100)}%</p>
              <p>• AI Response: {settings.aiDelay}ms</p>
              <p>• Max Score: {settings.maxScore.toLocaleString()}</p>
              <p>• Time Bonus: {Math.round(settings.timeBonus * 100)}%</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Results Modal */}
      {showResults && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {gameState.gameStatus === 'won' 
                  ? gameState.winner === 'X' ? 'You Won! 🎉' : 'AI Won! 🤖'
                  : "It's a Draw! 🤝"
                }
              </CardTitle>
              <CardDescription>Game Results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold text-primary">{finalScore}</div>
                <p className="text-muted-foreground">Final Score</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{gameState.moves}</div>
                  <p className="text-sm text-muted-foreground">Total Moves</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{gameState.timeElapsed.toFixed(1)}s</div>
                  <p className="text-sm text-muted-foreground">Time</p>
                </div>
              </div>

              {finalScore > gameState.bestScore && (
                <div className="text-center p-3 bg-green-100 rounded-lg">
                  <p className="text-green-800 font-medium">🎉 New Best Score! 🎉</p>
                </div>
              )}

              <div className="flex space-x-2">
                <Button onClick={playAgain} className="flex-1">
                  <Play className="w-4 h-4 mr-2" />
                  Play Again
                </Button>
                <Button variant="outline" onClick={() => navigate('/games')} className="flex-1">
                  Back to Games
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GravityTicTacToe;
