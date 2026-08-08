-- Add payment status fields to MandapInquiry table
ALTER TABLE "MandapInquiry" 
ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS "adminNote" TEXT,
ADD COLUMN IF NOT EXISTS "quotedPrice" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "stripePaymentLink" TEXT,
ADD COLUMN IF NOT EXISTS "paymentAcceptedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "paymentDeclinedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "customerResponseNote" TEXT,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW();

-- Create index for payment status queries
CREATE INDEX IF NOT EXISTS "MandapInquiry_paymentStatus_idx" ON "MandapInquiry"("paymentStatus");

-- Create index for status queries
CREATE INDEX IF NOT EXISTS "MandapInquiry_status_idx" ON "MandapInquiry"("status");