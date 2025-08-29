import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from './ui/badge';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import {
  Gamepad2,
  Target,
  Play,
  Zap,
  Clock,
  Star,
  TrendingUp
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const games = [
    {
      id: 'line-drop',
      name: 'Line Drop',
      description: 'Stop the falling line at the perfect moment',
      icon: Target,
      color: 'bg-blue-500',
      difficulty: 'Medium'
    },
    {
      id: 'circle-stop',
      name: 'Circle Stop',
      description: 'Freeze the circle when it matches the target',
      icon: Target,
      color: 'bg-green-500',
      difficulty: 'Medium'
    },
    {
      id: 'gravity-tic-tac-toe',
      name: 'Gravity Tic-Tac-Toe',
      description: 'Connect 3 with gravity mechanics',
      icon: Gamepad2,
      color: 'bg-purple-500',
      difficulty: 'Easy'
    },
    {
      id: 'word-sprint',
      name: 'Word Sprint',
      description: 'Solve word puzzles against the clock',
      icon: Zap,
      color: 'bg-orange-500',
      difficulty: 'Hard'
    }
  ];

  const features = [
    {
      id: 'no-login',
      title: 'No Login Required',
      description: 'Start playing immediately without any registration',
      icon: Play,
      color: 'text-green-500'
    },
    {
      id: 'precision-games',
      title: 'Precision Gaming',
      description: 'Test your timing and accuracy skills',
      icon: Target,
      color: 'text-blue-500'
    },
    {
      id: 'multiple-difficulties',
      title: 'Multiple Difficulties',
      description: 'Choose from Easy to Extreme challenges',
      icon: Star,
      color: 'text-yellow-500'
    },
    {
      id: 'instant-play',
      title: 'Instant Play',
      description: 'No waiting, no loading, just pure gaming',
      icon: Zap,
      color: 'text-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome to TimeiT! 🎯
            </h1>
            <p className="text-muted-foreground mt-2">
              Test your precision and timing with our collection of skill-based games. No login required - just pure gaming fun!
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">4</div>
              <div className="text-sm text-muted-foreground">Games Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">∞</div>
              <div className="text-sm text-muted-foreground">Unlimited Play</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature) => (
          <Card key={feature.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{feature.title}</CardTitle>
              <feature.icon className={`h-4 w-4 ${feature.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                {feature.description}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Games Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Quick Play</h2>
          <Link to="/games">
            <Button variant="outline">View All Games</Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {games.map((game) => (
            <Card key={game.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${game.color} rounded-lg flex items-center justify-center`}>
                    <game.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{game.name}</CardTitle>
                    <CardDescription className="text-sm">{game.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Difficulty:</span>
                  <Badge variant="secondary">{game.difficulty}</Badge>
                </div>
                <Link to={`/${game.id}`}>
                  <Button className="w-full" size="sm">
                    <Play className="w-4 h-4 mr-2" />
                    Play Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* How to Play */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>How to Play</span>
          </CardTitle>
          <CardDescription>
            Get started with TimeiT in just a few clicks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h4 className="font-medium mb-2">Choose a Game</h4>
              <p className="text-sm text-muted-foreground">
                Select from our collection of precision games
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h4 className="font-medium mb-2">Select Difficulty</h4>
              <p className="text-sm text-muted-foreground">
                Choose your challenge level from Easy to Extreme
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h4 className="font-medium mb-2">Start Playing</h4>
              <p className="text-sm text-muted-foreground">
                Test your skills and beat your own records
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
