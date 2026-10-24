const { Op } = require('sequelize');
const {
  LawyerApplication,
  LawyerProfile,
  LawyerService,
  User
} = require('../../models');
const {
  APPLICATION_STATUS,
  CONFIDENCE_LEVELS,
  URGENCY_LEVELS,
  MATCHING_WEIGHTS,
  MATCHING_KEYWORDS,
  GENERIC_FOLLOW_UP_QUESTIONS,
  CATEGORY_SPECIFIC_QUESTIONS
} = require('../../constants');
const { getAvailableSlots } = require('../availability/availability.service');

/**
 * Escapes regex special characters in a keyword.
 *
 * @param {string} str
 * @returns {string}
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Classifies free-text legal problem descriptions into practice areas.
 * Deterministic whole-word keyword matching with confidence metrics.
 *
 * @param {string} text - Case description (10-1000 characters)
 * @returns {object}
 */
const classifyText = (text) => {
  const normalized = text.toLowerCase();
  const areaScores = [];

  for (const [area, keywords] of Object.entries(MATCHING_KEYWORDS)) {
    const matched = [];

    for (const kw of keywords) {
      const pattern = new RegExp(`\\b${escapeRegex(kw.toLowerCase())}\\b`, 'i');
      if (pattern.test(normalized)) {
        matched.push(kw);
      }
    }

    if (matched.length > 0) {
      areaScores.push({
        practiceArea: area,
        hits: matched.length,
        matchedKeywords: matched
      });
    }
  }

  // Sort descending by keyword hit count
  areaScores.sort((a, b) => b.hits - a.hits);

  if (areaScores.length === 0) {
    return {
      practiceArea: null,
      confidence: CONFIDENCE_LEVELS.NONE,
      matchedKeywords: [],
      alternatives: [],
      followUpQuestions: [...GENERIC_FOLLOW_UP_QUESTIONS]
    };
  }

  const top = areaScores[0];
  const second = areaScores[1] || null;

  let confidence;
  if (top.hits >= 2 && (!second || top.hits > second.hits)) {
    confidence = CONFIDENCE_LEVELS.HIGH;
  } else {
    confidence = CONFIDENCE_LEVELS.LOW;
  }

  const alternatives = areaScores.slice(1, 3).map((item) => item.practiceArea);

  const categoryQuestion = CATEGORY_SPECIFIC_QUESTIONS[top.practiceArea];
  const followUpQuestions = [
    ...GENERIC_FOLLOW_UP_QUESTIONS,
    ...(categoryQuestion
      ? [
          {
            key: 'categoryDetail',
            question: categoryQuestion,
            type: 'text'
          }
        ]
      : [])
  ];

  return {
    practiceArea: top.practiceArea,
    confidence,
    matchedKeywords: top.matchedKeywords,
    alternatives,
    followUpQuestions
  };
};

/**
 * Searches and scores approved advocates and law firms based on multi-factor criteria.
 * Strictly adheres to Bar Council Rule 135 (no paid ranking, no hyperbole).
 *
 * @param {object} criteria
 * @param {string} criteria.practiceArea - Required practice area
 * @param {string} [criteria.city]
 * @param {string} [criteria.urgency] - 'today' | 'this_week' | 'flexible'
 * @param {number} [criteria.maxFeePkr]
 * @param {string} [criteria.mode] - 'video' | 'in_chamber' | 'phone' | 'chat'
 * @param {string} [criteria.language]
 * @param {number} [criteria.page=1]
 * @param {number} [criteria.limit=10]
 * @param {Function} [nowProvider] - Optional injectable clock for deterministic testing
 * @returns {Promise<object>}
 */
const searchMatches = async (
  { practiceArea, city, urgency, maxFeePkr, mode, language, page = 1, limit = 10 },
  nowProvider
) => {
  // Query approved advocates and law firms practicing the requested domain
  const apps = await LawyerApplication.findAll({
    where: {
      status: APPLICATION_STATUS.APPROVED,
      practiceAreas: {
        [Op.contains]: [practiceArea]
      }
    },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'role']
      },
      {
        model: LawyerProfile,
        as: 'profile',
        where: { isPublic: true },
        attributes: ['headline', 'about', 'languages', 'slotMinutes', 'isPublic']
      },
      {
        model: LawyerService,
        as: 'services',
        where: { isActive: true },
        required: false
      }
    ]
  });

  const now = nowProvider ? nowProvider() : new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const future14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const scoredCandidates = [];

  for (const app of apps) {
    let score = 0;
    const reasons = [`Practises ${practiceArea} law`];

    // 1. City Weight (30 points)
    if (city) {
      if (app.city && app.city.toLowerCase() === city.toLowerCase()) {
        score += MATCHING_WEIGHTS.CITY;
        reasons.push(`Based in ${app.city}`);
      }
    }

    // 2. Language Weight (10 points)
    if (language) {
      const speaksLang =
        app.profile &&
        Array.isArray(app.profile.languages) &&
        app.profile.languages.includes(language);
      if (speaksLang) {
        score += MATCHING_WEIGHTS.LANGUAGE;
        reasons.push(`Consults in ${language}`);
      }
    }

    // 3. Consultation Mode Weight (15 points)
    const activeServices = app.services || [];
    if (mode) {
      const offersMode = activeServices.some((s) => s.mode === mode);
      if (offersMode) {
        score += MATCHING_WEIGHTS.MODE;
        const modeLabel = mode === 'in_chamber' ? 'in-chamber' : mode;
        reasons.push(`Offers ${modeLabel} consultations`);
      }
    }

    // 4. Budget Weight (10 points)
    if (maxFeePkr !== undefined && maxFeePkr !== null) {
      const eligibleServices = mode
        ? activeServices.filter((s) => s.mode === mode)
        : activeServices;

      const fitsBudget = eligibleServices.some((s) => s.feePkr <= Number(maxFeePkr));
      if (fitsBudget) {
        score += MATCHING_WEIGHTS.BUDGET;
        reasons.push(
          `Consultation fee within your ${Number(maxFeePkr).toLocaleString()} PKR budget`
        );
      }
    }

    // 5. Experience Weight (10 points max, scaled up to 15 years)
    const expYears = Number(app.experienceYears) || 0;
    const expPoints = Math.round(
      (Math.min(expYears, MATCHING_WEIGHTS.EXPERIENCE_CAP_YEARS) /
        MATCHING_WEIGHTS.EXPERIENCE_CAP_YEARS) *
        MATCHING_WEIGHTS.EXPERIENCE_MAX_POINTS
    );
    score += expPoints;
    if (expYears >= 5) {
      reasons.push(`${expYears} years of professional legal experience`);
    }

    // 6. Slot Availability & Urgency Weight (25 or 10 points)
    let nextSlot = null;
    try {
      const slotData = await getAvailableSlots(
        app.id,
        todayStr,
        future14Days,
        nowProvider
      );
      const availableSlots = slotData.slots || [];

      if (availableSlots.length > 0) {
        nextSlot = availableSlots[0].startsAt || availableSlots[0].startUtc;
        const slotTimeMs = new Date(nextSlot).getTime();
        const nowMs = now.getTime();
        const diffHours = (slotTimeMs - nowMs) / (1000 * 60 * 60);

        if (urgency === URGENCY_LEVELS.TODAY) {
          if (diffHours <= 24) {
            score += MATCHING_WEIGHTS.URGENCY_TODAY;
            reasons.push('Consultation slot available today');
          }
        } else if (urgency === URGENCY_LEVELS.THIS_WEEK) {
          if (diffHours <= 7 * 24) {
            score += MATCHING_WEIGHTS.URGENCY_THIS_WEEK;
            reasons.push('Consultation slot available this week');
          }
        } else if (urgency === URGENCY_LEVELS.FLEXIBLE || !urgency) {
          if (diffHours <= 14 * 24) {
            score += MATCHING_WEIGHTS.URGENCY_FLEXIBLE;
            reasons.push('Upcoming consultation slots available within 14 days');
          }
        }
      }
    } catch {
      // If slot engine yields no slots, nextSlot remains null
      nextSlot = null;
    }

    // Compute lowest active fee
    const lowestFee =
      activeServices.length > 0
        ? Math.min(...activeServices.map((s) => s.feePkr))
        : null;

    scoredCandidates.push({
      id: app.id,
      name: app.user ? app.user.name : '',
      role: app.user ? app.user.role : 'lawyer',
      courtLevel: app.courtLevel,
      city: app.city,
      practiceAreas: app.practiceAreas,
      experienceYears: app.experienceYears,
      headline: app.profile ? app.profile.headline : '',
      languages: app.profile ? app.profile.languages : [],
      modes: activeServices.map((s) => s.mode),
      feeFrom: lowestFee,
      score,
      reasons,
      nextSlot
    });
  }

  // Deterministic sorting: score DESC -> nextSlot ASC (earliest slot first, nulls last) -> id ASC
  scoredCandidates.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (a.nextSlot && b.nextSlot) {
      const diff = new Date(a.nextSlot).getTime() - new Date(b.nextSlot).getTime();
      if (diff !== 0) return diff;
    } else if (a.nextSlot && !b.nextSlot) {
      return -1;
    } else if (!a.nextSlot && b.nextSlot) {
      return 1;
    }
    return a.id.localeCompare(b.id);
  });

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const offset = (pageNum - 1) * limitNum;
  const paginated = scoredCandidates.slice(offset, offset + limitNum);

  return {
    items: paginated,
    total: scoredCandidates.length,
    page: pageNum,
    limit: limitNum
  };
};

module.exports = {
  classifyText,
  searchMatches
};
