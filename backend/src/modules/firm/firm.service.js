const { Op } = require('sequelize');
const {
  User,
  FirmMember,
  Case,
  Hearing,
  LawyerApplication
} = require('../../models');
const { ROLES } = require('../../constants/roles');
const { createNotification } = require('../notification/notification.service');
const { NOTIFICATION_TYPES } = require('../../constants/notification');
const AppError = require('../../utils/AppError');

/**
 * List all associate advocates registered under a Law Firm chamber.
 *
 * @param {string} firmUserId - UUID of the authenticated Law Firm account
 * @returns {Promise<Array<object>>}
 */
const listFirmMembers = async (firmUserId) => {
  const members = await FirmMember.findAll({
    where: { firmId: firmUserId },
    include: [
      {
        model: User,
        as: 'lawyer',
        attributes: ['id', 'name', 'email', 'role', 'status'],
        include: [
          {
            model: LawyerApplication,
            as: 'lawyerApplication',
            attributes: ['barCouncil', 'courtLevel', 'experienceYears', 'enrolmentNo', 'status', 'city', 'practiceAreas']
          }
        ]
      }
    ],
    order: [['createdAt', 'ASC']]
  });

  // Calculate active assigned cases for each associate under this firm
  const lawyerIds = members.map((m) => m.lawyerId);
  let caseCountsByLawyer = {};

  if (lawyerIds.length > 0) {
    const cases = await Case.findAll({
      where: {
        lawyerId: firmUserId,
        assignedLawyerId: { [Op.in]: lawyerIds },
        status: { [Op.notIn]: ['Closed', 'Disposed'] }
      },
      attributes: ['assignedLawyerId']
    });

    cases.forEach((c) => {
      const lid = c.assignedLawyerId;
      caseCountsByLawyer[lid] = (caseCountsByLawyer[lid] || 0) + 1;
    });
  }

  return members.map((m) => {
    const raw = m.toJSON();
    const lawyerData = raw.lawyer || {};
    const appData = lawyerData.lawyerApplication || {};

    return {
      id: raw.id,
      firmId: raw.firmId,
      lawyerId: raw.lawyerId,
      name: lawyerData.name || 'Advocate',
      email: lawyerData.email || '',
      designation: raw.designation,
      status: raw.status,
      joinedAt: raw.joinedAt,
      barCouncil: appData.barCouncil || 'N/A',
      courtLevel: appData.courtLevel || 'N/A',
      experienceYears: appData.experienceYears || 0,
      enrolmentNo: appData.enrolmentNo || 'N/A',
      city: appData.city || 'N/A',
      practiceAreas: appData.practiceAreas || [],
      activeCasesCount: caseCountsByLawyer[raw.lawyerId] || 0
    };
  });
};

/**
 * Add / invite an associate lawyer to the Law Firm chamber.
 *
 * @param {string} firmUserId - UUID of the authenticated Law Firm account
 * @param {object} payload - { lawyerEmail, enrolmentNo, designation }
 * @returns {Promise<object>} Created firm member
 */
const addFirmMember = async (firmUserId, payload) => {
  const firmUser = await User.findByPk(firmUserId);
  if (!firmUser || firmUser.role !== ROLES.LAW_FIRM) {
    throw new AppError('Forbidden: Only registered law firms can add chamber members', 403);
  }

  let targetLawyer = null;

  if (payload.lawyerEmail) {
    targetLawyer = await User.findOne({
      where: { email: payload.lawyerEmail.trim().toLowerCase(), role: ROLES.LAWYER }
    });
  }

  if (!targetLawyer && payload.enrolmentNo) {
    const app = await LawyerApplication.findOne({
      where: { enrolmentNo: payload.enrolmentNo.trim() },
      include: [{ model: User, as: 'user', where: { role: ROLES.LAWYER } }]
    });
    if (app && app.user) {
      targetLawyer = app.user;
    }
  }

  if (!targetLawyer) {
    throw new AppError('Practicing advocate not found with the provided credentials', 404);
  }

  if (targetLawyer.id === firmUserId) {
    throw new AppError('A law firm account cannot add itself as an associate member', 400);
  }

  // Check if lawyer is already an associate in this firm
  const existingMembership = await FirmMember.findOne({
    where: { firmId: firmUserId, lawyerId: targetLawyer.id }
  });

  if (existingMembership) {
    throw new AppError('This advocate is already a member of your chamber roster', 409);
  }

  const member = await FirmMember.create({
    firmId: firmUserId,
    lawyerId: targetLawyer.id,
    designation: payload.designation || 'Associate Advocate',
    status: 'active',
    joinedAt: new Date()
  });

  // Notify the associate lawyer
  try {
    await createNotification({
      userId: targetLawyer.id,
      type: NOTIFICATION_TYPES.SYSTEM,
      title: 'Added to Law Chamber Roster',
      body: `You have been registered as ${payload.designation || 'Associate Advocate'} at ${firmUser.name}.`,
      link: '/dashboard'
    });
  } catch (err) {
    // Non-blocking notification failure
    console.debug('Notification delivery failed:', err?.message);
  }

  return {
    id: member.id,
    firmId: member.firmId,
    lawyerId: member.lawyerId,
    name: targetLawyer.name,
    email: targetLawyer.email,
    designation: member.designation,
    status: member.status,
    joinedAt: member.joinedAt
  };
};

/**
 * Update member designation or active status.
 *
 * @param {string} firmUserId
 * @param {string} memberId
 * @param {object} payload
 * @returns {Promise<object>}
 */
const updateFirmMember = async (firmUserId, memberId, payload) => {
  const member = await FirmMember.findOne({
    where: { id: memberId, firmId: firmUserId }
  });

  if (!member) {
    throw new AppError('Chamber member not found', 404);
  }

  if (payload.designation !== undefined) member.designation = payload.designation;
  if (payload.status !== undefined) member.status = payload.status;

  await member.save();
  return member;
};

/**
 * Remove an associate lawyer from the Law Firm chamber.
 * Also clears assignedLawyerId from active cases under this firm that were assigned to them.
 *
 * @param {string} firmUserId
 * @param {string} memberId
 * @returns {Promise<void>}
 */
const removeFirmMember = async (firmUserId, memberId) => {
  const member = await FirmMember.findOne({
    where: { id: memberId, firmId: firmUserId }
  });

  if (!member) {
    throw new AppError('Chamber member not found', 404);
  }

  // Clear case assignments under this firm
  await Case.update(
    { assignedLawyerId: null },
    { where: { lawyerId: firmUserId, assignedLawyerId: member.lawyerId } }
  );

  await member.destroy();
};

/**
 * Assign or reassign a firm case to an associate advocate.
 *
 * @param {string} firmUserId - UUID of the firm admin
 * @param {string} caseId - UUID of the case
 * @param {string|null} assignedLawyerId - UUID of the associate advocate or null to unassign
 * @returns {Promise<object>} Updated case
 */
const assignCase = async (firmUserId, caseId, assignedLawyerId) => {
  const caseRecord = await Case.findOne({
    where: { id: caseId, lawyerId: firmUserId }
  });

  if (!caseRecord) {
    throw new AppError('Case file not found or not owned by your chamber', 404);
  }

  if (assignedLawyerId) {
    // Verify assigned lawyer is an active member of this firm
    const membership = await FirmMember.findOne({
      where: { firmId: firmUserId, lawyerId: assignedLawyerId, status: 'active' },
      include: [{ model: User, as: 'lawyer', attributes: ['id', 'name', 'email'] }]
    });

    if (!membership) {
      throw new AppError('Selected advocate is not an active associate member of this firm', 400);
    }

    caseRecord.assignedLawyerId = assignedLawyerId;
    await caseRecord.save();

    // Send notification to the assigned associate advocate
    try {
      await createNotification({
        userId: assignedLawyerId,
        type: NOTIFICATION_TYPES.SYSTEM,
        title: 'New Case File Delegated',
        body: `Your chamber has delegated case "${caseRecord.title}" to you for management and appearance.`,
        link: `/cases/${caseRecord.id}`
      });
    } catch (err) {
      console.debug('Notification delivery failed:', err?.message);
    }
  } else {
    // Unassign case
    caseRecord.assignedLawyerId = null;
    await caseRecord.save();
  }

  return caseRecord;
};

/**
 * Aggregated Chamber metrics for Law Firm Dashboard.
 *
 * @param {string} firmUserId
 * @returns {Promise<object>}
 */
const getFirmDashboardStats = async (firmUserId) => {
  const [
    totalAssociates,
    activeAssociates,
    totalCases,
    activeCases,
    assignedCases,
    unassignedCases,
    hearingsCount
  ] = await Promise.all([
    FirmMember.count({ where: { firmId: firmUserId } }),
    FirmMember.count({ where: { firmId: firmUserId, status: 'active' } }),
    Case.count({ where: { lawyerId: firmUserId } }),
    Case.count({ where: { lawyerId: firmUserId, status: { [Op.notIn]: ['Closed', 'Disposed'] } } }),
    Case.count({
      where: {
        lawyerId: firmUserId,
        assignedLawyerId: { [Op.ne]: null },
        status: { [Op.notIn]: ['Closed', 'Disposed'] }
      }
    }),
    Case.count({
      where: {
        lawyerId: firmUserId,
        assignedLawyerId: null,
        status: { [Op.notIn]: ['Closed', 'Disposed'] }
      }
    }),
    Hearing.count({
      include: [
        {
          model: Case,
          as: 'case',
          where: { lawyerId: firmUserId },
          attributes: []
        }
      ],
      where: {
        scheduledAt: { [Op.gte]: new Date() }
      }
    })
  ]);

  return {
    totalAssociates,
    activeAssociates,
    totalCases,
    activeCases,
    assignedCases,
    unassignedCases,
    upcomingHearings: hearingsCount
  };
};

/**
 * Search available practicing advocates for adding to the firm roster.
 *
 * @param {string} term
 * @returns {Promise<Array<object>>}
 */
const searchAvailableLawyers = async (term) => {
  const trimmed = term.trim();
  const lawyers = await User.findAll({
    where: {
      role: ROLES.LAWYER,
      status: 'active',
      [Op.or]: [
        { name: { [Op.iLike]: `%${trimmed}%` } },
        { email: { [Op.iLike]: `%${trimmed}%` } }
      ]
    },
    include: [
      {
        model: LawyerApplication,
        as: 'lawyerApplication',
        attributes: ['barCouncil', 'courtLevel', 'experienceYears', 'enrolmentNo', 'status', 'city', 'practiceAreas']
      }
    ],
    limit: 10,
    attributes: ['id', 'name', 'email']
  });

  return lawyers.map((l) => ({
    id: l.id,
    name: l.name,
    email: l.email,
    barCouncil: l.lawyerApplication?.barCouncil || 'N/A',
    courtLevel: l.lawyerApplication?.courtLevel || 'N/A',
    enrolmentNo: l.lawyerApplication?.enrolmentNo || 'N/A',
    city: l.lawyerApplication?.city || 'N/A',
    experienceYears: l.lawyerApplication?.experienceYears || 0
  }));
};

module.exports = {
  listFirmMembers,
  addFirmMember,
  updateFirmMember,
  removeFirmMember,
  assignCase,
  getFirmDashboardStats,
  searchAvailableLawyers
};

