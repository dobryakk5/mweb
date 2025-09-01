-- Create ad_history table for tracking price and views changes
CREATE TABLE IF NOT EXISTS "users"."ad_history" (
    "id" integer PRIMARY KEY NOT NULL,
    "ad_id" integer NOT NULL,
    "price" integer,
    "views_today" smallint,
    "total_views" integer,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "ad_history_ad_id_idx" ON "users"."ad_history" ("ad_id");
CREATE INDEX IF NOT EXISTS "ad_history_created_at_idx" ON "users"."ad_history" ("created_at");

-- Add foreign key constraint
ALTER TABLE "users"."ad_history" ADD CONSTRAINT "ad_history_ad_id_ads_id_fk" 
    FOREIGN KEY ("ad_id") REFERENCES "users"."ads"("id") ON DELETE CASCADE;

-- Create sequence for id auto-increment
CREATE SEQUENCE IF NOT EXISTS "users"."ad_history_id_seq";
ALTER TABLE "users"."ad_history" ALTER COLUMN "id" SET DEFAULT nextval('"users"."ad_history_id_seq"'::regclass);