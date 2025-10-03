// server/src/models/Conversation.js
import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  lastMessage: {
    type: String,
    default: "",
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
  unreadCounts: {
    type: Map,
    of: Number,
    default: {},
  },
}, { timestamps: true });

export default mongoose.model('Conversation', conversationSchema);