import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Play, RotateCcw } from 'lucide-react';

interface SimpleLineDropProps {
  onGameComplete: (won: boolean, score: number) => void;
  difficulty?: string;
}

const SimpleLineDrop: React.FC<SimpleLineDropProps> = ({ onGameComplete, difficulty = 'easy' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [linePosition, setLinePosition] = useState(0);
  const [targetPosition, setTargetPosition] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameResult, setGameResult] = useState<'playing' | 'won' | 'lost' | null>(null);
  
  const animationRef = useRef<number>();
  const gameIntervalRef = useRef<NodeJS.Timeout>();
  const timeIntervalRef = useRef<NodeJS.Timeout>();

  // Difficulty settings
  const settings = {
    easy: { speed: 2, targetWidth: 60, timeLimit: 30 },
    medium: { speed: 3, targetWidth: 40, timeLimit: 25 },
    hard: { speed: 4, targetWidth: 30, timeLimit: 20 },
    extreme: { speed: 6, targetWidth: 20, timeLimit: 15 }
  }[difficulty];

  const startGame = () => {
    setIsPlaying(true);
    setLinePosition(0);
    setScore(0);
    setTimeLeft(settings.timeLimit);
    setGameResult('playing');
    
    // Set random target position
    const randomTarget = Math.random() * (400 - settings.targetWidth);
    setTargetPosition(randomTarget);
    
    // Start line animation
    const animate = () => {
      setLinePosition(prev => {
        if (prev >= 400) {
          // Line reached bottom - game over
          endGame(false);
          return prev;
        }
        return prev + settings.speed;
      });
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
    
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

  const stopLine = () => {
    if (!isPlaying || gameResult !== 'playing') return;
    
    const lineCenter = linePosition + 10; // Line is 20px wide
    const targetStart = targetPosition;
    const targetEnd = targetPosition + settings.targetWidth;
    
    if (lineCenter >= targetStart && lineCenter <= targetEnd) {
      // Hit the target!
      const accuracy = Math.abs(lineCenter - (targetStart + targetEnd) / 2);
      const accuracyScore = Math.max(0, 100 - accuracy);
      const finalScore = Math.floor(accuracyScore * 10) + timeLeft * 10;
      setScore(finalScore);
      endGame(true, finalScore);
    } else {
      // Missed the target
      endGame(false);
    }
  };

  const endGame = (won: boolean, finalScore?: number) => {
    setIsPlaying(false);
    setGameResult(won ? 'won' : 'lost');
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
    }
    
    // Call parent callback after a short delay
    setTimeout(() => {
      onGameComplete(won, finalScore || score);
    }, 2000);
  };

  const resetGame = () => {
    setIsPlaying(false);
    setLinePosition(0);
    setScore(0);
    setTimeLeft(settings.timeLimit);
    setGameResult(null);
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Line Drop - {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Game Instructions */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Click when the falling line reaches the target zone!</p>
            <p>Time left: {timeLeft}s | Score: {score}</p>
          </div>

          {/* Game Canvas */}
          <div className="relative w-full h-96 bg-gray-100 border-2 border-gray-300 rounded-lg overflow-hidden">
            {/* Target Zone */}
            <div 
              className="absolute bg-green-400 border-2 border-green-600 rounded"
              style={{
                left: `${targetPosition}px`,
                width: `${settings.targetWidth}px`,
                top: '350px',
                height: '20px'
              }}
            />
            
            {/* Falling Line */}
            <div 
              className="absolute bg-blue-600 rounded-full"
              style={{
                left: '190px',
                top: `${linePosition}px`,
                width: '20px',
                height: '20px'
              }}
            />
            
            {/* Click Area */}
            {isPlaying && (
              <div 
                className="absolute inset-0 cursor-pointer"
                onClick={stopLine}
              />
            )}
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
              <h3 className="text-lg font-semibold text-green-800">Great Job!</h3>
              <p className="text-green-600">You hit the target! Score: {score}</p>
            </div>
          )}
          
          {gameResult === 'lost' && (
            <div className="text-center p-4 bg-red-100 border border-red-300 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800">Missed!</h3>
              <p className="text-red-600">Try again to improve your timing!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleLineDrop;
