export const ROLES = {
  PATIENT: 'paciente',
  CAREGIVER: 'cuidador',
  ADMIN: 'admin',
};

export const ALERT_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const ALERT_STATUS = {
  OPEN: 'open',
  ACK: 'ack',
  RESOLVED: 'resolved',
  SUPPRESSED: 'suppressed',
};

export const ROUTINE_MODE = {
  ANY: 'any',
  ALL: 'all',
};

export const DAYS_OF_WEEK = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
};

export const DAYS_ARRAY = Object.values(DAYS_OF_WEEK);

export const ALERT_TYPES = {
  ROUTINE_MISSED: { code: 'ROUTINE_MISSED', defaultSeverity: 'high' },
  UNUSUAL_HOUR_ACTIVITY: {
    code: 'UNUSUAL_HOUR_ACTIVITY',
    defaultSeverity: 'high',
  },
  NIGHT_ACTIVITY: { code: 'NIGHT_ACTIVITY', defaultSeverity: 'medium' },
  DATA_GAP: { code: 'DATA_GAP', defaultSeverity: 'high' },
  DATA_SPIKE: { code: 'DATA_SPIKE', defaultSeverity: 'medium' },
  ERRATIC_BEHAVIOR: { code: 'ERRATIC_BEHAVIOR', defaultSeverity: 'high' },
  NO_ACTIVITY: { code: 'NO_ACTIVITY', defaultSeverity: 'high' },
  PROLONGED_INACTIVITY: {
    code: 'PROLONGED_INACTIVITY',
    defaultSeverity: 'high',
  },
  DEVICE_ISSUE: { code: 'DEVICE_ISSUE', defaultSeverity: 'medium' },
};

// Default preferences map for new users or "Remind me later"
export const DEFAULT_ALERT_PREFERENCES = Object.fromEntries(
  Object.values(ALERT_TYPES).map(({ code, defaultSeverity }) => [
    code,
    { enabled: true, severity: defaultSeverity },
  ])
);
