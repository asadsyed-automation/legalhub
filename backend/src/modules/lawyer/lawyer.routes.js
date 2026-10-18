const { Router } = require('express');
const lawyerController = require('./lawyer.controller');
const verifyToken = require('../../middleware/verifyToken');
const requireRole = require('../../middleware/requireRole');
const validate = require('../../middleware/validate');
const { applicationSchema } = require('./lawyer.schemas');
const { ROLES } = require('../../constants/roles');

const router = Router();

// Protect all lawyer endpoints with token verification and lawyer role requirement
router.use(verifyToken, requireRole(ROLES.LAWYER));

router.post('/application', validate(applicationSchema), lawyerController.submitApplication);
router.get('/application', lawyerController.getMyApplication);
router.put('/application', validate(applicationSchema), lawyerController.updateApplication);

module.exports = router;
