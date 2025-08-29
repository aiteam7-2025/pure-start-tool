import express from 'express';
import { query, validationResult } from 'express-validator';
import GameScore from '../models/GameScore.js';
import User from '../models/User.js';

const router = express.Router();

// Validation middleware
const validateLeaderboardQuery = [
  query('gameType')
    .isIn(['lineDrop', 'circleStop', 'gravityTicTacToe', 'wordSprint'])
    .withMessage('Invalid game type'),
  query('difficulty')
    .isIn(['easy', 'medium', 'hard', 'extreme'])
    .withMessage('Invalid difficulty level'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
];

// Get global leaderboard
router.get('/global', validateLeaderboardQuery, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { gameType, difficulty, limit = 50, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get top scores
    const topScores = await GameScore.find({
      gameType,
      difficulty,
      isPractice: false,
      completed: true
    })
    .sort({ score: -1, createdAt: 1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('userId', 'username avatar')
    .select('userId username score accuracy timeTaken attempts createdAt');

    // Get total count for pagination
    const total = await GameScore.countDocuments({
      gameType,
      difficulty,
      isPractice: false,
      completed: true
    });

    // Get user's position if authenticated
    let userPosition = null;
    if (req.user) {
      const userScore = await GameScore.findOne({
        userId: req.user._id,
        gameType,
        difficulty,
        isPractice: false,
        completed: true
      }).sort({ score: -1 });

      if (userScore) {
        userPosition = await userScore.getLeaderboardPosition();
      }
    }

    res.json({
      leaderboard: topScores,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: skip + topScores.length < total,
        hasPrev: parseInt(page) > 1
      },
      userPosition,
      gameType,
      difficulty
    });
  } catch (error) {
    console.error('Global leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch global leaderboard' });
  }
});

// Get friends leaderboard
router.get('/friends', validateLeaderboardQuery, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { gameType, difficulty, limit = 50, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get user's friends
    const user = await User.findById(req.user._id).populate('friends');
    if (!user.friends || user.friends.length === 0) {
      return res.json({
        leaderboard: [],
        pagination: { current: 1, total: 1, hasNext: false, hasPrev: false },
        message: 'No friends added yet'
      });
    }

    const friendIds = user.friends.map(friend => friend._id);
    friendIds.push(req.user._id); // Include current user

    // Get friends' scores
    const friendsScores = await GameScore.find({
      userId: { $in: friendIds },
      gameType,
      difficulty,
      isPractice: false,
      completed: true
    })
    .sort({ score: -1, createdAt: 1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('userId', 'username avatar')
    .select('userId username score accuracy timeTaken attempts createdAt');

    // Get total count for pagination
    const total = await GameScore.countDocuments({
      userId: { $in: friendIds },
      gameType,
      difficulty,
      isPractice: false,
      completed: true
    });

    // Get user's position among friends
    let userPosition = null;
    const userScore = await GameScore.findOne({
      userId: req.user._id,
      gameType,
      difficulty,
      isPractice: false,
      completed: true
    }).sort({ score: -1 });

    if (userScore) {
      userPosition = await GameScore.countDocuments({
        userId: { $in: friendIds },
        gameType,
        difficulty,
        isPractice: false,
        completed: true,
        score: { $gt: userScore.score }
      }) + 1;
    }

    res.json({
      leaderboard: friendsScores,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: skip + friendsScores.length < total,
        hasPrev: parseInt(page) > 1
      },
      userPosition,
      gameType,
      difficulty,
      totalFriends: user.friends.length
    });
  } catch (error) {
    console.error('Friends leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch friends leaderboard' });
  }
});

// Get overall leaderboard (all games combined)
router.get('/overall', async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Aggregate scores by user
    const overallLeaderboard = await GameScore.aggregate([
      {
        $match: {
          isPractice: false,
          completed: true
        }
      },
      {
        $group: {
          _id: '$userId',
          username: { $first: '$username' },
          totalScore: { $sum: '$score' },
          totalGames: { $sum: 1 },
          averageScore: { $avg: '$score' },
          bestScore: { $max: '$score' }
        }
      },
      {
        $sort: { totalScore: -1, averageScore: -1 }
      },
      {
        $skip: skip
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    // Get total count
    const total = await GameScore.aggregate([
      {
        $match: {
          isPractice: false,
          completed: true
        }
      },
      {
        $group: {
          _id: '$userId'
        }
      },
      {
        $count: 'total'
      }
    ]);

    const totalUsers = total[0]?.total || 0;

    // Get user's overall position
    let userPosition = null;
    if (req.user) {
      const userOverall = await GameScore.aggregate([
        {
          $match: {
            userId: req.user._id,
            isPractice: false,
            completed: true
          }
        },
        {
          $group: {
            _id: '$userId',
            totalScore: { $sum: '$score' },
            totalGames: { $sum: 1 },
            averageScore: { $avg: '$score' }
          }
        }
      ]);

      if (userOverall.length > 0) {
        const userScore = userOverall[0].totalScore;
        userPosition = await GameScore.aggregate([
          {
            $match: {
              isPractice: false,
              completed: true
            }
          },
          {
            $group: {
              _id: '$userId',
              totalScore: { $sum: '$score' }
            }
          },
          {
            $match: {
              totalScore: { $gt: userScore }
            }
          },
          {
            $count: 'count'
          }
        ]);
        userPosition = userPosition[0]?.count + 1 || 1;
      }
    }

    res.json({
      leaderboard: overallLeaderboard,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(totalUsers / parseInt(limit)),
        hasNext: skip + overallLeaderboard.length < totalUsers,
        hasPrev: parseInt(page) > 1
      },
      userPosition
    });
  } catch (error) {
    console.error('Overall leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch overall leaderboard' });
  }
});

// Get leaderboard for specific time period
router.get('/period', validateLeaderboardQuery, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { gameType, difficulty, period = 'week', limit = 50, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Default to week
    }

    // Get scores for the period
    const periodScores = await GameScore.find({
      gameType,
      difficulty,
      isPractice: false,
      completed: true,
      createdAt: { $gte: startDate }
    })
    .sort({ score: -1, createdAt: 1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('userId', 'username avatar')
    .select('userId username score accuracy timeTaken attempts createdAt');

    // Get total count for pagination
    const total = await GameScore.countDocuments({
      gameType,
      difficulty,
      isPractice: false,
      completed: true,
      createdAt: { $gte: startDate }
    });

    res.json({
      leaderboard: periodScores,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: skip + periodScores.length < total,
        hasPrev: parseInt(page) > 1
      },
      period,
      startDate,
      gameType,
      difficulty
    });
  } catch (error) {
    console.error('Period leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch period leaderboard' });
  }
});

export default router;
