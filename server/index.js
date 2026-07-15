import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load .env (if present) into process.env — tiny parser, no dependency.
loadDotEnv();

const {
  getAccountByRiotId,
  getSummonerByPuuid,
  getRankedByPuuid,
  getMatchIds,
  getMatch,
  getDdragonVersion,
  usingMockData,
} = await import('./riotClient.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const PORT = process.env.PORT || 3000;

// Simple in-memory cache to avoid hammering the API (and mock generator).
const cache = new Map();
const TTL_MS = 60 * 1000;
async function cached(key, fn) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.time < TTL_MS) return hit.value;
  const value = await fn();
  cache.set(key, { value, time: Date.now() });
  return value;
}

function extractParticipant(match, puuid) {
  const p = match.info.participants.find((x) => x.puuid === puuid) || match.info.participants[0];
  const kda = p.deaths === 0 ? p.kills + p.assists : (p.kills + p.assists) / p.deaths;
  return {
    matchId: match.metadata.matchId,
    queueId: match.info.queueId,
    queueName: match.info.queueName || `Queue ${match.info.queueId}`,
    gameEndTimestamp: match.info.gameEndTimestamp,
    gameDuration: match.info.gameDuration,
    championName: p.championName,
    championDisplayName: p.championDisplayName || p.championName,
    role: p.teamPosition,
    win: p.win,
    kills: p.kills,
    deaths: p.deaths,
    assists: p.assists,
    kda: Number(kda.toFixed(2)),
    cs: (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0),
    csPerMin: Number((((p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0)) / (match.info.gameDuration / 60)).toFixed(1)),
    goldEarned: p.goldEarned,
    damage: p.totalDamageDealtToChampions,
    visionScore: p.visionScore,
    summonerSpells: [p.summoner1Id, p.summoner2Id],
    items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6],
  };
}

// --- API handlers -----------------------------------------------------------

async function handleMeta() {
  return { status: 200, body: { mode: usingMockData ? 'mock' : 'live', ddragonVersion: getDdragonVersion() } };
}

async function handleProfile(name, tag) {
  const data = await cached(`profile:${name}#${tag}`, async () => {
    const account = await getAccountByRiotId(name, tag);
    const [summoner, ranked] = await Promise.all([
      getSummonerByPuuid(account.puuid),
      getRankedByPuuid(account.puuid),
    ]);
    return { account, summoner, ranked };
  });
  return { status: 200, body: data };
}

async function handleMatches(name, tag, count) {
  const n = Math.min(Number(count) || 20, 20);
  const rows = await cached(`matches:${name}#${tag}:${n}`, async () => {
    const account = await getAccountByRiotId(name, tag);
    const ids = await getMatchIds(account.puuid, { count: n });
    const matches = await Promise.all(ids.map((id) => getMatch(id)));
    return matches.map((m) => extractParticipant(m, account.puuid));
  });
  return { status: 200, body: rows };
}

// --- Static file serving ----------------------------------------------------

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(PUBLIC_DIR, urlPath);
  // Prevent path traversal outside the public directory.
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

// --- Router -----------------------------------------------------------------

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const { pathname, searchParams } = url;
  const parts = pathname.split('/').filter(Boolean); // e.g. ['api','profile','name','tag']

  try {
    if (req.method === 'GET' && pathname === '/api/meta') {
      const { status, body } = await handleMeta();
      return sendJson(res, status, body);
    }

    if (req.method === 'GET' && parts[0] === 'api' && parts[1] === 'profile' && parts.length === 4) {
      const { status, body } = await handleProfile(decodeURIComponent(parts[2]), decodeURIComponent(parts[3]));
      return sendJson(res, status, body);
    }

    if (req.method === 'GET' && parts[0] === 'api' && parts[1] === 'matches' && parts.length === 4) {
      const { status, body } = await handleMatches(
        decodeURIComponent(parts[2]),
        decodeURIComponent(parts[3]),
        searchParams.get('count')
      );
      return sendJson(res, status, body);
    }

    if (parts[0] === 'api') {
      return sendJson(res, 404, { error: 'Not found' });
    }

    // Fall through to static files.
    serveStatic(req, res);
  } catch (err) {
    sendJson(res, err.status || 500, { error: err.message, details: err.details });
  }
});

server.listen(PORT, () => {
  console.log(`\nLoL Match Tracker running:  http://localhost:${PORT}`);
  console.log(`Mode: ${usingMockData ? 'MOCK DATA (no API key set)' : 'LIVE Riot API'}\n`);
});

// --- Helpers ----------------------------------------------------------------

function loadDotEnv() {
  try {
    const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env');
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      // Strip optional surrounding quotes.
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // No .env file — that's fine, we fall back to mock mode.
  }
}
