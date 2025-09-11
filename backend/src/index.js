import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function main() {
  // 1) Conectar
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✔ Conectado a MongoDB Atlas');

  // 2) Crear un usuario de prueba
  const u = await User.create({
    name: 'Prueba',
    email: 'prueba@taicare.com',
    role: 'paciente',
    household_id: '650a1f000000000000000001' // usa un ObjectId válido
  });
  console.log('Usuario creado:', u);

  // 3) Leer
  const found = await User.findById(u._id);
  console.log('Leído:', found);

  // 4) Actualizar
  found.name = 'Prueba Editado';
  await found.save();
  console.log('Actualizado:', found);

  // 5) Borrar
  await User.deleteOne({ _id: u._id });
  console.log('Eliminado');

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
