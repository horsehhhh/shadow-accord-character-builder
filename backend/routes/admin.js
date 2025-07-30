const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only - for development)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username email createdAt').sort({ createdAt: -1 });
    res.json({
      success: true,
      count: users.length,
      users: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

module.exports = router;
