-- Answer-group aliases: alternate spellings/names for the SAME enumeration
-- answer group (not separate answers). Additive, safe, non-destructive.
ALTER TABLE "AcceptedAnswer" ADD COLUMN "aliases" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
