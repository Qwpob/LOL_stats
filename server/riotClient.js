// Thin Riot API client. When RIOT_API_KEY is set it calls the live API; otherwise
// it returns mock data so the app works out of the box.

import { mock } from './mockData.js';

const API_KEY = process.env.RIOT_API_KEY?.trim();
const REGIONAL = process.env.RIOT_REGIONAL_ROUTE?.trim() || 'europe';
const PLATFORM = process.env.RIOT_PLATFORM?.trim() || 'eun1';

export const usingMockData = !API_KEY;

function regionalHost(route) {
  return `https://${route}.api.riotgames.com`;
}

function platformHost(platform) {
  return `https://${platform}.api.riotgames.com`;
}

async function riotFetch(url) {
  const res = await fetch(url, { headers: { 'X-Riot-Token': API_KEY } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(`Riot API ${res.status} ${res.statusText}`);
    err.status = res.status;
    err.details = body;
    throw err;
  }
  return res.json();
}

// --- Public methods ---------------------------------------------------------

export async function getAccountByRiotId(gameName, tagLine, route = REGIONAL) {
  if (usingMockData) return mock.account;
  const url = `${regionalHost(route)}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
    gameName
  )}/${encodeURIComponent(tagLine)}`;
  return riotFetch(url);
}

export async function getSummonerByPuuid(puuid, platform = PLATFORM) {
  if (usingMockData) return mock.summoner;
  const url = `${platformHost(platform)}/lol/summoner/v4/summoners/by-puuid/${puuid}`;
  return riotFetch(url);
}

export async function getRankedByPuuid(puuid, platform = PLATFORM) {
  if (usingMockData) return mock.ranked;
  // league-v4 by-puuid endpoint
  const url = `${platformHost(platform)}/lol/league/v4/entries/by-puuid/${puuid}`;
  return riotFetch(url);
}

export async function getMatchIds(puuid, { start = 0, count = 20 } = {}, route = REGIONAL) {
  if (usingMockData) {
    return mock.buildMatches(count).map((m) => m.metadata.matchId);
  }
  const url = `${regionalHost(
    route
  )}/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}`;
  return riotFetch(url);
}

export async function getMatch(matchId, route = REGIONAL) {
  if (usingMockData) {
    const index = Number(String(matchId).split('_').pop()) - 1000000;
    return mock.buildMatches(20)[index] ?? mock.buildMatches(1)[0];
  }
  const url = `${regionalHost(route)}/lol/match/v5/matches/${matchId}`;
  return riotFetch(url);
}

export function getDdragonVersion() {
  return mock.ddragonVersion;
}
