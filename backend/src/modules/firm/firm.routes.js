const { Router } = require('express');
const firmController = require('./firm.controller');
const verifyToken = require('../../middleware/verifyToken');
const requireRole = require('../../middleware/requireRole');
const validate = require('../../middleware/validate');
const {
  addMemberSchema,
  updateMemberSchema,
  assignCaseSchema,
  searchLawyersQuerySchema
} = require('./firm.schemas');
const { ROLES } = require('../../constants/roles');

const router = Router();

// Protect all firm endpoints with token verification and law firm role requirement
router.use(verifyToken, requireRole(ROLES.LAW_FIRM));

router.get('/members', firmController.getMembers);
router.post('/members', validate(addMemberSchema), firmController.addMember);
router.patch('/members/:id', validate(updateMemberSchema), firmController.updateMember);
router.delete('/members/:id', firmController.removeMember);

router.patch('/cases/:caseId/assign', validate(assignCaseSchema), firmController.assignCase);
router.get('/stats', firmController.getDashboardStats);
router.get('/lawyers/search', validate(searchLawyersQuerySchema, 'query'), firmController.searchLawyers);

module.exports = router;

