-- Migration: Add tuitionFeeAtPayment snapshot to existing payments
-- This migration updates all existing COMPLETED payments to have a snapshot of their amount
-- For PENDING payments, it uses the current student's monthlyTuitionFee

-- Update COMPLETED payments: use their current amount as snapshot
UPDATE "Payment"
SET "tuitionFeeAtPayment" = "amount"
WHERE "tuitionFeeAtPayment" IS NULL
  AND "status" = 'COMPLETED'
  AND "paymentType" = 'TUITION';

-- Update PENDING/PARTIALLY_PAID payments: use student's current monthlyTuitionFee
UPDATE "Payment" p
SET "tuitionFeeAtPayment" = s."monthlyTuitionFee"
FROM "Student" s
WHERE p."studentId" = s."id"
  AND p."tuitionFeeAtPayment" IS NULL
  AND p."status" IN ('PENDING', 'PARTIALLY_PAID')
  AND p."paymentType" = 'TUITION'
  AND s."monthlyTuitionFee" IS NOT NULL;

