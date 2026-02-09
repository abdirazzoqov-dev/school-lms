-- Migration: Add salaryAmountAtPayment snapshot to existing salary payments

-- Update COMPLETED salary payments: use their current amount as snapshot
UPDATE "SalaryPayment"
SET "salaryAmountAtPayment" = "amount"
WHERE "salaryAmountAtPayment" IS NULL
  AND "status" = 'COMPLETED';

-- Update PENDING/PARTIALLY_PAID salary payments for teachers: use teacher's current monthlySalary
UPDATE "SalaryPayment" sp
SET "salaryAmountAtPayment" = t."monthlySalary"
FROM "Teacher" t
WHERE sp."teacherId" = t."id"
  AND sp."salaryAmountAtPayment" IS NULL
  AND sp."status" IN ('PENDING', 'PARTIALLY_PAID')
  AND t."monthlySalary" IS NOT NULL;

-- Update PENDING/PARTIALLY_PAID salary payments for staff: use staff's current monthlySalary
UPDATE "SalaryPayment" sp
SET "salaryAmountAtPayment" = s."monthlySalary"
FROM "Staff" s
WHERE sp."staffId" = s."id"
  AND sp."salaryAmountAtPayment" IS NULL
  AND sp."status" IN ('PENDING', 'PARTIALLY_PAID')
  AND s."monthlySalary" IS NOT NULL;

