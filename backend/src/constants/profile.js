const LANGUAGES = Object.freeze([
  'Urdu',
  'English',
  'Punjabi',
  'Sindhi',
  'Pashto',
  'Saraiki'
]);

const SERVICE_MODES = Object.freeze({
  CHAT: 'chat',
  PHONE: 'phone',
  VIDEO: 'video',
  IN_CHAMBER: 'in_chamber'
});

const ALLOWED_SERVICE_MODES = Object.freeze([
  SERVICE_MODES.CHAT,
  SERVICE_MODES.PHONE,
  SERVICE_MODES.VIDEO,
  SERVICE_MODES.IN_CHAMBER
]);

const SLOT_DURATIONS = Object.freeze([15, 30, 45, 60]);
const DEFAULT_SLOT_DURATION = 30;
const MAX_SERVICES_PER_LAWYER = 4;

const FEE_LIMITS = Object.freeze({
  MIN: 0,
  MAX: 200000
});

const DIRECTORY_SORT_OPTIONS = Object.freeze([
  'experience',
  'fee_asc',
  'fee_desc',
  'newest'
]);
const DEFAULT_DIRECTORY_SORT = 'experience';

module.exports = {
  LANGUAGES,
  SERVICE_MODES,
  ALLOWED_SERVICE_MODES,
  SLOT_DURATIONS,
  DEFAULT_SLOT_DURATION,
  MAX_SERVICES_PER_LAWYER,
  FEE_LIMITS,
  DIRECTORY_SORT_OPTIONS,
  DEFAULT_DIRECTORY_SORT
};
