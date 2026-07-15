"""Thin Riot API client. When RIOT_API_KEY is set it calls the live API; otherwise
it returns mock data so the app works out of the box. Standard library only.
"""

import json
import os
import urllib.parse
import urllib.request
import urllib.error

import mock_data

API_KEY = (os.environ.get("RIOT_API_KEY") or "").strip()
REGIONAL = (os.environ.get("RIOT_REGIONAL_ROUTE") or "").strip() or "europe"
PLATFORM = (os.environ.get("RIOT_PLATFORM") or "").strip() or "eun1"

using_mock_data = not API_KEY

# region key -> platform host + regional routing cluster.
REGION_MAP = {
    "EUNE": {"platform": "eun1", "regional": "europe"},
    "EUW": {"platform": "euw1", "regional": "europe"},
    "TR": {"platform": "tr1", "regional": "europe"},
    "RU": {"platform": "ru", "regional": "europe"},
    "NA": {"platform": "na1", "regional": "americas"},
    "BR": {"platform": "br1", "regional": "americas"},
    "LAN": {"platform": "la1", "regional": "americas"},
    "LAS": {"platform": "la2", "regional": "americas"},
    "OCE": {"platform": "oc1", "regional": "sea"},
    "KR": {"platform": "kr", "regional": "asia"},
    "JP": {"platform": "jp1", "regional": "asia"},
}


def resolve_region(region):
    """Return (platform, regional_route) for a region key, falling back to env defaults."""
    entry = REGION_MAP.get((region or "").strip().upper())
    if entry:
        return entry["platform"], entry["regional"]
    return PLATFORM, REGIONAL


class RiotApiError(Exception):
    def __init__(self, message, status=500, details=""):
        super().__init__(message)
        self.status = status
        self.details = details


def _regional_host(route):
    return f"https://{route}.api.riotgames.com"


def _platform_host(platform):
    return f"https://{platform}.api.riotgames.com"


def _riot_fetch(url):
    req = urllib.request.Request(
        url,
        headers={
            "X-Riot-Token": API_KEY,
            # Cloudflare blocks the default urllib User-Agent (error 1010), so set a real one.
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) lol-match-tracker/1.0",
            "Accept": "application/json",
            "Accept-Language": "en-US,en;q=0.9",
        },
    )
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = ""
        try:
            body = e.read().decode("utf-8")
        except Exception:
            pass
        raise RiotApiError(f"Riot API {e.code} {e.reason}", status=e.code, details=body)
    except urllib.error.URLError as e:
        raise RiotApiError(f"Riot API request failed: {e.reason}", status=502)


# --- Public methods ---------------------------------------------------------

def get_account_by_riot_id(game_name, tag_line, route=REGIONAL):
    if using_mock_data:
        return mock_data.account
    url = (
        f"{_regional_host(route)}/riot/account/v1/accounts/by-riot-id/"
        f"{urllib.parse.quote(game_name)}/{urllib.parse.quote(tag_line)}"
    )
    return _riot_fetch(url)


def get_summoner_by_puuid(puuid, platform=PLATFORM):
    if using_mock_data:
        return mock_data.summoner
    url = f"{_platform_host(platform)}/lol/summoner/v4/summoners/by-puuid/{puuid}"
    return _riot_fetch(url)


def get_ranked_by_puuid(puuid, platform=PLATFORM):
    if using_mock_data:
        return mock_data.ranked
    url = f"{_platform_host(platform)}/lol/league/v4/entries/by-puuid/{puuid}"
    return _riot_fetch(url)


def get_match_ids(puuid, start=0, count=20, route=REGIONAL):
    if using_mock_data:
        return [m["metadata"]["matchId"] for m in mock_data.build_matches(count)]
    url = (
        f"{_regional_host(route)}/lol/match/v5/matches/by-puuid/{puuid}/ids"
        f"?start={start}&count={count}"
    )
    return _riot_fetch(url)


def get_match(match_id, route=REGIONAL):
    if using_mock_data:
        index = int(str(match_id).split("_")[-1]) - 1000000
        matches = mock_data.build_matches(20)
        if 0 <= index < len(matches):
            return matches[index]
        return mock_data.build_matches(1)[0]
    url = f"{_regional_host(route)}/lol/match/v5/matches/{match_id}"
    return _riot_fetch(url)


def get_ddragon_version():
    return mock_data.DDRAGON_VERSION
