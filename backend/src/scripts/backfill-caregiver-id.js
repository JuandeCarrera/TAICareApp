/**
 * Script de backfill: añade caregiver_id a alertas que no lo tienen.
 * Ejecutar UNA SOLA VEZ:
 *   node src/scripts/backfill-caregiver-id.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import Alert from '../models/Alert.js';
import User from '../models/User.js';

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('✔ Conectado a MongoDB');

  // Buscar alertas sin caregiver_id
  const alerts = await Alert.find({ caregiver_id: { $exists: false } })
    .select('_id user_id')
    .lean();

  console.log(`ℹ Alertas sin caregiver_id: ${alerts.length}`);
  if (!alerts.length) {
    console.log('✅ Nada que migrar.');
    await mongoose.disconnect();
    return;
  }

  // Agrupar por user_id para minimizar consultas
  const userIds = [...new Set(alerts.map((a) => String(a.user_id)))];
  const patients = await User.find({ _id: { $in: userIds } })
    .select('_id caregiver_id')
    .lean();

  const caregiverMap = Object.fromEntries(
    patients.map((p) => [String(p._id), p.caregiver_id])
  );

  let updated = 0;
  let skipped = 0;

  for (const alert of alerts) {
    const cid = caregiverMap[String(alert.user_id)];
    if (!cid) {
      skipped++;
      continue;
    }
    await Alert.updateOne({ _id: alert._id }, { $set: { caregiver_id: cid } });
    updated++;
  }

  console.log(
    `✅ Actualizadas: ${updated} | Sin cuidador asignado (skip): ${skipped}`
  );
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
