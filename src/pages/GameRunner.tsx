import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';
import { Play, RotateCcw, Target, Zap, Gamepad2, Trophy } from 'lucide-react';

// Game definitions
const GAMES = [
  {
    id: 'line-drop',
    name: 'Line Drop',
    description: 'Stop the falling line at the perfect moment',
    icon: Target,
    color: 'bg-blue-500',
    difficulties: ['easy', 'medium', 'hard', 'extreme']
  },
  {
    id: 'circle-stop',
    name: 'Circle Stop',
    description: 'Freeze the circle at the right size',
    icon: Target,
    color: 'bg-green-500',
    difficulties: ['easy', 'medium', 'hard', 'extreme']
  },
  {
    id: 'gravity-tic-tac-toe',
    name: 'Gravity Tic-Tac-Toe',
    description: 'Connect 3 with gravity mechanics',
    icon: Gamepad2,
    color: 'bg-purple-500',
    difficulties: ['easy', 'medium', 'hard', 'extreme']
  },
  {
    id: 'word-sprint',
    name: 'Word Sprint',
    description: 'Solve word puzzles against time',
    icon: Zap,
    color: 'bg-orange-500',
    difficulties: ['easy', 'medium', 'hard', 'extreme']
  }
];

interface GameState {
  currentGameIndex: number;
  currentDifficulty: string;
  gameSequence: number[];
  isPlaying: boolean;
  score: number;
  level: number;
  totalGamesPlayed: number;
  gamesWon: number;
}

const GameRunner: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentGameIndex: 0,
    currentDifficulty: 'easy',
    gameSequence: [],
    isPlaying: false,
    score: 0,
    level: 1,
    totalGamesPlayed: 0,
    gamesWon: 0
  });

  // Generate random game sequence
  const generateGameSequence = () => {
    const sequence = [];
    for (let i = 0; i < 20; i++) { // 20 games per sequence
      sequence.push(Math.floor(Math.random() * GAMES.length));
    }
    return sequence;
  };

  // Start new game sequence
  const startNewSequence = () => {
    const newSequence = generateGameSequence();
    setGameState(prev => ({
      ...prev,
      currentGameIndex: 0,
      currentDifficulty: 'easy',
      gameSequence: newSequence,
      isPlaying: true,
      score: 0,
      level: 1,
      totalGamesPlayed: 0,
      gamesWon: 0
    }));
    toast.success('New game sequence started!');
  };

  // Handle game completion
  const handleGameComplete = (won: boolean, gameScore: number) => {
    setGameState(prev => {
      const newTotalGames = prev.totalGamesPlayed + 1;
      const newGamesWon = won ? prev.gamesWon + 1 : prev.gamesWon;
      const newScore = prev.score + gameScore;
      
      // Determine next difficulty based on performance
      let nextDifficulty = prev.currentDifficulty;
      if (won) {
        if (prev.currentDifficulty === 'easy') nextDifficulty = 'medium';
        else if (prev.currentDifficulty === 'medium') nextDifficulty = 'hard';
        else if (prev.currentDifficulty === 'hard') nextDifficulty = 'extreme';
      } else {
        if (prev.currentDifficulty === 'extreme') nextDifficulty = 'hard';
        else if (prev.currentDifficulty === 'hard') nextDifficulty = 'medium';
        else if (prev.currentDifficulty === 'medium') nextDifficulty = 'easy';
      }

      // Check if sequence is complete
      if (prev.currentGameIndex >= prev.gameSequence.length - 1) {
        // Sequence complete
        toast.success(`Sequence complete! Final score: ${newScore.toLocaleString()}`);
        return {
          ...prev,
          isPlaying: false,
          totalGamesPlayed: newTotalGames,
          gamesWon: newGamesWon,
          score: newScore
        };
      }

      // Move to next game
      return {
        ...prev,
        currentGameIndex: prev.currentGameIndex + 1,
        currentDifficulty: nextDifficulty,
        totalGamesPlayed: newTotalGames,
        gamesWon: newGamesWon,
        score: newScore,
        level: prev.level + 1
      };
    });
  };

  // Retry current game
  const retryCurrentGame = () => {
    toast.info('Retrying current game...');
  };

  // Get current game info
  const currentGame = GAMES[gameState.gameSequence[gameState.currentGameIndex] || 0];
  const progress = gameState.isPlaying ? (gameState.currentGameIndex / gameState.gameSequence.length) * 100 : 0;

  if (!gameState.isPlaying) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to TimeiT!</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Test your precision and timing skills with our collection of mini-games
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {GAMES.map((game) => (
            <Card key={game.id} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className={`w-16 h-16 ${game.color} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                  <game.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-lg">{game.name}</CardTitle>
                <CardDescription>{game.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {game.difficulties.map((difficulty) => (
                    <Badge key={difficulty} variant="outline" className="mr-2">
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" onClick={startNewSequence} className="text-lg px-8 py-4">
            <Play className="w-6 h-6 mr-2" />
            Start Gaming Journey
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Games will be selected randomly with increasing difficulty
          </p>
        </div>

        {gameState.totalGamesPlayed > 0 && (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Previous Session</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-2">
              <div className="flex justify-between">
                <span>Games Played:</span>
                <span className="font-medium">{gameState.totalGamesPlayed}</span>
              </div>
              <div className="flex justify-between">
                <span>Games Won:</span>
                <span className="font-medium">{gameState.gamesWon}</span>
              </div>
              <div className="flex justify-between">
                <span>Win Rate:</span>
                <span className="font-medium">
                  {gameState.totalGamesPlayed > 0 
                    ? Math.round((gameState.gamesWon / gameState.totalGamesPlayed) * 100)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Score:</span>
                <span className="font-medium">{gameState.score.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Game Progress Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Level {gameState.level}</h1>
        <p className="text-lg text-muted-foreground mb-4">
          {currentGame.name} - {gameState.currentDifficulty.charAt(0).toUpperCase() + gameState.currentDifficulty.slice(1)}
        </p>
        
        <div className="max-w-2xl mx-auto space-y-4">
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Game {gameState.currentGameIndex + 1} of {gameState.gameSequence.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
        </div>
      </div>

      {/* Current Game Card */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className={`w-20 h-20 ${currentGame.color} rounded-lg flex items-center justify-center mx-auto mb-4`}>
            <currentGame.icon className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-2xl">{currentGame.name}</CardTitle>
          <CardDescription>
            {currentGame.description} - {gameState.currentDifficulty.charAt(0).toUpperCase() + gameState.currentDifficulty.slice(1)} Mode
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {/* Game Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{gameState.score.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{gameState.gamesWon}</div>
              <div className="text-sm text-muted-foreground">Games Won</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{gameState.totalGamesPlayed}</div>
              <div className="text-sm text-muted-foreground">Games Played</div>
            </div>
          </div>

          {/* Game Actions */}
          <div className="space-y-3">
            <Button 
              size="lg" 
              className="w-full text-lg py-6"
              onClick={() => {
                // Simulate game completion (replace with actual game logic)
                const won = Math.random() > 0.3; // 70% win rate for demo
                const gameScore = Math.floor(Math.random() * 1000) + 100;
                handleGameComplete(won, gameScore);
              }}
            >
              <Play className="w-6 h-6 mr-2" />
              Play {currentGame.name}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={retryCurrentGame}
              className="w-full"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>

          {/* Next Game Preview */}
          {gameState.currentGameIndex < gameState.gameSequence.length - 1 && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Next up:</p>
              <div className="flex items-center justify-center space-x-2">
                <div className={`w-8 h-8 ${GAMES[gameState.gameSequence[gameState.currentGameIndex + 1]].color} rounded-lg flex items-center justify-center`}>
                  <GAMES[gameState.gameSequence[gameState.currentGameIndex + 1]].icon className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium">
                  {GAMES[gameState.gameSequence[gameState.currentGameIndex + 1]].name}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-center space-x-2">
              <Trophy className="w-5 h-5" />
              <span>Session Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {gameState.gamesWon}/{gameState.totalGamesPlayed}
                </div>
                <div className="text-sm text-muted-foreground">Win Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {gameState.currentGameIndex + 1}/{gameState.gameSequence.length}
                </div>
                <div className="text-sm text-muted-foreground">Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GameRunner;
