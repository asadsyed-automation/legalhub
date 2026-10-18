const { ROLES, ALLOWED_REGISTRATION_ROLES } = require('./roles');

const BAR_COUNCILS = Object.freeze([
  'Punjab Bar Council',
  'Sindh Bar Council',
  'Khyber Pakhtunkhwa Bar Council',
  'Balochistan Bar Council',
  'Islamabad Bar Council'
]);

const COURT_LEVELS = Object.freeze([
  'Advocate Lower Courts',
  'Advocate High Court',
  'Advocate Supreme Court'
]);

const CITIES = Object.freeze([
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
]);

const PRACTICE_AREAS = Object.freeze([
  'Criminal',
  'Civil',
  'Family',
  'Property',
  'Corporate',
  'Labor',
  'Tax',
  'Constitutional',
  'Banking',
  'Consumer'
]);

module.exports = {
  ROLES,
  ALLOWED_REGISTRATION_ROLES,
  BAR_COUNCILS,
  COURT_LEVELS,
  CITIES,
  PRACTICE_AREAS
};
