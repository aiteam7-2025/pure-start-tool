import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
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
  try {
    let query = supabase
      .from('game_scores')
      .select(`
        *,
        user_profiles!inner(username, avatar_url)
      `)
      .order('score', { ascending: false })
      .range((page - 1) * 20, page * 20 - 1);

    if (gameType) {
      query = query.eq('game_type', gameType);
    }
    
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const entries: LeaderboardEntry[] = (data || []).map((score, index) => ({
      rank: (page - 1) * 20 + index + 1,
      userId: score.user_id,
      username: score.user_profiles?.username || 'Unknown',
      avatar: score.user_profiles?.avatar_url,
      score: score.score,
      accuracy: score.accuracy,
      timeTaken: score.time_taken,
      gameType: score.game_type,
      difficulty: score.difficulty,
      isFriend: false // TODO: Implement friend system
    }));

    return {
      entries,
      total: count || 0,
      page,
      limit: 20
    };
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return {
      entries: [],
      total: 0,
      page,
      limit: 20
    };
  }
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

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const gameTypes = [
    { value: '', label: 'All Games' },
    { value: 'line-drop', label: 'Line Drop' },
    { value: 'circle-stop', label: 'Circle Stop' },
    { value: 'gravity-tic-tac-toe', label: 'Gravity Tic-Tac-Toe' },
    { value: 'word-sprint', label: 'Word Sprint' }
  ];

  const difficulties = [
    { value: '', label: 'All Difficulties' },
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
    { value: 'extreme', label: 'Extreme' }
  ];

  const periods = [
    { value: '', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground">
            Compete with players worldwide and track your progress
          </p>
        </div>
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
            <Trophy className="w-4 h-4" />
            <span>Overall</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <Select value={gameType} onValueChange={(value) => { setGameType(value); handleFilterChange(); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Game Type" />
              </SelectTrigger>
              <SelectContent>
                {gameTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={difficulty} onValueChange={(value) => { setDifficulty(value); handleFilterChange(); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map((diff) => (
                  <SelectItem key={diff.value} value={diff.value}>
                    {diff.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={period} onValueChange={(value) => { setPeriod(value); handleFilterChange(); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>

          {/* Leaderboard Content */}
          <TabsContent value="global" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading leaderboard...</p>
              </div>
            ) : (
              <LeaderboardTable data={currentData} />
            )}
          </TabsContent>

          <TabsContent value="friends" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading friends leaderboard...</p>
              </div>
            ) : (
              <LeaderboardTable data={currentData} />
            )}
          </TabsContent>

          <TabsContent value="overall" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading overall leaderboard...</p>
              </div>
            ) : (
              <LeaderboardTable data={currentData} />
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

interface LeaderboardTableProps {
  data?: LeaderboardData;
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ data }) => {
  if (!data || data.entries.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
          <p className="text-muted-foreground">
            No scores found for the selected criteria. Try adjusting your filters.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top 3 Podium */}
      {data.entries.slice(0, 3).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {data.entries.slice(0, 3).map((entry, index) => (
            <Card key={entry.userId} className={`text-center ${index === 0 ? 'ring-2 ring-yellow-500' : ''}`}>
              <CardContent className="pt-6">
                <div className="mb-4">
                  {getRankIcon(index + 1)}
                </div>
                <Avatar className="w-16 h-16 mx-auto mb-3">
                  <AvatarImage src={entry.avatar} alt={entry.username} />
                  <AvatarFallback>{entry.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg mb-1">{entry.username}</h3>
                <p className="text-2xl font-bold text-primary mb-2">{entry.score.toLocaleString()}</p>
                {entry.gameType && (
                  <Badge variant="outline" className="mb-2">
                    {entry.gameType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                )}
                {entry.difficulty && (
                  <Badge variant="secondary">
                    {entry.difficulty.charAt(0).toUpperCase() + entry.difficulty.slice(1)}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Full Leaderboard Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
          <CardDescription>
            Showing {data.entries.length} of {data.total} entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.entries.map((entry) => (
              <div
                key={entry.userId}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getRankIcon(entry.rank)}
                    <span className="font-medium text-muted-foreground">#{entry.rank}</span>
                  </div>
                  
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={entry.avatar} alt={entry.username} />
                    <AvatarFallback>{entry.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">{entry.username}</span>
                      {entry.isFriend && <Badge variant="outline" className="text-xs">Friend</Badge>}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      {entry.gameType && (
                        <span>{entry.gameType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                      )}
                      {entry.difficulty && (
                        <>
                          <span>•</span>
                          <span>{entry.difficulty.charAt(0).toUpperCase() + entry.difficulty.slice(1)}</span>
                        </>
                      )}
                      {entry.accuracy && (
                        <>
                          <span>•</span>
                          <span>{entry.accuracy.toFixed(1)}% accuracy</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xl font-bold text-primary">{entry.score.toLocaleString()}</div>
                  {getRankBadge(entry.rank)}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data.total > data.limit && (
            <div className="flex items-center justify-center space-x-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(data.page - 1)}
                disabled={data.page === 1}
              >
                Previous
              </Button>
              
              <span className="text-sm text-muted-foreground">
                Page {data.page} of {Math.ceil(data.total / data.limit)}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(data.page + 1)}
                disabled={data.page >= Math.ceil(data.total / data.limit)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Leaderboard;
