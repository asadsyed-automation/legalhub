const { sequelize, LawyerProfile, LawyerService } = require('../../models');
const AppError = require('../../utils/AppError');

/**
 * Fetch the authenticated advocate's professional profile.
 *
 * @param {string} userId - UUID of the advocate
 * @returns {Promise<object>}
 */
const getProfile = async (userId) => {
  let profile = await LawyerProfile.findOne({
    where: { userId }
  });

  if (!profile) {
    // Return standard defaults if profile has not been explicitly created yet
    return {
      userId,
      headline: null,
      about: null,
      languages: ['Urdu', 'English'],
      slotMinutes: 30,
      isPublic: true
    };
  }

  return profile.toJSON();
};

/**
 * Upsert the advocate's professional profile.
 *
 * @param {string} userId - UUID of the advocate
 * @param {object} profileData - { headline, about, languages, slotMinutes, isPublic }
 * @returns {Promise<object>}
 */
const upsertProfile = async (userId, profileData) => {
  const t = await sequelize.transaction();
  try {
    let profile = await LawyerProfile.findOne({
      where: { userId },
      transaction: t
    });

    if (profile) {
      await profile.update(profileData, { transaction: t });
    } else {
      profile = await LawyerProfile.create(
        {
          ...profileData,
          userId
        },
        { transaction: t }
      );
    }

    await t.commit();
    return profile.toJSON();
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/**
 * Fetch all consultation services offered by the advocate.
 *
 * @param {string} userId - UUID of the advocate
 * @returns {Promise<Array<object>>}
 */
const getServices = async (userId) => {
  const services = await LawyerService.findAll({
    where: { lawyerId: userId },
    order: [['mode', 'ASC']]
  });

  return services.map((s) => s.toJSON());
};

/**
 * Atomically replace the advocate's entire set of consultation services.
 *
 * @param {string} userId - UUID of the advocate
 * @param {Array<object>} servicesList - Array of { mode, durationMinutes, feePkr, isActive }
 * @returns {Promise<Array<object>>}
 */
const replaceServices = async (userId, servicesList) => {
  const t = await sequelize.transaction();
  try {
    // Remove existing services
    await LawyerService.destroy({
      where: { lawyerId: userId },
      transaction: t
    });

    // Insert new validated services
    const servicesToCreate = servicesList.map((service) => ({
      lawyerId: userId,
      mode: service.mode,
      durationMinutes: service.durationMinutes,
      feePkr: service.feePkr,
      isActive: service.isActive !== undefined ? service.isActive : true
    }));

    const createdServices = await LawyerService.bulkCreate(servicesToCreate, {
      transaction: t,
      validate: true
    });

    await t.commit();
    return createdServices.map((s) => s.toJSON());
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

module.exports = {
  getProfile,
  upsertProfile,
  getServices,
  replaceServices
};
