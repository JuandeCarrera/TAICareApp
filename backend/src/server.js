import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import { authRequired } from './middleware/auth.js';

// Routers
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import householdsRouter from './routes/households.js';
import devicesRouter from './routes/devices.js';
import dataRouter from './routes/data.js';
import routinesRouter from './routes/routines.js';
import routinePresetsRouter from './routes/routinePresets.js';
import alertsRouter from './routes/alerts.js';
import alertRulesRouter from './routes/alertRules.js';
import notificationPrefsRouter from './routes/notificationPrefs.js';
import systemSettingsRouter from './routes/systemSettings.js';
import jobsRouter from './routes/jobs.js';

dotenv.config();
const app = express();

// CORS + JSON + Cookies
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// DB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✔ Conectado a MongoDB Atlas'))
  .catch((err) => console.error('✖ Error de conexión:', err));

// Público
app.use('/auth', authRouter);

// Protegido
app.use(authRequired);
app.use((req, _res, next) => {
  console.log(`✓ [${req.method}] ${req.originalUrl} → user ${req.user.sub}`);
  next();
});

app.use('/users', usersRouter);
app.use('/households', householdsRouter);
app.use('/devices', devicesRouter);
app.use('/data', dataRouter);
app.use('/routines', routinesRouter);
app.use('/routine-presets', routinePresetsRouter);
app.use('/alerts', alertsRouter);
app.use('/alert-rules', alertRulesRouter);
app.use('/notification-prefs', notificationPrefsRouter);
app.use('/settings', systemSettingsRouter);
app.use('/jobs', jobsRouter);

import { errorHandler } from './middleware/errorHandler.js';
app.use(errorHandler);

// Arranque
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`API escuchando en http://localhost:${PORT}`)
);
