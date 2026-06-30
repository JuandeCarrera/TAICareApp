/**
 * Script de backfill: establece vacation_mode = false en todos los usuarios
 * que no tienen el campo definido en la base de datos.
 *
 * Ejecutar UNA SOLA VEZ:
 *   node src/scripts/backfill-vacation-mode.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('✔ Conectado a MongoDB');

  // Contar usuarios sin el campo vacation_mode
  const count = await User.countDocuments({ vacation_mode: { $exists: false } });
  console.log(`ℹ Usuarios sin vacation_mode: ${count}`);

  if (!count) {
    console.log('✅ Nada que migrar. Todos los usuarios ya tienen vacation_mode.');
    await mongoose.disconnect();
    return;
  }

  // Actualizar en bloque: añadir vacation_mode: false a los que no lo tienen
  const result = await User.updateMany(
    { vacation_mode: { $exists: false } },
    { $set: { vacation_mode: false } }
  );

  console.log(`✅ Actualizados: ${result.modifiedCount} usuarios`);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
