import { Schema, model } from 'mongoose';

const conditionSchema = new Schema(
  {
    // tipo de condición: potencia, inactividad, rutina, etc.
    kind: {
      type: String,
      required: true,
      enum: ['routine_missed', 'power_threshold', 'no_data', 'custom'],
    },

    params: { type: Schema.Types.Mixed },

    user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    caregiver_id: { type: Schema.Types.ObjectId, ref: 'User' },
    household_id: { type: Schema.Types.ObjectId, ref: 'Household' },
    device_id: { type: Schema.Types.ObjectId, ref: 'Device' },

    active_days: [
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
    time_start: { type: String }, // "HH:MM"
    time_end: { type: String }, // "HH:MM"

    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    title_tpl: { type: String, trim: true },
    msg_tpl: { type: String, trim: true },

    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const alertRuleSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    scope: {
      type: String,
      enum: ['global', 'caregiver', 'user', 'household', 'device'],
      default: 'global',
    },
    condition: { type: conditionSchema, required: true },

    dedupe_strategy: {
      type: String,
      enum: ['per_day', 'per_hour', 'none'],
      default: 'per_day',
    },
  },
  {
    timestamps: true,
    collection: 'alert_rules',
  }
);

alertRuleSchema.index({ 'condition.kind': 1, enabled: 1 });
alertRuleSchema.index({
  scope: 1,
  'condition.user_id': 1,
  'condition.household_id': 1,
  'condition.device_id': 1,
});

export default model('AlertRule', alertRuleSchema);
