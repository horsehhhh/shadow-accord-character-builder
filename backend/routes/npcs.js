const express = require('express');
const mongoose = require('mongoose');
const { param } = require('express-validator');
const NPC = require('../models/NPC');
const { auth } = require('../middleware/auth');

const router = express.Router();

const userQuery = (userId) => {
  const oid = new mongoose.Types.ObjectId(userId);
  return {
    $or: [
      { userId: oid },
      { userId: userId },
      { $expr: { $eq: [{ $toString: '$userId' }, userId] } },
    ],
  };
};

// GET /api/npcs — list saved NPCs for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const npcs = await NPC.find(userQuery(req.user.id))
      .select('_id name faction createdAt updatedAt data')
      .sort('-updatedAt')
      .lean();
    res.json({ success: true, npcs });
  } catch (err) {
    console.error('❌ GET /api/npcs error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/npcs — save a new NPC to the bank
router.post('/', auth, async (req, res) => {
  try {
    const { name, faction, data } = req.body;
    if (!data) return res.status(400).json({ success: false, message: 'NPC data required' });
    const npc = await NPC.create({
      userId: req.user.id,
      name: (name || 'Unnamed NPC').slice(0, 100),
      faction: faction || '',
      data,
    });
    res.status(201).json({ success: true, npc });
  } catch (err) {
    console.error('❌ POST /api/npcs error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/npcs/:id — remove a saved NPC
router.delete('/:id',
  auth,
  param('id').isMongoId().withMessage('Invalid NPC id'),
  async (req, res) => {
    try {
      const npc = await NPC.findOneAndDelete({
        _id: req.params.id,
        ...userQuery(req.user.id),
      });
      if (!npc) return res.status(404).json({ success: false, message: 'NPC not found' });
      res.json({ success: true });
    } catch (err) {
      console.error('❌ DELETE /api/npcs error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

module.exports = router;
