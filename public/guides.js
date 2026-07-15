// Curated bot lane (ADC) build guides — runes, items, and per-matchup advice.
// Static, hand-curated content (not from the Riot API). Patch ~14.13 meta.

const GUIDE_DD_VERSION = '14.13.1';
const guideChampIcon = (key) =>
  `https://ddragon.leagueoflegends.com/cdn/${GUIDE_DD_VERSION}/img/champion/${key}.png`;

// enemy helper: { n: display name, k: Data Dragon key }
const E = (n, k) => ({ n, k });

const BOTLANE_GUIDE = {
  Jhin: {
    name: 'Jhin',
    key: 'Jhin',
    tag: 'Poke / Utility Marksman',
    summoners: ['Flash', 'Heal'],
    overview:
      'A skirmish-heavy lane bully with huge range on his 4th shot and a long-range W root. You win the poke war but fall off in raw DPS teamfights — abuse cooldown windows and roam with your W.',
    runes: {
      primary: {
        tree: 'Precision',
        keystone: 'Fleet Footwork',
        picks: ['Presence of Mind', 'Legend: Alacrity', 'Coup de Grace'],
      },
      secondary: { tree: 'Sorcery', picks: ['Absolute Focus', 'Gathering Storm'] },
      shards: ['Adaptive Force', 'Adaptive Force', 'Health Scaling'],
    },
    start: ["Doran's Blade", 'Health Potion'],
    boots: "Berserker's Greaves",
    core: ['The Collector', 'Rapid Firecannon', 'Infinity Edge', "Lord Dominik's Regards"],
    matchups: [
      { e: E('Caitlyn', 'Caitlyn'), diff: 'hard', note: 'Outranged at every stage. Farm safely, dodge trap+headshot combos, and punish her only when she steps up to CS with a W root.', swaps: ["Start Doran's Shield"] },
      { e: E('Draven', 'Draven'), diff: 'hard', note: 'Loses hard to double-axe all-ins. Poke him while he chases axes and never fight when he has 2 stacked. Ward for his aggression.', swaps: ["Start Doran's Shield"] },
      { e: E('Lucian', 'Lucian'), diff: 'hard', note: 'Out-tempos you levels 1-3, especially with an engage support. Give up early trades, farm, and take over mid game.', swaps: ["Start Doran's Shield"] },
      { e: E('Samira', 'Samira'), diff: 'hard', note: 'She snowballs off your CC and stacks passive in trades. Root from max range, never feed her dashes, and disengage extended fights.', swaps: ['Rush Zeal item for kiting'] },
      { e: E('Miss Fortune', 'MissFortune'), diff: 'even', note: 'Pure poke war between two immobile ADCs. Win 4th-shot trades and never stand in the minion wave against her E slow.', swaps: [] },
      { e: E('Ezreal', 'Ezreal'), diff: 'even', note: 'Dodge his Q so he can not proc his poke, then punish with a loaded 4th shot while his Q is on cooldown.', swaps: [] },
      { e: E('Jinx', 'Jinx'), diff: 'even', note: 'She out-scales you. Abuse her weak early game with poke, deny resets, and force fights before she gets 2-3 items.', swaps: [] },
      { e: E('Vayne', 'Vayne'), diff: 'easy', note: 'Dominate early with range and 4th-shot poke. Kill her repeatedly before she scales; ward for the ganks she baits.', swaps: [] },
    ],
  },

  Tristana: {
    name: 'Tristana',
    key: 'Tristana',
    tag: 'All-in / Reset Marksman',
    summoners: ['Flash', 'Heal'],
    overview:
      'A range-scaling hyper carry with a jump reset (W) and a huge burst all-in around level 6 (E stacks + R knockback). Play safe early, then look for E-jump kills and pick up resets in fights.',
    runes: {
      primary: {
        tree: 'Precision',
        keystone: 'Lethal Tempo',
        picks: ['Presence of Mind', 'Legend: Alacrity', 'Cut Down'],
      },
      secondary: { tree: 'Inspiration', picks: ['Magical Footwear', 'Cosmic Insight'] },
      shards: ['Attack Speed', 'Adaptive Force', 'Health Scaling'],
    },
    start: ["Doran's Blade", 'Health Potion'],
    boots: "Berserker's Greaves",
    core: ['Kraken Slayer', "Runaan's Hurricane", 'Infinity Edge', "Lord Dominik's Regards"],
    matchups: [
      { e: E('Caitlyn', 'Caitlyn'), diff: 'hard', note: 'Outranged early. Use W only to dodge or escape, farm at max range, and set up a level-6 E-stack + jump all-in.', swaps: ["Start Doran's Shield"] },
      { e: E('Draven', 'Draven'), diff: 'hard', note: 'You lose early all-ins. Avoid trading while he has axes; jump in only to execute low targets or grab a reset.', swaps: ["Start Doran's Shield"] },
      { e: E('Lucian', 'Lucian'), diff: 'hard', note: 'Out-trades you levels 1-3. Respect his tempo, farm, and use your superior scaling + jump range later.', swaps: ["Start Doran's Shield"] },
      { e: E('Miss Fortune', 'MissFortune'), diff: 'even', note: 'Her burst punishes a bad jump-in. Wait out her Q/ult cooldowns, then E-stack jump when she is exposed.', swaps: [] },
      { e: E('Samira', 'Samira'), diff: 'hard', note: 'Do not jump into her — she resets off your engage. Kite with W to reposition and let your support peel.', swaps: ['Plated Steelcaps vs her AD'] },
      { e: E('Ezreal', 'Ezreal'), diff: 'even', note: 'Dodge his Q, then commit your E-jump all-in when his E (escape) is down.', swaps: [] },
      { e: E('Jinx', 'Jinx'), diff: 'even', note: 'Punish her immobility with E-jump all-ins after 6. Do not let her free-scale.', swaps: [] },
      { e: E('Jhin', 'Jhin'), diff: 'easy', note: 'Abuse his reload and lack of mobility. All-in during his 4th-shot reload window.', swaps: [] },
    ],
  },

  MissFortune: {
    name: 'Miss Fortune',
    key: 'MissFortune',
    tag: 'Poke / Burst Marksman',
    summoners: ['Flash', 'Heal'],
    overview:
      'A lane-bully caster ADC with strong Q double-up poke, an E slow, and a game-ending teamfight ult (Bullet Time). Win the early poke war and look for big Ults from fog or behind a frontline.',
    runes: {
      primary: {
        tree: 'Precision',
        keystone: 'Press the Attack',
        picks: ['Presence of Mind', 'Legend: Alacrity', 'Coup de Grace'],
      },
      secondary: { tree: 'Sorcery', picks: ['Manaflow Band', 'Gathering Storm'] },
      shards: ['Attack Speed', 'Adaptive Force', 'Health Scaling'],
    },
    start: ["Doran's Blade", 'Health Potion'],
    boots: "Berserker's Greaves",
    core: ['The Collector', 'Infinity Edge', "Rapid Firecannon", "Lord Dominik's Regards"],
    matchups: [
      { e: E('Caitlyn', 'Caitlyn'), diff: 'hard', note: 'Outranged. Farm safely, poke with Q double-up off the minion she stands behind, and avoid her traps.', swaps: ["Start Doran's Shield"] },
      { e: E('Samira', 'Samira'), diff: 'hard', note: 'Never ult into her — she wind-walls and heals off it. Poke with Q/E and disengage before she stacks passive.', swaps: ["Executioner's Calling early"] },
      { e: E('Lucian', 'Lucian'), diff: 'hard', note: 'He out-trades you early. Use E to slow his dash, poke with Q, and scale toward your teamfight ult.', swaps: ["Start Doran's Shield"] },
      { e: E('Draven', 'Draven'), diff: 'even', note: 'Punish him with Q double-up whenever he steps up to catch an axe. Do not full-fight two axes.', swaps: [] },
      { e: E('Ezreal', 'Ezreal'), diff: 'even', note: 'Poke war — do not stand directly behind minions so his Q and your Q both matter. Trade Q for Q.', swaps: [] },
      { e: E('Jinx', 'Jinx'), diff: 'even', note: 'Win the early poke war and deny her scaling with constant Q chip damage.', swaps: [] },
      { e: E('Ashe', 'Ashe'), diff: 'even', note: 'Two immobile ADCs poking. Respect her W poke + R engage; win with Q and E slow trades.', swaps: [] },
      { e: E('Vayne', 'Vayne'), diff: 'easy', note: 'Bully her off the wave with Q poke before she scales. Keep her from farming safely.', swaps: [] },
    ],
  },

  Lucian: {
    name: 'Lucian',
    key: 'Lucian',
    tag: 'Lane Bully / Tempo Marksman',
    summoners: ['Flash', 'Heal'],
    overview:
      'An early-game tempo bully with double auto-shots (passive), a dash (E), and burst combos. Strongest levels 1-9, especially with an enchanter (Nami/Milio). Snowball the lane before immobile scaling ADCs come online.',
    runes: {
      primary: {
        tree: 'Precision',
        keystone: 'Press the Attack',
        picks: ['Presence of Mind', 'Legend: Alacrity', 'Cut Down'],
      },
      secondary: { tree: 'Sorcery', picks: ['Manaflow Band', 'Transcendence'] },
      shards: ['Attack Speed', 'Adaptive Force', 'Health Scaling'],
    },
    start: ["Doran's Blade", 'Health Potion'],
    boots: "Berserker's Greaves",
    core: ['Essence Reaver', 'Navori Quickblades', 'Infinity Edge', "Lord Dominik's Regards"],
    matchups: [
      { e: E('Nilah', 'Nilah'), diff: 'hard', note: 'She wins extended fights with her healing and dodge. Only take short trades with passive + Q, then back off.', swaps: ["Executioner's Calling early"] },
      { e: E('Samira', 'Samira'), diff: 'hard', note: 'Do not dash into her stacking range. Poke and burst her before she reaches passive S rank; disengage her all-in.', swaps: ["Executioner's Calling early"] },
      { e: E('Caitlyn', 'Caitlyn'), diff: 'even', note: 'Dodge her poke with E and all-in once you dash onto her. Much easier with an engage/enchanter support.', swaps: [] },
      { e: E('Draven', 'Draven'), diff: 'even', note: 'Skill matchup. Dodge axes with E and trade with passive double-shot + Q when he reaches for a catch.', swaps: [] },
      { e: E('Ezreal', 'Ezreal'), diff: 'even', note: 'Dodge his Q with E, then commit your all-in when his E is on cooldown.', swaps: [] },
      { e: E('Miss Fortune', 'MissFortune'), diff: 'even', note: 'Trade with double-shots and dodge her Q bounce by not standing behind minions.', swaps: [] },
      { e: E('Jinx', 'Jinx'), diff: 'easy', note: 'Dominate early — dash in and burst her before she scales. Deny her farm and resets.', swaps: [] },
      { e: E('Vayne', 'Vayne'), diff: 'easy', note: 'Hard-bully her early. Keep her off the wave and end the lane before her item spikes.', swaps: [] },
    ],
  },
};

const DIFF_LABEL = { easy: 'Favored', even: 'Even', hard: 'Hard' };

function renderGuideChamps(activeKey) {
  const host = document.getElementById('guide-champs');
  host.innerHTML = Object.values(BOTLANE_GUIDE)
    .map(
      (c) => `
      <button class="guide-champ ${c.key === activeKey ? 'active' : ''}" data-champ="${c.key}" type="button">
        <img src="${guideChampIcon(c.key)}" alt="${c.name}" onerror="this.style.visibility='hidden'" />
        <span>${c.name}</span>
      </button>`
    )
    .join('');
}

function runePill(text, kind = '') {
  return `<span class="rune-pill ${kind}">${text}</span>`;
}

function renderGuideBuild(c) {
  const r = c.runes;
  const host = document.getElementById('guide-build');
  host.innerHTML = `
    <div class="build-head">
      <img class="build-portrait" src="${guideChampIcon(c.key)}" alt="" onerror="this.style.visibility='hidden'" />
      <div>
        <h2>${c.name} <span class="build-tag">${c.tag}</span></h2>
        <p class="muted">${c.overview}</p>
        <div class="summoners-line">Summoners: ${c.summoners.map((s) => runePill(s, 'sum')).join('')}</div>
      </div>
    </div>

    <div class="build-cols">
      <div class="build-box">
        <div class="build-box-title">Runes</div>
        <div class="rune-group">
          <div class="rune-tree ${r.primary.tree.toLowerCase()}">${r.primary.tree}</div>
          ${runePill(r.primary.keystone, 'keystone')}
          ${r.primary.picks.map((p) => runePill(p)).join('')}
        </div>
        <div class="rune-group">
          <div class="rune-tree ${r.secondary.tree.toLowerCase()}">${r.secondary.tree}</div>
          ${r.secondary.picks.map((p) => runePill(p)).join('')}
        </div>
        <div class="rune-group shards">
          <div class="rune-tree">Shards</div>
          ${r.shards.map((s) => runePill(s, 'shard')).join('')}
        </div>
      </div>

      <div class="build-box">
        <div class="build-box-title">Items</div>
        <div class="item-line"><span class="item-label">Start</span>${c.start.map((i) => runePill(i, 'item')).join('')}</div>
        <div class="item-line"><span class="item-label">Boots</span>${runePill(c.boots, 'item')}</div>
        <div class="item-line"><span class="item-label">Core order</span>
          <div class="core-order">
            ${c.core.map((i, idx) => `<span class="core-item">${idx + 1}. ${i}</span>`).join('<span class="arrow">→</span>')}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderGuideMatchups(c) {
  const host = document.getElementById('guide-matchups');
  host.innerHTML = c.matchups
    .map(
      (m) => `
      <div class="mu ${m.diff}">
        <img class="mu-icon" src="${guideChampIcon(m.e.k)}" alt="${m.e.n}" onerror="this.style.visibility='hidden'" />
        <div class="mu-body">
          <div class="mu-head">
            <b>${m.e.n}</b>
            <span class="mu-diff ${m.diff}">${DIFF_LABEL[m.diff]}</span>
          </div>
          <div class="mu-note">${m.note}</div>
          ${m.swaps && m.swaps.length ? `<div class="mu-swaps">${m.swaps.map((s) => runePill(s, 'swap')).join('')}</div>` : ''}
        </div>
      </div>`
    )
    .join('');
}

function selectGuideChamp(key) {
  const c = BOTLANE_GUIDE[key];
  if (!c) return;
  renderGuideChamps(key);
  renderGuideBuild(c);
  renderGuideMatchups(c);
}

function initGuides() {
  const champsHost = document.getElementById('guide-champs');
  if (!champsHost) return;

  champsHost.addEventListener('click', (e) => {
    const btn = e.target.closest('.guide-champ');
    if (btn) selectGuideChamp(btn.dataset.champ);
  });

  // Tab switching between tracker and guides views.
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.toggle('active', t === tab));
      const view = tab.dataset.view;
      document.getElementById('view-tracker').hidden = view !== 'tracker';
      document.getElementById('view-guides').hidden = view !== 'guides';
    });
  });

  selectGuideChamp('Jhin');
}

initGuides();
