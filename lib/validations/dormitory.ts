import { z } from 'zod'

// Building validation
export const buildingSchema = z.object({
  name: z.string().min(3, 'Bino nomi kamida 3 ta harf'),
  code: z.string().min(2, 'Kod kamida 2 ta belgi'),
  address: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  totalFloors: z.number().min(1, 'Kamida 1 ta qavat').max(50, 'Maksimal 50 qavat'),
  gender: z.enum(['MALE', 'FEMALE', 'MIXED']).optional(),
  facilities: z.array(z.string()).optional(),
  rules: z.array(z.string()).optional(),
  contactPerson: z.string().optional().or(z.literal('')),
  contactPhone: z.string().optional().or(z.literal('')),
})

export type BuildingFormData = z.infer<typeof buildingSchema>

export const updateBuildingSchema = buildingSchema.partial()

// Room validation
export const roomSchema = z.object({
  buildingId: z.string().min(1, 'Binoni tanlang'),
  roomNumber: z.string().min(1, 'Xona raqami majburiy'),
  floor: z.number().min(1, 'Qavat raqami majburiy'),
  capacity: z.number().min(1, 'Kamida 1 ta joy').max(20, 'Maksimal 20 ta joy'),
  roomType: z.enum(['STANDARD', 'LUXURY', 'SUITE']).default('STANDARD'),
  pricePerMonth: z.number().min(0, 'Oylik narx 0 yoki undan katta bo\'lishi kerak'),
  gender: z.enum(['MALE', 'FEMALE', 'MIXED']).optional(),
  description: z.string().optional().or(z.literal('')),
  amenities: z.array(z.string()).optional(),
})

export type RoomFormData = z.infer<typeof roomSchema>

export const updateRoomSchema = roomSchema.partial().extend({
  buildingId: z.string().optional(),
})

// Bed validation
export const bedSchema = z.object({
  roomId: z.string().min(1, 'Xonani tanlang'),
  bedNumber: z.string().min(1, 'Joy raqami majburiy'),
  bedType: z.enum(['SINGLE', 'BUNK_TOP', 'BUNK_BOTTOM']).default('SINGLE'),
  description: z.string().optional().or(z.literal('')),
})

export type BedFormData = z.infer<typeof bedSchema>

// Assignment validation
export const assignmentSchema = z.object({
  studentId: z.string().min(1, 'O\'quvchini tanlang'),
  roomId: z.string().min(1, 'Xonani tanlang'),
  bedId: z.string().min(1, 'Joyni tanlang'),
  checkInDate: z.date().optional(),
  monthlyFee: z.number().min(0, 'To\'lov 0 dan katta bo\'lishi kerak'),
  notes: z.string().optional().or(z.literal('')),
})

export type AssignmentFormData = z.infer<typeof assignmentSchema>

export const updateAssignmentSchema = z.object({
  checkOutDate: z.date().optional(),
  status: z.enum(['ACTIVE', 'MOVED', 'CHECKED_OUT', 'SUSPENDED']).optional(),
  notes: z.string().optional().or(z.literal('')),
})

export type UpdateAssignmentFormData = z.infer<typeof updateAssignmentSchema>

