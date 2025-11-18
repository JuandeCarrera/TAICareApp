import { Schema, model } from 'mongoose';

const routineOccurrenceSchema = new Schema({
  routineId:   { type: Schema.Types.ObjectId, ref: 'Routine', required: true },

  caregiver_id:{ type: Schema.Types.ObjectId, ref: 'User', required: true },
  household_id:{ type: Schema.Types.ObjectId, ref: 'Household', required: true },
  device_id:   { type: Schema.Types.ObjectId, ref: 'Device', required: true },

  date:        { type: Date, required: true },  // día lógico
  windowStart: { type: Date, required: true },
  windowEnd:   { type: Date, required: true },

  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'MISSED'],
    default: 'PENDING'
  },

  checkedAt:     { type: Date },
  matchedEvents: { type: Number, default: 0 }
}, {
  timestamps: true,
  collection: 'routineOccurrences'
});

routineOccurrenceSchema.index({ routineId: 1, date: 1 }, { unique: true });

export default model('RoutineOccurrence', routineOccurrenceSchema);
