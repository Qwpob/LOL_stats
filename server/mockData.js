// Realistic mock data shaped like Riot's account-v1 / summoner-v4 / match-v5 responses.
// Used automatically when no RIOT_API_KEY is configured, so the whole UI works offline.

const DDRAGON_VERSION = '14.13.1';

const account = {
  puuid: 'mock-puuid-dogmilk-eune-0000000000000000000000000000000000000000',
  gameName: 'Dogmilk',
  tagLine: 'EUNE',
};

const summoner = {
  id: 'mock-summoner-id',
  accountId: 'mock-account-id',
  puuid: account.puuid,
  name: 'Dogmilk',
  profileIconId: 5241,
  summonerLevel: 327,
};

const ranked = [
  {
    queueType: 'RANKED_SOLO_5x5',
    tier: 'PLATINUM',
    rank: 'II',
    leaguePoints: 64,
    wins: 138,
    losses: 121,
  },
  {
    queueType: 'RANKED_FLEX_SR',
    tier: 'GOLD',
    rank: 'I',
    leaguePoints: 22,
    wins: 47,
    losses: 39,
  },
];

// Champion pool used to generate varied matches.
const CHAMPS = [
  { name: 'Ahri', id: 'Ahri', role: 'MIDDLE' },
  { name: 'Lee Sin', id: 'LeeSin', role: 'JUNGLE' },
  { name: 'Jinx', id: 'Jinx', role: 'BOTTOM' },
  { name: 'Thresh', id: 'Thresh', role: 'UTILITY' },
  { name: 'Darius', id: 'Darius', role: 'TOP' },
  { name: 'Kai\'Sa', id: 'Kaisa', role: 'BOTTOM' },
  { name: 'Yasuo', id: 'Yasuo', role: 'MIDDLE' },
  { name: 'Sett', id: 'Sett', role: 'TOP' },
  { name: 'Lux', id: 'Lux', role: 'UTILITY' },
  { name: 'Viego', id: 'Viego', role: 'JUNGLE' },
];

const QUEUES = {
  420: 'Ranked Solo/Duo',
  440: 'Ranked Flex',
  400: 'Normal Draft',
  450: 'ARAM',
};

const ITEMS = [3153, 3157, 6655, 3020, 3135, 3089, 3115, 3006, 3031, 3094, 3072, 3033];
const SUMMONER_SPELLS = [4, 7, 12, 14, 6, 11, 3, 21];

// Deterministic pseudo-random so mock data is stable across restarts.
function seeded(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function pick(rand, arr) {
  return arr[Math.floor(rand() * arr.length)];
}

function buildMatch(index) {
  const rand = seeded(index * 7919 + 13);
  const champ = pick(rand, CHAMPS);
  const win = rand() > 0.45;
  const queueId = pick(rand, [420, 420, 440, 400, 450]);

  const kills = Math.floor(rand() * 15);
  const deaths = Math.floor(rand() * 10);
  const assists = Math.floor(rand() * 20);
  const durationSec = 1200 + Math.floor(rand() * 1400); // 20–43 min
  const cs = Math.floor((durationSec / 60) * (5 + rand() * 4));
  const gameEnd = Date.now() - index * 1000 * 60 * 60 * 8; // every ~8h back

  const items = Array.from({ length: 6 }, () => pick(rand, ITEMS));

  return {
    metadata: {
      matchId: `EUN1_MOCK_${1000000 + index}`,
      participants: [account.puuid],
    },
    info: {
      gameCreation: gameEnd - durationSec * 1000,
      gameEndTimestamp: gameEnd,
      gameDuration: durationSec,
      queueId,
      queueName: QUEUES[queueId],
      gameVersion: DDRAGON_VERSION,
      participants: [
        {
          puuid: account.puuid,
          summonerName: account.gameName,
          championName: champ.id,
          championDisplayName: champ.name,
          teamPosition: champ.role,
          win,
          kills,
          deaths,
          assists,
          totalMinionsKilled: cs,
          neutralMinionsKilled: 0,
          goldEarned: 8000 + Math.floor(rand() * 9000),
          totalDamageDealtToChampions: 12000 + Math.floor(rand() * 30000),
          visionScore: Math.floor(rand() * 60),
          summoner1Id: pick(rand, SUMMONER_SPELLS),
          summoner2Id: pick(rand, SUMMONER_SPELLS),
          item0: items[0],
          item1: items[1],
          item2: items[2],
          item3: items[3],
          item4: items[4],
          item5: items[5],
          item6: 3364,
        },
      ],
    },
  };
}

function buildMatches(count = 20) {
  return Array.from({ length: count }, (_, i) => buildMatch(i));
}

export const mock = {
  ddragonVersion: DDRAGON_VERSION,
  account,
  summoner,
  ranked,
  buildMatches,
};
