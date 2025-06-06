import mongoose from "mongoose";
import User from "../models/user.model.js"
const SessionSchema = new mongoose.Schema({
  sessionCode: {
    type: String,
    required: true,
    unique: true, // Ensures session code is unique
    trim: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the Users collection
    required: true
  },
  participants: [{
    type : String,
  },],
  status: {
    type: String,
    enum: ['active', 'ended' , 'upcomming'], // Only 'active' , upcomming ,  'ended' allowed
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date,
    default: null // Null if the session is still active
  }
});

const Session = mongoose.model('Session', SessionSchema);
export default Session;
