import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema({
  sessionCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true, // Index for fast lookups
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // Index for host queries
  },
  participants: [{
    type: String,
  }],
  status: {
    type: String,
    enum: ['active', 'ended', 'upcoming'],
    default: 'active',
    index: true, // Index for filtering by status
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true, // Index for time-based queries
  },
  endedAt: {
    type: Date,
    default: null,
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
});

// Compound index for common queries
SessionSchema.index({ sessionCode: 1, status: 1 });
SessionSchema.index({ host: 1, status: 1 });

const Session = mongoose.model('Session', SessionSchema);
export default Session;
