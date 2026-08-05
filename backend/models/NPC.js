const mongoose = require('mongoose');

const npcSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name:    { type: String, default: 'Unnamed NPC', trim: true, maxlength: 100 },
  faction: { type: String, default: '' },
  // Full serialised npcData blob — no strict schema so the ST tool can evolve freely
  data: { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true });

module.exports = mongoose.model('NPC', npcSchema);
