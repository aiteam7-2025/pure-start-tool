# TimeiT - Supabase Setup Guide

This guide will help you set up Supabase for the TimeiT gaming platform.

## 🚀 Quick Start

### 1. Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `timeit-gaming-platform`
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your users
6. Click "Create new project"

### 2. Get Project Credentials
1. In your project dashboard, go to **Settings** → **API**
2. Copy your **Project URL** and **anon public** key
3. Create a `.env` file in your project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Set Up Database Tables
1. In your Supabase dashboard, go to **SQL Editor**
2. Run the following SQL script:

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

### 4. Configure Authentication
1. Go to **Authentication** → **Settings**
2. Under **Site URL**, add: `http://localhost:5173`
3. Under **Redirect URLs**, add:
   - `http://localhost:5173/login`
   - `http://localhost:5173/register`
   - `http://localhost:5173/dashboard`

### 5. Start the App
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Open [http://localhost:5173](http://localhost:5173)

## 🔧 Features

✅ **User Authentication**
- Email/password signup and login
- Automatic user profile creation
- Secure session management

✅ **Game Data Storage**
- Game scores with difficulty levels
- User statistics tracking
- Real-time data updates

✅ **Security**
- Row Level Security (RLS) policies
- User data isolation
- Secure API endpoints

## 📊 Database Schema

### user_profiles
- `id`: UUID (references auth.users)
- `username`: TEXT (unique)
- `avatar_url`: TEXT (optional)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### game_scores
- `id`: UUID (primary key)
- `user_id`: UUID (references auth.users)
- `game_type`: TEXT (line-drop, circle-stop, etc.)
- `difficulty`: TEXT (easy, medium, hard, extreme)
- `score`: INTEGER
- `accuracy`: DECIMAL (optional)
- `time_taken`: INTEGER (optional)
- `created_at`: TIMESTAMP

### user_stats
- `user_id`: UUID (references auth.users, primary key)
- `total_games_played`: INTEGER
- `total_score`: INTEGER
- `best_score`: INTEGER
- `average_score`: DECIMAL
- `games_won`: INTEGER
- `updated_at`: TIMESTAMP

## 🚨 Troubleshooting

### Common Issues

**"Missing Supabase environment variables"**
- Ensure `.env` file exists in project root
- Check that variable names start with `VITE_`
- Restart development server after adding variables

**"Row Level Security policy violation"**
- Verify RLS policies are created correctly
- Check that user is authenticated
- Ensure policies match table structure

**"User profile not created"**
- Check trigger function exists
- Verify function has correct permissions
- Check database logs for errors

### Getting Help

1. Check Supabase dashboard logs
2. Review SQL execution in SQL Editor
3. Check browser console for client errors
4. Verify environment variables are loaded

## 🔒 Security Notes

- All tables have Row Level Security enabled
- Users can only access their own data
- Authentication is handled by Supabase
- No sensitive data is stored in client-side code

## 📈 Next Steps

After setup, you can:
1. Customize user profiles
2. Add more game types
3. Implement leaderboards
4. Add social features
5. Set up real-time subscriptions

---

**Need help?** Check the [Supabase documentation](https://supabase.com/docs) or create an issue in the project repository.
