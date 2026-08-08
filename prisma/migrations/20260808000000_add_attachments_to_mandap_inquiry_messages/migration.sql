-- Add attachments field to MandapInquiryMessage table
ALTER TABLE "MandapInquiryMessage"
ADD COLUMN IF NOT EXISTS "attachments" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
