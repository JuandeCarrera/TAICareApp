import { Schema, model } from 'mongoose';

const perDeviceSchema = new Schema({
  device_id:     { type: Schema.Types.ObjectId, ref: 'Device', required: true },
  matchedEvents: { type: Number, default: 0 },
  minutesActive: { type: Number, default: 0 },
}, { _id: false });

const routineOccurrenceSchema = new Schema({
  // Relación con la rutina y la occurrence (subdocumento) concreta
  routine_id:     { type: Schema.Types.ObjectId, ref: 'Routine', required: true },
  occurrence_id:  { type: Schema.Types.ObjectId, required: true }, // _id del subdoc en Routine.occurrences

  // Contexto
  user_id:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
  caregiver_id:   { type: Schema.Types.ObjectId, ref: 'User' },
  household_id:   { type: Schema.Types.ObjectId, ref: 'Household' },

  // Dispositivos implicados (una occurrence puede tener varios)
  device_ids:     [{ type: Schema.Types.ObjectId, ref: 'Device', required: true }],

  // Día lógico + ventana
  date:           { type: Date, required: true },     // día lógico (00:00 local)
  windowStart:    { type: Date, required: true },
  windowEnd:      { type: Date, required: true },

  // Resultado de evaluación
  status:         { type: String, enum: ['PENDING','COMPLETED','MISSED'], default: 'PENDING' },
  checkedAt:      { type: Date },

  // Métricas
  summary:        { type: [perDeviceSchema], default: [] }, // por dispositivo
  matchedEvents:  { type: Number, default: 0 },             // total
}, {
  timestamps: true,
  collection: 'routineOccurrences'
});

/**
 * Índice único: 1 fila por (rutina + occurrence + día)
 * (sustituye al antiguo { routineId:1, date:1 })
 */
routineOccurrenceSchema.index({ routine_id: 1, occurrence_id: 1, date: 1 }, { unique: true });

// Búsquedas útiles
routineOccurrenceSchema.index({ user_id: 1, date: -1 });
routineOccurrenceSchema.index({ status: 1, date: -1 });

export default model('RoutineOccurrence', routineOccurrenceSchema);
