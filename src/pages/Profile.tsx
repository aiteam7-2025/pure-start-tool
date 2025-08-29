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
import { supabase } from '../lib/supabase';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

interface UserStats {
  total_games_played: number;
  total_score: number;
  best_score: number;
  average_score: number;
  games_won: number;
}

interface GameScore {
  id: string;
  game_type: string;
  difficulty: string;
  score: number;
  accuracy?: number;
  time_taken?: number;
  created_at: string;
}

const fetchUserProfile = async (userId: string): Promise<{ profile: UserProfile; stats: UserStats }> => {
  try {
    // Fetch user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Fetch user stats
    const { data: statsData, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (statsError) throw statsError;

    return {
      profile: profileData,
      stats: statsData
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

const fetchGameHistory = async (userId: string, gameType?: string): Promise<GameScore[]> => {
  try {
    let query = supabase
      .from('game_scores')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (gameType) {
      query = query.eq('game_type', gameType);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching game history:', error);
    return [];
  }
};

const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

const Profile: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    bio: ''
  });
  const [selectedGameType, setSelectedGameType] = useState<string>('');

  const { data: profileData, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => fetchUserProfile(user?.id || ''),
    enabled: !!user?.id
  });

  const { data: gameHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['gameHistory', user?.id, selectedGameType],
    queryFn: () => fetchGameHistory(user?.id || '', selectedGameType),
    enabled: !!user?.id
  });

  const updateProfileMutation = useMutation({
    mutationFn: (updates: Partial<UserProfile>) => updateUserProfile(user?.id || '', updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    },
    onError: (error) => {
      toast.error('Failed to update profile');
      console.error('Profile update error:', error);
    }
  });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData?.profile) return;

    const updates: Partial<UserProfile> = {};
    if (editForm.username !== profileData.profile.username) {
      updates.username = editForm.username;
    }
    if (editForm.bio !== profileData.profile.bio) {
      updates.bio = editForm.bio;
    }

    if (Object.keys(updates).length > 0) {
      updateProfileMutation.mutate(updates);
    } else {
      setIsEditing(false);
    }
  };

  const startEditing = () => {
    if (profileData?.profile) {
      setEditForm({
        username: profileData.profile.username,
        bio: profileData.profile.bio || ''
      });
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm({
      username: profileData?.profile?.username || '',
      bio: profileData?.profile?.bio || ''
    });
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (profileError || !profileData) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-2">Error Loading Profile</h2>
        <p className="text-muted-foreground">Failed to load your profile. Please try again.</p>
      </div>
    );
  }

  const { profile, stats } = profileData;

  const gameTypes = [
    { value: '', label: 'All Games' },
    { value: 'line-drop', label: 'Line Drop' },
    { value: 'circle-stop', label: 'Circle Stop' },
    { value: 'gravity-tic-tac-toe', label: 'Gravity Tic-Tac-Toe' },
    { value: 'word-sprint', label: 'Word Sprint' }
  ];

  const getGameIcon = (gameType: string) => {
    switch (gameType) {
      case 'line-drop': return <Target className="w-4 h-4" />;
      case 'circle-stop': return <Target className="w-4 h-4" />;
      case 'gravity-tic-tac-toe': return <Gamepad2 className="w-4 h-4" />;
      case 'word-sprint': return <Zap className="w-4 h-4" />;
      default: return <Gamepad2 className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">
            Manage your profile and view your gaming statistics
          </p>
        </div>
        <Button onClick={startEditing} disabled={isEditing}>
          <Edit className="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="relative mx-auto mb-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile.avatar_url} alt={profile.username} />
                  <AvatarFallback className="text-2xl">{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-xl">{profile.username}</CardTitle>
              <CardDescription>{profile.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.bio && (
                <div>
                  <Label className="text-sm font-medium">Bio</Label>
                  <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>
                </div>
              )}
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Member since</p>
                <p className="font-medium">{formatDate(profile.created_at)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats and Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{stats.total_games_played}</div>
                <p className="text-sm text-muted-foreground">Games Played</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{stats.total_score.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Total Score</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{stats.best_score.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Best Score</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{stats.average_score.toFixed(0)}</div>
                <p className="text-sm text-muted-foreground">Average Score</p>
              </CardContent>
            </Card>
          </div>

          {/* Game History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Recent Games</span>
              </CardTitle>
              <CardDescription>Your latest gaming achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Select value={selectedGameType} onValueChange={setSelectedGameType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by game" />
                  </SelectTrigger>
                  <SelectContent>
                    {gameTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {historyLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading game history...</p>
                </div>
              ) : gameHistory && gameHistory.length > 0 ? (
                <div className="space-y-3">
                  {gameHistory.map((game) => (
                    <div
                      key={game.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        {getGameIcon(game.game_type)}
                        <div>
                          <div className="font-medium">
                            {game.game_type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {game.difficulty.charAt(0).toUpperCase() + game.difficulty.slice(1)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">{game.score.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(game.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Gamepad2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Games Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start playing to see your game history here!
                  </p>
                  <Button onClick={() => window.location.href = '/games'}>
                    Play Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                placeholder="Enter username"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                placeholder="Tell us about yourself"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={cancelEditing}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
