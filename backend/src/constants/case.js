const APPROVED_CITIES = [
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
  'Abbottabad'
];

const CASE_STATUSES = Object.freeze([
  'Prospect',
  'Active',
  'Adjourned',
  'Reserved',
  'Stayed',
  'Decided',
  'Appealed',
  'Withdrawn',
  'Closed'
]);

const CASE_STAGES = Object.freeze([
  'Pleadings',
  'Issues',
  'Evidence',
  'Arguments',
  'Judgment',
  'Execution'
]);

const BASE_SUPERIOR_COURTS = [
  'Supreme Court of Pakistan',
  'Lahore High Court',
  'Sindh High Court',
  'Peshawar High Court',
  'Balochistan High Court',
  'Islamabad High Court'
];

// Generate District & Sessions courts for every approved Pakistani city
const SUBORDINATE_COURTS = APPROVED_CITIES.flatMap((city) => [
  `District Court, ${city}`,
  `Sessions Court, ${city}`
]);

const COURTS = Object.freeze([
  ...BASE_SUPERIOR_COURTS,
  ...SUBORDINATE_COURTS
]);

const CASE_LIMITS = Object.freeze({
  TITLE_MAX_LENGTH: 150,
  CASE_OR_FIR_MAX_LENGTH: 60,
  PARTY_NAME_MAX_LENGTH: 120,
  ROLE_LABEL_MAX_LENGTH: 40,
  MAX_PARTIES_PER_CASE: 10
});

const CASE_ENTRY_TYPES = Object.freeze([
  'petition',
  'order',
  'note'
]);

const ENTRY_VISIBILITIES = Object.freeze([
  'private',
  'shared'
]);

const DOCUMENT_TYPES = Object.freeze([
  'Petition',
  'Court Order',
  'Evidence',
  'Affidavit',
  'Contract',
  'FIR Copy',
  'Identity Document',
  'Other'
]);

const DOCUMENT_LIMITS = Object.freeze({
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10 MB
  MAX_TAGS: 5,
  MAX_TAG_LENGTH: 30,
  ALLOWED_EXTENSIONS: ['.pdf', '.jpeg', '.jpg', '.png', '.doc', '.docx'],
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
});

const DOCUMENT_VISIBILITIES = Object.freeze([
  'private',
  'shared'
]);

const FEE_AGREEMENT_TYPES = Object.freeze([
  'fixed',
  'per_appearance',
  'stage_wise'
]);

const FEE_PAYMENT_METHODS = Object.freeze([
  'cash',
  'bank',
  'jazzcash',
  'easypaisa',
  'cheque'
]);

const CASE_FEE_LIMITS = Object.freeze({
  MIN_AGREED_AMOUNT_PKR: 0,
  MAX_FEE_PKR: 100000000, // 10 Crore PKR
  MIN_PAYMENT_PKR: 1,
  MAX_AGREEMENT_NOTES_LENGTH: 500,
  MAX_PAYMENT_NOTE_LENGTH: 300,
  MAX_PAYMENT_REF_LENGTH: 60
});

module.exports = {
  CASE_STATUSES,
  CASE_STAGES,
  COURTS,
  CASE_LIMITS,
  CASE_ENTRY_TYPES,
  ENTRY_VISIBILITIES,
  DOCUMENT_TYPES,
  DOCUMENT_LIMITS,
  DOCUMENT_VISIBILITIES,
  FEE_AGREEMENT_TYPES,
  FEE_PAYMENT_METHODS,
  CASE_FEE_LIMITS,
  FEE_LIMITS: CASE_FEE_LIMITS
};

