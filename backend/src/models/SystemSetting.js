import { Schema, model } from 'mongoose';

const systemSettingSchema = new Schema({
  key:   { type: String, required: true },
  value: { type: Schema.Types.Mixed },
  note:  { type: String, trim: true }
}, {
  timestamps: true,
  collection: 'system_settings'
});

systemSettingSchema.index({ key: 1 }, { unique: true }); 

export default model('SystemSetting', systemSettingSchema);