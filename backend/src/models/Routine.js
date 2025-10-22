import { Schema, model } from 'mongoose';

const routineSchema = new Schema({
  name:           { type: String, trim: true, default: '' },
  user_id:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
  device_id:      { type: Schema.Types.ObjectId, ref: 'Device', required: true },
  expected_start: { type: String, required: true },  // "HH:MM"
  expected_end:   { type: String, required: true },  // "HH:MM"
  days: {
    type: [{
      type: String,
      enum: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
    }],
    required: true
  }
}, {
  timestamps: true,
  collection: 'routines'
});

export default model('Routine', routineSchema);
