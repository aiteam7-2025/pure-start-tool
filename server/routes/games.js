import express from 'express';
import { body, validationResult } from 'express-validator';
import GameScore from '../models/GameScore.js';
import User from '../models/User.js';

const router = express.Router();

// Validation middleware
const validateGameScore = [
  body('gameType')
    .isIn(['lineDrop', 'circleStop', 'gravityTicTacToe', 'wordSprint'])
    .withMessage('Invalid game type'),
  body('difficulty')
    .isIn(['easy', 'medium', 'hard', 'extreme'])
    .withMessage('Invalid difficulty level'),
  body('score')
    .isInt({ min: 0 })
    .withMessage('Score must be a non-negative integer'),
  body('accuracy')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Accuracy must be between 0 and 100'),
  body('timeTaken')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Time taken must be a non-negative integer'),
  body('attempts')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Attempts must be at least 1'),
  body('isPractice')
    .optional()
    .isBoolean()
    .withMessage('isPractice must be a boolean')
];

// Submit game score
router.post('/score', validateGameScore, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      gameType,
      difficulty,
      score,
      accuracy,
      timeTaken,
      attempts = 1,
      gameData,
      isPractice = false,
      metadata
    } = req.body;

    const userId = req.user._id;

    // Create game score
    const gameScore = new GameScore({
      userId,
      username: req.user.username,
      gameType,
      difficulty,
      score,
      accuracy,
      timeTaken,
      attempts,
      gameData,
      isPractice,
      metadata
    });

    await gameScore.save();

    // Update user stats if not practice mode
    if (!isPractice) {
      const won = gameType === 'gravityTicTacToe' ? score > 0 : true; // Tic-tac-toe has win/lose, others are score-based
      req.user.updateGameStats(gameType, score, won);
      await req.user.save();
    }

    // Get leaderboard position
    const position = await gameScore.getLeaderboardPosition();

    res.status(201).json({
      message: 'Score submitted successfully',
      gameScore,
      leaderboardPosition: position,
      userStats: req.user.gameStats[gameType]
    });
  } catch (error) {
    console.error('Score submission error:', error);
    res.status(500).json({ error: 'Failed to submit score' });
  }
});

// Get user's game history
router.get('/history/:gameType?', async (req, res) => {
  try {
    const { gameType } = req.params;
    const { difficulty, limit = 20, page = 1 } = req.query;
    const userId = req.user._id;

    const query = { userId, isPractice: false, completed: true };
    if (gameType) query.gameType = gameType;
    if (difficulty) query.difficulty = difficulty;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const scores = await GameScore.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('gameType difficulty score accuracy timeTaken attempts createdAt');

    const total = await GameScore.countDocuments(query);

    res.json({
      scores,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: skip + scores.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Game history error:', error);
    res.status(500).json({ error: 'Failed to fetch game history' });
  }
});

// Get user's best scores
router.get('/best-scores', async (req, res) => {
  try {
    const userId = req.user._id;
    const { gameType, difficulty } = req.query;

    const query = { userId, isPractice: false, completed: true };
    if (gameType) query.gameType = gameType;
    if (difficulty) query.difficulty = difficulty;

    const bestScores = await GameScore.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            gameType: '$gameType',
            difficulty: '$difficulty'
          },
          bestScore: { $max: '$score' },
          bestScoreDoc: { $first: '$$ROOT' }
        }
      },
      { $sort: { '_id.gameType': 1, '_id.difficulty': 1 } }
    ]);

    res.json({ bestScores });
  } catch (error) {
    console.error('Best scores error:', error);
    res.status(500).json({ error: 'Failed to fetch best scores' });
  }
});

// Get game statistics
router.get('/stats/:gameType?', async (req, res) => {
  try {
    const { gameType } = req.params;
    const userId = req.user._id;

    if (gameType) {
      // Get stats for specific game
      const stats = req.user.gameStats[gameType];
      if (!stats) {
        return res.status(404).json({ error: 'Game type not found' });
      }

      // Get recent scores for this game
      const recentScores = await GameScore.find({
        userId,
        gameType,
        isPractice: false,
        completed: true
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('difficulty score accuracy timeTaken createdAt');

      res.json({
        gameType,
        stats,
        recentScores
      });
    } else {
      // Get overall stats
      res.json({
        overall: req.user.stats,
        games: req.user.gameStats
      });
    }
  } catch (error) {
    console.error('Game stats error:', error);
    res.status(500).json({ error: 'Failed to fetch game statistics' });
  }
});

// Practice mode - submit score without affecting leaderboard
router.post('/practice', validateGameScore, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      gameType,
      difficulty,
      score,
      accuracy,
      timeTaken,
      attempts = 1,
      gameData,
      metadata
    } = req.body;

    const userId = req.user._id;

    // Create practice score
    const practiceScore = new GameScore({
      userId,
      username: req.user.username,
      gameType,
      difficulty,
      score,
      accuracy,
      timeTaken,
      attempts,
      gameData,
      isPractice: true,
      metadata
    });

    await practiceScore.save();

    res.status(201).json({
      message: 'Practice score saved',
      practiceScore
    });
  } catch (error) {
    console.error('Practice score error:', error);
    res.status(500).json({ error: 'Failed to save practice score' });
  }
});

// Get daily challenge (for Word Sprint)
router.get('/daily-challenge', async (req, res) => {
  try {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    
    // Simple deterministic word generation based on day
    const words = {
      easy: ['cat', 'dog', 'hat', 'run', 'big', 'red', 'hot', 'fun'],
      medium: ['happy', 'world', 'music', 'beach', 'dream', 'peace', 'smile', 'heart'],
      hard: ['adventure', 'beautiful', 'challenge', 'determine', 'experience', 'friendship'],
      extreme: ['serendipity', 'ephemeral', 'mellifluous', 'quintessential', 'surreptitious']
    };

    const difficulties = Object.keys(words);
    const challenge = {};

    difficulties.forEach(difficulty => {
      const wordList = words[difficulty];
      const wordIndex = dayOfYear % wordList.length;
      challenge[difficulty] = {
        word: wordList[wordIndex],
        scrambled: wordList[wordIndex].split('').sort(() => Math.random() - 0.5).join(''),
        hints: generateHints(wordList[wordIndex], difficulty)
      };
    });

    res.json({
      date: today.toISOString().split('T')[0],
      dayOfYear,
      challenge
    });
  } catch (error) {
    console.error('Daily challenge error:', error);
    res.status(500).json({ error: 'Failed to generate daily challenge' });
  }
});

// Helper function to generate hints
function generateHints(word, difficulty) {
  const hints = [];
  
  switch (difficulty) {
    case 'easy':
      hints.push(`The word has ${word.length} letters`);
      hints.push(`It starts with "${word[0]}"`);
      break;
    case 'medium':
      hints.push(`The word has ${word.length} letters`);
      hints.push(`It starts with "${word[0]}"`);
      hints.push(`It ends with "${word[word.length - 1]}"`);
      break;
    case 'hard':
      hints.push(`The word has ${word.length} letters`);
      hints.push(`It starts with "${word[0]}"`);
      hints.push(`It ends with "${word[word.length - 1]}"`);
      hints.push(`It contains the letter "${word[Math.floor(word.length / 2)]}"`);
      break;
    case 'extreme':
      hints.push(`The word has ${word.length} letters`);
      hints.push(`It's a ${word.length > 10 ? 'long' : 'medium-length'} word`);
      hints.push(`It's a ${word.length > 8 ? 'complex' : 'simple'} word`);
      break;
  }
  
  return hints;
}

export default router;
