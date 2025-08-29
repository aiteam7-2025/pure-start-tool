import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Play, RotateCcw } from 'lucide-react';

interface SimpleCircleStopProps {
  onGameComplete: (won: boolean, score: number) => void;
  difficulty?: string;
}

const SimpleCircleStop: React.FC<SimpleCircleStopProps> = ({ onGameComplete, difficulty = 'easy' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [circleSize, setCircleSize] = useState(50);
  const [targetSize, setTargetSize] = useState(100);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameResult, setGameResult] = useState<'playing' | 'won' | 'lost' | null>(null);
  
  const animationRef = useRef<number>();
  const timeIntervalRef = useRef<NodeJS.Timeout>();

  // Difficulty settings
  const settings = {
    easy: { speed: 1, targetRange: 20, timeLimit: 30 },
    medium: { speed: 1.5, targetRange: 15, timeLimit: 25 },
    hard: { speed: 2, targetRange: 10, timeLimit: 20 },
    extreme: { speed: 3, targetRange: 8, timeLimit: 15 }
  }[difficulty];

  const startGame = () => {
    setIsPlaying(true);
    setCircleSize(50);
    setScore(0);
    setTimeLeft(settings.timeLimit);
    setGameResult('playing');
    
    // Set random target size
    const randomTarget = Math.random() * 100 + 50; // Between 50 and 150
    setTargetSize(randomTarget);
    
    // Start circle animation
    const animate = () => {
      setCircleSize(prev => {
        if (prev >= 200) {
          // Circle too big - game over
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

  const stopCircle = () => {
    if (!isPlaying || gameResult !== 'playing') return;
    
    const sizeDifference = Math.abs(circleSize - targetSize);
    
    if (sizeDifference <= settings.targetRange) {
      // Hit the target size!
      const accuracy = Math.max(0, 100 - sizeDifference);
      const finalScore = Math.floor(accuracy * 10) + timeLeft * 10;
      setScore(finalScore);
      endGame(true, finalScore);
    } else {
      // Wrong size
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
    setCircleSize(50);
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
          <CardTitle className="text-center">Circle Stop - {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Game Instructions */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Click when the circle reaches the target size!</p>
            <p>Target: {Math.round(targetSize)}px | Current: {Math.round(circleSize)}px</p>
            <p>Time left: {timeLeft}s | Score: {score}</p>
          </div>

          {/* Game Canvas */}
          <div className="relative w-full h-96 bg-gray-100 border-2 border-gray-300 rounded-lg flex items-center justify-center">
            {/* Target Size Indicator */}
            <div 
              className="absolute border-2 border-green-600 border-dashed rounded-full"
              style={{
                width: `${targetSize}px`,
                height: `${targetSize}px`
              }}
            />
            
            {/* Growing Circle */}
            <div 
              className="absolute bg-blue-600 rounded-full transition-all duration-100"
              style={{
                width: `${circleSize}px`,
                height: `${circleSize}px`
              }}
            />
            
            {/* Click Area */}
            {isPlaying && (
              <div 
                className="absolute inset-0 cursor-pointer"
                onClick={stopCircle}
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
              <h3 className="text-lg font-semibold text-green-800">Perfect Timing!</h3>
              <p className="text-green-600">You stopped at the right size! Score: {score}</p>
            </div>
          )}
          
          {gameResult === 'lost' && (
            <div className="text-center p-4 bg-red-100 border border-red-300 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800">Wrong Size!</h3>
              <p className="text-red-600">Target was {Math.round(targetSize)}px, you stopped at {Math.round(circleSize)}px</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleCircleStop;
