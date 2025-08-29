import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import {
  Gamepad2,
  Trophy,
  TrendingUp,
  Target,
  Clock,
  Star,
  Play,
  BarChart3,
  Users,
  Award,
  Zap,
  Calendar
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const games = [
    {
      id: 'lineDrop',
      name: 'Line Drop',
      description: 'Stop the falling line at the perfect moment',
      icon: Target,
      color: 'bg-blue-500',
      bestScore: user.gameStats.lineDrop.bestScore,
      gamesPlayed: user.gameStats.lineDrop.gamesPlayed
    },
    {
      id: 'circleStop',
      name: 'Circle Stop',
      description: 'Freeze the circle when it matches the target',
      icon: Target,
      color: 'bg-green-500',
      bestScore: user.gameStats.circleStop.bestScore,
      gamesPlayed: user.gameStats.circleStop.gamesPlayed
    },
    {
      id: 'gravityTicTacToe',
      name: 'Gravity Tic-Tac-Toe',
      description: 'Connect 3 with gravity mechanics',
      icon: Gamepad2,
      color: 'bg-purple-500',
      bestScore: user.gameStats.gravityTicTacToe.bestScore,
      gamesPlayed: user.gameStats.gravityTicTacToe.gamesPlayed
    },
    {
      id: 'wordSprint',
      name: 'Word Sprint',
      description: 'Solve word puzzles against the clock',
      icon: Zap,
      color: 'bg-orange-500',
      bestScore: user.gameStats.wordSprint.bestScore,
      gamesPlayed: user.gameStats.wordSprint.gamesPlayed
    }
  ];

  const achievements = [
    {
      id: 'first-game',
      title: 'First Steps',
      description: 'Played your first game',
      icon: Play,
      unlocked: user.stats.totalGamesPlayed > 0,
      color: 'text-blue-500'
    },
    {
      id: 'score-master',
      title: 'Score Master',
      description: 'Achieve a score of 1000+',
      icon: Star,
      unlocked: user.stats.bestScore >= 1000,
      color: 'text-yellow-500'
    },
    {
      id: 'dedicated-player',
      title: 'Dedicated Player',
      description: 'Play 50+ games',
      icon: Target,
      unlocked: user.stats.totalGamesPlayed >= 50,
      color: 'text-green-500'
    },
    {
      id: 'winner',
      title: 'Winner',
      description: 'Win 10+ games',
      icon: Trophy,
      unlocked: user.stats.gamesWon >= 10,
      color: 'text-purple-500'
    }
  ];

  const recentActivity = [
    { type: 'game', game: 'Line Drop', score: 850, difficulty: 'medium', time: '2 hours ago' },
    { type: 'achievement', title: 'Score Master', time: '1 day ago' },
    { type: 'game', game: 'Word Sprint', score: 1200, difficulty: 'hard', time: '2 days ago' },
    { type: 'game', game: 'Circle Stop', score: 650, difficulty: 'easy', time: '3 days ago' }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {user.username}! 👋
            </h1>
            <p className="text-muted-foreground mt-2">
              Ready to beat your high scores? Let's play some games!
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                #{user.stats.totalGamesPlayed > 0 ? Math.floor(Math.random() * 1000) + 1 : 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">Global Rank</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {user.stats.totalScore.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Score</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Games</CardTitle>
            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.stats.totalGamesPlayed}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.floor(Math.random() * 5) + 1} from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.stats.bestScore.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {user.stats.bestScore > 0 ? 'Personal record!' : 'Start playing to set one!'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user.stats.averageScore > 0 ? Math.round(user.stats.averageScore) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {user.stats.averageScore > 0 ? 'Keep improving!' : 'No games played yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Games Won</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.stats.gamesWon}</div>
            <p className="text-xs text-muted-foreground">
              {user.stats.totalGamesPlayed > 0 
                ? `${Math.round((user.stats.gamesWon / user.stats.totalGamesPlayed) * 100)}% win rate`
                : 'No games played yet'
              }
            </p>
          </CardContent>
        </Card>
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
                  <span className="text-muted-foreground">Best Score:</span>
                  <span className="font-medium">{game.bestScore.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Games Played:</span>
                  <span className="font-medium">{game.gamesPlayed}</span>
                </div>
                <Link to={`/games/${game.id}`}>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'game' ? 'bg-blue-500' : 'bg-yellow-500'
                  }`} />
                  <div className="flex-1">
                    {activity.type === 'game' ? (
                      <div>
                        <span className="font-medium">{activity.game}</span>
                        <span className="text-muted-foreground"> - {activity.score} points</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {activity.difficulty}
                        </Badge>
                      </div>
                    ) : (
                      <span className="font-medium">{activity.title}</span>
                    )}
                    <div className="text-sm text-muted-foreground">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="w-5 h-5" />
              <span>Achievements</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    achievement.unlocked ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    <achievement.icon className={`w-4 h-4 ${
                      achievement.unlocked ? achievement.color : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${
                      achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {achievement.title}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {achievement.description}
                    </div>
                  </div>
                  {achievement.unlocked && (
                    <Badge variant="secondary" className="text-xs">
                      Unlocked
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Your Progress</span>
          </CardTitle>
          <CardDescription>
            Track your improvement across all games
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {games.map((game) => (
            <div key={game.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{game.name}</span>
                <span className="text-sm text-muted-foreground">
                  {game.gamesPlayed} games played
                </span>
              </div>
              <Progress 
                value={game.gamesPlayed > 0 ? Math.min((game.gamesPlayed / 100) * 100, 100) : 0} 
                className="h-2"
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
