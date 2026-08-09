-- Create PriceZone table
CREATE TABLE IF NOT EXISTS "PriceZone" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL UNIQUE,
    "markupNok" DOUBLE PRECISION NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create PriceZoneCountry table
CREATE TABLE IF NOT EXISTS "PriceZoneCountry" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "zoneId" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PriceZoneCountry_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "PriceZone"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create unique index on (zoneId, country)
CREATE UNIQUE INDEX IF NOT EXISTS "PriceZoneCountry_zoneId_country_key" ON "PriceZoneCountry"("zoneId", "country");

-- Create index for zone lookups by country
CREATE INDEX IF NOT EXISTS "PriceZoneCountry_country_idx" ON "PriceZoneCountry"("country");

-- Add zoneMarkup column to OrderItem if it doesn't exist
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "zoneMarkup" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Insert default zones
INSERT INTO "PriceZone" ("name", "code", "markupNok", "priority")
VALUES 
    ('Norway', 'ZONE_0', 0, 0),
    ('Nordics & Nearby', 'ZONE_1', 280, 1),
    ('Central Europe', 'ZONE_2', 320, 2),
    ('Western & Southern Europe', 'ZONE_3', 370, 3),
    ('Southern Europe', 'ZONE_4', 409, 4)
ON CONFLICT ("code") DO NOTHING;

-- Get zone IDs and insert countries
DO $$
DECLARE
    zone0_id TEXT;
    zone1_id TEXT;
    zone2_id TEXT;
    zone3_id TEXT;
    zone4_id TEXT;
BEGIN
    SELECT "id" INTO zone0_id FROM "PriceZone" WHERE "code" = 'ZONE_0';
    SELECT "id" INTO zone1_id FROM "PriceZone" WHERE "code" = 'ZONE_1';
    SELECT "id" INTO zone2_id FROM "PriceZone" WHERE "code" = 'ZONE_2';
    SELECT "id" INTO zone3_id FROM "PriceZone" WHERE "code" = 'ZONE_3';
    SELECT "id" INTO zone4_id FROM "PriceZone" WHERE "code" = 'ZONE_4';

    -- Zone 0: Norway
    INSERT INTO "PriceZoneCountry" ("zoneId", "country") VALUES (zone0_id, 'NO') ON CONFLICT DO NOTHING;
    
    -- Zone 1: SE, DK, FI, DE, EE, LV, LT
    INSERT INTO "PriceZoneCountry" ("zoneId", "country") VALUES 
        (zone1_id, 'SE'), (zone1_id, 'DK'), (zone1_id, 'FI'), (zone1_id, 'DE'),
        (zone1_id, 'EE'), (zone1_id, 'LV'), (zone1_id, 'LT')
    ON CONFLICT DO NOTHING;
    
    -- Zone 2: NL, BE, AT, PL, CZ, SK, HU, LU, HR, BG
    INSERT INTO "PriceZoneCountry" ("zoneId", "country") VALUES 
        (zone2_id, 'NL'), (zone2_id, 'BE'), (zone2_id, 'AT'), (zone2_id, 'PL'),
        (zone2_id, 'CZ'), (zone2_id, 'SK'), (zone2_id, 'HU'), (zone2_id, 'LU'),
        (zone2_id, 'HR'), (zone2_id, 'BG')
    ON CONFLICT DO NOTHING;
    
    -- Zone 3: FR, IE, PT, SI, CY, MT
    INSERT INTO "PriceZoneCountry" ("zoneId", "country") VALUES 
        (zone3_id, 'FR'), (zone3_id, 'IE'), (zone3_id, 'PT'), (zone3_id, 'SI'),
        (zone3_id, 'CY'), (zone3_id, 'MT')
    ON CONFLICT DO NOTHING;
    
    -- Zone 4: ES, IT, GR, RO
    INSERT INTO "PriceZoneCountry" ("zoneId", "country") VALUES 
        (zone4_id, 'ES'), (zone4_id, 'IT'), (zone4_id, 'GR'), (zone4_id, 'RO')
    ON CONFLICT DO NOTHING;
END $$;