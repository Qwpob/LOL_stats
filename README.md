# LoL Match Tracker

A League of Legends match tracker with a Node.js proxy backend and a plain web frontend.
Runs out of the box with realistic **mock data** — add a Riot API key later to go live.

## Why a backend?

Riot's API can't be called directly from the browser (CORS) and your API key must stay
secret. The Node server acts as a proxy: the frontend talks to `http://localhost:3000/api/*`,
and the server talks to Riot (or serves mock data).

## Run

```powershell
npm install
npm start
```

Then open http://localhost:3000. It defaults to **Dogmilk#EUNE** and shows the profile,
ranked info, and recent matches.

## Go live with the real Riot API

1. Get a key at https://developer.riotgames.com/
2. Copy `.env.example` to `.env` and set:
   - `RIOT_API_KEY` — your key
   - `RIOT_REGIONAL_ROUTE` — `europe` for EUNE/EUW (match & account APIs)
   - `RIOT_PLATFORM` — `eun1` for EUNE (summoner & league APIs)
3. Restart `npm start`. The badge in the header switches from **Mock Data** to **Live API**.

> Note: development keys from Riot expire every 24h and are rate-limited.

## Structure

- `server/index.js` — Express server, API routes, caching, static hosting
- `server/riotClient.js` — Riot API client with automatic mock fallback
- `server/mockData.js` — deterministic sample data
- `public/` — frontend (HTML/CSS/JS), champion art via Data Dragon CDN

Not affiliated with Riot Games.
