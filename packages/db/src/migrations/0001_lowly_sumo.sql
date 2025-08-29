CREATE TABLE "users.sessions" (
	"id" varchar PRIMARY KEY NOT NULL,
	"tg_user_id" bigint NOT NULL,
	"session_token" varchar NOT NULL,
	"expires_at" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users.sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "users.telegram_users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"tg_user_id" bigint NOT NULL,
	"first_name" varchar,
	"last_name" varchar,
	"username" varchar,
	"photo_url" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users.telegram_users_tg_user_id_unique" UNIQUE("tg_user_id")
);
--> statement-breakpoint
DROP TABLE "sessions" CASCADE;--> statement-breakpoint
DROP TABLE "telegram_users" CASCADE;--> statement-breakpoint
CREATE INDEX "sessions_tg_user_id_idx" ON "users.sessions" USING btree ("tg_user_id");--> statement-breakpoint
CREATE INDEX "sessions_token_idx" ON "users.sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "telegram_users_tg_user_id_idx" ON "users.telegram_users" USING btree ("tg_user_id");