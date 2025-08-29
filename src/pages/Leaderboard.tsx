import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Medal, Star, Users, Globe, Crown } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  accuracy?: number;
  timeTaken?: number;
  gameType?: string;
  difficulty?: string;
  isFriend?: boolean;
}

interface LeaderboardData {
  entries: LeaderboardEntry[];
  total: number;
  page: number;
  limit: number;
}

const fetchLeaderboard = async (type: string, gameType?: string, difficulty?: string, period?: string, page: number = 1): Promise<LeaderboardData> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '20'
  });
  
  if (gameType) params.append('gameType', gameType);
  if (difficulty) params.append('difficulty', difficulty);
  if (period) params.append('period', period);

  const response = await fetch(`/api/leaderboard/${type}?${params}`);
  if (!response.ok) throw new Error('Failed to fetch leaderboard');
  return response.json();
};

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
  if (rank === 3) return <Trophy className="w-5 h-5 text-amber-600" />;
  return <span className="text-sm font-medium text-muted-foreground">{rank}</span>;
};

const getRankBadge = (rank: number) => {
  if (rank === 1) return <Badge className="bg-yellow-500 text-yellow-900">🥇 1st</Badge>;
  if (rank === 2) return <Badge className="bg-gray-400 text-gray-900">🥈 2nd</Badge>;
  if (rank === 3) return <Badge className="bg-amber-600 text-amber-900">🥉 3rd</Badge>;
  if (rank <= 10) return <Badge variant="secondary">Top 10</Badge>;
  if (rank <= 50) return <Badge variant="outline">Top 50</Badge>;
  return null;
};

const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('global');
  const [gameType, setGameType] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');
  const [period, setPeriod] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data: globalData, isLoading: globalLoading } = useQuery({
    queryKey: ['leaderboard', 'global', gameType, difficulty, period, page],
    queryFn: () => fetchLeaderboard('global', gameType, difficulty, period, page),
    enabled: activeTab === 'global'
  });

  const { data: friendsData, isLoading: friendsLoading } = useQuery({
    queryKey: ['leaderboard', 'friends', gameType, difficulty, period, page],
    queryFn: () => fetchLeaderboard('friends', gameType, difficulty, period, page),
    enabled: activeTab === 'friends'
  });

  const { data: overallData, isLoading: overallLoading } = useQuery({
    queryKey: ['leaderboard', 'overall', gameType, difficulty, period, page],
    queryFn: () => fetchLeaderboard('overall', gameType, difficulty, period, page),
    enabled: activeTab === 'overall'
  });

  const currentData = activeTab === 'global' ? globalData : activeTab === 'friends' ? friendsData : overallData;
  const isLoading = activeTab === 'global' ? globalLoading : activeTab === 'friends' ? friendsLoading : overallLoading;

  const handleFilterChange = () => {
    setPage(1);
  };

  const resetFilters = () => {
    setGameType('');
    setDifficulty('');
    setPeriod('');
    setPage(1);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Leaderboards</h1>
        <p className="text-muted-foreground">
          Compete with players worldwide and challenge your friends to beat your scores
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="global" className="flex items-center space-x-2">
            <Globe className="w-4 h-4" />
            <span>Global</span>
          </TabsTrigger>
          <TabsTrigger value="friends" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Friends</span>
          </TabsTrigger>
          <TabsTrigger value="overall" className="flex items-center space-x-2">
            <Star className="w-4 h-4" />
            <span>Overall</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
              <CardDescription>Customize your leaderboard view</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Game Type</label>
                  <Select value={gameType} onValueChange={(value) => { setGameType(value); handleFilterChange(); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Games" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Games</SelectItem>
                      <SelectItem value="line-drop">Line Drop</SelectItem>
                      <SelectItem value="circle-stop">Circle Stop</SelectItem>
                      <SelectItem value="gravity-tic-tac-toe">Gravity Tic-Tac-Toe</SelectItem>
                      <SelectItem value="word-sprint">Word Sprint</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Difficulty</label>
                  <Select value={difficulty} onValueChange={(value) => { setDifficulty(value); handleFilterChange(); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Difficulties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Difficulties</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                      <SelectItem value="extreme">Extreme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Time Period</label>
                  <Select value={period} onValueChange={(value) => { setPeriod(value); handleFilterChange(); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Time</SelectItem>
                      <SelectItem value="day">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button variant="outline" onClick={resetFilters} className="w-full">
                    Reset Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {activeTab === 'global' && <Globe className="w-5 h-5" />}
                {activeTab === 'friends' && <Users className="w-5 h-5" />}
                {activeTab === 'overall' && <Star className="w-5 h-5" />}
                <span>
                  {activeTab === 'global' ? 'Global' : activeTab === 'friends' ? 'Friends' : 'Overall'} Leaderboard
                </span>
              </CardTitle>
              <CardDescription>
                {activeTab === 'global' && 'Top players from around the world'}
                {activeTab === 'friends' && 'Compete with your friends'}
                {activeTab === 'overall' && 'Best overall performance across all games'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : currentData?.entries?.length ? (
                <div className="space-y-4">
                  {currentData.entries.map((entry) => (
                    <div
                      key={`${entry.userId}-${entry.gameType}-${entry.difficulty}`}
                      className={`flex items-center space-x-4 p-4 rounded-lg border transition-colors ${
                        entry.userId === user?.id
                          ? 'bg-primary/10 border-primary/20'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="flex items-center justify-center w-8 h-8">
                          {getRankIcon(entry.rank)}
                        </div>
                        
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={entry.avatar} alt={entry.username} />
                          <AvatarFallback>{entry.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium truncate">{entry.username}</p>
                            {entry.isFriend && <Badge variant="secondary" className="text-xs">Friend</Badge>}
                            {getRankBadge(entry.rank)}
                          </div>
                          {entry.gameType && (
                            <p className="text-sm text-muted-foreground capitalize">
                              {entry.gameType.replace('-', ' ')} • {entry.difficulty}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-right">
                        {entry.accuracy && (
                          <div>
                            <p className="text-sm text-muted-foreground">Accuracy</p>
                            <p className="font-medium">{entry.accuracy.toFixed(1)}%</p>
                          </div>
                        )}
                        {entry.timeTaken && (
                          <div>
                            <p className="text-sm text-muted-foreground">Time</p>
                            <p className="font-medium">{entry.timeTaken}s</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-muted-foreground">Score</p>
                          <p className="text-xl font-bold text-primary">{entry.score.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {currentData.total > currentData.limit && (
                    <div className="flex items-center justify-between pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Showing {((currentData.page - 1) * currentData.limit) + 1} to{' '}
                        {Math.min(currentData.page * currentData.limit, currentData.total)} of {currentData.total} entries
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page - 1)}
                          disabled={page === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page + 1)}
                          disabled={page * currentData.limit >= currentData.total}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Trophy className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No scores yet</h3>
                  <p className="text-muted-foreground mb-4">
                    {activeTab === 'friends' 
                      ? 'Your friends haven\'t played any games yet. Invite them to join!'
                      : 'Be the first to set a record!'
                    }
                  </p>
                  <Button onClick={() => window.location.href = '/games'}>
                    Play Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </div>
  );
};

export default Leaderboard;
