import { Schema, model } from 'mongoose';

const deviceSchema = new Schema(
  {
    plugmodel: { type: String, default: 'P110' },
    user: { type: String, required: true },
    room: { type: String, required: true },
    appliance: { type: String, required: true },
    household_id: {
      type: Schema.Types.ObjectId,
      ref: 'Household',
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'devices',
  }
);

export default model('Device', deviceSchema);
