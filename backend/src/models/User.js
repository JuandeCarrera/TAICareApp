import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const { Schema, Types: { ObjectId } } = mongoose;

const userSchema = new Schema({
  name:    { type: String, required: true },
  email:   { type: String, required: true, unique: true },
  role:    { type: String, enum: ['paciente','cuidador','admin'], required: true },
  password: { type: String, required: true },
  caregiver_id: { type: ObjectId, ref: 'User', index: true },
  household_id: { type: ObjectId, ref: 'Household' },
  history: { type: String }
}, { timestamps: true });

//hash contraseña
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// comprobar contraseña
userSchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.index({ role: 1, caregiver_id: 1 });

export default mongoose.model('User', userSchema);
