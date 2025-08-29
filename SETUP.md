# Game Platform Setup Guide

## Prerequisites

1. **Node.js** (v16 or higher) - Download from [https://nodejs.org/](https://nodejs.org/)
2. **MongoDB** - Install locally or use [MongoDB Atlas](https://www.mongodb.com/atlas)

## Quick Start

### Option 1: Windows (Easiest)
1. Double-click `start-backend.bat` to start the backend
2. In a new terminal, run `npm run dev` to start the frontend
3. Open [http://localhost:5173](http://localhost:5173) in your browser

### Option 2: PowerShell
1. Right-click `start-backend.ps1` and select "Run with PowerShell"
2. In a new PowerShell window, run `npm run dev`
3. Open [http://localhost:5173](http://localhost:5173) in your browser

### Option 3: Manual Setup

#### Backend Setup
```bash
cd server
npm install
# Create .env file from env.example
copy env.example .env
# Edit .env with your MongoDB connection string
npm run dev
```

#### Frontend Setup
```bash
npm install
npm run dev
```

## Environment Configuration

### Backend (.env file)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/game-platform
JWT_SECRET=your-super-secret-jwt-key-here
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend
The frontend will automatically connect to `http://localhost:5000` for the backend API.

## Troubleshooting

### "Connection Refused" Error
- Make sure the backend server is running on port 5000
- Check if MongoDB is running
- Verify the `.env` file exists in the server directory

### "npm not found" Error
- Install Node.js from [https://nodejs.org/](https://nodejs.org/)
- Restart your terminal after installation

### MongoDB Connection Issues
- For local MongoDB: Make sure MongoDB service is running
- For MongoDB Atlas: Check your connection string and network access

## Features Available

✅ **Authentication System** - User registration and login
✅ **4 Mini-Games** - Line Drop, Circle Stop, Gravity Tic-Tac-Toe, Word Sprint
✅ **Leaderboards** - Global and friends rankings
✅ **User Profiles** - Game statistics and social features
✅ **Responsive UI** - Works on desktop and mobile

## Development

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + MongoDB
- **UI Components**: shadcn/ui + Tailwind CSS

## Support

If you encounter issues:
1. Check the console for error messages
2. Verify all prerequisites are installed
3. Ensure both frontend and backend are running
4. Check MongoDB connection
