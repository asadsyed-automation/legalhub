export const ROLES = Object.freeze({
  CLIENT: 'client',
  LAWYER: 'lawyer',
  ADMIN: 'admin',
});

export const ALLOWED_REGISTRATION_ROLES = Object.freeze([
  ROLES.CLIENT,
  ROLES.LAWYER,
]);

export const ROLE_LABELS = Object.freeze({
  [ROLES.CLIENT]: 'Client / Citizen',
  [ROLES.LAWYER]: 'Advocate / Lawyer',
  [ROLES.ADMIN]: 'Court Administrator',
});

export const APPLICATION_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

export const STATUS_LABELS = Object.freeze({
  [APPLICATION_STATUS.PENDING]: 'Under Verification',
  [APPLICATION_STATUS.APPROVED]: 'Verified Advocate',
  [APPLICATION_STATUS.REJECTED]: 'Action Required',
});

export const BAR_COUNCILS = Object.freeze([
  'Punjab Bar Council',
  'Sindh Bar Council',
  'Khyber Pakhtunkhwa Bar Council',
  'Balochistan Bar Council',
  'Islamabad Bar Council',
]);

export const COURT_LEVELS = Object.freeze([
  'Advocate Lower Courts',
  'Advocate High Court',
  'Advocate Supreme Court',
]);

export const CITIES = Object.freeze([
  'Lahore',
  'Karachi',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
  'Gujranwala',
  'Sialkot',
  'Hyderabad',
  'Bahawalpur',
  'Sargodha',
  'Sukkur',
  'Abbottabad',
]);

export const PRACTICE_AREAS = Object.freeze([
  'Criminal',
  'Civil',
  'Family',
  'Property',
  'Corporate',
  'Labor',
  'Tax',
  'Constitutional',
  'Banking',
  'Consumer',
]);

export const STORAGE_KEYS = Object.freeze({
  TOKEN: 'legalhub_token',
});
