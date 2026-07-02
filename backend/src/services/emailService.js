import 'dotenv/config';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import NotificationPref from '../models/NotificationPref.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export async function sendEmail({ to, subject, text, html }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.warn('[EmailService] GMAIL_USER or GMAIL_PASS not configured in .env. Skipping email.');
    return;
  }

  const mailOptions = {
    from: `"TAICare Visualizer" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[EmailService] Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('[EmailService] Error sending email:', error.message);
    throw error;
  }
}

export async function sendAlertEmail(alert) {
  try {
    if (!alert.caregiver_id) return;

    // Check caregiver's notification preferences
    const pref = await NotificationPref.findOne({ user_id: alert.caregiver_id }).lean();
    if (pref) {
      const emailChannel = pref.channels?.find(ch => ch.channel === 'email');
      
      // If email channel is explicitly disabled, skip sending
      if (emailChannel && emailChannel.enabled === false) {
        console.log(`[EmailService] Email notification skipped: disabled by caregiver preference.`);
        return;
      }

      // Check minimum severity threshold
      const severities = ['low', 'medium', 'high', 'critical'];
      const alertSeverity = String(alert.severity || 'medium').toLowerCase();
      const prefSeverity = String(emailChannel?.min_severity || 'medium').toLowerCase();

      const alertSeverityIdx = severities.indexOf(alertSeverity);
      const minSeverityIdx = severities.indexOf(prefSeverity);

      if (alertSeverityIdx !== -1 && minSeverityIdx !== -1 && alertSeverityIdx < minSeverityIdx) {
        console.log(`[EmailService] Email notification skipped: alert severity (${alertSeverity}) is lower than minimum preference (${prefSeverity}).`);
        return;
      }
    }

    // Fetch caregiver info to get their email
    const caregiver = await User.findById(alert.caregiver_id).lean();
    if (!caregiver || !caregiver.email) {
      console.warn('[EmailService] Caregiver not found or has no email address:', alert.caregiver_id);
      return;
    }

    // Fetch patient info to show their name
    const patient = alert.user_id ? await User.findById(alert.user_id).lean() : null;
    const patientName = patient ? patient.name : 'Paciente';

    const subject = `⚠️ ALERTA: ${alert.title || 'Nueva alerta detectada'}`;

    const text = `Se ha generado una nueva alerta para ${patientName}.\n\nTítulo: ${alert.title}\nMensaje: ${alert.message}\nSeveridad: ${alert.severity.toUpperCase()}\nHora: ${new Date(alert.timestamp).toLocaleString()}\n\nPor favor, revisa el panel de control de TAICare.`;

    const severityColors = {
      high: '#ef4444',
      medium: '#f59e0b',
      low: '#10b981',
      critical: '#ef4444'
    };
    const color = severityColors[alert.severity] || '#6366f1';

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; background-color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid ${color}; padding-bottom: 10px; margin-bottom: 20px;">
          <h2 style="color: ${color}; margin: 0;">⚠️ Nueva Alerta Detectada</h2>
          <span style="font-size: 0.85rem; color: #64748b;">TAICare Visualizer</span>
        </div>
        <p style="font-size: 1rem; color: #334155; line-height: 1.5;">
          Se ha registrado un evento fuera de lo común para el paciente <strong>${patientName}</strong>:
        </p>
        <div style="background-color: #f8fafc; border-left: 4px solid ${color}; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <tr>
              <td style="padding: 4px 0; font-weight: bold; color: #475569; width: 120px;">Tipo:</td>
              <td style="padding: 4px 0; color: #1e293b;">${alert.type}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: bold; color: #475569;">Título:</td>
              <td style="padding: 4px 0; color: #1e293b; font-weight: 600;">${alert.title}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: bold; color: #475569;">Detalle:</td>
              <td style="padding: 4px 0; color: #1e293b;">${alert.message}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: bold; color: #475569;">Severidad:</td>
              <td style="padding: 4px 0;"><span style="background-color: ${color}; color: #ffffff; padding: 2px 8px; border-radius: 999px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase;">${alert.severity}</span></td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: bold; color: #475569;">Fecha/Hora:</td>
              <td style="padding: 4px 0; color: #1e293b;">${new Date(alert.timestamp).toLocaleString()}</td>
            </tr>
          </table>
        </div>
        <p style="font-size: 0.9rem; color: #475569; line-height: 1.5;">
          Por favor, acceda al panel de control de TAICare para revisar la alerta y marcarla como resuelta si procede.
        </p>
        <div style="text-align: center; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
          <p style="font-size: 0.75rem; color: #94a3b8; margin: 0;">Este es un mensaje generado automáticamente. No responda a este correo.</p>
        </div>
      </div>
    `;

    await sendEmail({ to: caregiver.email, subject, text, html });
  } catch (error) {
    console.error('[EmailService] Failed to process alert email:', error.message);
  }
}
