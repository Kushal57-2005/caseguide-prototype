/**
 * @file User.js
 * @description Mongoose User model representing registered Indian citizens/users of caseGuide.
 * @inputs User registration data (name, email, passwordHash).
 * @outputs Mongoose User model instance.
 */

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

// Indexes (email uniqueness is already indexed by field definition)
userSchema.index({ createdAt: -1 });

export const User = mongoose.model('User', userSchema);
