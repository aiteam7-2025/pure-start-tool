import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Play, Pause, RotateCcw, Home, Target, Gamepad2, Zap, Square } from 'lucide-react';
import SimpleLineDrop from './SimpleLineDrop';
import SimpleCircleStop from './SimpleCircleStop';
import SimpleGravityTicTacToe from './SimpleGravityTicTacToe';
import SimpleWordSprint from './SimpleWordSprint';

// Game definitions
const GAMES = [
  {
    id: 'line-drop',
    name: 'Line Drop',
    description: 'Stop the falling line at the perfect moment',
    icon: Target,
    color: 'bg-blue-500',
    component: 'LineDrop'
  },
  {
    id: 'circle-stop',
    name: 'Circle Stop',
    description: 'Freeze the circle at the right size',
    icon: Square,
    color: 'bg-green-500',
    component: 'CircleStop'
  },
  {
    id: 'gravity-tic-tac-toe',
    name: 'Gravity Tic-Tac-Toe',
    description: 'Connect 3 with gravity mechanics',
    icon: Gamepad2,
    color: 'bg-purple-500',
    component: 'GravityTicTacToe'
  },
  {
    id: 'word-sprint',
    name: 'Word Sprint',
    description: 'Solve word puzzles against time',
    icon: Zap,
    color: 'bg-orange-500',
    component: 'WordSprint'
  }
];

interface GameState {
  currentGameIndex: number;
  gameSequence: number[];
  isPlaying: boolean;
  isPaused: boolean;
  score: number;
  gamesWon: number;
  totalGamesPlayed: number;
}

const SimpleGameRunner: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentGameIndex: 0,
    gameSequence: [],
    isPlaying: false,
    isPaused: false,
    score: 0,
    gamesWon: 0,
    totalGamesPlayed: 0
  });

  const [currentGameComponent, setCurrentGameComponent] = useState<string | null>(null);
  const [showPauseMenu, setShowPauseMenu] = useState(false);

  // Generate random game sequence of 4 games
  const generateGameSequence = () => {
    const sequence = [];
    const availableGames = [...Array(GAMES.length).keys()];
    
    for (let i = 0; i < 4; i++) {
      const randomIndex = Math.floor(Math.random() * availableGames.length);
      sequence.push(availableGames[randomIndex]);
      availableGames.splice(randomIndex, 1);
    }
    return sequence;
  };

  // Start new game sequence
  const startNewSequence = () => {
    const newSequence = generateGameSequence();
    setGameState(prev => ({
      ...prev,
      currentGameIndex: 0,
      gameSequence: newSequence,
      isPlaying: true,
      isPaused: false,
      score: 0,
      gamesWon: 0,
      totalGamesPlayed: 0
    }));
    setCurrentGameComponent(GAMES[newSequence[0]].component);
  };

  // Handle game completion
  const handleGameComplete = (won: boolean, gameScore: number) => {
    setGameState(prev => {
      const newTotalGames = prev.totalGamesPlayed + 1;
      const newGamesWon = won ? prev.gamesWon + 1 : prev.gamesWon;
      const newScore = prev.score + gameScore;
      
      // Check if all 4 games are done
      if (prev.currentGameIndex >= 3) {
        // All games complete
        return {
          ...prev,
          isPlaying: false,
          totalGamesPlayed: newTotalGames,
          gamesWon: newGamesWon,
          score: newScore
        };
      }

      // Move to next game
      const nextGameIndex = prev.currentGameIndex + 1;
      const nextGame = GAMES[prev.gameSequence[nextGameIndex]];
      setCurrentGameComponent(nextGame.component);
      
      return {
        ...prev,
        currentGameIndex: nextGameIndex,
        totalGamesPlayed: newTotalGames,
        gamesWon: newGamesWon,
        score: newScore
      };
    });
  };

  // Restart from beginning
  const restartFromStart = () => {
    setGameState(prev => ({
      ...prev,
      currentGameIndex: 0,
      isPlaying: true,
      isPaused: false,
      score: 0,
      gamesWon: 0,
      totalGamesPlayed: 0
    }));
    setCurrentGameComponent(GAMES[prev.gameSequence[0]].component);
  };

  // Toggle pause
  const togglePause = () => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
    setShowPauseMenu(!showPauseMenu);
  };

  // Resume game
  const resumeGame = () => {
    setGameState(prev => ({ ...prev, isPaused: false }));
    setShowPauseMenu(false);
  };

  // Get current game info
  const currentGame = gameState.gameSequence.length > 0 
    ? GAMES[gameState.gameSequence[gameState.currentGameIndex] || 0] 
    : null;
  
  const progress = gameState.isPlaying ? ((gameState.currentGameIndex + 1) / 4) * 100 : 0;

  // Render current game component
  const renderCurrentGame = () => {
    if (!currentGame || !currentGameComponent) return null;

    const commonProps = {
      onGameComplete: handleGameComplete,
      difficulty: 'easy' // You can make this dynamic based on performance
    };

    switch (currentGameComponent) {
      case 'LineDrop':
        return <SimpleLineDrop {...commonProps} />;
      case 'CircleStop':
        return <SimpleCircleStop {...commonProps} />;
      case 'GravityTicTacToe':
        return <SimpleGravityTicTacToe {...commonProps} />;
      case 'WordSprint':
        return <SimpleWordSprint {...commonProps} />;
      default:
        return null;
    }
  };

  // If not playing, show main menu
  if (!gameState.isPlaying) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">TimeiT Games!</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Test your skills with 4 random mini-games
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
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" onClick={startNewSequence} className="text-lg px-8 py-4">
            <Play className="w-6 h-6 mr-2" />
            Start 4-Game Challenge
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Games will be selected randomly - complete all 4 to win!
          </p>
        </div>

        {gameState.totalGamesPlayed > 0 && (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Last Session</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-2">
              <div className="flex justify-between">
                <span>Games Won:</span>
                <span className="font-medium">{gameState.gamesWon}/4</span>
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

  // If paused, show pause menu
  if (showPauseMenu) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-96">
          <CardHeader className="text-center">
            <CardTitle>Game Paused</CardTitle>
            <CardDescription>What would you like to do?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={resumeGame} className="w-full">
              <Play className="w-4 h-4 mr-2" />
              Resume Game
            </Button>
            <Button variant="outline" onClick={restartFromStart} className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Restart from Start
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Main Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show current game
  return (
    <div className="space-y-6">
      {/* Game Progress Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Game {gameState.currentGameIndex + 1} of 4</h1>
        <p className="text-lg text-muted-foreground mb-4">
          {currentGame?.name}
        </p>
        
        <div className="max-w-2xl mx-auto space-y-4">
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress: {Math.round(progress)}%</span>
            <span>{gameState.gamesWon} of 4 completed</span>
          </div>
        </div>
      </div>

      {/* Game Controls */}
      <div className="flex justify-center space-x-4">
        <Button onClick={togglePause} variant="outline">
          <Pause className="w-4 h-4 mr-2" />
          Pause
        </Button>
        <Button onClick={restartFromStart} variant="outline">
          <RotateCcw className="w-4 h-4 mr-2" />
          Restart
        </Button>
      </div>

      {/* Current Game Display */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <div className={`w-20 h-20 ${currentGame?.color} rounded-lg flex items-center justify-center mx-auto mb-4`}>
            <currentGame?.icon className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-2xl">{currentGame?.name}</CardTitle>
          <CardDescription>{currentGame?.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {renderCurrentGame()}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Session Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {gameState.gamesWon}/4
                </div>
                <div className="text-sm text-muted-foreground">Games Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {gameState.currentGameIndex + 1}/4
                </div>
                <div className="text-sm text-muted-foreground">Current Position</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SimpleGameRunner;
