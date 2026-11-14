const firmService = require('./firm.service');
const asyncHandler = require('../../utils/asyncHandler');

const getMembers = asyncHandler(async (req, res) => {
  const members = await firmService.listFirmMembers(req.user.id);
  res.status(200).json({ members });
});

const addMember = asyncHandler(async (req, res) => {
  const member = await firmService.addFirmMember(req.user.id, req.body);
  res.status(201).json({ member });
});

const updateMember = asyncHandler(async (req, res) => {
  const member = await firmService.updateFirmMember(req.user.id, req.params.id, req.body);
  res.status(200).json({ member });
});

const removeMember = asyncHandler(async (req, res) => {
  await firmService.removeFirmMember(req.user.id, req.params.id);
  res.status(200).json({ message: 'Associate advocate removed from firm chamber roster' });
});

const assignCase = asyncHandler(async (req, res) => {
  const updatedCase = await firmService.assignCase(req.user.id, req.params.caseId, req.body.assignedLawyerId);
  res.status(200).json({ case: updatedCase });
});

const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await firmService.getFirmDashboardStats(req.user.id);
  res.status(200).json({ stats });
});

const searchLawyers = asyncHandler(async (req, res) => {
  const lawyers = await firmService.searchAvailableLawyers(req.query.q || '');
  res.status(200).json({ lawyers });
});

module.exports = {
  getMembers,
  addMember,
  updateMember,
  removeMember,
  assignCase,
  getDashboardStats,
  searchLawyers
};

