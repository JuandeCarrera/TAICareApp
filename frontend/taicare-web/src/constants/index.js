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
