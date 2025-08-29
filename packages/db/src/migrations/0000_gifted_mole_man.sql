CREATE SCHEMA "users";
--> statement-breakpoint
CREATE TABLE "users"."sessions" (
	"id" varchar PRIMARY KEY NOT NULL,
	"tg_user_id" bigint NOT NULL,
	"session_token" varchar NOT NULL,
	"expires_at" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "users"."telegram_users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"tg_user_id" bigint NOT NULL,
	"first_name" varchar,
	"last_name" varchar,
	"username" varchar,
	"photo_url" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "telegram_users_tg_user_id_unique" UNIQUE("tg_user_id")
);
--> statement-breakpoint
CREATE TABLE "users"."user_flats" (
	"id" varchar PRIMARY KEY NOT NULL,
	"tg_user_id" bigint NOT NULL,
	"flat_id" varchar NOT NULL,
	"address" varchar NOT NULL,
	"rooms" integer NOT NULL,
	"floor" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users"."users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"username" varchar NOT NULL,
	"email" varchar NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "sessions_tg_user_id_idx" ON "users"."sessions" USING btree ("tg_user_id");--> statement-breakpoint
CREATE INDEX "sessions_token_idx" ON "users"."sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "telegram_users_tg_user_id_idx" ON "users"."telegram_users" USING btree ("tg_user_id");--> statement-breakpoint
CREATE INDEX "user_flats_tg_user_id_idx" ON "users"."user_flats" USING btree ("tg_user_id");--> statement-breakpoint
CREATE INDEX "user_flats_flat_id_idx" ON "users"."user_flats" USING btree ("flat_id");--> statement-breakpoint
CREATE INDEX "users_username_idx" ON "users"."users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users"."users" USING btree ("email");