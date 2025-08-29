import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Play, RotateCcw } from 'lucide-react';

interface SimpleGravityTicTacToeProps {
  onGameComplete: (won: boolean, score: number) => void;
  difficulty?: string;
}

type Player = 'X' | 'O' | null;
type Board = Player[][];

const SimpleGravityTicTacToe: React.FC<SimpleGravityTicTacToeProps> = ({ onGameComplete, difficulty = 'easy' }) => {
  const [board, setBoard] = useState<Board>(Array(6).fill(null).map(() => Array(7).fill(null)));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [gameResult, setGameResult] = useState<'playing' | 'won' | 'draw' | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const timeIntervalRef = useRef<NodeJS.Timeout>();

  // Difficulty settings
  const settings = {
    easy: { timeLimit: 30, aiDelay: 1000 },
    medium: { timeLimit: 25, aiDelay: 800 },
    hard: { timeLimit: 20, aiDelay: 600 },
    extreme: { timeLimit: 15, aiDelay: 400 }
  }[difficulty];

  const startGame = () => {
    setBoard(Array(6).fill(null).map(() => Array(7).fill(null)));
    setCurrentPlayer('X');
    setGameResult('playing');
    setScore(0);
    setTimeLeft(settings.timeLimit);
    setIsPlaying(true);
    
    // Start timer
    timeIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const makeMove = (col: number) => {
    if (gameResult !== 'playing' || currentPlayer !== 'X') return;
    
    // Find the lowest empty row in the column
    const row = findLowestEmptyRow(col);
    if (row === -1) return; // Column is full
    
    // Make the move
    const newBoard = board.map(row => [...row]);
    newBoard[row][col] = currentPlayer;
    setBoard(newBoard);
    
    // Check for win
    if (checkWin(newBoard, row, col, currentPlayer)) {
      endGame(true, 1000 + timeLeft * 10);
      return;
    }
    
    // Check for draw
    if (checkDraw(newBoard)) {
      endGame(false, 500);
      return;
    }
    
    // Switch to AI player
    setCurrentPlayer('O');
    
    // AI makes a move after a delay
    setTimeout(() => {
      if (gameResult === 'playing') {
        makeAIMove(newBoard);
      }
    }, settings.aiDelay);
  };

  const findLowestEmptyRow = (col: number): number => {
    for (let row = 5; row >= 0; row--) {
      if (board[row][col] === null) {
        return row;
      }
    }
    return -1;
  };

  const makeAIMove = (currentBoard: Board) => {
    // Simple AI: find a random available column
    const availableCols = [];
    for (let col = 0; col < 7; col++) {
      if (currentBoard[0][col] === null) {
        availableCols.push(col);
      }
    }
    
    if (availableCols.length === 0) return;
    
    const randomCol = availableCols[Math.floor(Math.random() * availableCols.length)];
    const row = findLowestEmptyRow(randomCol);
    
    if (row !== -1) {
      const newBoard = currentBoard.map(row => [...row]);
      newBoard[row][randomCol] = 'O';
      setBoard(newBoard);
      
      // Check for AI win
      if (checkWin(newBoard, row, randomCol, 'O')) {
        endGame(false, 0);
        return;
      }
      
      // Check for draw
      if (checkDraw(newBoard)) {
        endGame(false, 500);
        return;
      }
      
      // Switch back to player
      setCurrentPlayer('X');
    }
  };

  const checkWin = (board: Board, row: number, col: number, player: Player): boolean => {
    if (!player) return false;
    
    // Check horizontal
    let count = 1;
    for (let c = col - 1; c >= 0 && board[row][c] === player; c--) count++;
    for (let c = col + 1; c < 7 && board[row][c] === player; c++) count++;
    if (count >= 4) return true;
    
    // Check vertical
    count = 1;
    for (let r = row - 1; r >= 0 && board[r][col] === player; r--) count++;
    for (let r = row + 1; r < 6 && board[r][col] === player; r++) count++;
    if (count >= 4) return true;
    
    // Check diagonal (top-left to bottom-right)
    count = 1;
    for (let i = 1; row - i >= 0 && col - i >= 0 && board[row - i][col - i] === player; i++) count++;
    for (let i = 1; row + i < 6 && col + i < 7 && board[row + i][col + i] === player; i++) count++;
    if (count >= 4) return true;
    
    // Check diagonal (top-right to bottom-left)
    count = 1;
    for (let i = 1; row - i >= 0 && col + i < 7 && board[row - i][col + i] === player; i++) count++;
    for (let i = 1; row + i < 6 && col - i >= 0 && board[row + i][col - i] === player; i++) count++;
    if (count >= 4) return true;
    
    return false;
  };

  const checkDraw = (board: Board): boolean => {
    return board[0].every(cell => cell !== null);
  };

  const endGame = (won: boolean, finalScore: number) => {
    setIsPlaying(false);
    setGameResult(won ? 'won' : 'lost');
    setScore(finalScore);
    
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
    }
    
    // Call parent callback after a short delay
    setTimeout(() => {
      onGameComplete(won, finalScore);
    }, 2000);
  };

  const resetGame = () => {
    setBoard(Array(6).fill(null).map(() => Array(7).fill(null)));
    setCurrentPlayer('X');
    setGameResult(null);
    setScore(0);
    setTimeLeft(settings.timeLimit);
    setIsPlaying(false);
    
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Gravity Tic-Tac-Toe - {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Game Instructions */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Connect 4 in a row! Pieces fall to the bottom.</p>
            <p>Current Player: <span className="font-bold">{currentPlayer}</span></p>
            <p>Time left: {timeLeft}s | Score: {score}</p>
          </div>

          {/* Game Board */}
          <div className="flex justify-center">
            <div className="bg-blue-600 p-4 rounded-lg">
              <div className="grid grid-cols-7 gap-1">
                {board.map((row, rowIndex) =>
                  row.map((cell, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`w-12 h-12 rounded-full border-2 border-white flex items-center justify-center cursor-pointer transition-colors ${
                        cell === 'X' 
                          ? 'bg-red-500 text-white font-bold text-xl' 
                          : cell === 'O' 
                          ? 'bg-yellow-500 text-white font-bold text-xl'
                          : 'bg-blue-400 hover:bg-blue-300'
                      }`}
                      onClick={() => makeMove(colIndex)}
                    >
                      {cell}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Game Controls */}
          <div className="flex justify-center space-x-4">
            {!isPlaying && gameResult === null && (
              <Button onClick={startGame} size="lg">
                <Play className="w-4 h-4 mr-2" />
                Start Game
              </Button>
            )}
            
            {!isPlaying && gameResult !== null && (
              <Button onClick={resetGame} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Play Again
              </Button>
            )}
          </div>

          {/* Game Result */}
          {gameResult === 'won' && (
            <div className="text-center p-4 bg-green-100 border border-green-300 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800">Congratulations!</h3>
              <p className="text-green-600">You won! Score: {score}</p>
            </div>
          )}
          
          {gameResult === 'lost' && (
            <div className="text-center p-4 bg-red-100 border border-red-300 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800">Game Over!</h3>
              <p className="text-red-600">AI won this round. Try again!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleGravityTicTacToe;
