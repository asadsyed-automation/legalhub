const { z } = require('zod');
const {
  BAR_COUNCILS,
  COURT_LEVELS,
  CITIES,
  PRACTICE_AREAS
} = require('../../constants');

const applicationSchema = z.object({
  barCouncil: z.enum(BAR_COUNCILS, {
    errorMap: () => ({
      message: `Invalid Bar Council. Must be one of: ${BAR_COUNCILS.join(', ')}`
    })
  }),
  enrolmentNo: z
    .string({ required_error: 'Enrolment number is required' })
    .trim()
    .min(2, { message: 'Enrolment number must be at least 2 characters long' })
    .max(50, { message: 'Enrolment number cannot exceed 50 characters' }),
  courtLevel: z.enum(COURT_LEVELS, {
    errorMap: () => ({
      message: `Invalid Court Level. Must be one of: ${COURT_LEVELS.join(', ')}`
    })
  }),
  city: z.enum(CITIES, {
    errorMap: () => ({
      message: `Invalid City. Must be one of: ${CITIES.join(', ')}`
    })
  }),
  practiceAreas: z
    .array(
      z.enum(PRACTICE_AREAS, {
        errorMap: () => ({
          message: `Invalid Practice Area. Allowed areas: ${PRACTICE_AREAS.join(', ')}`
        })
      }),
      { required_error: 'Practice areas are required' }
    )
    .min(1, { message: 'You must select at least 1 practice area' })
    .max(5, { message: 'You can select at most 5 practice areas' })
    .refine((items) => new Set(items).size === items.length, {
      message: 'Practice areas must not contain duplicate items'
    }),
  experienceYears: z
    .number({ required_error: 'Years of experience is required' })
    .int({ message: 'Years of experience must be an integer' })
    .min(0, { message: 'Years of experience cannot be negative' })
    .max(60, { message: 'Years of experience cannot exceed 60' }),
  chamberAddress: z
    .string({ required_error: 'Chamber address is required' })
    .trim()
    .min(5, { message: 'Chamber address must be at least 5 characters long' })
    .max(300, { message: 'Chamber address cannot exceed 300 characters' }),
  bio: z
    .string()
    .trim()
    .max(1000, { message: 'Bio cannot exceed 1000 characters' })
    .optional()
    .nullable()
});

module.exports = {
  applicationSchema
};
