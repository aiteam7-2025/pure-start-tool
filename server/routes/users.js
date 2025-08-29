import express from 'express';
import { body, query, validationResult } from 'express-validator';
import User from '../models/User.js';
import GameScore from '../models/GameScore.js';

const router = express.Router();

// Validation middleware
const validateProfileUpdate = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 20 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-20 characters and contain only letters, numbers, and underscores'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL'),
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark', 'auto'])
    .withMessage('Theme must be light, dark, or auto'),
  body('preferences.soundEnabled')
    .optional()
    .isBoolean()
    .withMessage('Sound enabled must be a boolean'),
  body('preferences.notifications')
    .optional()
    .isBoolean()
    .withMessage('Notifications must be a boolean')
];

const validateFriendRequest = [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
];

// Get current user profile
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('friends', 'username avatar isOnline lastSeen');

    res.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', validateProfileUpdate, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, avatar, preferences } = req.body;
    const updateData = {};

    // Check if username is being changed and if it's already taken
    if (username && username !== req.user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      updateData.username = username;
    }

    if (avatar !== undefined) updateData.avatar = avatar;
    if (preferences) {
      updateData.preferences = { ...req.user.preferences, ...preferences };
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Search users
router.get('/search', [
  query('q')
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { q: searchQuery, limit = 20 } = req.query;
    const userId = req.user._id;

    // Search for users by username (excluding current user)
    const users = await User.find({
      _id: { $ne: userId },
      username: { $regex: searchQuery, $options: 'i' }
    })
    .select('username avatar isOnline lastSeen stats')
    .limit(parseInt(limit));

    res.json({ users });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Send friend request
router.post('/friend-request', validateFriendRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username } = req.body;
    const senderId = req.user._id;

    // Find the user to send request to
    const targetUser = await User.findOne({ username });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser._id.equals(senderId)) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if already friends
    if (targetUser.friends.includes(senderId)) {
      return res.status(400).json({ error: 'Already friends with this user' });
    }

    // Check if request already exists
    const existingRequest = targetUser.friendRequests.find(
      req => req.from.equals(senderId) && req.status === 'pending'
    );
    if (existingRequest) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }

    // Add friend request
    targetUser.friendRequests.push({
      from: senderId,
      status: 'pending'
    });

    await targetUser.save();

    res.json({
      message: 'Friend request sent successfully',
      targetUser: {
        _id: targetUser._id,
        username: targetUser.username,
        avatar: targetUser.avatar
      }
    });
  } catch (error) {
    console.error('Friend request error:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// Respond to friend request
router.put('/friend-request/:requestId', [
  body('action')
    .isIn(['accept', 'reject'])
    .withMessage('Action must be accept or reject')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { requestId } = req.params;
    const { action } = req.body;
    const userId = req.user._id;

    // Find user with the friend request
    const user = await User.findById(userId);
    const request = user.friendRequests.id(requestId);

    if (!request) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    if (action === 'accept') {
      // Add to friends list for both users
      user.friends.push(request.from);
      await User.findByIdAndUpdate(request.from, {
        $push: { friends: userId }
      });

      // Remove the request
      user.friendRequests.pull(requestId);
    } else {
      // Mark as rejected
      request.status = 'rejected';
    }

    await user.save();

    res.json({
      message: `Friend request ${action}ed successfully`,
      action
    });
  } catch (error) {
    console.error('Friend request response error:', error);
    res.status(500).json({ error: 'Failed to respond to friend request' });
  }
});

// Get friend requests
router.get('/friend-requests', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friendRequests.from', 'username avatar');

    const pendingRequests = user.friendRequests.filter(req => req.status === 'pending');

    res.json({ friendRequests: pendingRequests });
  } catch (error) {
    console.error('Friend requests fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch friend requests' });
  }
});

// Remove friend
router.delete('/friends/:friendId', async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user._id;

    // Remove from current user's friends list
    await User.findByIdAndUpdate(userId, {
      $pull: { friends: friendId }
    });

    // Remove from friend's friends list
    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: userId }
    });

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

// Get user's friends
router.get('/friends', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends', 'username avatar isOnline lastSeen stats');

    res.json({ friends: user.friends });
  } catch (error) {
    console.error('Friends fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// Get user statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's overall stats
    const userStats = await User.findById(userId).select('stats gameStats');

    // Get recent achievements
    const recentScores = await GameScore.find({
      userId,
      isPractice: false,
      completed: true
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('gameType difficulty score createdAt');

    // Get ranking information
    const overallRank = await GameScore.aggregate([
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
        $sort: { totalScore: -1 }
      }
    ]);

    const userRank = overallRank.findIndex(entry => entry._id.equals(userId)) + 1;

    res.json({
      stats: userStats,
      recentScores,
      ranking: {
        overall: userRank,
        totalPlayers: overallRank.length
      }
    });
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// Get user's game history summary
router.get('/history-summary', async (req, res) => {
  try {
    const userId = req.user._id;
    const { gameType, limit = 10 } = req.query;

    const query = { userId, isPractice: false, completed: true };
    if (gameType) query.gameType = gameType;

    const history = await GameScore.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('gameType difficulty score accuracy timeTaken createdAt');

    // Group by game type
    const summary = history.reduce((acc, score) => {
      if (!acc[score.gameType]) {
        acc[score.gameType] = [];
      }
      acc[score.gameType].push(score);
      return acc;
    }, {});

    res.json({ historySummary: summary });
  } catch (error) {
    console.error('History summary error:', error);
    res.status(500).json({ error: 'Failed to fetch history summary' });
  }
});

export default router;
