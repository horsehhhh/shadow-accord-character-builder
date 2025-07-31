const express = require('express');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only - for development)
router.get('/users', auth, requireRole('admin'), async (req, res) => {
  try {
    // Only return usernames and creation dates - NO EMAILS for privacy
    const users = await User.find({}, 'username createdAt isActive role').sort({ createdAt: -1 });
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
