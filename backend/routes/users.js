const express = require('express');
const Joi = require('joi');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

// @route   GET /api/users/profile
// @desc    Get user profile (public data)
// @access  Private
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      profile: {
        username: user.username,
        bio: user.profile.bio,
        favoriteGenres: user.profile.favoriteGenres,
        joinDate: user.profile.joinDate,
        stats: user.stats
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/password
// @desc    Update user password
// @access  Private
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { error } = updatePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/search
// @desc    Search users by username (for potential social features)
// @access  Private
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { username } = req.query;
    
    if (!username || username.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters' });
    }

    const users = await User.find({
      username: { $regex: username, $options: 'i' },
      _id: { $ne: req.user._id }
    })
    .select('username profile.bio profile.joinDate stats')
    .limit(10);

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:username
// @desc    Get public user profile by username
// @access  Private
router.get('/:username', authMiddleware, async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await User.findOne({ username })
      .select('username profile stats gameLibrary');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return public profile data
    const publicProfile = {
      username: user.username,
      bio: user.profile.bio,
      favoriteGenres: user.profile.favoriteGenres,
      joinDate: user.profile.joinDate,
      stats: user.stats,
      recentGames: user.gameLibrary
        .filter(game => game.status === 'completed')
        .sort((a, b) => new Date(b.dateCompleted) - new Date(a.dateCompleted))
        .slice(0, 5)
        .map(game => ({
          name: game.name,
          userRating: game.userRating,
          dateCompleted: game.dateCompleted,
          background_image: game.background_image
        }))
    };

    res.json({ profile: publicProfile });
  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;