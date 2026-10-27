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
  [APPLICATION_STATUS.PENDING]: 'Under Admin Review',
  [APPLICATION_STATUS.APPROVED]: 'Admin-Reviewed Advocate',
  [APPLICATION_STATUS.REJECTED]: 'Action Required / Not Approved',
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

export const LANGUAGES = Object.freeze([
  'Urdu',
  'English',
  'Punjabi',
  'Sindhi',
  'Pashto',
  'Saraiki',
]);

export const SERVICE_MODES = Object.freeze({
  CHAT: 'chat',
  PHONE: 'phone',
  VIDEO: 'video',
  IN_CHAMBER: 'in_chamber',
});

export const SERVICE_MODE_LABELS = Object.freeze({
  [SERVICE_MODES.CHAT]: 'Text Consultation',
  [SERVICE_MODES.PHONE]: 'Audio Call Consultation',
  [SERVICE_MODES.VIDEO]: 'Video Conference',
  [SERVICE_MODES.IN_CHAMBER]: 'In-Chamber Meeting',
});

export const SLOT_DURATIONS = Object.freeze([15, 30, 45, 60]);

export const WEEKDAYS = Object.freeze([
  { id: 1, label: 'Monday', short: 'Mon' },
  { id: 2, label: 'Tuesday', short: 'Tue' },
  { id: 3, label: 'Wednesday', short: 'Wed' },
  { id: 4, label: 'Thursday', short: 'Thu' },
  { id: 5, label: 'Friday', short: 'Fri' },
  { id: 6, label: 'Saturday', short: 'Sat' },
  { id: 7, label: 'Sunday', short: 'Sun' },
]);

export const BOOKING_STATUS = Object.freeze({
  REQUESTED: 'requested',
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  REJECTED: 'rejected',
  PAID: 'paid',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  EXPIRED: 'expired',
});

export const BOOKING_STATUS_LABELS = Object.freeze({
  [BOOKING_STATUS.REQUESTED]: 'Requested',
  [BOOKING_STATUS.PENDING]: 'Pending',
  [BOOKING_STATUS.ACCEPTED]: 'Accepted (Awaiting Payment)',
  [BOOKING_STATUS.DECLINED]: 'Declined',
  [BOOKING_STATUS.REJECTED]: 'Declined',
  [BOOKING_STATUS.PAID]: 'Paid (Awaiting Confirmation)',
  [BOOKING_STATUS.CONFIRMED]: 'Confirmed',
  [BOOKING_STATUS.COMPLETED]: 'Completed',
  [BOOKING_STATUS.CANCELLED]: 'Cancelled',
  [BOOKING_STATUS.REFUNDED]: 'Refunded',
  [BOOKING_STATUS.EXPIRED]: 'Expired',
});

export const PAYMENT_METHOD = Object.freeze({
  SANDBOX: 'sandbox',
});

export const PAYMENT_STATUS = Object.freeze({
  SUCCEEDED: 'succeeded',
  REFUNDED: 'refunded',
});

export const CASE_STATUSES = Object.freeze([
  'Prospect',
  'Active',
  'Adjourned',
  'Reserved',
  'Stayed',
  'Decided',
  'Appealed',
  'Withdrawn',
  'Closed',
]);

export const CASE_STATUS_LABELS = Object.freeze({
  Prospect: 'Prospect / Intake',
  Active: 'Active Hearing',
  Adjourned: 'Adjourned / Tariq Peshi',
  Reserved: 'Reserved for Orders',
  Stayed: 'Stay Granted',
  Decided: 'Decided / Disposed',
  Appealed: 'Under Appeal',
  Withdrawn: 'Withdrawn',
  Closed: 'Closed File',
});

export const CASE_STAGES = Object.freeze([
  'Pleadings',
  'Issues',
  'Evidence',
  'Arguments',
  'Judgment',
  'Execution',
]);

export const CASE_STAGE_LABELS = Object.freeze({
  Pleadings: 'Pleadings / Written Statement',
  Issues: 'Framing of Issues',
  Evidence: 'Recording of Evidence',
  Arguments: 'Final Arguments',
  Judgment: 'Pronouncement of Judgment',
  Execution: 'Execution of Decree',
});

export const BASE_SUPERIOR_COURTS = [
  'Supreme Court of Pakistan',
  'Lahore High Court',
  'Sindh High Court',
  'Peshawar High Court',
  'Balochistan High Court',
  'Islamabad High Court',
];

export const COURTS = Object.freeze([
  ...BASE_SUPERIOR_COURTS,
  ...CITIES.flatMap((city) => [
    `District Court, ${city}`,
    `Sessions Court, ${city}`,
  ]),
]);

export const CASE_ENTRY_TYPES = Object.freeze([
  'petition',
  'order',
  'note',
]);

export const CASE_ENTRY_TYPE_LABELS = Object.freeze({
  petition: 'Pleading / Petition',
  order: 'Court Order / Hukam',
  note: 'Chamber Note / Strategy',
});

export const ENTRY_VISIBILITIES = Object.freeze([
  'private',
  'shared',
]);




