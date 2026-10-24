const ROLES = Object.freeze({
  CLIENT: 'client',
  LAWYER: 'lawyer',
  ADMIN: 'admin',
  LAW_FIRM: 'law_firm'
});

const ALLOWED_REGISTRATION_ROLES = Object.freeze([
  ROLES.CLIENT,
  ROLES.LAWYER,
  ROLES.LAW_FIRM
]);

module.exports = {
  ROLES,
  ALLOWED_REGISTRATION_ROLES
};
