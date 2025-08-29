import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { 
  User, 
  Settings, 
  Trophy, 
  Users, 
  Gamepad2, 
  Edit, 
  Save, 
  X, 
  Plus,
  Search,
  Check,
  Clock,
  Target,
  Zap
} from 'lucide-react';

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  stats: {
    totalGamesPlayed: number;
    totalScore: number;
    averageScore: number;
    bestScore: number;
    gamesWon: number;
  };
  gameStats: {
    lineDrop: {
      bestScore: number;
      gamesPlayed: number;
      totalScore: number;
    };
    circleStop: {
      bestScore: number;
      gamesPlayed: number;
      totalScore: number;
    };
    gravityTicTacToe: {
      bestScore: number;
      gamesPlayed: number;
      totalScore: number;
      gamesWon: number;
    };
    wordSprint: {
      bestScore: number;
      gamesPlayed: number;
      totalScore: number;
      wordsSolved: number;
    };
  };
  friends: string[];
  friendRequests: string[];
}

interface FriendRequest {
  _id: string;
  from: {
    _id: string;
    username: string;
    avatar?: string;
  };
  to: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

interface GameScore {
  _id: string;
  gameType: string;
  difficulty: string;
  score: number;
  accuracy?: number;
  timeTaken?: number;
  createdAt: string;
}

const fetchUserProfile = async (): Promise<UserProfile> => {
  const response = await fetch('/api/users/profile', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  if (!response.ok) throw new Error('Failed to fetch profile');
  return response.json();
};

const fetchFriendRequests = async (): Promise<FriendRequest[]> => {
  const response = await fetch('/api/users/friend-requests', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  if (!response.ok) throw new Error('Failed to fetch friend requests');
  return response.json();
};

const fetchGameHistory = async (gameType?: string): Promise<GameScore[]> => {
  const params = gameType ? `?gameType=${gameType}` : '';
  const response = await fetch(`/api/games/history${params}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  if (!response.ok) throw new Error('Failed to fetch game history');
  return response.json();
};

const updateProfile = async (data: Partial<UserProfile>): Promise<UserProfile> => {
  const response = await fetch('/api/users/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to update profile');
  return response.json();
};

const respondToFriendRequest = async (requestId: string, action: 'accept' | 'reject'): Promise<void> => {
  const response = await fetch('/api/users/friend-request', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ requestId, action })
  });
  if (!response.ok) throw new Error('Failed to respond to friend request');
};

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    bio: '',
    phone: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchUserProfile
  });

  const { data: friendRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ['friendRequests'],
    queryFn: fetchFriendRequests
  });

  const { data: gameHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['gameHistory'],
    queryFn: () => fetchGameHistory()
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      updateUser(data);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error('Failed to update profile');
    }
  });

  const friendRequestMutation = useMutation({
    mutationFn: ({ requestId, action }: { requestId: string; action: 'accept' | 'reject' }) => 
      respondToFriendRequest(requestId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Friend request updated!');
    },
    onError: (error) => {
      toast.error('Failed to update friend request');
    }
  });

  const handleEditStart = () => {
    if (profile) {
      setEditForm({
        username: profile.username,
        bio: profile.bio || '',
        phone: profile.phone || ''
      });
      setIsEditing(true);
    }
  };

  const handleEditSave = () => {
    updateProfileMutation.mutate(editForm);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditForm({ username: '', bio: '', phone: '' });
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      }
    } catch (error) {
      toast.error('Failed to search users');
    }
  };

  const sendFriendRequest = async (userId: string) => {
    try {
      const response = await fetch('/api/users/friend-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ to: userId })
      });
      if (response.ok) {
        toast.success('Friend request sent!');
        setSearchResults([]);
        setSearchQuery('');
      }
    } catch (error) {
      toast.error('Failed to send friend request');
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">Profile not found</h3>
        <p className="text-muted-foreground">Unable to load your profile information.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start space-x-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile.avatar} alt={profile.username} />
              <AvatarFallback className="text-2xl">{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">{profile.username}</h1>
                  <p className="text-muted-foreground">{profile.email}</p>
                  {profile.phone && <p className="text-muted-foreground">{profile.phone}</p>}
                </div>
                
                <div className="flex space-x-2">
                  {!isEditing ? (
                    <Button onClick={handleEditStart} variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button onClick={handleEditSave} size="sm" disabled={updateProfileMutation.isPending}>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button onClick={handleEditCancel} variant="outline" size="sm">
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  {profile.bio && <p className="text-muted-foreground">{profile.bio}</p>}
                  {!profile.bio && <p className="text-muted-foreground italic">No bio added yet.</p>}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Gamepad2 className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Games</p>
                <p className="text-2xl font-bold">{profile.stats.totalGamesPlayed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Best Score</p>
                <p className="text-2xl font-bold">{profile.stats.bestScore.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold">{profile.stats.averageScore.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Wins</p>
                <p className="text-2xl font-bold">{profile.stats.gamesWon}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="games">Game Stats</TabsTrigger>
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest gaming achievements</CardDescription>
            </CardHeader>
            <CardContent>
              {gameHistory && gameHistory.length > 0 ? (
                <div className="space-y-3">
                  {gameHistory.slice(0, 5).map((game) => (
                    <div key={game._id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <div>
                          <p className="font-medium capitalize">{game.gameType.replace('-', ' ')}</p>
                          <p className="text-sm text-muted-foreground">{game.difficulty} • {game.score.toLocaleString()} pts</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{new Date(game.createdAt).toLocaleDateString()}</p>
                        {game.accuracy && <p className="text-xs text-muted-foreground">{game.accuracy.toFixed(1)}% accuracy</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Gamepad2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No games played yet. Start playing to see your activity!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="games" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Game Performance</CardTitle>
              <CardDescription>Detailed statistics for each game</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(profile.gameStats).map(([gameType, stats]) => (
                  <Card key={gameType} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium capitalize">{gameType.replace('-', ' ')}</h4>
                        <Badge variant="secondary">{stats.gamesPlayed} games</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Best Score:</span>
                          <span className="font-medium">{stats.bestScore.toLocaleString()}</span>
                        </div>
                         <div className="flex justify-between text-sm">
                           <span>Games Played:</span>
                           <span className="font-medium">{stats.gamesPlayed}</span>
                         </div>
                         <div className="flex justify-between text-sm">
                           <span>Total Score:</span>
                           <span className="font-medium">{stats.totalScore.toLocaleString()}</span>
                         </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="friends" className="space-y-4">
          {/* Friend Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Friend Requests</span>
                {friendRequests && friendRequests.length > 0 && (
                  <Badge variant="secondary">{friendRequests.length}</Badge>
                )}
              </CardTitle>
              <CardDescription>Manage incoming friend requests</CardDescription>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : friendRequests && friendRequests.length > 0 ? (
                <div className="space-y-3">
                  {friendRequests.map((request) => (
                    <div key={request._id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={request.from.avatar} alt={request.from.username} />
                          <AvatarFallback>{request.from.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.from.username}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => friendRequestMutation.mutate({ requestId: request._id, action: 'accept' })}
                          disabled={friendRequestMutation.isPending}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => friendRequestMutation.mutate({ requestId: request._id, action: 'reject' })}
                          disabled={friendRequestMutation.isPending}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending friend requests</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Friends */}
          <Card>
            <CardHeader>
              <CardTitle>Add Friends</CardTitle>
              <CardDescription>Search and connect with other players</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Search by username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchUsers()}
                  />
                  <Button onClick={handleSearchUsers}>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Search Results:</p>
                    {searchResults.map((result) => (
                      <div key={result._id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={result.avatar} alt={result.username} />
                            <AvatarFallback>{result.username.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{result.username}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendFriendRequest(result._id)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Friend
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Game History</CardTitle>
              <CardDescription>Your complete gaming journey</CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : gameHistory && gameHistory.length > 0 ? (
                <div className="space-y-3">
                  {gameHistory.map((game) => (
                    <div key={game._id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Gamepad2 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium capitalize">{game.gameType.replace('-', ' ')}</p>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Badge variant="outline">{game.difficulty}</Badge>
                            <span>•</span>
                            <span>{new Date(game.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <Clock className="w-3 h-3" />
                            <span>{game.timeTaken}s</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">{game.score.toLocaleString()}</p>
                        {game.accuracy && (
                          <p className="text-sm text-muted-foreground">{game.accuracy.toFixed(1)}% accuracy</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No game history yet. Start playing to build your record!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
