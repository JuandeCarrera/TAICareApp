import { Schema, model } from 'mongoose';

const alertSchema = new Schema({
  device_id:   { type: Schema.Types.ObjectId, ref: 'Device', required: true },
  user_id:     { type: Schema.Types.ObjectId, ref: 'User',   required: true },
  timestamp:   { type: Date, required: true },
  type:        { type: String, required: true },
  resolved:    { type: Boolean, default: false },

  seen:        { type: Boolean, default: false }, 
  day_key:     { type: String, index: true },        
  window_key:  { type: String },                    

  caregiver_id:{ type: Schema.Types.ObjectId, ref: 'User' },
  household_id:{ type: Schema.Types.ObjectId, ref: 'Household' },
  routine_id:  { type: Schema.Types.ObjectId, ref: 'Routine' },

  title:       { type: String, trim: true },
  message:     { type: String, trim: true },

  severity:    { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  status:      { type: String, enum: ['open','ack','resolved','suppressed'], default: 'open' },

  dedupe_key:  { type: String, index: true },
  first_seen:  { type: Date },
  last_seen:   { type: Date },
  count:       { type: Number, default: 1 },

  metadata:    { type: Schema.Types.Mixed },
}, {
  timestamps: true,
  collection: 'alerts'
});

// Índices útiles para la deduplicación diaria
alertSchema.index({ type: 1, user_id: 1, routine_id: 1, day_key: 1 });
alertSchema.index({ type: 1, user_id: 1, device_id: 1, day_key: 1, resolved: 1 });
alertSchema.index({ user_id: 1, resolved: 1, timestamp: 1 });
alertSchema.index({ type: 1, timestamp: -1 });
alertSchema.index({ status: 1, severity: 1, timestamp: -1 });
alertSchema.index({ routine_id: 1, timestamp: -1 });

export default model('Alert', alertSchema);
