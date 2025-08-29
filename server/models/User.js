import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  avatar: {
    type: String,
    default: ''
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  friendRequests: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  stats: {
    totalGamesPlayed: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    bestScore: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 }
  },
  gameStats: {
    lineDrop: {
      bestScore: { type: Number, default: 0 },
      gamesPlayed: { type: Number, default: 0 },
      totalScore: { type: Number, default: 0 }
    },
    circleStop: {
      bestScore: { type: Number, default: 0 },
      gamesPlayed: { type: Number, default: 0 },
      totalScore: { type: Number, default: 0 }
    },
    gravityTicTacToe: {
      bestScore: { type: Number, default: 0 },
      gamesPlayed: { type: Number, default: 0 },
      totalScore: { type: Number, default: 0 },
      gamesWon: { type: Number, default: 0 }
    },
    wordSprint: {
      bestScore: { type: Number, default: 0 },
      gamesPlayed: { type: Number, default: 0 },
      totalScore: { type: Number, default: 0 },
      wordsSolved: { type: Number, default: 0 }
    }
  },
  preferences: {
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
    soundEnabled: { type: Boolean, default: true },
    notifications: { type: Boolean, default: true }
  },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'stats.totalScore': -1 });
userSchema.index({ 'gameStats.lineDrop.bestScore': -1 });
userSchema.index({ 'gameStats.circleStop.bestScore': -1 });
userSchema.index({ 'gameStats.gravityTicTacToe.bestScore': -1 });
userSchema.index({ 'gameStats.wordSprint.bestScore': -1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to update game stats
userSchema.methods.updateGameStats = function(gameType, score, won = false) {
  const gameStats = this.gameStats[gameType];
  if (gameStats) {
    gameStats.gamesPlayed += 1;
    gameStats.totalScore += score;
    gameStats.bestScore = Math.max(gameStats.bestScore, score);
    if (won && gameType === 'gravityTicTacToe') {
      gameStats.gamesWon += 1;
    }
    if (gameType === 'wordSprint') {
      gameStats.wordsSolved += 1;
    }
  }
  
  // Update overall stats
  this.stats.totalGamesPlayed += 1;
  this.stats.totalScore += score;
  this.stats.averageScore = this.stats.totalScore / this.stats.totalGamesPlayed;
  this.stats.bestScore = Math.max(this.stats.bestScore, score);
  if (won) this.stats.gamesWon += 1;
};

// Method to get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  return {
    _id: this._id,
    username: this.username,
    avatar: this.avatar,
    stats: this.stats,
    isOnline: this.isOnline,
    lastSeen: this.lastSeen
  };
};

const User = mongoose.model('User', userSchema);

export default User;
