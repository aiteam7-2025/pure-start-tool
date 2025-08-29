import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import {
  Target,
  Gamepad2,
  Zap,
  Play,
  Trophy,
  Clock,
  Star,
  Settings,
  Info
} from 'lucide-react';

const Games: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  if (!user) return null;

  const difficulties = [
    { id: 'easy', name: 'Easy', color: 'bg-green-500', description: 'Perfect for beginners' },
    { id: 'medium', name: 'Medium', color: 'bg-yellow-500', description: 'Balanced challenge' },
    { id: 'hard', name: 'Hard', color: 'bg-orange-500', description: 'For experienced players' },
    { id: 'extreme', name: 'Extreme', color: 'bg-red-500', description: 'Ultimate challenge' }
  ];

  const games = [
    {
      id: 'line-drop',
      name: 'Line Drop',
      description: 'A vertical line falls from the top of the screen. Stop it exactly on the dotted target line at the bottom. The closer your alignment, the more points you earn!',
      icon: Target,
      color: 'bg-blue-500',
      gradient: 'from-blue-500 to-blue-600',
      bestScore: user.gameStats?.lineDrop?.bestScore || 0,
      gamesPlayed: user.gameStats?.lineDrop?.gamesPlayed || 0,
      features: [
        'Precision timing',
        'Visual feedback',
        'Progressive difficulty',
        'Score multipliers'
      ],
      tips: [
        'Watch the line speed carefully',
        'Use the dotted line as your guide',
        'Practice makes perfect!'
      ]
    },
    {
      id: 'circle-stop',
      name: 'Circle Stop',
      description: 'A circle grows and shrinks dynamically. Click to freeze it when its size matches the dotted circular outline. Perfect timing equals perfect scores!',
      icon: Target,
      color: 'bg-green-500',
      gradient: 'from-green-500 to-green-600',
      bestScore: user.gameStats?.circleStop?.bestScore || 0,
      gamesPlayed: user.gameStats?.circleStop?.gamesPlayed || 0,
      features: [
        'Dynamic sizing',
        'Visual matching',
        'Timing challenges',
        'Accuracy rewards'
      ],
      tips: [
        'Focus on the outline size',
        'Don\'t rush your clicks',
        'Watch for size patterns'
      ]
    },
    {
      id: 'gravity-tic-tac-toe',
      name: 'Gravity Tic-Tac-Toe',
      description: 'Classic Tic-Tac-Toe with a twist! Drop X\'s and O\'s into a 3x3 grid with gravity mechanics. First to connect 3 in a row wins!',
      icon: Gamepad2,
      color: 'bg-purple-500',
      gradient: 'from-purple-500 to-purple-600',
      bestScore: user.gameStats?.gravityTicTacToe?.bestScore || 0,
      gamesPlayed: user.gameStats?.gravityTicTacToe?.gamesPlayed || 0,
      features: [
        'Gravity mechanics',
        'Strategic gameplay',
        'Win/lose scoring',
        'Multiple strategies'
      ],
      tips: [
        'Plan your moves ahead',
        'Use gravity to your advantage',
        'Block opponent\'s winning moves'
      ]
    },
    {
      id: 'word-sprint',
      name: 'Word Sprint',
      description: 'Daily word puzzles with a time limit! Solve scrambled words or fill in missing letters. Race against the clock to earn maximum points!',
      icon: Zap,
      color: 'bg-orange-500',
      gradient: 'from-orange-500 to-orange-600',
      bestScore: user.gameStats?.wordSprint?.bestScore || 0,
      gamesPlayed: user.gameStats?.wordSprint?.gamesPlayed || 0,
      features: [
        'Daily challenges',
        'Time pressure',
        'Word variety',
        'Hint system'
      ],
      tips: [
        'Read the hints carefully',
        'Use the time wisely',
        'Practice vocabulary regularly'
      ]
    }
  ];

  const handlePlayGame = (gameId: string) => {
    if (selectedDifficulty) {
      navigate(`/${gameId}?difficulty=${selectedDifficulty}`);
    }
  };

  const getDifficultyMultiplier = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 1;
      case 'medium': return 1.5;
      case 'hard': return 2;
      case 'extreme': return 3;
      default: return 1;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Games</h1>
        <p className="text-muted-foreground">
          Choose from our collection of skill-based mini-games. Each game offers multiple difficulty levels to challenge players of all skill levels.
        </p>
      </div>

      {/* Difficulty Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Select Difficulty</span>
          </CardTitle>
          <CardDescription>
            Choose your challenge level. Higher difficulties offer better score multipliers!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {difficulties.map((difficulty) => (
              <div
                key={difficulty.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedDifficulty === difficulty.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedDifficulty(difficulty.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 ${difficulty.color} rounded-full`} />
                  <div>
                    <div className="font-medium">{difficulty.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {difficulty.description}
                    </div>
                  </div>
                </div>
                {selectedDifficulty === difficulty.id && (
                  <div className="mt-2 text-sm text-primary font-medium">
                    Score Multiplier: {getDifficultyMultiplier(difficulty.id)}x
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Games Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {games.map((game) => (
          <Card key={game.id} className="overflow-hidden">
            <div className={`h-2 ${game.gradient} bg-gradient-to-r`} />
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 ${game.color} rounded-xl flex items-center justify-center`}>
                    <game.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{game.name}</CardTitle>
                    <CardDescription className="text-sm max-w-md">
                      {game.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Best Score</div>
                  <div className="text-2xl font-bold text-primary">
                    {game.bestScore.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{game.gamesPlayed}</div>
                  <div className="text-sm text-muted-foreground">Games Played</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {game.gamesPlayed > 0 ? Math.round(game.bestScore / game.gamesPlayed) : 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Score</div>
                </div>
              </div>

              <Separator />

              {/* Features */}
              <div>
                <h4 className="font-medium mb-2 flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span>Game Features</span>
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {game.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div>
                <h4 className="font-medium mb-2 flex items-center space-x-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  <span>Pro Tips</span>
                </h4>
                <div className="space-y-1">
                  {game.tips.map((tip, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Play Button */}
              <div className="pt-4">
                <Button
                  className={`w-full ${game.gradient} hover:opacity-90`}
                  size="lg"
                  onClick={() => handlePlayGame(game.id)}
                  disabled={!selectedDifficulty}
                >
                  <Play className="w-5 h-5 mr-2" />
                  {selectedDifficulty ? `Play ${selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)}` : 'Select Difficulty'}
                </Button>
                
                {!selectedDifficulty && (
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Please select a difficulty level above
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Game Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="w-5 h-5" />
            <span>How to Play</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Scoring System</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Easy:</strong> Base score × 1.0</li>
                <li>• <strong>Medium:</strong> Base score × 1.5</li>
                <li>• <strong>Hard:</strong> Base score × 2.0</li>
                <li>• <strong>Extreme:</strong> Base score × 3.0</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Practice Mode</h4>
              <p className="text-sm text-muted-foreground">
                All games support practice mode where you can play without affecting your leaderboard ranking. Perfect for learning new strategies!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Games;
