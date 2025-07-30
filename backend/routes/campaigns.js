const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, optionalAuth } = require('../middleware/auth');
const Campaign = require('../models/Campaign');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/campaigns
// @desc    Get campaigns for user (as player or GM)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const campaigns = await Campaign.find({
      $or: [
        { gamemaster: req.user.id },
        { players: req.user.id }
      ]
    })
    .populate('gamemaster', 'username email')
    .populate('players', 'username email')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      campaigns
    });
  } catch (error) {
    console.error('Campaigns fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching campaigns'
    });
  }
});

// @route   GET /api/campaigns/public
// @desc    Get public campaigns for joining
// @access  Public
router.get('/public', optionalAuth, async (req, res) => {
  try {
    const campaigns = await Campaign.find({
      isPublic: true,
      status: 'active'
    })
    .populate('gamemaster', 'username')
    .select('name description gamemaster playerLimit players.length location schedule lastSession')
    .sort({ createdAt: -1 })
    .limit(50);

    res.json({
      success: true,
      campaigns
    });
  } catch (error) {
    console.error('Public campaigns fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching public campaigns'
    });
  }
});

// @route   GET /api/campaigns/:id
// @desc    Get campaign by ID
// @access  Private (must be player or GM)
router.get('/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('gamemaster', 'username email')
      .populate('players', 'username email');

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check if user is authorized to view this campaign
    const isPlayer = campaign.players.some(player => player._id.toString() === req.user.id);
    const isGM = campaign.gamemaster._id.toString() === req.user.id;

    if (!isPlayer && !isGM) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this campaign'
      });
    }

    res.json({
      success: true,
      campaign
    });
  } catch (error) {
    console.error('Campaign fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching campaign'
    });
  }
});

// @route   POST /api/campaigns
// @desc    Create new campaign
// @access  Private
router.post('/', [
  auth,
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Campaign name must be 1-100 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('location').optional().isLength({ max: 200 }).withMessage('Location cannot exceed 200 characters'),
  body('playerLimit').optional().isInt({ min: 1, max: 20 }).withMessage('Player limit must be between 1-20'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be boolean')
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

    const { name, description, location, playerLimit, isPublic, schedule } = req.body;

    const campaign = new Campaign({
      name,
      description,
      gamemaster: req.user.id,
      location,
      playerLimit: playerLimit || 6,
      isPublic: isPublic || false,
      schedule: schedule || {},
      status: 'active'
    });

    await campaign.save();
    
    await campaign.populate('gamemaster', 'username email');

    res.status(201).json({
      success: true,
      campaign
    });
  } catch (error) {
    console.error('Campaign creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating campaign'
    });
  }
});

// @route   PUT /api/campaigns/:id
// @desc    Update campaign (GM only)
// @access  Private
router.put('/:id', [
  auth,
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Campaign name must be 1-100 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('location').optional().isLength({ max: 200 }).withMessage('Location cannot exceed 200 characters'),
  body('playerLimit').optional().isInt({ min: 1, max: 20 }).withMessage('Player limit must be between 1-20'),
  body('status').optional().isIn(['active', 'paused', 'completed', 'cancelled']).withMessage('Invalid status')
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

    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check if user is the GM
    if (campaign.gamemaster.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the gamemaster can update this campaign'
      });
    }

    const allowedUpdates = ['name', 'description', 'location', 'playerLimit', 'isPublic', 'schedule', 'status'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    Object.assign(campaign, updates);
    await campaign.save();

    await campaign.populate('gamemaster', 'username email');
    await campaign.populate('players', 'username email');

    res.json({
      success: true,
      campaign
    });
  } catch (error) {
    console.error('Campaign update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating campaign'
    });
  }
});

// @route   DELETE /api/campaigns/:id
// @desc    Delete campaign (GM only)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check if user is the GM
    if (campaign.gamemaster.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the gamemaster can delete this campaign'
      });
    }

    await Campaign.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    console.error('Campaign deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting campaign'
    });
  }
});

// @route   POST /api/campaigns/:id/join
// @desc    Join a campaign
// @access  Private
router.post('/:id/join', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check if campaign is full
    if (campaign.players.length >= campaign.playerLimit) {
      return res.status(400).json({
        success: false,
        message: 'Campaign is full'
      });
    }

    // Check if user is already a player
    if (campaign.players.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already a player in this campaign'
      });
    }

    // Check if user is the GM
    if (campaign.gamemaster.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Gamemaster cannot join as a player'
      });
    }

    campaign.players.push(req.user.id);
    await campaign.save();

    await campaign.populate('gamemaster', 'username email');
    await campaign.populate('players', 'username email');

    res.json({
      success: true,
      message: 'Successfully joined campaign',
      campaign
    });
  } catch (error) {
    console.error('Campaign join error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error joining campaign'
    });
  }
});

// @route   POST /api/campaigns/:id/leave
// @desc    Leave a campaign
// @access  Private
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check if user is a player
    if (!campaign.players.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are not a player in this campaign'
      });
    }

    campaign.players = campaign.players.filter(
      playerId => playerId.toString() !== req.user.id
    );
    
    await campaign.save();

    res.json({
      success: true,
      message: 'Successfully left campaign'
    });
  } catch (error) {
    console.error('Campaign leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error leaving campaign'
    });
  }
});

// @route   POST /api/campaigns/:id/remove-player
// @desc    Remove player from campaign (GM only)
// @access  Private
router.post('/:id/remove-player', [
  auth,
  body('playerId').notEmpty().withMessage('Player ID is required')
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

    const { playerId } = req.body;
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check if user is the GM
    if (campaign.gamemaster.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the gamemaster can remove players'
      });
    }

    // Check if player is in the campaign
    if (!campaign.players.includes(playerId)) {
      return res.status(400).json({
        success: false,
        message: 'Player is not in this campaign'
      });
    }

    campaign.players = campaign.players.filter(
      id => id.toString() !== playerId
    );
    
    await campaign.save();

    await campaign.populate('gamemaster', 'username email');
    await campaign.populate('players', 'username email');

    res.json({
      success: true,
      message: 'Player removed successfully',
      campaign
    });
  } catch (error) {
    console.error('Remove player error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error removing player'
    });
  }
});

// @route   POST /api/campaigns/:id/sessions
// @desc    Add session record (GM only)
// @access  Private
router.post('/:id/sessions', [
  auth,
  body('date').isISO8601().withMessage('Valid date is required'),
  body('xpAwarded').optional().isInt({ min: 0, max: 50 }).withMessage('XP awarded must be 0-50'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
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

    const { date, xpAwarded, notes } = req.body;
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check if user is the GM
    if (campaign.gamemaster.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the gamemaster can add sessions'
      });
    }

    const session = {
      date: new Date(date),
      xpAwarded: xpAwarded || 0,
      notes: notes || '',
      playersPresent: req.body.playersPresent || []
    };

    campaign.sessions.push(session);
    campaign.lastSession = session.date;
    await campaign.save();

    res.json({
      success: true,
      message: 'Session added successfully',
      session
    });
  } catch (error) {
    console.error('Session add error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding session'
    });
  }
});

module.exports = router;
