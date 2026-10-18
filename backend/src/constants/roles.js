const ROLES = Object.freeze({
  CLIENT: 'client',
  LAWYER: 'lawyer',
  ADMIN: 'admin'
});

const ALLOWED_REGISTRATION_ROLES = Object.freeze([
  ROLES.CLIENT,
  ROLES.LAWYER
]);

module.exports = {
  ROLES,
  ALLOWED_REGISTRATION_ROLES
};
