CREATE TABLE "ai_insights" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ai_insights_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"content" text NOT NULL,
	"model" text NOT NULL,
	"input_market_ids" jsonb NOT NULL,
	"input_signals" jsonb NOT NULL,
	"report" jsonb,
	"raw_response" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_snapshots" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "market_snapshots_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"market_id" text NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"volume" double precision,
	"volume_24hr" double precision,
	"volume_1wk" double precision,
	"volume_1mo" double precision,
	"liquidity" double precision,
	"best_bid" double precision,
	"best_ask" double precision,
	"last_trade_price" double precision,
	"spread" double precision,
	"one_day_price_change" double precision,
	"one_week_price_change" double precision,
	"one_month_price_change" double precision,
	"outcome_prices" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "markets" (
	"id" text PRIMARY KEY NOT NULL,
	"condition_id" text,
	"question" text NOT NULL,
	"slug" text,
	"description" text,
	"category" text,
	"event_id" text,
	"event_slug" text,
	"event_title" text,
	"image" text,
	"icon" text,
	"active" boolean DEFAULT true NOT NULL,
	"closed" boolean DEFAULT false NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"accepting_orders" boolean DEFAULT false NOT NULL,
	"restricted" boolean DEFAULT false NOT NULL,
	"volume" double precision,
	"volume_24hr" double precision,
	"volume_1wk" double precision,
	"volume_1mo" double precision,
	"liquidity" double precision,
	"best_bid" double precision,
	"best_ask" double precision,
	"last_trade_price" double precision,
	"spread" double precision,
	"one_day_price_change" double precision,
	"one_week_price_change" double precision,
	"one_month_price_change" double precision,
	"outcomes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"outcome_prices" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"raw" jsonb NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"market_created_at" timestamp with time zone,
	"market_updated_at" timestamp with time zone,
	"last_synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "market_snapshots" ADD CONSTRAINT "market_snapshots_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_insights_created_at_idx" ON "ai_insights" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "market_snapshots_market_time_idx" ON "market_snapshots" USING btree ("market_id","captured_at");--> statement-breakpoint
CREATE INDEX "markets_active_closed_idx" ON "markets" USING btree ("active","closed");--> statement-breakpoint
CREATE INDEX "markets_volume_idx" ON "markets" USING btree ("volume");--> statement-breakpoint
CREATE INDEX "markets_slug_idx" ON "markets" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "markets_event_id_idx" ON "markets" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "markets_end_date_idx" ON "markets" USING btree ("end_date");