const mongoose = require('mongoose');

const characterSchema = new mongoose.Schema({
  // Owner information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Character basic info (matching your current structure)
  name: {
    type: String,
    default: '',
    trim: true,
    maxlength: [50, 'Character name cannot exceed 50 characters']
  },
  player: {
    type: String,
    default: '',
    trim: true,
    maxlength: [50, 'Player name cannot exceed 50 characters']
  },
  
  // Faction and subfaction
  faction: {
    type: String,
    default: '',
    enum: ['human', 'vampire', 'shifter', 'wraith', '']
  },
  subfaction: {
    type: String,
    default: ''
  },
  
  // Character stats (exact match to your structure)
  stats: {
    health: { type: Number, default: 10, min: 1, max: 50 },
    maxHealth: { type: Number, default: 10, min: 1, max: 50 },
    willpower: { type: Number, default: 1, min: 1, max: 10 },
    energy: { type: Number, default: 10, min: 1, max: 50 },
    maxEnergy: { type: Number, default: 10, min: 1, max: 50 },
    virtue: { type: Number, default: 7, min: 1, max: 10 },
    virtueType: { type: String, default: 'Humanity' },
    energyType: { type: String, default: 'Vitality' }
  },
  
  // Character abilities
  skills: {
    type: Object,
    default: {}
  },
  
  powers: {
    type: Object,
    default: {}
  },
  
  merits: {
    type: Object,
    default: {}
  },
  
  lores: [{
    lore_id: String,
    name: String,
    category: String,
    cost_type: String
  }],
  
  // Character progression
  totalXP: { type: Number, default: 27, min: 0 },
  xpSpent: { type: Number, default: 0, min: 0 },
  checkInCount: { type: Number, default: 0, min: 0 },
  
  xpHistory: {
    type: mongoose.Schema.Types.Mixed, // Allow any type to handle corrupted data
    default: [],
    validate: {
      validator: function(value) {
        // Always return true to allow corrupted data to be saved for repair
        return true;
      }
    }
  },
  
  advancementHistory: {
    type: mongoose.Schema.Types.Mixed, // Allow any type to handle corrupted data
    default: [],
    validate: {
      validator: function(value) {
        // Always return true to allow corrupted data to be saved for repair
        return true;
      }
    }
  },
  
  // Special character features
  innateTreeIds: [String],
  fundamentalPowers: [String],
  shadowArchetype: String,
  thornOptions: [String],
  selectedPassions: [String],
  
  // Faction-specific data
  generation: Number,
  amaranthCount: { type: Number, default: 0 },
  rank: String,
  breed: String,
  auspice: String,
  legion: String,
  guild: String,
  
  // Claimed status system
  claimedStatus: String,
  selectedFomoriTree: String,
  claimedInnateTreeIds: [String],
  
  // Self-imposed limitations
  selfNerfs: [{
    type: String,
    category: String,
    description: String,
    source: String
  }],
  
  // Character notes
  notes: { type: String, maxlength: [5000, 'Notes cannot exceed 5000 characters'] },
  
  // Sharing and visibility
  isPublic: { type: Boolean, default: false },
  sharedWith: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    permission: { type: String, enum: ['view', 'edit'], default: 'view' },
    sharedAt: { type: Date, default: Date.now }
  }],
  
  // Campaign association
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    default: null
  },
  
  // Faction change tracking
  factionChanges: [{
    fromFaction: String,
    toFaction: String,
    timestamp: { type: Date, default: Date.now },
    reason: String
  }],
  
  // Version and metadata
  version: { type: String, default: '0.2.3' },
  lastModified: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for performance
characterSchema.index({ userId: 1, name: 1 });
characterSchema.index({ userId: 1, faction: 1 });
characterSchema.index({ campaignId: 1 });
characterSchema.index({ isPublic: 1 });
characterSchema.index({ 'sharedWith.userId': 1 });

// Middleware to update lastModified
characterSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

// Virtual for character summary
characterSchema.virtual('summary').get(function() {
  return {
    id: this._id,
    name: this.name,
    player: this.player,
    faction: this.faction,
    subfaction: this.subfaction,
    totalXP: this.totalXP,
    checkInCount: this.checkInCount,
    lastModified: this.lastModified
  };
});

// Method to check if user can access character
characterSchema.methods.canAccess = function(userId, permission = 'view') {
  // Owner has full access
  if (this.userId.toString() === userId.toString()) {
    return true;
  }
  
  // Public characters can be viewed
  if (this.isPublic && permission === 'view') {
    return true;
  }
  
  // Check shared permissions
  const sharedEntry = this.sharedWith.find(
    share => share.userId.toString() === userId.toString()
  );
  
  if (!sharedEntry) return false;
  
  if (permission === 'view') return true;
  if (permission === 'edit') return sharedEntry.permission === 'edit';
  
  return false;
};

// Method to add XP
characterSchema.methods.addXP = function(amount, reason) {
  const xpEntry = {
    timestamp: new Date(),
    type: 'gain',
    amount: amount,
    reason: reason,
    previousTotal: this.totalXP,
    newTotal: this.totalXP + amount
  };
  
  this.totalXP += amount;
  this.xpHistory.push(xpEntry);
  
  return this.save();
};

// Indexes for better query performance
characterSchema.index({ userId: 1, lastModified: -1 }); // Compound index for user queries with sorting
characterSchema.index({ userId: 1, created: -1 }); // For creation date sorting 
characterSchema.index({ userId: 1, name: 1 }); // For name-based searches within user's characters
characterSchema.index({ 'sharedWith.userId': 1 }); // For shared character queries

module.exports = mongoose.model('Character', characterSchema);
