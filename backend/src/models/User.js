import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

import { ROLES, DEFAULT_ALERT_PREFERENCES } from '../constants/index.js';

const {
  Schema,
  Types: { ObjectId },
} = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: Object.values(ROLES), required: true },
    password: { type: String, required: true },
    caregiver_id: { type: ObjectId, ref: 'User', index: true },
    household_id: { type: ObjectId, ref: 'Household' },
    history: { type: String },
    vacation_mode: { type: Boolean, default: false },
    // Alert preferences per type: { ROUTINE_MISSED: { enabled: true, severity: 'high' }, ... }
    alert_preferences: {
      type: Map,
      of: new mongoose.Schema(
        {
          enabled: { type: Boolean, default: true },
          severity: { type: String, default: 'medium' },
        },
        { _id: false }
      ),
      default: () => new Map(Object.entries(DEFAULT_ALERT_PREFERENCES)),
    },
    // False = user hasn't completed the onboarding alert setup yet
    alert_preferences_configured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

//hash contraseña
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// comprobar contraseña
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.index({ role: 1, caregiver_id: 1 });

export default mongoose.model('User', userSchema);
