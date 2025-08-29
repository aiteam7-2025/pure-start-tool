import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Play, RotateCcw, Trophy, Target, Timer, BookOpen, CheckCircle, XCircle } from 'lucide-react';

interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  score: number;
  accuracy: number;
  timeElapsed: number;
  timeRemaining: number;
  attempts: number;
  bestScore: number;
  gameStartTime: number;
  currentWord: string;
  scrambledWord: string;
  userInput: string;
  wordIndex: number;
  totalWords: number;
  correctAnswers: number;
}

interface DifficultySettings {
  timeLimit: number;
  wordCount: number;
  maxWordLength: number;
  minWordLength: number;
  maxScore: number;
  timeBonus: number;
}

const DIFFICULTY_SETTINGS: Record<string, DifficultySettings> = {
  easy: {
    timeLimit: 60,
    wordCount: 5,
    maxWordLength: 6,
    minWordLength: 3,
    maxScore: 1000,
    timeBonus: 0.3
  },
  medium: {
    timeLimit: 45,
    wordCount: 7,
    maxWordLength: 8,
    minWordLength: 4,
    maxScore: 2000,
    timeBonus: 0.4
  },
  hard: {
    timeLimit: 30,
    wordCount: 10,
    maxWordLength: 10,
    minWordLength: 5,
    maxScore: 3000,
    timeBonus: 0.5
  },
  extreme: {
    timeLimit: 20,
    wordCount: 12,
    maxWordLength: 12,
    minWordLength: 6,
    maxScore: 5000,
    timeBonus: 0.6
  }
};

// Sample word lists for different difficulties
const WORD_LISTS = {
  easy: ['cat', 'dog', 'hat', 'run', 'big', 'red', 'fun', 'sun', 'map', 'cup'],
  medium: ['happy', 'world', 'music', 'friend', 'school', 'family', 'nature', 'beauty', 'wisdom', 'courage'],
  hard: ['adventure', 'beautiful', 'challenge', 'determine', 'education', 'fantastic', 'generous', 'happiness', 'important', 'knowledge'],
  extreme: ['extraordinary', 'accomplishment', 'determination', 'imagination', 'revolutionary', 'technological', 'philosophical', 'mathematical', 'psychological', 'environmental']
};

const WordSprint: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const difficulty = searchParams.get('difficulty') || 'easy';
  const settings = DIFFICULTY_SETTINGS[difficulty];
  
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isPaused: false,
    score: 0,
    accuracy: 0,
    timeElapsed: 0,
    timeRemaining: settings.timeLimit,
    attempts: 0,
    bestScore: 0,
    gameStartTime: 0,
    currentWord: '',
    scrambledWord: '',
    userInput: '',
    wordIndex: 0,
    totalWords: settings.wordCount,
    correctAnswers: 0
  });

  const [showResults, setShowResults] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalAccuracy, setFinalAccuracy] = useState(0);
  const [dailyWords, setDailyWords] = useState<string[]>([]);

  // Initialize game
  useEffect(() => {
    loadBestScore();
    generateDailyWords();
  }, [difficulty]);

  const loadBestScore = async () => {
    try {
      const response = await fetch(`/api/games/best-scores?gameType=word-sprint&difficulty=${difficulty}`, {
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

  const generateDailyWords = useCallback(() => {
    const words = WORD_LISTS[difficulty as keyof typeof WORD_LISTS] || WORD_LISTS.easy;
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    const selectedWords = shuffled.slice(0, settings.wordCount);
    setDailyWords(selectedWords);
  }, [difficulty, settings.wordCount]);

  const scrambleWord = useCallback((word: string): string => {
    const letters = word.split('');
    let scrambled = '';
    
    while (letters.length > 0) {
      const randomIndex = Math.floor(Math.random() * letters.length);
      scrambled += letters.splice(randomIndex, 1)[0];
    }
    
    // Ensure the scrambled word is different from the original
    return scrambled === word ? scrambleWord(word) : scrambled;
  }, []);

  const startGame = useCallback(() => {
    if (dailyWords.length === 0) return;

    const firstWord = dailyWords[0];
    const scrambled = scrambleWord(firstWord);

    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      isPaused: false,
      score: 0,
      accuracy: 0,
      timeElapsed: 0,
      timeRemaining: settings.timeLimit,
      attempts: 0,
      gameStartTime: Date.now(),
      currentWord: firstWord,
      scrambledWord: scrambled,
      userInput: '',
      wordIndex: 0,
      totalWords: settings.wordCount,
      correctAnswers: 0
    }));
    setShowResults(false);
  }, [dailyWords, settings.timeLimit, scrambleWord]);

  const pauseGame = useCallback(() => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  const resetGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: false,
      score: 0,
      accuracy: 0,
      timeElapsed: 0,
      timeRemaining: settings.timeLimit,
      attempts: 0,
      currentWord: '',
      scrambledWord: '',
      userInput: '',
      wordIndex: 0,
      correctAnswers: 0
    }));
    setShowResults(false);
    setFinalScore(0);
    setFinalAccuracy(0);
  }, [settings.timeLimit]);

  const submitAnswer = useCallback(() => {
    if (!gameState.isPlaying || gameState.isPaused) return;

    const isCorrect = gameState.userInput.toLowerCase().trim() === gameState.currentWord.toLowerCase();
    const newAttempts = gameState.attempts + 1;
    const newCorrectAnswers = isCorrect ? gameState.correctAnswers + 1 : gameState.correctAnswers;
    const newWordIndex = gameState.wordIndex + 1;

    if (isCorrect) {
      // Calculate score for this word
      const timeBonus = Math.max(0, gameState.timeRemaining / settings.timeLimit) * settings.timeBonus;
      const wordScore = Math.round((settings.maxScore / settings.wordCount) * (1 + timeBonus));
      
      setGameState(prev => ({
        ...prev,
        score: prev.score + wordScore,
        correctAnswers: newCorrectAnswers,
        wordIndex: newWordIndex,
        attempts: newAttempts
      }));

      toast.success(`Correct! +${wordScore} points`);
    } else {
      toast.error(`Incorrect! The word was: ${gameState.currentWord}`);
    }

    // Check if game is over
    if (newWordIndex >= settings.wordCount) {
      endGame();
      return;
    }

    // Move to next word
    const nextWord = dailyWords[newWordIndex];
    const nextScrambled = scrambleWord(nextWord);

    setGameState(prev => ({
      ...prev,
      currentWord: nextWord,
      scrambledWord: nextScrambled,
      userInput: '',
      wordIndex: newWordIndex
    }));
  }, [gameState, settings, dailyWords, scrambleWord]);

  const endGame = useCallback(async () => {
    const finalAccuracy = (gameState.correctAnswers / settings.wordCount) * 100;
    const finalScore = gameState.score;

    setFinalScore(finalScore);
    setFinalAccuracy(finalAccuracy);
    setShowResults(true);

    setGameState(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: false
    }));

    // Submit score
    if (finalScore > 0) {
      try {
        const response = await fetch('/api/games/score', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            gameType: 'word-sprint',
            difficulty,
            score: finalScore,
            accuracy: finalAccuracy,
            timeTaken: gameState.timeElapsed,
            attempts: gameState.attempts,
            gameData: {
              correctAnswers: gameState.correctAnswers,
              totalWords: settings.wordCount,
              words: dailyWords
            }
          })
        });
        
        if (response.ok) {
          toast.success('Score submitted successfully!');
          // Update best score if needed
          if (finalScore > gameState.bestScore) {
            setGameState(prev => ({ ...prev, bestScore: finalScore }));
          }
        }
      } catch (error) {
        toast.error('Failed to submit score');
      }
    }
  }, [gameState, settings, dailyWords, difficulty]);

  const playAgain = useCallback(() => {
    resetGame();
    generateDailyWords();
    setTimeout(() => startGame(), 100);
  }, [resetGame, generateDailyWords, startGame]);

  // Game timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (gameState.isPlaying && !gameState.isPaused) {
      interval = setInterval(() => {
        setGameState(prev => {
          const newTimeElapsed = prev.timeElapsed + 0.1;
          const newTimeRemaining = Math.max(0, settings.timeLimit - newTimeElapsed);
          
          if (newTimeRemaining <= 0) {
            endGame();
            return prev;
          }
          
          return {
            ...prev,
            timeElapsed: newTimeElapsed,
            timeRemaining: newTimeRemaining
          };
        });
      }, 100);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState.isPlaying, gameState.isPaused, settings.timeLimit, endGame]);

  // Handle Enter key
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && gameState.isPlaying && !gameState.isPaused) {
      submitAnswer();
    }
  }, [gameState.isPlaying, gameState.isPaused, submitAnswer]);

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
            <h1 className="text-3xl font-bold">Word Sprint</h1>
            <p className="text-muted-foreground">
              Unscramble words quickly to earn points
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Game Area */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Word Challenge</span>
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
                Unscramble the word before time runs out
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!gameState.isPlaying ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Ready to start?</h3>
                  <p className="text-muted-foreground mb-6">
                    You'll have {settings.timeLimit}s to unscramble {settings.wordCount} words
                  </p>
                  <Button onClick={startGame} size="lg">
                    <Play className="w-4 h-4 mr-2" />
                    Start Game
                  </Button>
                </div>
              ) : (
                <>
                  {/* Progress */}
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-2">
                      Word {gameState.wordIndex + 1} of {settings.wordCount}
                    </div>
                    <Progress 
                      value={((gameState.wordIndex + 1) / settings.wordCount) * 100} 
                      className="w-full"
                    />
                  </div>

                  {/* Scrambled Word */}
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-2">Unscramble this word:</div>
                    <div className="text-4xl font-mono font-bold text-primary bg-primary/10 p-6 rounded-lg">
                      {gameState.scrambledWord}
                    </div>
                  </div>

                  {/* Input */}
                  <div className="space-y-4">
                    <Input
                      placeholder="Type your answer..."
                      value={gameState.userInput}
                      onChange={(e) => setGameState(prev => ({ ...prev, userInput: e.target.value }))}
                      onKeyPress={handleKeyPress}
                      className="text-center text-lg"
                      disabled={gameState.isPaused}
                    />
                    <Button 
                      onClick={submitAnswer}
                      className="w-full"
                      disabled={gameState.isPaused || !gameState.userInput.trim()}
                    >
                      Submit Answer
                    </Button>
                  </div>

                  {/* Current Stats */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">{gameState.score}</div>
                      <div className="text-sm text-muted-foreground">Score</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{gameState.correctAnswers}</div>
                      <div className="text-sm text-muted-foreground">Correct</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{gameState.attempts}</div>
                      <div className="text-sm text-muted-foreground">Attempts</div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Game Info */}
        <div className="space-y-4">
          {/* Timer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Timer className="w-5 h-5" />
                <span>Time Remaining</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {gameState.isPlaying ? (
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {Math.ceil(gameState.timeRemaining)}s
                  </div>
                  <Progress 
                    value={(gameState.timeRemaining / settings.timeLimit) * 100} 
                    className="w-full"
                  />
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  Game not started
                </div>
              )}
            </CardContent>
          </Card>

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
                <span>Best Score:</span>
                <span className="font-bold text-green-600">{gameState.bestScore}</span>
              </div>
              <div className="flex justify-between">
                <span>Difficulty:</span>
                <Badge variant="secondary">{difficulty}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Words:</span>
                <span className="font-medium">{settings.wordCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Time Limit:</span>
                <span className="font-medium">{settings.timeLimit}s</span>
              </div>
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
              <p>• Unscramble the given word</p>
              <p>• Type your answer and press Enter</p>
              <p>• Score points for correct answers</p>
              <p>• Faster answers earn bonus points</p>
              <p>• Complete all words before time runs out</p>
            </CardContent>
          </Card>

          {/* Difficulty Info */}
          <Card>
            <CardHeader>
              <CardTitle>Difficulty: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>• Word Count: {settings.wordCount}</p>
              <p>• Time Limit: {settings.timeLimit}s</p>
              <p>• Word Length: {settings.minWordLength}-{settings.maxWordLength} letters</p>
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
              <CardTitle className="text-2xl">Game Complete!</CardTitle>
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
                  <div className="text-2xl font-bold">{gameState.correctAnswers}/{settings.wordCount}</div>
                  <p className="text-sm text-muted-foreground">Words Correct</p>
                </div>
              </div>

              <div className="text-center p-3 bg-blue-100 rounded-lg">
                <p className="text-blue-800 text-sm">
                  Time Used: {gameState.timeElapsed.toFixed(1)}s<br/>
                  Attempts: {gameState.attempts}<br/>
                  Words Completed: {gameState.wordIndex + 1}
                </p>
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

export default WordSprint;
