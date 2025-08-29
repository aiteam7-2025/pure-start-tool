import mongoose from 'mongoose';

const gameScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  gameType: {
    type: String,
    required: true,
    enum: ['lineDrop', 'circleStop', 'gravityTicTacToe', 'wordSprint']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard', 'extreme']
  },
  score: {
    type: Number,
    required: true,
    min: 0
  },
  accuracy: {
    type: Number,
    min: 0,
    max: 100
  },
  timeTaken: {
    type: Number, // in milliseconds
    min: 0
  },
  attempts: {
    type: Number,
    default: 1
  },
  gameData: {
    // Store game-specific data
    targetPosition: Number, // for line drop
    circleSize: Number, // for circle stop
    boardState: String, // for tic-tac-toe
    word: String, // for word sprint
    hints: [String]
  },
  isPractice: {
    type: Boolean,
    default: false
  },
  completed: {
    type: Boolean,
    default: true
  },
  metadata: {
    device: String,
    browser: String,
    screenResolution: String
  }
}, {
  timestamps: true
});

// Indexes for performance
gameScoreSchema.index({ gameType: 1, difficulty: 1, score: -1 });
gameScoreSchema.index({ userId: 1, gameType: 1, createdAt: -1 });
gameScoreSchema.index({ gameType: 1, difficulty: 1, createdAt: -1 });
gameScoreSchema.index({ score: -1, createdAt: -1 });

// Compound index for leaderboard queries
gameScoreSchema.index({ gameType: 1, difficulty: 1, score: -1, createdAt: -1 });

// Method to get leaderboard position
gameScoreSchema.methods.getLeaderboardPosition = async function() {
  const position = await this.constructor.countDocuments({
    gameType: this.gameType,
    difficulty: this.difficulty,
    score: { $gt: this.score }
  });
  return position + 1;
};

// Static method to get top scores
gameScoreSchema.statics.getTopScores = async function(gameType, difficulty, limit = 100) {
  return this.find({
    gameType,
    difficulty,
    isPractice: false,
    completed: true
  })
  .sort({ score: -1, createdAt: 1 })
  .limit(limit)
  .populate('userId', 'username avatar')
  .select('userId username score accuracy timeTaken attempts createdAt');
};

// Static method to get user's best score for a game
gameScoreSchema.statics.getUserBestScore = async function(userId, gameType, difficulty) {
  return this.findOne({
    userId,
    gameType,
    difficulty,
    isPractice: false,
    completed: true
  })
  .sort({ score: -1 })
  .select('score accuracy timeTaken attempts createdAt');
};

// Static method to get user's recent scores
gameScoreSchema.statics.getUserRecentScores = async function(userId, gameType, limit = 10) {
  return this.find({
    userId,
    gameType,
    isPractice: false,
    completed: true
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .select('score difficulty accuracy timeTaken createdAt');
};

const GameScore = mongoose.model('GameScore', gameScoreSchema);

export default GameScore;
