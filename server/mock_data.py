"""Realistic mock data shaped like Riot's account-v1 / summoner-v4 / match-v5 responses.
Used automatically when no RIOT_API_KEY is configured, so the whole UI works offline.
"""

import time

DDRAGON_VERSION = "14.13.1"

account = {
    "puuid": "mock-puuid-dogmilk-eune-0000000000000000000000000000000000000000",
    "gameName": "Dogmilk",
    "tagLine": "EUNE",
}

summoner = {
    "id": "mock-summoner-id",
    "accountId": "mock-account-id",
    "puuid": account["puuid"],
    "name": "Dogmilk",
    "profileIconId": 5241,
    "summonerLevel": 327,
}

ranked = [
    {
        "queueType": "RANKED_SOLO_5x5",
        "tier": "PLATINUM",
        "rank": "II",
        "leaguePoints": 64,
        "wins": 138,
        "losses": 121,
    },
    {
        "queueType": "RANKED_FLEX_SR",
        "tier": "GOLD",
        "rank": "I",
        "leaguePoints": 22,
        "wins": 47,
        "losses": 39,
    },
]

# Champion pool used to generate varied matches.
CHAMPS = [
    {"name": "Ahri", "id": "Ahri", "role": "MIDDLE"},
    {"name": "Lee Sin", "id": "LeeSin", "role": "JUNGLE"},
    {"name": "Jinx", "id": "Jinx", "role": "BOTTOM"},
    {"name": "Thresh", "id": "Thresh", "role": "UTILITY"},
    {"name": "Darius", "id": "Darius", "role": "TOP"},
    {"name": "Kai'Sa", "id": "Kaisa", "role": "BOTTOM"},
    {"name": "Yasuo", "id": "Yasuo", "role": "MIDDLE"},
    {"name": "Sett", "id": "Sett", "role": "TOP"},
    {"name": "Lux", "id": "Lux", "role": "UTILITY"},
    {"name": "Viego", "id": "Viego", "role": "JUNGLE"},
]

QUEUES = {
    420: "Ranked Solo/Duo",
    440: "Ranked Flex",
    400: "Normal Draft",
    450: "ARAM",
}

ITEMS = [3153, 3157, 6655, 3020, 3135, 3089, 3115, 3006, 3031, 3094, 3072, 3033]
SUMMONER_SPELLS = [4, 7, 12, 14, 6, 11, 3, 21]


def _seeded(seed):
    """Deterministic pseudo-random so mock data is stable across restarts."""
    s = seed % 2147483647
    if s <= 0:
        s += 2147483646

    state = {"s": s}

    def rand():
        state["s"] = (state["s"] * 16807) % 2147483647
        return state["s"] / 2147483647

    return rand


def _pick(rand, arr):
    return arr[int(rand() * len(arr))]


def _now_ms():
    return int(time.time() * 1000)


def build_match(index):
    rand = _seeded(index * 7919 + 13)
    champ = _pick(rand, CHAMPS)
    win = rand() > 0.45
    queue_id = _pick(rand, [420, 420, 440, 400, 450])

    kills = int(rand() * 15)
    deaths = int(rand() * 10)
    assists = int(rand() * 20)
    duration_sec = 1200 + int(rand() * 1400)  # 20-43 min
    cs = int((duration_sec / 60) * (5 + rand() * 4))
    game_end = _now_ms() - index * 1000 * 60 * 60 * 8  # every ~8h back

    items = [_pick(rand, ITEMS) for _ in range(6)]

    return {
        "metadata": {
            "matchId": f"EUN1_MOCK_{1000000 + index}",
            "participants": [account["puuid"]],
        },
        "info": {
            "gameCreation": game_end - duration_sec * 1000,
            "gameEndTimestamp": game_end,
            "gameDuration": duration_sec,
            "queueId": queue_id,
            "queueName": QUEUES[queue_id],
            "gameVersion": DDRAGON_VERSION,
            "participants": [
                {
                    "puuid": account["puuid"],
                    "summonerName": account["gameName"],
                    "championName": champ["id"],
                    "championDisplayName": champ["name"],
                    "teamPosition": champ["role"],
                    "win": win,
                    "kills": kills,
                    "deaths": deaths,
                    "assists": assists,
                    "totalMinionsKilled": cs,
                    "neutralMinionsKilled": 0,
                    "goldEarned": 8000 + int(rand() * 9000),
                    "totalDamageDealtToChampions": 12000 + int(rand() * 30000),
                    "visionScore": int(rand() * 60),
                    "summoner1Id": _pick(rand, SUMMONER_SPELLS),
                    "summoner2Id": _pick(rand, SUMMONER_SPELLS),
                    "item0": items[0],
                    "item1": items[1],
                    "item2": items[2],
                    "item3": items[3],
                    "item4": items[4],
                    "item5": items[5],
                    "item6": 3364,
                }
            ],
        },
    }


def build_matches(count=20):
    return [build_match(i) for i in range(count)]
