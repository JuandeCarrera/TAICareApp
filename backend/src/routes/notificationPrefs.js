import { Router } from 'express';
import NotificationPref from '../models/NotificationPref.js';

const router = Router();

// GET /notification-prefs/me
router.get('/me', async (req, res) => {
  try {
    const userId = req.user.sub;
    const pref = await NotificationPref.findOne({ user_id: userId }).lean();
    
    // Si no existe, devolvemos un objeto por defecto
    if (!pref) {
      return res.json({
        channels: { email: true, push: false },
        min_severity: 'medium',
      });
    }

    // Mapeamos el array del schema al formato que espera el frontend
    const channelsObj = { email: false, push: false };
    if (Array.isArray(pref.channels)) {
      pref.channels.forEach(ch => {
        if (ch.channel === 'email') channelsObj.email = ch.enabled;
        if (ch.channel === 'push') channelsObj.push = ch.enabled;
      });
    }

    res.json({
      channels: channelsObj,
      min_severity: pref.channels.find(ch => ch.channel === 'email')?.min_severity || 'medium',
    });
  } catch (e) {
    res.status(500).json({ error: 'Error al recuperar preferencias' });
  }
});

// PUT /notification-prefs/me
router.put('/me', async (req, res) => {
  try {
    const userId = req.user.sub;
    const { channels, min_severity } = req.body || {};

    const channelsArray = [];
    if (channels) {
      if (typeof channels.email === 'boolean') {
        channelsArray.push({ channel: 'email', enabled: channels.email, min_severity: min_severity || 'medium' });
      }
      if (typeof channels.push === 'boolean') {
        channelsArray.push({ channel: 'push', enabled: channels.push, min_severity: min_severity || 'medium' });
      }
    }

    const doc = await NotificationPref.findOneAndUpdate(
      { user_id: userId },
      {
        $set: {
          channels: channelsArray,
        }
      },
      { upsert: true, new: true, runValidators: true }
    );

    // Mapeamos de vuelta al formato del frontend
    const channelsObj = { email: false, push: false };
    let severityVal = 'medium';
    if (Array.isArray(doc.channels)) {
      doc.channels.forEach(ch => {
        if (ch.channel === 'email') {
          channelsObj.email = ch.enabled;
          severityVal = ch.min_severity || severityVal;
        }
        if (ch.channel === 'push') channelsObj.push = ch.enabled;
      });
    }

    res.json({
      channels: channelsObj,
      min_severity: severityVal,
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
