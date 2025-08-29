import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Play, RotateCcw } from 'lucide-react';

interface SimpleWordSprintProps {
  onGameComplete: (won: boolean, score: number) => void;
  difficulty?: string;
}

const SimpleWordSprint: React.FC<SimpleWordSprintProps> = ({ onGameComplete, difficulty = 'easy' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWord, setCurrentWord] = useState('');
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [gameResult, setGameResult] = useState<'playing' | 'won' | 'lost' | null>(null);
  
  const timeIntervalRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Word lists for different difficulties
  const wordLists = {
    easy: ['cat', 'dog', 'hat', 'run', 'jump', 'play', 'sing', 'dance', 'smile', 'laugh'],
    medium: ['computer', 'elephant', 'beautiful', 'adventure', 'knowledge', 'happiness', 'butterfly', 'mountain', 'ocean', 'sunshine'],
    hard: ['extraordinary', 'sophisticated', 'revolutionary', 'philosophical', 'technological', 'environmental', 'international', 'revolutionary', 'sophisticated', 'extraordinary'],
    extreme: ['pneumonoultramicroscopicsilicovolcanoconios', 'supercalifragilisticexpialidocious', 'antidisestablishmentarianism', 'floccinaucinihilipilification', 'hippopotomonstrosesquippedaliophobia']
  };

  const currentWordList = wordLists[difficulty as keyof typeof wordLists] || wordLists.easy;

  // Difficulty settings
  const settings = {
    easy: { timeLimit: 30, targetWords: 5 },
    medium: { timeLimit: 25, targetWords: 4 },
    hard: { timeLimit: 20, targetWords: 3 },
    extreme: { timeLimit: 15, targetWords: 2 }
  }[difficulty];

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setTimeLeft(settings.timeLimit);
    setWordsCompleted(0);
    setGameResult('playing');
    setUserInput('');
    
    // Set first word
    const randomWord = currentWordList[Math.floor(Math.random() * currentWordList.length)];
    setCurrentWord(randomWord);
    
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
    
    // Focus input
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (userInput.toLowerCase() === currentWord.toLowerCase()) {
      // Correct word!
      const wordScore = Math.floor(currentWord.length * 10) + timeLeft * 5;
      setScore(prev => prev + wordScore);
      setWordsCompleted(prev => prev + 1);
      
      // Check if target reached
      if (wordsCompleted + 1 >= settings.targetWords) {
        endGame(true, score + wordScore);
        return;
      }
      
      // Set next word
      const remainingWords = currentWordList.filter(word => word !== currentWord);
      const nextWord = remainingWords[Math.floor(Math.random() * remainingWords.length)];
      setCurrentWord(nextWord);
      setUserInput('');
      
      // Focus input again
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const endGame = (won: boolean, finalScore?: number) => {
    setIsPlaying(false);
    setGameResult(won ? 'won' : 'lost');
    
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
    setScore(0);
    setTimeLeft(settings.timeLimit);
    setWordsCompleted(0);
    setGameResult(null);
    setUserInput('');
    setCurrentWord('');
    
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
          <CardTitle className="text-center">Word Sprint - {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Game Instructions */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Type the word correctly to advance!</p>
            <p>Target: {settings.targetWords} words | Completed: {wordsCompleted}</p>
            <p>Time left: {timeLeft}s | Score: {score}</p>
          </div>

          {/* Current Word Display */}
          {isPlaying && (
            <div className="text-center p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <h2 className="text-3xl font-mono font-bold text-blue-800 mb-4">
                {currentWord}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={handleInputChange}
                  placeholder="Type the word here..."
                  className="text-center text-lg"
                  autoComplete="off"
                  autoFocus
                />
                <Button type="submit" className="w-full">
                  Submit Word
                </Button>
              </form>
            </div>
          )}

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
              <h3 className="text-lg font-semibold text-green-800">Excellent!</h3>
              <p className="text-green-600">You completed {wordsCompleted + 1} words! Score: {score}</p>
            </div>
          )}
          
          {gameResult === 'lost' && (
            <div className="text-center p-4 bg-red-100 border border-red-300 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800">Time's Up!</h3>
              <p className="text-red-600">You completed {wordsCompleted} words. Try to be faster!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleWordSprint;
