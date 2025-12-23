import { Schema, model } from 'mongoose';

const channelSchema = new Schema({
  channel: { type: String, enum: ['email','sms','push','webhook'], required: true },
  enabled: { type: Boolean, default: true },

  address: { type: String, trim: true }, 
  secret:  { type: String, trim: true },  

  min_severity: { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  types:        [{ type: String }],       
}, { _id: false });

const notificationPrefSchema = new Schema({
  user_id:   { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  channels:  { type: [channelSchema], default: [] },

  quiet_hours: {
    start: { type: String }, // "HH:MM"
    end:   { type: String }  // "HH:MM"
  }
}, {
  timestamps: true,
  collection: 'notification_prefs'
});

notificationPrefSchema.index({ user_id: 1 });

export default model('NotificationPref', notificationPrefSchema);
