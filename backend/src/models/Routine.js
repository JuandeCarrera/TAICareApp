import { Schema, model } from 'mongoose';
import { ROUTINE_MODE, DAYS_ARRAY } from '../constants/index.js';

/**
 * Una Rutina puede tener N ocurrencias (franjas) y cada ocurrencia N dispositivos.
 * - mode (grupo/ocurrencia): 'any' => basta un dispositivo, 'all' => deben activarse todos.
 * - power_threshold_w/min_minutes_active: permiten ajustar reglas por grupo u ocurrencia.
 *
 * Compatibilidad:
 *  - Los campos legacy (device_id/expected_start/expected_end/days) ya NO son obligatorios,
 *    pero si vienen y no hay occurrences, se crearán como una occurrence automáticamente.
 */

const occurrenceSchema = new Schema(
  {
    name: { type: String, trim: true, default: '' },

    device_ids: [
      { type: Schema.Types.ObjectId, ref: 'Device', required: true },
    ],

    days: {
      type: [
        {
          type: String,
          enum: DAYS_ARRAY,
        },
      ],
      required: true,
    },

    start: { type: String, required: true }, // "HH:MM"
    end: { type: String, required: true }, // "HH:MM" (si end<=start => cruza medianoche)

    // Overrides opcionales (si no se setean, heredan del grupo)
    mode: { type: String, enum: Object.values(ROUTINE_MODE) },
    power_threshold_w: { type: Number },
    min_minutes_active: { type: Number, default: 0 },
  },
  { _id: true }
);

const routineSchema = new Schema(
  {
    name: { type: String, trim: true, default: '' },

    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    caregiver_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    household_id: {
      type: Schema.Types.ObjectId,
      ref: 'Household',
      required: true,
    },

    // Reglas por defecto a nivel de rutina (pueden ser sobreescritas por cada occurrence)
    mode: {
      type: String,
      enum: Object.values(ROUTINE_MODE),
      default: ROUTINE_MODE.ANY,
    },
    power_threshold_w: { type: Number, default: 5 },
    timezone: { type: String }, // opcional, ej. "Europe/Madrid"
    enabled: { type: Boolean, default: true },

    //ocurrencias/franjas dentro de la misma rutina
    occurrences: { type: [occurrenceSchema], default: [] },

    // ---- CAMPOS LEGACY (compat). Dejarán de usarse, pero no rompen lo existente ----
    device_id: { type: Schema.Types.ObjectId, ref: 'Device' }, // ya NO required
    expected_start: { type: String }, // "HH:MM"
    expected_end: { type: String }, // "HH:MM"
    days: {
      type: [
        {
          type: String,
          enum: DAYS_ARRAY,
        },
      ],
    },
  },
  {
    timestamps: true,
    collection: 'routines',
  }
);

/**
 * Compat: si no hay occurrences pero sí hay los campos legacy, se autogenera
 * una occurrence equivalente (1 dispositivo, una franja, X días).
 */
routineSchema.pre('save', function (next) {
  try {
    if (
      Array.isArray(this.occurrences) &&
      this.occurrences.length === 0 &&
      this.device_id &&
      this.expected_start &&
      this.expected_end &&
      Array.isArray(this.days) &&
      this.days.length > 0
    ) {
      this.occurrences = [
        {
          name: '',
          device_ids: [this.device_id],
          days: this.days,
          start: this.expected_start,
          end: this.expected_end,
        },
      ];
    }
    return next();
  } catch (e) {
    return next(e);
  }
});

// Índices útiles
routineSchema.index({ user_id: 1, enabled: 1, updatedAt: -1 });
routineSchema.index({ 'occurrences.days': 1 });
routineSchema.index({ 'occurrences.device_ids': 1 });

export default model('Routine', routineSchema);
