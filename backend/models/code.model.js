import mongoose from "mongoose";

const CodeSnippetSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    index: true, // Index for fast lookups
  },
  code: {
    type: Object,
    required: true,
    default: {}, // Store Yjs update as { update: base64String }
  },
  language: {
    type: String,
    default: 'javascript',
    required: true,
    enum: ['javascript', 'python', 'java', 'cpp'], // Restrict to supported languages
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
    index: true, // Index for time-based queries
  }
}, {
  timestamps: true,
});

// Compound index for common queries
CodeSnippetSchema.index({ sessionId: 1, lastUpdated: -1 });

const CodeSnippet = mongoose.model('CodeSnippet', CodeSnippetSchema);
export default CodeSnippet;
