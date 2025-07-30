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
      hasAdvancementHistory: !!req.body.advancementHistory,
      advancementHistoryType: typeof req.body.advancementHistory,
      advancementHistoryValue: req.body.advancementHistory ? JSON.stringify(req.body.advancementHistory).substring(0, 200) + '...' : 'undefined',
      totalXP: req.body.totalXP,
      xpSpent: req.body.xpSpent
    });

    // Preprocess data types before updating with robust JSON parsing
    const updateData = { ...req.body };
    
    // Recursive function to parse any stringified JSON in nested data
    function deepParseJSON(obj) {
      if (typeof obj === 'string') {
        try {
          const parsed = JSON.parse(obj);
          return deepParseJSON(parsed); // Recursively parse in case of double-stringification
        } catch (e) {
          return obj; // Return original if not valid JSON
        }
      } else if (Array.isArray(obj)) {
        return obj.map(deepParseJSON);
      } else if (obj && typeof obj === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
          result[key] = deepParseJSON(value);
        }
        return result;
      }
      return obj;
    }
    
    // Handle array fields that might be stringified (including nested)
    const arrayFields = ['advancementHistory', 'xpHistory', 'lores', 'innateTreeIds', 'fundamentalPowers', 'thornOptions', 'selectedPassions', 'claimedInnateTreeIds', 'selfNerfs', 'sharedWith', 'factionChanges'];
    
    arrayFields.forEach(field => {
      if (updateData[field] !== undefined) {
        console.log(`🔍 Processing ${field}:`, typeof updateData[field], Array.isArray(updateData[field]) ? `Array with ${updateData[field].length} items` : 'Not array');
        updateData[field] = deepParseJSON(updateData[field]);
        console.log(`✅ After processing ${field}:`, typeof updateData[field], Array.isArray(updateData[field]) ? `Array with ${updateData[field].length} items` : 'Not array');
      }
    });
    
    // Handle nested object fields that might be stringified
    const objectFields = ['stats', 'skills', 'powers', 'merits'];
    
    objectFields.forEach(field => {
      if (updateData[field] !== undefined) {
        console.log(`🔍 Processing object ${field}:`, typeof updateData[field]);
        updateData[field] = deepParseJSON(updateData[field]);
        console.log(`✅ After processing object ${field}:`, typeof updateData[field]);
      }
    });

    // Apply processed data to character with explicit field assignment
    // Don't use Object.assign for complex fields to avoid reference issues
    for (const [key, value] of Object.entries(updateData)) {
      if (arrayFields.includes(key) || objectFields.includes(key)) {
        // Log state before assignment
        if (key === 'advancementHistory') {
          console.log(`🔍 Before assignment - character.${key}:`, 
            Array.isArray(character[key]) ? `Array[${character[key].length}]` : typeof character[key],
            character[key] && typeof character[key] === 'string' ? character[key].substring(0, 100) + '...' : ''
          );
          console.log(`🔍 Value to assign:`, Array.isArray(value) ? `Array[${value.length}]` : typeof value);
        }
        
        // Force repair corrupted advancementHistory field in database
        if (key === 'advancementHistory') {
          console.log('🧹 Repairing corrupted advancementHistory field in database');
          
          // Ensure the value is a proper array with proper objects
          let cleanedValue = [];
          if (Array.isArray(value)) {
            cleanedValue = value.map(item => {
              if (typeof item === 'string') {
                try {
                  return JSON.parse(item);
                } catch (e) {
                  return item;
                }
              }
              return item;
            });
          } else if (typeof value === 'string') {
            try {
              cleanedValue = JSON.parse(value);
              if (!Array.isArray(cleanedValue)) {
                cleanedValue = [];
              }
            } catch (e) {
              cleanedValue = [];
            }
          }
          
          // Use raw MongoDB driver to bypass Mongoose validation
          try {
            const result = await character.collection.updateOne(
              { _id: character._id },
              { 
                $set: { 
                  advancementHistory: cleanedValue,
                  xpHistory: updateData.xpHistory && Array.isArray(updateData.xpHistory) ? updateData.xpHistory : character.xpHistory || [],
                  lastModified: new Date()
                }
              }
            );
            console.log('✅ Raw MongoDB update successful:', result);
            
            // Update other fields normally but skip advancementHistory and xpHistory
            delete updateData.advancementHistory;
            delete updateData.xpHistory;
            
            // Apply remaining updates
            for (const [remainingKey, remainingValue] of Object.entries(updateData)) {
              if (arrayFields.includes(remainingKey) || objectFields.includes(remainingKey)) {
                character.set(remainingKey, remainingValue);
                character.markModified(remainingKey);
              } else {
                character[remainingKey] = remainingValue;
              }
            }
            
            await character.save();
            console.log('✅ Character update completed successfully after raw MongoDB repair');
            
            res.json({
              success: true,
              message: 'Character updated successfully',
              character: await Character.findById(character._id) // Return fresh data
            });
            return;
          } catch (rawError) {
            console.error('❌ Raw MongoDB update failed:', rawError);
            throw rawError;
          }
        }
        
        // Directly assign complex fields to ensure proper type casting
        character.set(key, value);  // Use .set() instead of direct assignment
        character.markModified(key); // Explicitly mark as modified
        console.log(`📝 Directly assigned ${key}:`, Array.isArray(value) ? `Array[${value.length}]` : typeof value);
        
        // Verify assignment worked
        if (key === 'advancementHistory') {
          console.log(`✅ After assignment - character.${key}:`, 
            Array.isArray(character[key]) ? `Array[${character[key].length}]` : typeof character[key]
          );
        }
      } else {
        // Use normal assignment for simple fields
        character[key] = value;
      }
    }
    
    // Validate critical array fields before saving
    if (character.advancementHistory && !Array.isArray(character.advancementHistory)) {
      console.error('❌ advancementHistory is not an array after processing:', typeof character.advancementHistory);
      // Try one more parsing attempt
      if (typeof character.advancementHistory === 'string') {
        try {
          character.advancementHistory = JSON.parse(character.advancementHistory);
          console.log('🔄 Emergency parse successful for advancementHistory');
        } catch (e) {
          console.error('💥 Emergency parse failed, setting to empty array');
          character.advancementHistory = [];
        }
      }
    }
    
    try {
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
    } catch (saveError) {
      console.error('💥 Character save failed with detailed error:', {
        errorName: saveError.name,
        errorMessage: saveError.message,
        validationErrors: saveError.errors ? Object.keys(saveError.errors) : 'none',
        characterId: character._id,
        characterData: {
          name: character.name,
          advancementHistoryLength: character.advancementHistory?.length,
          advancementHistoryType: Array.isArray(character.advancementHistory) ? 'Array' : typeof character.advancementHistory,
          xpHistoryLength: character.xpHistory?.length,
          xpHistoryType: Array.isArray(character.xpHistory) ? 'Array' : typeof character.xpHistory
        }
      });
      
      // Log specific validation errors
      if (saveError.errors) {
        for (const [field, error] of Object.entries(saveError.errors)) {
          console.error(`❌ Validation error for ${field}:`, error.message);
        }
      }
      
      throw saveError; // Re-throw to trigger the main error handler
    }

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
