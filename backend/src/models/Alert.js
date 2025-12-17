import { Schema, model } from 'mongoose';

const alertSchema = new Schema({
  device_id: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
  user_id:   { type: Schema.Types.ObjectId, ref: 'User',   required: true },


  routine_id: { type: Schema.Types.ObjectId, ref: 'Routine' },

  kind: { 
    type: String,
    enum: ['RoutineMissed','DeviceOffline','Anomaly','Other'],
    default: 'RoutineMissed'
  },

  title: { type: String, trim: true },

  type:  { type: String, required: true },

  patient_name_snapshot: { type: String },
  routine_name_snapshot: { type: String },

  timestamp: { type: Date, required: true },
  resolved:  { type: Boolean, default: false }
}, {
  timestamps: true,
  collection: 'alerts'
});

alertSchema.pre('save', function(next) {
  if (!this.title) {
    const who  = this.patient_name_snapshot || '';
    const what = this.routine_name_snapshot || '';
    const type = this.type || '';
    const parts = [];
    if (who)  parts.push(`Paciente: ${who}`);
    if (what) parts.push(`Rutina: ${what}`);
    if (type) parts.push(type);
    this.title = parts.length ? parts.join(' · ') : 'Alerta';
  }
  next();
});

export default model('Alert', alertSchema);
