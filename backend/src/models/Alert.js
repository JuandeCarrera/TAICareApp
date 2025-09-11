import { Schema, model } from 'mongoose';

const alertSchema = new Schema({
  device_id: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
  user_id:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, required: true },
  type:      { type: String, required: true },
  resolved:  { type: Boolean, default: false }
}, {
  timestamps: true,
  collection: 'alerts'
});

export default model('Alert', alertSchema);
