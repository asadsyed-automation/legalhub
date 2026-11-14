const { z } = require('zod');

const addMemberSchema = z
  .object({
    lawyerEmail: z.string().email().optional(),
    enrolmentNo: z.string().trim().min(3).max(50).optional(),
    designation: z.string().trim().min(2).max(100).default('Associate Advocate')
  })
  .refine((data) => data.lawyerEmail || data.enrolmentNo, {
    message: 'Please provide either lawyer email or Bar Council enrolment number'
  });

const updateMemberSchema = z.object({
  designation: z.string().trim().min(2).max(100).optional(),
  status: z.enum(['active', 'inactive']).optional()
});

const assignCaseSchema = z.object({
  assignedLawyerId: z.string().uuid().nullable()
});

const searchLawyersQuerySchema = z.object({
  q: z.string().trim().min(1, 'Search term must be at least 1 character').max(100)
});

module.exports = {
  addMemberSchema,
  updateMemberSchema,
  assignCaseSchema,
  searchLawyersQuerySchema
};

