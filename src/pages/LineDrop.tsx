import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Play, RotateCcw, Trophy, Target, Timer } from 'lucide-react';

interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  score: number;
  accuracy: number;
  timeElapsed: number;
  attempts: number;
  bestScore: number;
  gameStartTime: number;
}

interface DifficultySettings {
  lineSpeed: number;
  targetWidth: number;
  lineWidth: number;
  maxScore: number;
  timeLimit: number;
}

const DIFFICULTY_SETTINGS: Record<string, DifficultySettings> = {
  easy: {
    lineSpeed: 1,
    targetWidth: 60,
    lineWidth: 8,
    maxScore: 1000,
    timeLimit: 30
  },
  medium: {
    lineSpeed: 1.5,
    targetWidth: 40,
    lineWidth: 6,
    maxScore: 2000,
    timeLimit: 25
  },
  hard: {
    lineSpeed: 2,
    targetWidth: 30,
    lineWidth: 4,
    maxScore: 3000,
    timeLimit: 20
  },
  extreme: {
    lineSpeed: 3,
    targetWidth: 20,
    lineWidth: 3,
    maxScore: 5000,
    timeLimit: 15
  }
};

const LineDrop: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const difficulty = searchParams.get('difficulty') || 'easy';
  const settings = DIFFICULTY_SETTINGS[difficulty];
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const gameStateRef = useRef<GameState>({
    isPlaying: false,
    isPaused: false,
    score: 0,
    accuracy: 0,
    timeElapsed: 0,
    attempts: 0,
    bestScore: 0,
    gameStartTime: 0
  });

  const [gameState, setGameState] = useState<GameState>(gameStateRef.current);
  const [linePosition, setLinePosition] = useState(0);
  const [targetPosition, setTargetPosition] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalAccuracy, setFinalAccuracy] = useState(0);

  // Initialize game
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = 400;
        canvas.height = 600;
        drawGame(ctx);
      }
    }
    
    // Set random target position
    setTargetPosition(Math.random() * 300 + 100);
    
    // Load best score
    loadBestScore();
  }, [difficulty]);

  const loadBestScore = async () => {
    try {
      const response = await fetch(`/api/games/best-scores?gameType=line-drop&difficulty=${difficulty}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.bestScore) {
          gameStateRef.current.bestScore = data.bestScore.score;
          setGameState(prev => ({ ...prev, bestScore: data.bestScore.score }));
        }
      }
    } catch (error) {
      console.error('Failed to load best score:', error);
    }
  };

  const drawGame = useCallback((ctx: CanvasRenderingContext2D) => {
    const canvas = ctx.canvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw target line
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, targetPosition);
    ctx.lineTo(canvas.width, targetPosition);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw target zone
    ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
    ctx.fillRect(0, targetPosition - settings.targetWidth / 2, canvas.width, settings.targetWidth);

    // Draw falling line
    if (gameStateRef.current.isPlaying) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = settings.lineWidth;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, linePosition);
      ctx.lineTo(canvas.width / 2, linePosition + 100);
      ctx.stroke();
    }
  }, [targetPosition, settings, linePosition]);

  const startGame = useCallback(() => {
    if (gameStateRef.current.isPlaying) return;

    gameStateRef.current.isPlaying = true;
    gameStateRef.current.isPaused = false;
    gameStateRef.current.score = 0;
    gameStateRef.current.accuracy = 0;
    gameStateRef.current.timeElapsed = 0;
    gameStateRef.current.attempts = 0;
    gameStateRef.current.gameStartTime = Date.now();
    
    setGameState({ ...gameStateRef.current });
    setLinePosition(0);
    setShowResults(false);

    const animate = () => {
      if (!gameStateRef.current.isPlaying || gameStateRef.current.isPaused) return;

      setLinePosition(prev => {
        const newPosition = prev + settings.lineSpeed;
        
        // Check if line has reached the target area
        if (newPosition >= targetPosition - settings.targetWidth / 2 && 
            newPosition <= targetPosition + settings.targetWidth / 2) {
          // Line is in target zone - player can stop it
          return newPosition;
        }
        
        // Check if line has passed the target
        if (newPosition > targetPosition + settings.targetWidth / 2) {
          // Missed the target
          gameStateRef.current.attempts++;
          setGameState({ ...gameStateRef.current });
          
          if (gameStateRef.current.attempts >= 3) {
            endGame();
            return prev;
          }
          
          // Reset line position for next attempt
          return 0;
        }
        
        return newPosition;
      });

      // Update time
      gameStateRef.current.timeElapsed = (Date.now() - gameStateRef.current.gameStartTime) / 1000;
      setGameState({ ...gameStateRef.current });

      // Check time limit
      if (gameStateRef.current.timeElapsed >= settings.timeLimit) {
        endGame();
        return;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
  }, [settings, targetPosition]);

  const stopLine = useCallback(() => {
    if (!gameStateRef.current.isPlaying || gameStateRef.current.isPaused) return;

    // Calculate accuracy
    const distance = Math.abs(linePosition - targetPosition);
    const maxDistance = settings.targetWidth / 2;
    const accuracy = Math.max(0, 100 - (distance / maxDistance) * 100);
    
    // Calculate score based on accuracy and time
    const timeBonus = Math.max(0, (settings.timeLimit - gameStateRef.current.timeElapsed) / settings.timeLimit);
    const score = Math.round(settings.maxScore * (accuracy / 100) * (0.7 + timeBonus * 0.3));
    
    gameStateRef.current.score = score;
    gameStateRef.current.accuracy = accuracy;
    
    setFinalScore(score);
    setFinalAccuracy(accuracy);
    setShowResults(true);
    
    endGame();
  }, [linePosition, targetPosition, settings]);

  const endGame = useCallback(async () => {
    gameStateRef.current.isPlaying = false;
    gameStateRef.current.isPaused = false;
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    setGameState({ ...gameStateRef.current });
    
    // Submit score if it's not 0
    if (gameStateRef.current.score > 0) {
      try {
        const response = await fetch('/api/games/score', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            gameType: 'line-drop',
            difficulty,
            score: gameStateRef.current.score,
            accuracy: gameStateRef.current.accuracy,
            timeTaken: gameStateRef.current.timeElapsed,
            attempts: gameStateRef.current.attempts,
            gameData: {
              linePosition,
              targetPosition,
              finalDistance: Math.abs(linePosition - targetPosition)
            }
          })
        });
        
        if (response.ok) {
          toast.success('Score submitted successfully!');
          // Update best score if needed
          if (gameStateRef.current.score > gameStateRef.current.bestScore) {
            gameStateRef.current.bestScore = gameStateRef.current.score;
            setGameState(prev => ({ ...prev, bestScore: gameStateRef.current.score }));
          }
        }
      } catch (error) {
        toast.error('Failed to submit score');
      }
    }
  }, [difficulty, linePosition, targetPosition]);

  const pauseGame = useCallback(() => {
    if (!gameStateRef.current.isPlaying) return;
    
    gameStateRef.current.isPaused = !gameStateRef.current.isPaused;
    setGameState({ ...gameStateRef.current });
    
    if (gameStateRef.current.isPaused) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    } else {
      startGame();
    }
  }, [startGame]);

  const resetGame = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    gameStateRef.current.isPlaying = false;
    gameStateRef.current.isPaused = false;
    gameStateRef.current.score = 0;
    gameStateRef.current.accuracy = 0;
    gameStateRef.current.timeElapsed = 0;
    gameStateRef.current.attempts = 0;
    
    setGameState({ ...gameStateRef.current });
    setLinePosition(0);
    setShowResults(false);
    setFinalScore(0);
    setFinalAccuracy(0);
    
    // Set new random target position
    setTargetPosition(Math.random() * 300 + 100);
  }, []);

  const playAgain = useCallback(() => {
    resetGame();
    setTimeout(() => startGame(), 100);
  }, [resetGame, startGame]);

  // Draw game on canvas updates
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawGame(ctx);
      }
    }
  }, [drawGame, linePosition, gameState.isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

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
            <h1 className="text-3xl font-bold">Line Drop</h1>
            <p className="text-muted-foreground">
              Stop the falling line precisely on the target
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Game Canvas */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Game Area</span>
                <div className="flex items-center space-x-2">
                  {gameState.isPlaying && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={pauseGame}
                    >
                      {gameState.isPaused ? 'Resume' : 'Pause'}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetGame}
                    disabled={gameState.isPlaying}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Click to stop the line when it reaches the green target zone
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <canvas
                  ref={canvasRef}
                  className="border-2 border-gray-200 rounded-lg cursor-pointer"
                  onClick={gameState.isPlaying && !gameState.isPaused ? stopLine : undefined}
                  style={{ cursor: gameState.isPlaying && !gameState.isPaused ? 'pointer' : 'default' }}
                />
              </div>
              
              {!gameState.isPlaying && !showResults && (
                <div className="text-center mt-4">
                  <Button onClick={startGame} size="lg">
                    <Play className="w-4 h-4 mr-2" />
                    Start Game
                  </Button>
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
                <span>Attempts:</span>
                <span className="font-bold">{gameState.attempts}/3</span>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span className="font-bold">{gameState.timeElapsed.toFixed(1)}s</span>
              </div>
            </CardContent>
          </Card>

          {/* Time Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Timer className="w-5 h-5" />
                <span>Time Limit</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress 
                value={(gameState.timeElapsed / settings.timeLimit) * 100} 
                className="w-full"
              />
              <p className="text-sm text-muted-foreground mt-2">
                {Math.max(0, settings.timeLimit - gameState.timeElapsed).toFixed(1)}s remaining
              </p>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>How to Play</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>• A line falls from the top</p>
              <p>• Click when it reaches the green target zone</p>
              <p>• Score depends on accuracy and speed</p>
              <p>• You have 3 attempts per game</p>
              <p>• Beat the time limit for bonus points</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Results Modal */}
      {showResults && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Game Over!</CardTitle>
              <CardDescription>Here's how you did</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold text-primary">{finalScore}</div>
                <p className="text-muted-foreground">Final Score</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{finalAccuracy.toFixed(1)}%</div>
                  <p className="text-sm text-muted-foreground">Accuracy</p>
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

export default LineDrop;
