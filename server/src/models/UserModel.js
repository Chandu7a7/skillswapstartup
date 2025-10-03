// models/User.js

import mongoose from 'mongoose';

//---------------------------------- A sub-schema for reviews. This will be an array in the User model----------------------------------
const ReviewSchema = new mongoose.Schema({
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reviewerName: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

//------------------------------------User Schema------------------------------------------------------------
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: false,
    trim: true,
  },
  skillsOffered: {
    type: [String],
    default: [],
  },
  skillsWanted: {
    type: [String],
    default: [],
  },
  availability: {
    type: [String],
    enum: ['Weekdays', 'Weekends', 'Mornings', 'Afternoons', 'Evenings'], // Use enum for consistency
    default: [],
  },
  profilePicture: {
    type: String, // URL to the image
    default: '',
  },
  github: {
     type: String, 
     trim: true },
  linkedin: { 
    type: String, 
    trim: true 
  },
  reviews: {
    type: [ReviewSchema], // An array of reviews from other users
    default: [],
  },
  swapsCompleted: {
    type: Number,
    default: 0,
  },
  learningHours: {
    type: Number,
    default: 0,
  },
   points: {
    type: Number,
    default: 0,
  },
  level: {
    type: Number,
    default: 1,
  },
  unlockedAchievements: [{
    achievementId: { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now }
  }],

}, { timestamps: true });

UserSchema.virtual('averageRating').get(function() {
    if (!this.reviews || this.reviews.length === 0) {
    return 0;
  }
  const totalRating = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  return (totalRating / this.reviews.length).toFixed(1); // Return rating with one decimal place
});

// Ensure virtuals are included when converting to JSON
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

export default mongoose.model('User', UserSchema);