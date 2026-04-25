# Market Dashboard

Polymarket intelligence dashboard built for the PredictQ live build. It ingests
Gamma markets, stores current state plus snapshots, exposes API routes, and
generates a Market Movers Brief from stored movement data.

## Setup

```bash
npm install
npm run db:migrate
npm run ingest:markets
npm run dev
```

Required env vars:

```bash
DATABASE_URL=
CRON_SECRET=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
```

## Architecture

- `markets` stores normalized current Gamma market state.
- `market_snapshots` stores time-series observations for charting and movers.
- `ai_insights` stores generated Market Movers Briefs and their input signals.
- `/api/cron/ingest` polls Gamma every minute on Vercel.
- `/api/cron/insights` generates a new AI brief hourly.
- Frontend reads from the app database through server-side helpers.

## API Smoke Checks

```bash
curl "http://localhost:3000/markets?limit=10"
curl "http://localhost:3000/markets/:id"
curl "http://localhost:3000/markets/:id/history?window=24h"
curl "http://localhost:3000/insights/trends"
curl "http://localhost:3000/insights/trends?refresh=true"
```

Local dev allows direct cron endpoint clicks. Production cron endpoints require
`Authorization: Bearer $CRON_SECRET`.

## Tradeoffs

I prioritized the working pipeline over polish: ingestion, storage, API,
frontend, then AI. I skipped SSE/WebSockets and kept the UI plain. Snapshot
retention/downsampling would be the first scaling improvement after the demo.

## Deploy

Deploy to Vercel and set the env vars above. Cron schedules are defined in
`vercel.json`.