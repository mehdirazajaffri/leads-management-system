import { z } from 'zod'

// User validation schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['ADMIN', 'AGENT']).optional(),
})

export const updateUserSchema = z.object({
  id: z.string().uuid('Invalid user ID').optional(),
  email: z.string().email('Invalid email address').optional(),
  name: z.string().min(1, 'Name is required').optional(),
  role: z.enum(['ADMIN', 'AGENT']).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Lead validation schemas
export const createLeadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z
    .string()
    .refine((val) => !val || z.string().email().safeParse(val).success, {
      message: 'Invalid email address',
    })
    .optional()
    .default(''),
  sourcePlatform: z.string().optional().default(''),
  campaignName: z.string().optional().default(''),
  assignedToId: z.string().uuid().optional().nullable(),
  currentStatusId: z.string().uuid(),
})

export const updateLeadSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional(),
  sourcePlatform: z.string().min(1).optional(),
  campaignName: z.string().min(1).optional(),
  assignedToId: z.string().uuid().optional().nullable(),
  currentStatusId: z.string().uuid().optional(),
})

export const bulkAssignLeadsSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1, 'At least one lead ID is required'),
  agentId: z.string().uuid('Invalid agent ID'),
})

export const bulkUpdateLeadsSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1),
  statusId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional().nullable(),
  isArchived: z.boolean().optional(),
})

// CSV row validation
export const csvRowSchema = z.object({
  Name: z.string().min(1, 'Name is required'),
  Phone: z.string().min(1, 'Phone is required'),
  Email: z
    .string()
    .refine((val) => !val || z.string().email().safeParse(val).success, {
      message: 'Invalid email address',
    })
    .optional()
    .default(''),
  'Source Platform': z.string().optional().default(''),
  'Campaign Name': z.string().optional().default(''),
})

// Status validation
export const createStatusSchema = z.object({
  name: z.string().min(1, 'Status name is required'),
  isFinal: z.boolean().default(false),
})

export const updateStatusSchema = z.object({
  name: z.string().min(1).optional(),
  isFinal: z.boolean().optional(),
})

// Status transition validation
export const statusTransitionSchema = z.object({
  leadId: z.string().uuid(),
  newStatusId: z.string().uuid(),
  note: z.string().optional(),
})

// Callback validation
export const createCallbackSchema = z.object({
  leadId: z.string().uuid(),
  scheduledDate: z.string().datetime(),
  scheduledTime: z.string().optional(),
  notes: z.string().optional(),
})

export const updateCallbackSchema = z.object({
  scheduledDate: z.string().datetime().optional(),
  scheduledTime: z.string().optional(),
  notes: z.string().optional(),
  completed: z.boolean().optional(),
})

// Note validation
export const createNoteSchema = z.object({
  leadId: z.string().uuid(),
  content: z.string().min(1, 'Note content is required'),
  isPrivate: z.boolean().default(false),
})

export const updateNoteSchema = z.object({
  content: z.string().min(1).optional(),
  isPrivate: z.boolean().optional(),
})

// Query parameter validation
export const paginationSchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
})

export const leadFilterSchema = z.object({
  agentId: z.string().uuid().optional(),
  statusId: z.string().uuid().optional(),
  sourcePlatform: z.string().optional(),
  campaignName: z.string().optional(),
  isArchived: z.string().optional().transform((val) => val === 'true'),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

