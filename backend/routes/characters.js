const express = require('express');
const { body, validationResult, param, query } = require('express-validator');
const Character = require('../models/Character');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/characters
// @desc    Get user's characters
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50, faction, search, sort = '-lastModified' } = req.query;
    
    const query = { userId: req.user.id };
    
    // Add faction filter
    if (faction) {
      query.faction = faction;
    }
    
    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { player: { $regex: search, $options: 'i' } }
      ];
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort
    };
    
    const characters = await Character.find(query)
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit);
    
    const total = await Character.countDocuments(query);
    
    res.json({
      success: true,
      count: characters.length,
      total,
      page: options.page,
      pages: Math.ceil(total / options.limit),
      characters
    });
  } catch (error) {
    console.error('Character list error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching characters'
    });
  }
});

// @route   GET /api/characters/public
// @desc    Get public characters
// @access  Public
router.get('/public', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, faction, search, sort = '-lastModified' } = req.query;
    
    const query = { isPublic: true };
    
    if (faction) {
      query.faction = faction;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { player: { $regex: search, $options: 'i' } }
      ];
    }
    
    const characters = await Character.find(query)
      .select('name player faction subfaction totalXP checkInCount lastModified')
      .populate('userId', 'username')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Character.countDocuments(query);
    
    res.json({
      success: true,
      count: characters.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      characters
    });
  } catch (error) {
    console.error('Public characters error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching public characters'
    });
  }
});

// @route   GET /api/characters/:id
// @desc    Get specific character
// @access  Private
router.get('/:id', [
  auth,
  param('id').isMongoId().withMessage('Invalid character ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const character = await Character.findById(req.params.id);
    
    if (!character) {
      return res.status(404).json({
        success: false,
        message: 'Character not found'
      });
    }

    // Check access permissions
    if (!character.canAccess(req.user.id, 'view')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      character
    });
  } catch (error) {
    console.error('Character fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching character'
    });
  }
});

// @route   POST /api/characters
// @desc    Create new character
// @access  Private
router.post('/', [
  auth,
  body('name')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Character name cannot exceed 50 characters'),
  body('player')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Player name cannot exceed 50 characters'),
  body('faction')
    .optional()
    .isIn(['human', 'vampire', 'shifter', 'wraith', ''])
    .withMessage('Invalid faction'),
  body('subfaction')
    .optional()
], async (req, res) => {
  try {
    console.log('Character creation request received:', {
      userId: req.user.id,
      body: req.body
    });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    let characterData = {
      ...req.body,
      userId: req.user.id
    };

    // Preprocess data types before creating (same as update)
    const arrayFields = ['advancementHistory', 'xpHistory', 'lores', 'innateTreeIds', 'fundamentalPowers', 'thornOptions', 'selectedPassions', 'claimedInnateTreeIds', 'selfNerfs', 'sharedWith', 'factionChanges'];
    
    arrayFields.forEach(field => {
      if (characterData[field] && typeof characterData[field] === 'string') {
        try {
          characterData[field] = JSON.parse(characterData[field]);
        } catch (e) {
          console.warn(`Failed to parse ${field} as JSON during creation:`, characterData[field]);
        }
      }
    });
    
    // Handle nested object fields that might be stringified
    const objectFields = ['stats', 'skills', 'powers', 'merits'];
    
    objectFields.forEach(field => {
      if (characterData[field] && typeof characterData[field] === 'string') {
        try {
          characterData[field] = JSON.parse(characterData[field]);
        } catch (e) {
          console.warn(`Failed to parse ${field} as JSON during creation:`, characterData[field]);
        }
      }
    });

    console.log('Creating character with processed data:', characterData);
    const character = await Character.create(characterData);
    console.log('Character created successfully:', character._id);

    res.status(201).json({
      success: true,
      message: 'Character created successfully',
      character
    });
  } catch (error) {
    console.error('Character creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating character'
    });
  }
});

// @route   PUT /api/characters/:id
// @desc    Update character
// @access  Private
router.put('/:id', [
  auth,
  param('id').isMongoId().withMessage('Invalid character ID'),
  body('name')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Character name cannot exceed 50 characters'),
  body('player')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Player name cannot exceed 50 characters'),
  body('notes')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Notes cannot exceed 5000 characters'),
  body('faction')
    .optional()
    .isIn(['human', 'vampire', 'shifter', 'wraith', ''])
    .withMessage('Invalid faction'),
  body('totalXP')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total XP must be a non-negative integer'),
  body('xpSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('XP spent must be a non-negative integer'),
  body('checkInCount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Check-in count must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Character update validation failed:', {
        characterId: req.params.id,
        userId: req.user?.id,
        errors: errors.array(),
        bodyKeys: Object.keys(req.body)
      });
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const character = await Character.findById(req.params.id);
    
    if (!character) {
      return res.status(404).json({
        success: false,
        message: 'Character not found'
      });
    }

    // Check edit permissions
    if (!character.canAccess(req.user.id, 'edit')) {
      return res.status(403).json({
        success: false,
        message: 'Edit access denied'
      });
    }

    // Log the update data for debugging
    console.log('Character update request:', {
      characterId: req.params.id,
      userId: req.user.id,
      bodyKeys: Object.keys(req.body),
      hasStats: !!req.body.stats,
      hasSkills: !!req.body.skills,
      hasPowers: !!req.body.powers,
      hasMerits: !!req.body.merits,
      hasLores: !!req.body.lores,
      totalXP: req.body.totalXP,
      xpSpent: req.body.xpSpent
    });

    // Preprocess data types before updating
    const updateData = { ...req.body };
    
    // Handle array fields that might be stringified
    const arrayFields = ['advancementHistory', 'xpHistory', 'lores', 'innateTreeIds', 'fundamentalPowers', 'thornOptions', 'selectedPassions', 'claimedInnateTreeIds', 'selfNerfs', 'sharedWith', 'factionChanges'];
    
    arrayFields.forEach(field => {
      if (updateData[field] && typeof updateData[field] === 'string') {
        try {
          updateData[field] = JSON.parse(updateData[field]);
        } catch (e) {
          console.warn(`Failed to parse ${field} as JSON:`, updateData[field]);
        }
      }
    });
    
    // Handle nested object fields that might be stringified
    const objectFields = ['stats', 'skills', 'powers', 'merits'];
    
    objectFields.forEach(field => {
      if (updateData[field] && typeof updateData[field] === 'string') {
        try {
          updateData[field] = JSON.parse(updateData[field]);
        } catch (e) {
          console.warn(`Failed to parse ${field} as JSON:`, updateData[field]);
        }
      }
    });

    // Update character
    Object.assign(character, updateData);
    await character.save();

    console.log('✅ Character update successful:', {
      characterId: character._id,
      name: character.name,
      totalXP: character.totalXP,
      skillsCount: Object.keys(character.skills || {}).length,
      powersCount: Object.keys(character.powers || {}).length,
      meritsCount: Object.keys(character.merits || {}).length,
      loresCount: (character.lores || []).length
    });

    res.json({
      success: true,
      message: 'Character updated successfully',
      character
    });
  } catch (error) {
    console.error('Character update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating character'
    });
  }
});

// @route   DELETE /api/characters/:id
// @desc    Delete character
// @access  Private
router.delete('/:id', [
  auth,
  param('id').isMongoId().withMessage('Invalid character ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const character = await Character.findById(req.params.id);
    
    if (!character) {
      return res.status(404).json({
        success: false,
        message: 'Character not found'
      });
    }

    // Only owner can delete
    if (character.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await Character.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Character deleted successfully'
    });
  } catch (error) {
    console.error('Character deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting character'
    });
  }
});

// @route   POST /api/characters/:id/clone
// @desc    Clone character
// @access  Private
router.post('/:id/clone', [
  auth,
  param('id').isMongoId().withMessage('Invalid character ID'),
  body('name')
    .notEmpty()
    .withMessage('New character name is required')
    .isLength({ max: 50 })
    .withMessage('Character name cannot exceed 50 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const originalCharacter = await Character.findById(req.params.id);
    
    if (!originalCharacter) {
      return res.status(404).json({
        success: false,
        message: 'Character not found'
      });
    }

    // Check access permissions
    if (!originalCharacter.canAccess(req.user.id, 'view')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Create clone
    const cloneData = originalCharacter.toObject();
    delete cloneData._id;
    delete cloneData.createdAt;
    delete cloneData.updatedAt;
    
    cloneData.name = req.body.name;
    cloneData.userId = req.user.id;
    cloneData.isPublic = false;
    cloneData.sharedWith = [];
    cloneData.campaignId = null;

    const clonedCharacter = await Character.create(cloneData);

    res.status(201).json({
      success: true,
      message: 'Character cloned successfully',
      character: clonedCharacter
    });
  } catch (error) {
    console.error('Character clone error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cloning character'
    });
  }
});

// @route   POST /api/characters/:id/share
// @desc    Share character with another user
// @access  Private
router.post('/:id/share', [
  auth,
  param('id').isMongoId().withMessage('Invalid character ID'),
  body('username')
    .notEmpty()
    .withMessage('Username is required'),
  body('permission')
    .isIn(['view', 'edit'])
    .withMessage('Permission must be view or edit')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const character = await Character.findById(req.params.id);
    
    if (!character) {
      return res.status(404).json({
        success: false,
        message: 'Character not found'
      });
    }

    // Only owner can share
    if (character.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only character owner can share'
      });
    }

    // Find user to share with
    const User = require('../models/User');
    const targetUser = await User.findOne({ username: req.body.username });
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already shared
    const existingShare = character.sharedWith.find(
      share => share.userId.toString() === targetUser._id.toString()
    );

    if (existingShare) {
      existingShare.permission = req.body.permission;
    } else {
      character.sharedWith.push({
        userId: targetUser._id,
        permission: req.body.permission
      });
    }

    await character.save();

    res.json({
      success: true,
      message: `Character shared with ${targetUser.username}`
    });
  } catch (error) {
    console.error('Character share error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error sharing character'
    });
  }
});

// @route   POST /api/characters/:id/xp
// @desc    Add XP to character
// @access  Private
router.post('/:id/xp', [
  auth,
  param('id').isMongoId().withMessage('Invalid character ID'),
  body('amount')
    .isInt({ min: 1 })
    .withMessage('XP amount must be a positive integer'),
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ max: 200 })
    .withMessage('Reason cannot exceed 200 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const character = await Character.findById(req.params.id);
    
    if (!character) {
      return res.status(404).json({
        success: false,
        message: 'Character not found'
      });
    }

    // Check edit permissions
    if (!character.canAccess(req.user.id, 'edit')) {
      return res.status(403).json({
        success: false,
        message: 'Edit access denied'
      });
    }

    const { amount, reason } = req.body;
    await character.addXP(amount, reason);

    res.json({
      success: true,
      message: 'XP added successfully',
      character: {
        id: character._id,
        totalXP: character.totalXP,
        xpHistory: character.xpHistory.slice(-5) // Last 5 entries
      }
    });
  } catch (error) {
    console.error('XP addition error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding XP'
    });
  }
});

module.exports = router;
