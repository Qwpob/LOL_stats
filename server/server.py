"""LoL Match Tracker backend — Python standard library only (no pip installs).

Serves the static frontend from ../public and provides a small JSON API that
proxies Riot's API (or returns mock data when no RIOT_API_KEY is set).

Run:  python server/server.py
Open: http://localhost:3000
"""

import json
import mimetypes
import os
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs, unquote

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)  # so `import riot_client` / `mock_data` works

# Load .env (if present) before importing the client, so the API key is picked up.
def _load_dotenv():
    env_path = os.path.join(HERE, "..", ".env")
    try:
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                key, value = key.strip(), value.strip()
                if (value.startswith('"') and value.endswith('"')) or (
                    value.startswith("'") and value.endswith("'")
                ):
                    value = value[1:-1]
                os.environ.setdefault(key, value)
    except FileNotFoundError:
        pass  # No .env — fall back to mock mode.


_load_dotenv()

import riot_client  # noqa: E402  (imported after .env is loaded)

PUBLIC_DIR = os.path.abspath(os.path.join(HERE, "..", "public"))
PORT = int(os.environ.get("PORT", "3000"))

# Simple in-memory cache to avoid hammering the API (and mock generator).
_CACHE = {}
_TTL_MS = 60 * 1000


def _now_ms():
    return int(time.time() * 1000)


def cached(key, fn):
    hit = _CACHE.get(key)
    if hit and _now_ms() - hit["time"] < _TTL_MS:
        return hit["value"]
    value = fn()
    _CACHE[key] = {"value": value, "time": _now_ms()}
    return value


def extract_participant(match, puuid):
    participants = match["info"]["participants"]
    p = next((x for x in participants if x["puuid"] == puuid), participants[0])
    total_cs = p.get("totalMinionsKilled", 0) + p.get("neutralMinionsKilled", 0)
    kda = (p["kills"] + p["assists"]) if p["deaths"] == 0 else (p["kills"] + p["assists"]) / p["deaths"]

    # Team-relative influence metrics (need all teammates).
    team_id = p.get("teamId")
    teammates = [x for x in participants if x.get("teamId") == team_id] or [p]
    team_kills = sum(x.get("kills", 0) for x in teammates)
    team_damage = sum(x.get("totalDamageDealtToChampions", 0) for x in teammates)
    team_gold = sum(x.get("goldEarned", 0) for x in teammates)
    kill_participation = min((p["kills"] + p["assists"]) / team_kills, 1.0) if team_kills else 0.0
    damage_share = p["totalDamageDealtToChampions"] / team_damage if team_damage else 0.0
    gold_share = p.get("goldEarned", 0) / team_gold if team_gold else 0.0
    minutes = match["info"]["gameDuration"] / 60

    return {
        "matchId": match["metadata"]["matchId"],
        "queueId": match["info"]["queueId"],
        "queueName": match["info"].get("queueName") or f"Queue {match['info']['queueId']}",
        "gameEndTimestamp": match["info"]["gameEndTimestamp"],
        "gameDuration": match["info"]["gameDuration"],
        "championName": p["championName"],
        "championDisplayName": p.get("championDisplayName") or p["championName"],
        "role": p.get("teamPosition"),
        "win": p["win"],
        "kills": p["kills"],
        "deaths": p["deaths"],
        "assists": p["assists"],
        "kda": round(kda, 2),
        "cs": total_cs,
        "csPerMin": round(total_cs / minutes, 1) if minutes else 0,
        "goldEarned": p["goldEarned"],
        "damage": p["totalDamageDealtToChampions"],
        "visionScore": p["visionScore"],
        "visionPerMin": round(p["visionScore"] / minutes, 2) if minutes else 0,
        "killParticipation": round(kill_participation, 3),
        "damageShare": round(damage_share, 3),
        "goldShare": round(gold_share, 3),
        "teamKills": team_kills,
        "summonerSpells": [p["summoner1Id"], p["summoner2Id"]],
        "items": [p["item0"], p["item1"], p["item2"], p["item3"], p["item4"], p["item5"], p["item6"]],
    }


# --- API handlers -----------------------------------------------------------

def handle_meta():
    return 200, {
        "mode": "mock" if riot_client.using_mock_data else "live",
        "ddragonVersion": riot_client.get_ddragon_version(),
    }


def handle_profile(name, tag, region):
    platform, route = riot_client.resolve_region(region)

    def build():
        account = riot_client.get_account_by_riot_id(name, tag, route=route)
        summoner = riot_client.get_summoner_by_puuid(account["puuid"], platform=platform)
        ranked = riot_client.get_ranked_by_puuid(account["puuid"], platform=platform)
        return {"account": account, "summoner": summoner, "ranked": ranked}

    return 200, cached(f"profile:{region}:{name}#{tag}", build)


def handle_matches(name, tag, count, region):
    n = min(int(count) if count else 20, 20)
    platform, route = riot_client.resolve_region(region)

    def build():
        account = riot_client.get_account_by_riot_id(name, tag, route=route)
        ids = riot_client.get_match_ids(account["puuid"], count=n, route=route)
        matches = [riot_client.get_match(mid, route=route) for mid in ids]
        return [extract_participant(m, account["puuid"]) for m in matches]

    return 200, cached(f"matches:{region}:{name}#{tag}:{n}", build)


# --- HTTP request handler ---------------------------------------------------

class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass  # Quieter console.

    def _send_json(self, status, body):
        payload = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def _serve_static(self, path):
        url_path = unquote(path)
        if url_path == "/":
            url_path = "/index.html"
        file_path = os.path.abspath(os.path.join(PUBLIC_DIR, url_path.lstrip("/")))
        # Prevent path traversal outside the public directory.
        if not file_path.startswith(PUBLIC_DIR):
            self.send_error(403, "Forbidden")
            return
        if not os.path.isfile(file_path):
            self.send_error(404, "Not Found")
            return
        ctype = mimetypes.guess_type(file_path)[0] or "application/octet-stream"
        with open(file_path, "rb") as f:
            data = f.read()
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        parts = [p for p in path.split("/") if p]
        query = parse_qs(parsed.query)

        try:
            if path == "/api/meta":
                return self._send_json(*handle_meta())

            if len(parts) == 4 and parts[0] == "api" and parts[1] == "profile":
                region = query.get("region", [None])[0]
                return self._send_json(*handle_profile(unquote(parts[2]), unquote(parts[3]), region))

            if len(parts) == 4 and parts[0] == "api" and parts[1] == "matches":
                count = query.get("count", [None])[0]
                region = query.get("region", [None])[0]
                return self._send_json(*handle_matches(unquote(parts[2]), unquote(parts[3]), count, region))

            if parts and parts[0] == "api":
                return self._send_json(404, {"error": "Not found"})

            # Fall through to static files.
            self._serve_static(path)
        except riot_client.RiotApiError as err:
            self._send_json(err.status or 500, {"error": str(err), "details": err.details})
        except Exception as err:  # noqa: BLE001
            self._send_json(500, {"error": str(err)})


def main():
    server = ThreadingHTTPServer(("", PORT), Handler)
    mode = "MOCK DATA (no API key set)" if riot_client.using_mock_data else "LIVE Riot API"
    print(f"\nLoL Match Tracker running:  http://localhost:{PORT}")
    print(f"Mode: {mode}\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
        server.shutdown()


if __name__ == "__main__":
    main()
