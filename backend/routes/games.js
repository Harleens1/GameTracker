const express = require('express');
const Joi = require('joi');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const addGameSchema = Joi.object({
  gameId: Joi.number().required(),
  name: Joi.string().required(),
  background_image: Joi.string().allow(null),
  released: Joi.string().allow(null),
  rating: Joi.number().allow(null),
  platforms: Joi.array().items(Joi.object({
    platform: Joi.object({
      id: Joi.number(),
      name: Joi.string()
    })
  })),
  genres: Joi.array().items(Joi.object({
    id: Joi.number(),
    name: Joi.string()
  })),
  status: Joi.string().valid('playing', 'completed', 'dropped', 'plan-to-play').required()
});

const updateGameSchema = Joi.object({
  status: Joi.string().valid('playing', 'completed', 'dropped', 'plan-to-play'),
  userRating: Joi.number().min(1).max(10).allow(null),
  notes: Joi.string().max(500).allow('')
});

// @route   GET /api/games/library
// @desc    Get user's game library
// @access  Private
router.get('/library', authMiddleware, async (req, res) => {
  try {
    const { status, sortBy = 'dateAdded', order = 'desc' } = req.query;
    
    let games = req.user.gameLibrary;
    
    // Filter by status if provided
    if (status) {
      games = games.filter(game => game.status === status);
    }
    
    // Sort games
    games.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'rating':
          comparison = (a.userRating || 0) - (b.userRating || 0);
          break;
        case 'dateAdded':
          comparison = new Date(a.dateAdded) - new Date(b.dateAdded);
          break;
        case 'dateCompleted':
          comparison = new Date(a.dateCompleted || 0) - new Date(b.dateCompleted || 0);
          break;
        default:
          comparison = new Date(a.dateAdded) - new Date(b.dateAdded);
      }
      
      return order === 'asc' ? comparison : -comparison;
    });
    
    res.json({ games });
  } catch (error) {
    console.error('Get library error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/games/library
// @desc    Add game to user's library
// @access  Private
router.post('/library', authMiddleware, async (req, res) => {
  try {
    const { error } = addGameSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const gameData = req.body;
    const user = await User.findById(req.user._id);

    // Check if game already exists in library
    if (user.hasGame(gameData.gameId)) {
      return res.status(400).json({ message: 'Game already in library' });
    }

    // Add game to library
    user.gameLibrary.push(gameData);
    user.updateStats();
    await user.save();

    res.status(201).json({ 
      message: 'Game added to library',
      game: user.gameLibrary[user.gameLibrary.length - 1]
    });
  } catch (error) {
    console.error('Add game error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/games/library/:gameId
// @desc    Update game in user's library
// @access  Private
router.put('/library/:gameId', authMiddleware, async (req, res) => {
  try {
    const { error } = updateGameSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const gameId = parseInt(req.params.gameId);
    const updateData = req.body;
    const user = await User.findById(req.user._id);

    const game = user.getGame(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found in library' });
    }

    // Update game properties
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        game[key] = updateData[key];
      }
    });

    // Set completion date if status changed to completed
    if (updateData.status === 'completed' && game.status !== 'completed') {
      game.dateCompleted = new Date();
    } else if (updateData.status !== 'completed') {
      game.dateCompleted = null;
    }

    user.updateStats();
    await user.save();

    res.json({ 
      message: 'Game updated successfully',
      game
    });
  } catch (error) {
    console.error('Update game error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/games/library/:gameId
// @desc    Remove game from user's library
// @access  Private
router.delete('/library/:gameId', authMiddleware, async (req, res) => {
  try {
    const gameId = parseInt(req.params.gameId);
    const user = await User.findById(req.user._id);

    const gameIndex = user.gameLibrary.findIndex(game => game.gameId === gameId);
    if (gameIndex === -1) {
      return res.status(404).json({ message: 'Game not found in library' });
    }

    user.gameLibrary.splice(gameIndex, 1);
    user.updateStats();
    await user.save();

    res.json({ message: 'Game removed from library' });
  } catch (error) {
    console.error('Remove game error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/games/library/:gameId
// @desc    Get specific game from user's library
// @access  Private
router.get('/library/:gameId', authMiddleware, async (req, res) => {
  try {
    const gameId = parseInt(req.params.gameId);
    const game = req.user.getGame(gameId);

    if (!game) {
      return res.status(404).json({ message: 'Game not found in library' });
    }

    res.json({ game });
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/games/stats
// @desc    Get user's game statistics
// @access  Private
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const games = user.gameLibrary;
    
    // Calculate detailed stats
    const stats = {
      totalGames: games.length,
      playing: games.filter(g => g.status === 'playing').length,
      completed: games.filter(g => g.status === 'completed').length,
      dropped: games.filter(g => g.status === 'dropped').length,
      planToPlay: games.filter(g => g.status === 'plan-to-play').length,
      averageRating: user.stats.averageRating,
      topGenres: {},
      recentActivity: games
        .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
        .slice(0, 5)
        .map(game => ({
          name: game.name,
          status: game.status,
          dateAdded: game.dateAdded
        }))
    };

    // Calculate top genres
    games.forEach(game => {
      if (game.genres) {
        game.genres.forEach(genre => {
          stats.topGenres[genre.name] = (stats.topGenres[genre.name] || 0) + 1;
        });
      }
    });

    // Sort genres by count
    stats.topGenres = Object.entries(stats.topGenres)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .reduce((obj, [genre, count]) => {
        obj[genre] = count;
        return obj;
      }, {});

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;