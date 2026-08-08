-- Link Review to Product and add title/email fields for the moderated review & rating system
ALTER TABLE "Review"
ADD COLUMN IF NOT EXISTS "productId" TEXT,
ADD COLUMN IF NOT EXISTS "email" TEXT,
ADD COLUMN IF NOT EXISTS "title" TEXT;

-- Backfill is not needed: the Review table had 0 rows at the time this migration was written.
ALTER TABLE "Review"
ALTER COLUMN "productId" SET NOT NULL;

ALTER TABLE "Review"
ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Review_productId_idx" ON "Review"("productId");
CREATE INDEX IF NOT EXISTS "Review_approved_idx" ON "Review"("approved");
