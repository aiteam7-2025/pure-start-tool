# TimeiT - Precision Gaming Platform - Web Application

A complete web-based game platform featuring multiple mini-games, user authentication, leaderboards, and social features.

## 🎯 TimeiT Features

### 🎮 Mini-Games
- **Line Drop**: Stop a falling line precisely on target
- **Circle Stop**: Freeze a growing/shrinking circle at the right size
- **Gravity Tic-Tac-Toe**: Connect 3 with gravity mechanics
- **Word Sprint**: Daily word puzzles with time limits

### 🏆 Game Features
- 4 difficulty levels: Easy, Medium, Hard, Extreme
- Real-time scoring and accuracy tracking
- Practice mode (doesn't affect leaderboards)
- Game history and statistics

### 👥 Social Features
- User registration and authentication
- Friend system with requests
- Global and friends leaderboards
- User profiles with detailed stats

### 🎨 UI/UX
- Clean, minimalist design (Wordle-inspired)
- Responsive layout for all devices
- Dark/light theme support
- Modern component library (shadcn/ui)

## 🚀 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Router DOM** for navigation
- **React Query** for data fetching
- **Sonner** for notifications

### Backend
- **Supabase** for authentication and database
- **PostgreSQL** database with Row Level Security
- **Real-time subscriptions** for live updates
- **Built-in authentication** with email/password

## Project Structure

```
├── src/                          # Frontend source code
│   ├── components/               # Reusable UI components
│   │   └── ui/                  # shadcn/ui components
│   ├── contexts/                 # React contexts
│   │   ├── AuthContext.tsx      # Authentication state
│   │   └── ThemeContext.tsx     # Theme management
│   ├── hooks/                   # Custom React hooks
│   ├── pages/                   # Application pages
│   │   ├── Dashboard.tsx        # Main dashboard
│   │   ├── Games.tsx            # Game selection
│   │   ├── Leaderboard.tsx      # Leaderboards
│   │   ├── Profile.tsx          # User profile
│   │   ├── Login.tsx            # Authentication
│   │   └── Register.tsx         # User registration
│   ├── App.tsx                  # Main app component
│   └── main.tsx                 # Entry point
├── src/                         # Frontend source code
│   ├── lib/                     # Utilities and configurations
│   │   └── supabase.ts         # Supabase client configuration
│   ├── contexts/                # React contexts
│   │   ├── AuthContext.tsx     # Supabase authentication
│   │   └── ThemeContext.tsx    # Theme management
├── package.json                  # Frontend dependencies
└── README.md                    # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account and project
- Git

### Frontend Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:5173 in your browser

### Supabase Setup
1. Create a new Supabase project at [https://supabase.com](https://supabase.com)

2. Get your project URL and anon key from the project settings

3. Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

4. Set up your database tables (see Database Setup section below)

### Database Setup
1. In your Supabase project, go to the SQL Editor
2. Run the following SQL to create the necessary tables:

```sql
-- Create users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create game_scores table
CREATE TABLE public.game_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  score INTEGER NOT NULL,
  accuracy DECIMAL(5,2),
  time_taken INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_stats table
CREATE TABLE public.user_stats (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  total_games_played INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  average_score DECIMAL(10,2) DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view their own scores" ON public.game_scores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scores" ON public.game_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own stats" ON public.user_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" ON public.user_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', 'User'));
  
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

3. The application will automatically create user profiles and stats when users register

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password

### Games
- `POST /api/games/score` - Submit game score
- `GET /api/games/history` - Get game history
- `GET /api/games/best-scores` - Get best scores
- `GET /api/games/stats` - Get game statistics
- `POST /api/games/practice` - Submit practice score

### Leaderboards
- `GET /api/leaderboard/global` - Global leaderboard
- `GET /api/leaderboard/friends` - Friends leaderboard
- `GET /api/leaderboard/overall` - Overall leaderboard
- `GET /api/leaderboard/period` - Time-based leaderboard

### Users
- `GET /api/users/search` - Search users
- `POST /api/users/friend-request` - Send friend request
- `PUT /api/users/friend-request` - Respond to friend request
- `GET /api/users/friends` - Get friend list
- `DELETE /api/users/friends/:friendId` - Remove friend

## Game Mechanics

### Line Drop
- Vertical line falls at varying speeds
- Player must stop it on horizontal target line
- Score based on alignment accuracy
- Difficulty affects line speed and target size

### Circle Stop
- Circle grows/shrinks dynamically
- Player freezes it when radius matches target outline
- Score based on size accuracy
- Difficulty affects animation speed and target precision

### Gravity Tic-Tac-Toe
- 3x3 grid with gravity mechanics
- Pieces fall to bottom when placed
- First to connect 3 in any direction wins
- AI opponent with adjustable difficulty

### Word Sprint
- Daily word challenges
- Scrambled words or missing letters
- Time-based scoring
- New puzzle every day

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 💬 Support

For support or questions, please open an issue in the repository.
