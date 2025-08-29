# Game Platform - Web Application

A complete web-based game platform featuring multiple mini-games, user authentication, leaderboards, and social features.

## Features

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

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Router DOM** for navigation
- **React Query** for data fetching
- **Sonner** for notifications

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Express middleware** for security

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
├── backend/                      # Backend source code
│   ├── models/                  # Mongoose schemas
│   │   ├── User.js             # User model
│   │   └── GameScore.js        # Game score model
│   ├── routes/                  # API routes
│   │   ├── auth.js             # Authentication endpoints
│   │   ├── games.js            # Game-related endpoints
│   │   ├── leaderboard.js      # Leaderboard endpoints
│   │   └── users.js            # User management endpoints
│   ├── middleware/              # Express middleware
│   │   └── auth.js             # JWT authentication
│   ├── server.js                # Express server
│   └── package.json             # Backend dependencies
├── package.json                  # Frontend dependencies
└── README.md                    # This file
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- MongoDB instance (local or cloud)
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

### Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/game-platform
   JWT_SECRET=your-super-secret-jwt-key-here
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

### Database Setup
1. Ensure MongoDB is running
2. The application will automatically create collections and indexes
3. First user registration will set up the initial database structure

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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the repository.
