const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const gameEntrySchema = new mongoose.Schema({
  gameId: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  background_image: {
    type: String,
    default: null
  },
  released: {
    type: String,
    default: null
  },
  rating: {
    type: Number,
    default: null
  },
  platforms: [{
    platform: {
      id: Number,
      name: String
    }
  }],
  genres: [{
    id: Number,
    name: String
  }],
  status: {
    type: String,
    enum: ['playing', 'completed', 'dropped', 'plan-to-play'],
    required: true
  },
  userRating: {
    type: Number,
    min: 1,
    max: 10,
    default: null
  },
  dateAdded: {
    type: Date,
    default: Date.now
  },
  dateCompleted: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    maxlength: 500,
    default: ''
  }
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  gameLibrary: [gameEntrySchema],
  profile: {
    bio: {
      type: String,
      maxlength: 300,
      default: ''
    },
    favoriteGenres: [String],
    joinDate: {
      type: Date,
      default: Date.now
    }
  },
  stats: {
    totalGames: {
      type: Number,
      default: 0
    },
    completedGames: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update user stats method
userSchema.methods.updateStats = function() {
  const completedGames = this.gameLibrary.filter(game => game.status === 'completed');
  const ratedGames = completedGames.filter(game => game.userRating !== null);
  
  this.stats.totalGames = this.gameLibrary.length;
  this.stats.completedGames = completedGames.length;
  
  if (ratedGames.length > 0) {
    const totalRating = ratedGames.reduce((sum, game) => sum + game.userRating, 0);
    this.stats.averageRating = Math.round((totalRating / ratedGames.length) * 10) / 10;
  } else {
    this.stats.averageRating = 0;
  }
};

// Check if game exists in library
userSchema.methods.hasGame = function(gameId) {
  return this.gameLibrary.some(game => game.gameId === gameId);
};

// Get game from library
userSchema.methods.getGame = function(gameId) {
  return this.gameLibrary.find(game => game.gameId === gameId);
};

module.exports = mongoose.model('User', userSchema);