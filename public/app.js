// LoL Match Tracker frontend. Talks to the local proxy backend (server/index.js).

const DDRAGON = 'https://ddragon.leagueoflegends.com/cdn';
let ddVersion = '14.13.1';

// Summoner spell id -> Data Dragon key (subset covering common spells).
const SPELL_KEYS = {
  1: 'SummonerBoost',
  3: 'SummonerExhaust',
  4: 'SummonerFlash',
  6: 'SummonerHaste',
  7: 'SummonerHeal',
  11: 'SummonerSmite',
  12: 'SummonerTeleport',
  14: 'SummonerDot',
  21: 'SummonerBarrier',
  32: 'SummonerSnowball',
};

const ROLE_LABEL = {
  TOP: 'Top',
  JUNGLE: 'Jungle',
  MIDDLE: 'Mid',
  BOTTOM: 'Bot',
  UTILITY: 'Support',
};

const el = (id) => document.getElementById(id);

function champIcon(name) {
  return `${DDRAGON}/${ddVersion}/img/champion/${name}.png`;
}
function itemIcon(id) {
  return id ? `${DDRAGON}/${ddVersion}/img/item/${id}.png` : '';
}
function spellIcon(id) {
  const key = SPELL_KEYS[id];
  return key ? `${DDRAGON}/${ddVersion}/img/spell/${key}.png` : '';
}
function profileIcon(id) {
  return `${DDRAGON}/${ddVersion}/img/profileicon/${id}.png`;
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function duration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// --- Match analysis: impact score + match-specific tips ----------------------

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// Role-weighted influence score (0–100) computed from THIS match's numbers.
function impactScore(m) {
  const mins = m.gameDuration / 60 || 1;
  const deathsPerMin = m.deaths / mins;

  const sub = {
    kp: clamp(m.killParticipation ?? 0, 0, 1),
    dmg: clamp((m.damageShare ?? 0) / 0.3, 0, 1), // 30% of team damage = full marks
    kda: clamp(m.kda / 5, 0, 1),
    cs: clamp(m.csPerMin / 8, 0, 1),
    vis: clamp((m.visionPerMin ?? 0) / (m.role === 'UTILITY' ? 2 : 1.2), 0, 1),
    surv: 1 - clamp(deathsPerMin / 0.4, 0, 1), // fewer deaths = better
  };

  const W = {
    MIDDLE: { dmg: 0.3, kda: 0.2, kp: 0.2, cs: 0.2, surv: 0.1 },
    BOTTOM: { dmg: 0.3, kda: 0.2, kp: 0.2, cs: 0.2, surv: 0.1 },
    TOP: { dmg: 0.25, kda: 0.2, kp: 0.15, cs: 0.25, surv: 0.15 },
    JUNGLE: { kp: 0.3, dmg: 0.2, kda: 0.15, vis: 0.15, surv: 0.2 },
    UTILITY: { kp: 0.3, vis: 0.35, kda: 0.15, surv: 0.2 },
  };
  const weights = W[m.role] || { kp: 0.25, dmg: 0.25, kda: 0.2, cs: 0.15, surv: 0.15 };

  let score = 0;
  for (const [k, w] of Object.entries(weights)) score += w * (sub[k] ?? 0);
  return Math.round(score * 100);
}

function impactLabel(score) {
  if (score >= 75) return { text: 'Carry', cls: 'carry' };
  if (score >= 58) return { text: 'High impact', cls: 'high' };
  if (score >= 42) return { text: 'Solid', cls: 'solid' };
  if (score >= 28) return { text: 'Low impact', cls: 'low' };
  return { text: 'Passenger', cls: 'passenger' };
}

// Tips derived from THIS match's stats — not generic advice.
function matchTips(m) {
  const tips = [];
  const mins = m.gameDuration / 60 || 1;
  const role = m.role;
  const roleName = ROLE_LABEL[role] || role || 'your role';
  const kpPct = Math.round((m.killParticipation ?? 0) * 100);
  const dmgPct = Math.round((m.damageShare ?? 0) * 100);
  const farmRole = ['TOP', 'MIDDLE', 'BOTTOM', 'JUNGLE'].includes(role);

  // Deaths / survival
  if (m.deaths >= 8) {
    tips.push({
      type: 'warn',
      text: `You died ${m.deaths} times in ${duration(m.gameDuration)} — about one every ${(mins / m.deaths).toFixed(1)} min. Each death handed the enemy tempo for objectives; when there's no fight to join, take the safer recall or side-wave instead.`,
    });
  } else if (m.deaths <= 3 && m.win) {
    tips.push({ type: 'good', text: `Only ${m.deaths} deaths — disciplined game. Staying alive kept steady map pressure.` });
  }

  // Kill participation
  if (kpPct < 45 && role !== 'BOTTOM') {
    tips.push({
      type: 'warn',
      text: `You were in ${kpPct}% of your team's ${m.teamKills} kills. Glance at the minimap after each wave and rotate toward fights you can actually reach.`,
    });
  } else if (kpPct >= 65) {
    tips.push({ type: 'good', text: `${kpPct}% kill participation — you showed up for nearly every fight.` });
  }

  // Damage share (damage-carry roles)
  if (role === 'MIDDLE' || role === 'BOTTOM') {
    if (dmgPct < 22) {
      tips.push({
        type: 'warn',
        text: `As ${roleName} you dealt ${dmgPct}% of your team's damage. Position at the edge of fights with an escape available so you can keep DPS'ing without dying first.`,
      });
    } else if (dmgPct >= 30) {
      tips.push({ type: 'good', text: `${dmgPct}% of team damage — you were the primary carry this game.` });
    }
  }

  // CS (farming roles)
  if (farmRole) {
    if (m.csPerMin < 6) {
      const missed = Math.max(0, Math.round((7 - m.csPerMin) * mins));
      tips.push({
        type: 'warn',
        text: `${m.csPerMin} CS/min. Reaching ~7/min this game was roughly ${missed} more minions (~${missed * 20} gold) — spend the downtime after trades catching the wave instead of roaming aimlessly.`,
      });
    } else if (m.csPerMin >= 8) {
      tips.push({ type: 'good', text: `${m.csPerMin} CS/min — excellent farm for a ${duration(m.gameDuration)} game.` });
    }
  }

  // Vision
  if (role === 'UTILITY') {
    if ((m.visionPerMin ?? 0) < 1.5) {
      tips.push({
        type: 'warn',
        text: `${m.visionPerMin} vision/min as support (${m.visionScore} total). Keep a Control Ward on the map and sweep the objective bush ~30s before it spawns to push past 2/min.`,
      });
    } else {
      tips.push({ type: 'good', text: `${m.visionPerMin} vision/min — strong map control from the support seat.` });
    }
  } else if ((m.visionPerMin ?? 0) < 0.5) {
    tips.push({ type: 'warn', text: `Low vision (${m.visionScore} score). Use your trinket ward before rotating so you don't walk into unseen picks.` });
  }

  // KDA reality check on losses
  if (!m.win && m.deaths > m.kills + m.assists) {
    tips.push({
      type: 'warn',
      text: `More deaths (${m.deaths}) than kills+assists (${m.kills + m.assists}). When behind, concede unwinnable trades and play for scaling rather than forcing plays.`,
    });
  }

  if (!tips.length) {
    tips.push({
      type: 'good',
      text: `Balanced game with no glaring weakness. Pick one stat — CS, vision, or damage share — and push it higher to tilt more of these games your way.`,
    });
  }
  return tips.slice(0, 4);
}

async function fetchJson(url) {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function renderProfile({ account, summoner, ranked }) {
  const ranksHtml = (ranked || [])
    .map((r) => {
      const total = r.wins + r.losses;
      const wr = total ? Math.round((r.wins / total) * 100) : 0;
      const queue = r.queueType === 'RANKED_SOLO_5x5' ? 'Solo/Duo' : 'Flex';
      return `
        <div class="rank">
          <div class="queue">${queue}</div>
          <div class="tier">${r.tier} ${r.rank} · ${r.leaguePoints} LP</div>
          <div class="wl">${r.wins}W ${r.losses}L · <span class="wr">${wr}% WR</span></div>
        </div>`;
    })
    .join('');

  el('profile').innerHTML = `
    <img class="icon" src="${profileIcon(summoner.profileIconId)}" alt="" onerror="this.style.visibility='hidden'" />
    <div class="who">
      <p class="name">${account.gameName} <span class="tag">#${account.tagLine}</span></p>
      <div class="level">Level ${summoner.summonerLevel}</div>
    </div>
    <div class="ranks">${ranksHtml || '<div class="muted">Unranked</div>'}</div>
  `;
  el('profile').hidden = false;
}

function renderMatch(m) {
  const spells = m.summonerSpells
    .map((id) => {
      const src = spellIcon(id);
      return src ? `<img src="${src}" alt="" title="spell" />` : '';
    })
    .join('');

  const items = m.items
    .map((id) =>
      id ? `<img src="${itemIcon(id)}" alt="" onerror="this.style.visibility='hidden'" />` : '<span></span>'
    )
    .join('');

  const kdaGood = m.kda >= 3 ? 'good' : '';

  const score = impactScore(m);
  const label = impactLabel(score);
  const kpPct = Math.round((m.killParticipation ?? 0) * 100);
  const dmgPct = Math.round((m.damageShare ?? 0) * 100);
  const tips = matchTips(m);
  const tipsHtml = tips
    .map((t) => `<li class="tip ${t.type}"><span class="tip-dot"></span><span>${t.text}</span></li>`)
    .join('');

  return `
    <div class="match ${m.win ? 'win' : 'loss'}" data-match="${m.matchId}">
      <div></div>
      <div class="champ">
        <img src="${champIcon(m.championName)}" alt="${m.championDisplayName}" onerror="this.style.visibility='hidden'" />
      </div>
      <div class="info">
        <div class="result">${m.win ? 'Victory' : 'Defeat'}</div>
        <div class="meta">${m.queueName} · ${duration(m.gameDuration)} · ${timeAgo(m.gameEndTimestamp)}</div>
        <div class="champname">${m.championDisplayName}${m.role ? ` · ${ROLE_LABEL[m.role] || m.role}` : ''}</div>
        <div class="spells">${spells}</div>
      </div>
      <div class="kda">
        <div class="score">${m.kills} / <span class="d">${m.deaths}</span> / ${m.assists}</div>
        <div class="ratio ${kdaGood}">${m.kda} KDA</div>
        <div class="items">${items}</div>
      </div>
      <div class="stats">
        <div class="row"><b>${m.cs}</b> CS (${m.csPerMin}/m)</div>
        <div class="row"><b>${(m.damage / 1000).toFixed(1)}k</b> dmg</div>
        <div class="row"><b>${m.visionScore}</b> vision</div>
      </div>
      <div class="impact">
        <div class="impact-score ${label.cls}" title="Your influence on this match (0–100)">${score}</div>
        <div class="impact-label ${label.cls}">${label.text}</div>
        <button class="details-toggle" type="button" aria-expanded="false">Analysis ▾</button>
      </div>
      <div class="details" hidden>
        <div class="details-grid">
          <div class="metric"><span class="mlabel">Impact</span><b class="${label.cls}">${score}/100 · ${label.text}</b></div>
          <div class="metric"><span class="mlabel">Kill participation</span><b>${kpPct}%</b></div>
          <div class="metric"><span class="mlabel">Damage share</span><b>${dmgPct}%</b></div>
          <div class="metric"><span class="mlabel">CS / min</span><b>${m.csPerMin}</b></div>
          <div class="metric"><span class="mlabel">Vision / min</span><b>${m.visionPerMin ?? 0}</b></div>
          <div class="metric"><span class="mlabel">Gold</span><b>${(m.goldEarned / 1000).toFixed(1)}k</b></div>
        </div>
        <div class="tips-title">What to work on from this game</div>
        <ul class="tips">${tipsHtml}</ul>
      </div>
    </div>`;
}

function renderSummary(rows) {
  const wins = rows.filter((r) => r.win).length;
  const wr = rows.length ? Math.round((wins / rows.length) * 100) : 0;
  const k = rows.reduce((a, r) => a + r.kills, 0);
  const d = rows.reduce((a, r) => a + r.deaths, 0);
  const a = rows.reduce((acc, r) => acc + r.assists, 0);
  const avgKda = d === 0 ? (k + a).toFixed(2) : ((k + a) / d).toFixed(2);
  el('matches-summary').textContent = `${wins}W ${rows.length - wins}L · ${wr}% WR · ${avgKda} avg KDA`;
}

const avg = (rows, fn) => (rows.length ? rows.reduce((s, r) => s + (fn(r) || 0), 0) / rows.length : 0);

// Aggregate overview across the loaded matches, including average influence.
function renderStatsOverview(rows) {
  const scores = rows.map(impactScore);
  const avgImpact = Math.round(scores.reduce((s, n) => s + n, 0) / (scores.length || 1));
  const label = impactLabel(avgImpact);

  const avgKp = Math.round(avg(rows, (r) => r.killParticipation) * 100);
  const avgDmg = Math.round(avg(rows, (r) => r.damageShare) * 100);
  const avgCs = avg(rows, (r) => r.csPerMin).toFixed(1);
  const avgVis = avg(rows, (r) => r.visionPerMin).toFixed(2);

  // Best game by impact for a quick highlight.
  let bestIdx = 0;
  scores.forEach((s, i) => {
    if (s > scores[bestIdx]) bestIdx = i;
  });
  const best = rows[bestIdx];

  el('stats-overview').innerHTML = `
    <div class="ov-impact">
      <div class="ov-ring ${label.cls}"><span>${avgImpact}</span><small>/100</small></div>
      <div class="ov-impact-meta">
        <div class="ov-h">Average Impact</div>
        <div class="ov-label ${label.cls}">${label.text}</div>
        <div class="muted">across ${rows.length} games</div>
      </div>
    </div>
    <div class="ov-metrics">
      <div class="ov-metric"><span>Kill participation</span><b>${avgKp}%</b></div>
      <div class="ov-metric"><span>Damage share</span><b>${avgDmg}%</b></div>
      <div class="ov-metric"><span>CS / min</span><b>${avgCs}</b></div>
      <div class="ov-metric"><span>Vision / min</span><b>${avgVis}</b></div>
    </div>
    <div class="ov-best">
      <div class="ov-h">Best game</div>
      <div class="ov-best-body">
        <img src="${champIcon(best.championName)}" alt="" onerror="this.style.visibility='hidden'" />
        <div>
          <b>${best.championDisplayName}</b>
          <div class="muted">${best.kills}/${best.deaths}/${best.assists} · Impact ${scores[bestIdx]}</div>
        </div>
      </div>
    </div>`;
  el('stats-overview').hidden = false;
}

function showSkeletons(n = 6) {
  el('matches').innerHTML = Array.from({ length: n }, () => '<div class="skeleton"></div>').join('');
  el('status').textContent = '';
}

async function load(name, tag, region = 'EUNE') {
  el('profile').hidden = true;
  el('stats-overview').hidden = true;
  el('matches-summary').textContent = '';
  el('status').classList.remove('error');
  showSkeletons();

  const q = `region=${encodeURIComponent(region)}`;

  try {
    // Fetch independently so a missing profile doesn't wipe out match history.
    const [profileRes, matchesRes] = await Promise.allSettled([
      fetchJson(`/api/profile/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?${q}`),
      fetchJson(`/api/matches/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?count=20&${q}`),
    ]);

    if (profileRes.status === 'fulfilled') {
      renderProfile(profileRes.value);
    }

    if (matchesRes.status === 'rejected') {
      throw matchesRes.reason;
    }
    const matches = matchesRes.value;

    if (!matches.length) {
      el('matches').innerHTML = '';
      el('status').textContent = 'No recent matches found for this account and region.';
      return;
    }

    renderSummary(matches);
    renderStatsOverview(matches);
    el('matches').innerHTML = matches.map(renderMatch).join('');
    el('status').textContent = '';
  } catch (err) {
    el('matches').innerHTML = '';
    el('status').textContent = `Error: ${err.message}. Check the Riot ID and that the correct region is selected.`;
    el('status').classList.add('error');
  }
}

async function init() {
  try {
    const meta = await fetchJson('/api/meta');
    ddVersion = meta.ddragonVersion || ddVersion;
    const badge = el('mode-badge');
    badge.textContent = meta.mode === 'live' ? 'Live API' : 'Mock Data';
    badge.classList.add(meta.mode);
    badge.hidden = false;
  } catch {
    /* meta is best-effort */
  }

  el('search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = el('name-input').value.trim();
    const tag = el('tag-input').value.trim();
    const region = el('region-select').value;
    if (name && tag) load(name, tag, region);
  });

  // Expand/collapse per-match analysis.
  el('matches').addEventListener('click', (e) => {
    const btn = e.target.closest('.details-toggle');
    if (!btn) return;
    const match = btn.closest('.match');
    const details = match.querySelector('.details');
    const open = details.hidden;
    details.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? 'Analysis ▴' : 'Analysis ▾';
  });

  load('Dogmilk', 'EUNE', 'EUNE');
}

init();
