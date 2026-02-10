import { Schema, model } from 'mongoose';

const presetSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    }, // quién crea/ve la plantilla
    name: { type: String, required: true, trim: true },
    expected_start: { type: String, required: true }, // "HH:MM"
    expected_end: { type: String, required: true }, // "HH:MM"
    days: {
      type: [
        {
          type: String,
          enum: [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday',
          ],
        },
      ],
      required: true,
    },
    // opcional
    description: { type: String, trim: true },
  },
  { timestamps: true, collection: 'routine_presets' }
);

export default model('RoutinePreset', presetSchema);
