const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Campaign name is required'],
    trim: true,
    maxlength: [100, 'Campaign name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Campaign owner (GM)
  gamemaster: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Campaign settings
  settings: {
    isPublic: { type: Boolean, default: false },
    allowPlayerRegistration: { type: Boolean, default: true },
    maxPlayers: { type: Number, default: 8, min: 1, max: 20 },
    startingXP: { type: Number, default: 27, min: 0 },
    xpPerSession: { type: Number, default: 3, min: 0 },
    rulesVariants: [String]
  },
  
  // Player management
  players: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'pending' },
    notes: String
  }],
  
  // Session tracking
  sessions: [{
    sessionNumber: { type: Number, required: true },
    date: { type: Date, required: true },
    title: String,
    description: String,
    xpAwarded: { type: Number, default: 3 },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    notes: String
  }],
  
  // Campaign status
  status: {
    type: String,
    enum: ['planning', 'active', 'on-hold', 'completed', 'cancelled'],
    default: 'planning'
  },
  
  // Scheduling
  schedule: {
    frequency: { type: String, enum: ['weekly', 'biweekly', 'monthly', 'irregular'], default: 'weekly' },
    dayOfWeek: { type: Number, min: 0, max: 6 }, // 0 = Sunday
    timeOfDay: String, // e.g., "19:00"
    timezone: String
  }
}, {
  timestamps: true
});

// Indexes
campaignSchema.index({ gamemaster: 1 });
campaignSchema.index({ 'players.userId': 1 });
campaignSchema.index({ status: 1 });
campaignSchema.index({ 'settings.isPublic': 1 });

// Virtual for active players count
campaignSchema.virtual('activePlayersCount').get(function() {
  return this.players.filter(player => player.status === 'active').length;
});

// Method to check if user is GM
campaignSchema.methods.isGamemaster = function(userId) {
  return this.gamemaster.toString() === userId.toString();
};

// Method to check if user is player
campaignSchema.methods.isPlayer = function(userId) {
  return this.players.some(player => 
    player.userId.toString() === userId.toString() && 
    player.status === 'active'
  );
};

// Method to add player
campaignSchema.methods.addPlayer = function(userId, status = 'pending') {
  const existingPlayer = this.players.find(
    player => player.userId.toString() === userId.toString()
  );
  
  if (existingPlayer) {
    existingPlayer.status = status;
  } else {
    this.players.push({ userId, status });
  }
  
  return this.save();
};

// Method to add session
campaignSchema.methods.addSession = function(sessionData) {
  const sessionNumber = this.sessions.length + 1;
  const session = {
    sessionNumber,
    ...sessionData
  };
  
  this.sessions.push(session);
  return this.save();
};

module.exports = mongoose.model('Campaign', campaignSchema);
