-- Deposit/balance payment tracking for custom Mandap/Temple order requests.
-- Adds a per-inquiry running paid total and a deposit amount, plus a new
-- transaction ledger backing in-app Stripe Checkout Sessions (replacing the
-- manually-pasted Stripe Payment Link flow). Purely additive — no drops.

ALTER TABLE "MandapInquiry" ADD COLUMN IF NOT EXISTS "depositAmount" DOUBLE PRECISION;
ALTER TABLE "MandapInquiry" ADD COLUMN IF NOT EXISTS "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "MandapInquiryTransaction" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "stripeSessionId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MandapInquiryTransaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MandapInquiryTransaction_stripeSessionId_key" ON "MandapInquiryTransaction"("stripeSessionId");
CREATE INDEX IF NOT EXISTS "MandapInquiryTransaction_inquiryId_idx" ON "MandapInquiryTransaction"("inquiryId");

DO $$ BEGIN
    ALTER TABLE "MandapInquiryTransaction" ADD CONSTRAINT "MandapInquiryTransaction_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "MandapInquiry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
