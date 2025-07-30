const express = require('express');
const { body, validationResult, param, query } = require('express-validator');
const mongoose = require('mongoose');
const Character = require('../models/Character');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/characters
// @desc    Get user's characters
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50, faction, search, sort = '-lastModified' } = req.query;
    
    console.log('🔍 GET Characters request:', {
      userId: req.user.id,
      userEmail: req.user.email,
      hasUser: !!req.user,
      userObjectId: req.user._id,
      userIdVsObjectId: req.user.id === req.user._id.toString(),
      userIdType: typeof req.user.id,
      userObjectIdType: typeof req.user._id,
      userIdString: req.user.id.toString(),
      queryParams: { page, limit, faction, search, sort },
      timestamp: new Date().toISOString()
    });
    
    // Try both ObjectId and string comparison with $expr to force evaluation
    const userObjectId = new mongoose.Types.ObjectId(req.user.id);
    const query = {
      $or: [
        { userId: userObjectId },
        { userId: req.user.id },
        { $expr: { $eq: [{ $toString: "$userId" }, req.user.id] } }
      ]
    };
    
    console.log('🔍 Using comprehensive query with ObjectId, string, and $expr comparison');
    
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
    
    console.log('🔍 MongoDB query (converting string to ObjectId to match database storage):', {
      originalUserId: req.user.id,
      userIdType: typeof req.user.id,
      queryUserId: query.userId,
      queryUserIdType: typeof query.userId,
      queryUserIdConstructor: query.userId.constructor.name,
      queryUserIdString: query.userId.toString(),
      query: query
    });
    
    // Test the query directly to see what's happening
    console.log('🧪 Testing ObjectId query directly...');
    const testQuery = { userId: new mongoose.Types.ObjectId(req.user.id) };
    const testCount = await Character.countDocuments(testQuery);
    console.log('🧪 Direct ObjectId query test result:', {
      testQuery: testQuery,
      testCount: testCount,
      queryWorks: testCount > 0
    });
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort
    };
    
    const characters = await Character.find(query)
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit);
    
    console.log('🔍 Character.find() raw result:', {
      queryUsed: query,
      charactersFound: characters.length,
      firstCharacterSample: characters[0] ? {
        id: characters[0]._id,
        name: characters[0].name,
        userId: characters[0].userId,
        userIdType: typeof characters[0].userId
      } : 'No characters found'
    });

    const total = await Character.countDocuments(query);
    
    console.log('🔍 Character.countDocuments() result:', {
      queryUsed: query,
      totalCount: total
    });    // Debug: Check which users own characters in the database
    const allCharacterUsers = await Character.aggregate([
      { $group: { _id: "$userId", count: { $sum: 1 }, names: { $push: "$name" } } },
      { $limit: 10 }
    ]);
    
    // Enhanced debugging: Get actual character documents to see userId format
    const sampleCharacters = await Character.find({}).limit(3).select('name userId');
    console.log('🔍 Sample character userIds from database:', sampleCharacters.map(c => ({
      name: c.name,
      userId: c.userId,
      userIdType: typeof c.userId,
      userIdConstructor: c.userId?.constructor?.name,
      userIdString: c.userId?.toString(),
      isObjectId: c.userId instanceof mongoose.Types.ObjectId,
      matchesCurrentUser: c.userId?.toString() === req.user.id
    })));
    
    console.log('🔍 GET Characters result:', {
      currentUserAuthenticated: req.user._id.toString(),
      searchingForUserId: req.user.id,
      foundCharacters: characters.length,
      totalCount: total,
      characterNames: characters.map(c => c.name),
      allCharacterOwners: allCharacterUsers.map(u => ({
        userId: u._id.toString(),
        characterCount: u.count,
        characterNames: u.names
      }))
    });
    
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
      userId: new mongoose.Types.ObjectId(req.user.id)  // Store as ObjectId to match database storage format
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
    console.log('✅ Character created successfully:', {
      id: character._id,
      name: character.name,
      userId: character.userId
    });

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

    // Use raw MongoDB driver for ALL character updates to avoid Mongoose validation issues
    console.log('🔄 Using raw MongoDB update for all character changes to prevent data corruption');
    
    try {
      // Prepare all update fields for raw MongoDB update
      const mongoUpdateFields = {
        lastModified: new Date()
      };
      
      // Clean advancementHistory if it exists
      if (updateData.advancementHistory !== undefined) {
        console.log('🧹 Processing advancementHistory field');
        let cleanedValue = [];
        if (Array.isArray(updateData.advancementHistory)) {
          cleanedValue = updateData.advancementHistory.map(item => {
            if (typeof item === 'string') {
              try {
                return JSON.parse(item);
              } catch (e) {
                return item;
              }
            }
            return item;
          });
        } else if (typeof updateData.advancementHistory === 'string') {
          try {
            cleanedValue = JSON.parse(updateData.advancementHistory);
            if (!Array.isArray(cleanedValue)) {
              cleanedValue = [];
            }
          } catch (e) {
            cleanedValue = [];
          }
        }
        mongoUpdateFields.advancementHistory = cleanedValue;
      }
      
      // Handle xpHistory
      if (updateData.xpHistory !== undefined) {
        mongoUpdateFields.xpHistory = Array.isArray(updateData.xpHistory) ? updateData.xpHistory : character.xpHistory || [];
      }
      
      // Add all other update fields to the raw MongoDB update
      for (const [key, value] of Object.entries(updateData)) {
        if (key !== 'advancementHistory' && 
            key !== 'xpHistory' && 
            key !== '__v' && 
            key !== '_id' &&
            key !== 'lastModified') {
          mongoUpdateFields[key] = value;
        }
      }
      
      console.log('📤 Raw MongoDB update fields:', {
        fieldCount: Object.keys(mongoUpdateFields).length,
        hasStats: !!mongoUpdateFields.stats,
        hasSkills: !!mongoUpdateFields.skills,
        hasPowers: !!mongoUpdateFields.powers,
        hasMerits: !!mongoUpdateFields.merits,
        hasLores: !!mongoUpdateFields.lores,
        hasAdvancementHistory: !!mongoUpdateFields.advancementHistory,
        hasXpHistory: !!mongoUpdateFields.xpHistory
      });
      
      const result = await character.collection.updateOne(
        { _id: character._id },
        { 
          $set: mongoUpdateFields,
          $inc: { __v: 1 } // Increment version to avoid conflicts
        }
      );
      console.log('✅ Raw MongoDB update successful:', result);
      
      // Return fresh data from database instead of using stale Mongoose document
      const updatedCharacter = await Character.findById(character._id);
      console.log('✅ Character update completed successfully with raw MongoDB update');
      
      res.json({
        success: true,
        message: 'Character updated successfully',
        character: updatedCharacter
      });
      return;
    } catch (rawError) {
      console.error('❌ Raw MongoDB update failed:', rawError);
      throw rawError;
    }
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
    cloneData.userId = new mongoose.Types.ObjectId(req.user.id);  // Store as ObjectId to match database storage format
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
