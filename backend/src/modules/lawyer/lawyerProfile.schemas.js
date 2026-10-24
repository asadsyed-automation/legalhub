const { z } = require('zod');
const {
  LANGUAGES,
  ALLOWED_SERVICE_MODES,
  SLOT_DURATIONS,
  MAX_SERVICES_PER_LAWYER,
  FEE_LIMITS
} = require('../../constants/profile');

const updateProfileSchema = z.object({
  headline: z
    .string()
    .trim()
    .max(120, { message: 'Headline cannot exceed 120 characters' })
    .nullable()
    .optional(),
  about: z
    .string()
    .trim()
    .max(2000, { message: 'About biography cannot exceed 2000 characters' })
    .nullable()
    .optional(),
  languages: z
    .array(z.enum(LANGUAGES, {
      errorMap: () => ({
        message: `Languages must be chosen from: ${LANGUAGES.join(', ')}`
      })
    }))
    .min(1, { message: 'At least one spoken language must be selected' }),
  slotMinutes: z
    .enum(['15', '30', '45', '60'])
    .or(z.number())
    .transform((val) => Number(val))
    .refine((val) => SLOT_DURATIONS.includes(val), {
      message: `slotMinutes must be one of: ${SLOT_DURATIONS.join(', ')}`
    })
    .default(30),
  isPublic: z.boolean().default(true)
});

const serviceItemSchema = z.object({
  mode: z.enum(ALLOWED_SERVICE_MODES, {
    errorMap: () => ({
      message: `mode must be one of: ${ALLOWED_SERVICE_MODES.join(', ')}`
    })
  }),
  durationMinutes: z
    .enum(['15', '30', '45', '60'])
    .or(z.number())
    .transform((val) => Number(val))
    .refine((val) => SLOT_DURATIONS.includes(val), {
      message: `durationMinutes must be one of: ${SLOT_DURATIONS.join(', ')}`
    }),
  feePkr: z
    .number({ required_error: 'feePkr is required' })
    .int({ message: 'feePkr must be an integer' })
    .min(FEE_LIMITS.MIN, { message: `feePkr cannot be negative` })
    .max(FEE_LIMITS.MAX, { message: `feePkr cannot exceed ${FEE_LIMITS.MAX}` }),
  isActive: z.boolean().default(true)
});

const updateServicesSchema = z.object({
  services: z
    .array(serviceItemSchema)
    .max(MAX_SERVICES_PER_LAWYER, {
      message: `A lawyer may offer at most ${MAX_SERVICES_PER_LAWYER} services`
    })
    .refine(
      (services) => {
        const modes = services.map((s) => s.mode);
        return new Set(modes).size === modes.length;
      },
      {
        message: 'Duplicate consultation modes are not allowed in services list'
      }
    )
});

module.exports = {
  updateProfileSchema,
  updateServicesSchema
};
