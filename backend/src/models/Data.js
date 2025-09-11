import { Schema, model } from 'mongoose';

const dataSchema = new Schema({
  time:      { type: Date, required: true },
  device_id: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
  status:    { type: Boolean, required: true },
  power:     { type: Number, required: true },
  synthetic: { type: Boolean, required: true }
}, {
  timestamps: false,
  collection: 'data'
});

// TTL de 30 días
dataSchema.index(
  { time: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30, name: 'data_ttl_30d' }
);

export default model('Data', dataSchema);
