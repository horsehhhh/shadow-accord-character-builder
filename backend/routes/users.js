const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Character = require('../models/Character');
const Campaign = require('../models/Campaign');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user statistics
    const [characterCount, campaignsAsGM, campaignsAsPlayer] = await Promise.all([
      Character.countDocuments({ owner: user._id }),
      Campaign.countDocuments({ gamemaster: user._id }),
      Campaign.countDocuments({ players: user._id })
    ]);

    const userWithStats = {
      ...user.toObject(),
      stats: {
        charactersCreated: characterCount,
        campaignsAsGM,
        campaignsAsPlayer
      }
    };

    res.json({
      success: true,
      user: userWithStats
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  auth,
  body('username').optional().trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  body('email').optional().isEmail().withMessage('Please include a valid email'),
  body('settings.theme').optional().isIn(['light', 'dark']).withMessage('Theme must be light or dark'),
  body('settings.notifications').optional().isBoolean().withMessage('Notifications must be boolean'),
  body('settings.publicProfile').optional().isBoolean().withMessage('Public profile must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { username, email, settings } = req.body;

    // Check if username is taken (if being changed)
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
      user.username = username;
    }

    // Check if email is taken (if being changed)
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }
      user.email = email;
    }

    // Update settings
    if (settings) {
      user.settings = { ...user.settings, ...settings };
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user.toObject({ transform: (doc, ret) => { delete ret.password; return ret; } })
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
});

// @route   GET /api/users/search
// @desc    Search users by username
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const users = await User.find({
      username: { $regex: q, $options: 'i' },
      'settings.publicProfile': true
    })
    .select('username')
    .limit(20);

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error searching users'
    });
  }
});

// @route   GET /api/users/:id/public
// @desc    Get public user profile
// @access  Public
router.get('/:id/public', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username createdAt settings.publicProfile');
    
    if (!user || !user.settings.publicProfile) {
      return res.status(404).json({
        success: false,
        message: 'User not found or profile is private'
      });
    }

    // Get public characters
    const publicCharacters = await Character.find({
      owner: user._id,
      'sharing.isPublic': true
    })
    .select('name faction subfaction level')
    .limit(10);

    const publicProfile = {
      _id: user._id,
      username: user.username,
      memberSince: user.createdAt,
      publicCharacters: publicCharacters.length,
      characters: publicCharacters
    };

    res.json({
      success: true,
      user: publicProfile
    });
  } catch (error) {
    console.error('Public profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching public profile'
    });
  }
});

// Admin routes (require admin role)

// @route   GET /api/users/admin/list
// @desc    Get all users (admin only)
// @access  Private (Admin)
router.get('/admin/list', [auth, requireRole('admin')], async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin user list error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user list'
    });
  }
});

// @route   PUT /api/users/admin/:id/role
// @desc    Update user role (admin only)
// @access  Private (Admin)
router.put('/admin/:id/role', [
  auth,
  requireRole('admin'),
  body('role').isIn(['user', 'moderator', 'admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { role } = req.body;
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent self-demotion from admin
    if (req.user.id === user._id.toString() && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own admin role'
      });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    console.error('Role update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user role'
    });
  }
});

// @route   PUT /api/users/admin/:id/suspend
// @desc    Suspend/unsuspend user (admin only)
// @access  Private (Admin)
router.put('/admin/:id/suspend', [
  auth,
  requireRole('admin'),
  body('suspended').isBoolean().withMessage('Suspended must be boolean'),
  body('reason').optional().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { suspended, reason } = req.body;
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent self-suspension
    if (req.user.id === user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot suspend your own account'
      });
    }

    user.suspended = suspended;
    if (suspended && reason) {
      user.suspensionReason = reason;
    } else if (!suspended) {
      user.suspensionReason = undefined;
    }

    await user.save();

    res.json({
      success: true,
      message: `User ${suspended ? 'suspended' : 'unsuspended'} successfully`,
      user
    });
  } catch (error) {
    console.error('Suspension error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating suspension status'
    });
  }
});

// @route   DELETE /api/users/admin/:id
// @desc    Delete user account (admin only)
// @access  Private (Admin)
router.delete('/admin/:id', [auth, requireRole('admin')], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent self-deletion
    if (req.user.id === user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Delete user's characters and campaigns
    await Promise.all([
      Character.deleteMany({ owner: user._id }),
      Campaign.deleteMany({ gamemaster: user._id }),
      Campaign.updateMany(
        { players: user._id },
        { $pull: { players: user._id } }
      )
    ]);

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting user'
    });
  }
});

// @route   GET /api/users/admin/stats
// @desc    Get platform statistics (admin only)
// @access  Private (Admin)
router.get('/admin/stats', [auth, requireRole('admin')], async (req, res) => {
  try {
    const [
      totalUsers,
      totalCharacters,
      totalCampaigns,
      recentUsers,
      suspendedUsers
    ] = await Promise.all([
      User.countDocuments(),
      Character.countDocuments(),
      Campaign.countDocuments(),
      User.countDocuments({ 
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
      }),
      User.countDocuments({ suspended: true })
    ]);

    // Get faction distribution
    const factionStats = await Character.aggregate([
      { $group: { _id: '$faction', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const stats = {
      users: {
        total: totalUsers,
        recentSignups: recentUsers,
        suspended: suspendedUsers
      },
      characters: {
        total: totalCharacters
      },
      campaigns: {
        total: totalCampaigns
      },
      factionDistribution: factionStats
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching statistics'
    });
  }
});

module.exports = router;
