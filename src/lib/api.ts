// API Configuration and utilities
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Check if backend is available
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

// API request wrapper with error handling
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
};

// Mock data for when backend is not available
export const getMockData = (endpoint: string) => {
  // Return appropriate mock data based on endpoint
  if (endpoint.includes('leaderboard')) {
    return {
      data: [
        { rank: 1, username: 'Demo User', score: 1000, gameType: 'line-drop', difficulty: 'easy' },
        { rank: 2, username: 'Player 2', score: 850, gameType: 'line-drop', difficulty: 'easy' },
        { rank: 3, username: 'Player 3', score: 720, gameType: 'line-drop', difficulty: 'easy' },
      ],
      total: 3,
      page: 1,
      limit: 10
    };
  }
  
  if (endpoint.includes('profile')) {
    return {
      username: 'Demo User',
      email: 'demo@example.com',
      stats: {
        totalGames: 25,
        totalScore: 5000,
        bestScore: 1000,
        wins: 15
      },
      gameStats: {
        lineDrop: { bestScore: 1000, gamesPlayed: 10, averageScore: 850 },
        circleStop: { bestScore: 800, gamesPlayed: 8, averageScore: 720 },
        gravityTicTacToe: { bestScore: 600, gamesPlayed: 5, averageScore: 500 },
        wordSprint: { bestScore: 900, gamesPlayed: 2, averageScore: 900 }
      }
    };
  }
  
  return null;
};
