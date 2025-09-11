import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const householdSchema = new Schema({
  name:    { type: String, required: true },
  address: { type: String, required: true },
  rooms:   [String],
  users:   [{ type: Schema.Types.ObjectId, ref: 'User' }],
  owner:   { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true,
  collection: 'household'
});

export default model('Household', householdSchema);
