const POSITIONS = ['现状', '课题', '建议'];

const THEME_COLORS = {
  study: '#5f9278',
  career: '#b0783a',
  love: '#bd6258',
  family: '#5e88a0',
  money: '#c19a3f',
  health: '#7a9a4f'
};

const SUIT_CLOSERS = {
  wands: '主动出击、保持热情的那一面',
  cups: '情感流动、照顾感受的那一面',
  swords: '理清思路、坦诚沟通的那一面',
  pentacles: '脚踏实地、稳定积累的那一面'
};

const state = {
  theme: null,
  drawn: null,
  flipped: [false, false, false],
  logged: false,
  lastLogId: null
};

const themeScreen = document.getElementById('theme-screen');
const readingScreen = document.getElementById('reading-screen');
const themeGrid = document.getElementById('theme-grid');
const cardsRow = document.getElementById('cards-row');
const themeBanner = document.getElementById('theme-banner');
const drawBtn = document.getElementById('draw-btn');
const changeThemeBtn = document.getElementById('change-theme-btn');
const overallEl = document.getElementById('overall');
const themeToggle = document.getElementById('theme-toggle');
const questionInput = document.getElementById('question-input');
const consentInput = document.getElementById('consent-input');
const aiButton = document.getElementById('ai-button');
const aiResult = document.getElementById('ai-result');

const savedTheme = (() => {
  try {
    return localStorage.getItem('tarot-theme') || 'dark';
  } catch (error) {
    return 'dark';
  }
})();
document.documentElement.dataset.theme = savedTheme;
themeToggle.setAttribute('aria-pressed', savedTheme === 'light' ? 'true' : 'false');

themeToggle.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem('tarot-theme', next);
  } catch (error) {
    // Ignore storage failures, theme still switches for this visit.
  }
  themeToggle.setAttribute('aria-pressed', next === 'light' ? 'true' : 'false');
});

function themeIcon(icon) {
  const paths = {
    book: '<path d="M12 6C10 4 7 4 4 4v14c3 0 6 0 8 2 2-2 5-2 8-2V4c-3 0-6 0-8 2z"/><path d="M12 6v14"/>',
    briefcase: '<rect x="4" y="8" width="16" height="12" rx="2"/><path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M4 15h16"/>',
    heart: '<path d="M12 21C7 16.5 3.5 13.5 3.5 9.2A4.7 4.7 0 0 1 8.2 4.5c1.6 0 3 .7 3.8 1.8.8-1.1 2.2-1.8 3.8-1.8a4.7 4.7 0 0 1 4.7 4.7c0 4.3-3.5 7.3-8.5 11.8z"/>',
    home: '<path d="M4 12l8-7 8 7v11H4z"/><path d="M9 22v-6h6v6"/>',
    coin: '<circle cx="12" cy="12" r="8"/><path d="M12 4v16M8 7c0 3 4 4 4 4s4-1 4-4"/>',
    leaf: '<path d="M20 4C9 4 5 11 5 19c0 5 6 5 9 1 3-4 7-10 6-16z"/><path d="M5 20c3-6 8-10 13-13"/>'
  };
  return `<svg class="theme-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[icon]}</svg>`;
}

function cardFrontMarkup(card) {
  const title = cardTitle(card);
  return `<img class="card-image" src="cards/${card.suit}-${card.rank}.png" alt="${title}" draggable="false">`;
}

function cardBackSVG() {
  const gold = '#c9a45c';
  return `
    <svg viewBox="0 0 300 500" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="牌背">
      <rect width="300" height="500" fill="#20302a"/>
      <rect x="14" y="14" width="272" height="472" rx="16" fill="none" stroke="${gold}" stroke-width="2"/>
      <rect x="24" y="24" width="252" height="452" rx="11" fill="none" stroke="${gold}" stroke-width="1" opacity="0.5"/>
      <circle cx="150" cy="250" r="88" fill="none" stroke="${gold}" stroke-width="1.5" opacity="0.75"/>
      <circle cx="150" cy="250" r="70" fill="none" stroke="${gold}" stroke-width="1" opacity="0.45"/>
      <path d="M150 196 L228 250 L150 304 L72 250 Z" fill="none" stroke="${gold}" stroke-width="1.5" opacity="0.65"/>
      <path d="M150 216 L201 250 L150 284 L99 250 Z" fill="none" stroke="${gold}" stroke-width="1" opacity="0.45"/>
      <path d="M150 250 L150 166 M150 250 L221 250 M150 250 L150 334 M150 250 L79 250" stroke="${gold}" stroke-width="1" opacity="0.4"/>
      <circle cx="150" cy="250" r="10" fill="${gold}"/>
    </svg>`;
}

function renderThemeGrid() {
  themeGrid.innerHTML = THEMES.map((theme) => `
    <button class="theme-card" type="button" data-theme="${theme.id}" style="--accent:${THEME_COLORS[theme.id]}">
      <span class="theme-icon">${themeIcon(theme.icon)}</span>
      <span class="theme-name">${theme.name}</span>
    </button>
  `).join('');
}

function cardSlotHTML(index) {
  return `
    <div class="slot" data-index="${index}">
      <div class="slot-head">
        <span class="slot-number">0${index + 1}</span>
        <span class="slot-name">${POSITIONS[index]}</span>
      </div>
      <div class="card pending" data-index="${index}" role="button" tabindex="0" aria-label="${POSITIONS[index]}卡牌">
        <div class="card-inner">
          <div class="card-face card-back">${cardBackSVG()}</div>
          <div class="card-face card-front"></div>
        </div>
      </div>
      <div class="reading-panel"></div>
    </div>`;
}

function themeBannerHTML(theme) {
  return `
    <span class="banner-icon" style="color:${THEME_COLORS[theme.id]}">${themeIcon(theme.icon)}</span>
    <span>${theme.name} · 三张牌</span>`;
}

function showReading(theme) {
  state.theme = theme;
  state.drawn = null;
  state.flipped = [false, false, false];
  state.logged = false;
  state.lastLogId = null;
  themeBanner.innerHTML = themeBannerHTML(theme);
  cardsRow.innerHTML = [0, 1, 2].map(cardSlotHTML).join('');
  drawBtn.textContent = '洗牌并抽三张';
  drawBtn.disabled = false;
  overallEl.hidden = true;
  questionInput.value = '';
  aiButton.disabled = true;
  aiResult.hidden = true;
  aiResult.classList.remove('is-error');
  themeScreen.classList.remove('active');
  readingScreen.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function shuffleCards(cards) {
  const pool = [...cards];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

function drawCards() {
  const pool = shuffleCards(CARDS);
  state.drawn = [0, 1, 2].map((i) => ({
    card: pool[i],
    reversed: Math.random() < 0.5
  }));
  state.flipped = [false, false, false];
  state.logged = false;
  state.lastLogId = null;
  overallEl.hidden = true;
  aiButton.disabled = true;
  aiResult.hidden = true;
  aiResult.classList.remove('is-error');

  const cards = cardsRow.querySelectorAll('.card');
  cards.forEach((cardEl, i) => {
    cardEl.classList.remove('flipped', 'reversed', 'pending');
    cardEl.classList.add('drawing');
    cardEl.querySelector('.card-front').innerHTML = cardFrontMarkup(state.drawn[i].card);
    cardsRow.querySelectorAll('.reading-panel')[i].innerHTML = '';
  });

  drawBtn.disabled = true;
  drawBtn.textContent = '正在洗牌';
  setTimeout(() => {
    cards.forEach((cardEl) => {
      cardEl.classList.remove('drawing');
      cardEl.classList.add('ready');
    });
    drawBtn.disabled = false;
    drawBtn.textContent = '重新抽三张';
  }, 700);
}

function themeFocusLine(themeId, suit, reversed) {
  const focus = THEME_FOCUS[themeId] && THEME_FOCUS[themeId][suit];
  return focus ? (reversed ? focus.reversed : focus.upright) : '';
}

function renderPanel(panel, draw, index) {
  const orientation = draw.reversed ? '逆位' : '正位';
  panel.innerHTML = `
    <div class="panel-head">
      <span class="orientation ${draw.reversed ? 'bad' : 'good'}">${orientation}</span>
      <span class="panel-pos">${POSITIONS[index]}</span>
    </div>
    <h3>${cardTitle(draw.card)}</h3>
    <div class="keywords">${draw.card.keywords.map((k) => `<span>${k}</span>`).join('')}</div>
    <p class="panel-main">${draw.reversed ? draw.card.reversed : draw.card.upright}</p>
    <div class="panel-divider"></div>
    <p class="panel-theme">${themeFocusLine(state.theme.id, draw.card.suit, draw.reversed)}</p>
  `;
}

function dominantSuit() {
  const counts = {};
  state.drawn.forEach((d) => {
    counts[d.card.suit] = (counts[d.card.suit] || 0) + 1;
  });
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
}

function renderOverall() {
  const uprightCount = state.drawn.filter((d) => !d.reversed).length;
  const balanceText = uprightCount === 3
    ? '三张牌都是正位，整体能量顺畅，适合把状态、课题和建议串成一条主动推进的路径。'
    : uprightCount === 2
      ? '正位多于逆位，方向基本清晰；逆位那张牌是你最需要留意的地方，它往往藏着真正的功课。'
      : uprightCount === 1
        ? '逆位占多，现阶段更适合先调整内在状态，再谈向外推进；把逆位当作提醒，而不是否定。'
        : '三张牌都落在逆位，这不是坏消息，而是一个明显的信号：先停下来修复与校准，再继续向前。';
  const topSuit = dominantSuit();
  const parts = state.drawn.map((d, i) => `「${POSITIONS[i]}」${cardTitle(d.card)}（${d.reversed ? '逆位' : '正位'}）`);
  overallEl.innerHTML = `
    <div class="overall-label">整体解读</div>
    <p class="overall-head">你围绕「${state.theme.name}」抽到：${parts.join('、')}。</p>
    <p>${balanceText}</p>
    <p>这个牌阵里「${SUITS[topSuit].name}」的元素最重（${SUITS[topSuit].element}元素），在「${state.theme.name}」这件事上，多留意${SUIT_CLOSERS[topSuit]}。</p>
  `;
  overallEl.hidden = false;
  aiButton.disabled = false;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}

function cleanAIResponse(text) {
  return String(text)
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*/g, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+[.、]\s+/gm, '')
    .replace(/^\s*-{3,}\s*$/gm, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function requestAI() {
  if (!state.drawn || !state.flipped.every(Boolean)) return;
  aiButton.disabled = true;
  aiButton.textContent = 'AI 解读中...';
  aiResult.hidden = true;
  aiResult.classList.remove('is-error');

  const payload = {
    theme: state.theme.name,
    question: questionInput.value.trim().slice(0, 500),
    cards: state.drawn.map((draw) => ({
      title: cardTitle(draw.card),
      suit: SUITS[draw.card.suit].name,
      orientation: draw.reversed ? '逆位' : '正位',
      keywords: draw.card.keywords,
      meaning: draw.reversed ? draw.card.reversed : draw.card.upright,
      themeNote: themeFocusLine(state.theme.id, draw.card.suit, draw.reversed)
    }))
  };

  try {
    const response = await fetch('/api/reading', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'AI 解读暂时不可用');
    }
    updateAIUsed();
    aiResult.innerHTML = `<div class="ai-label">AI 解读</div><p>${escapeHtml(cleanAIResponse(data.text || ''))}</p>`;
  } catch (error) {
    aiResult.innerHTML = `<div class="ai-label">AI 解读</div><p>${escapeHtml(error.message || '请求失败，请稍后再试')}</p>`;
    aiResult.classList.add('is-error');
  } finally {
    aiButton.disabled = false;
    aiButton.textContent = 'AI 解读';
    aiResult.hidden = false;
  }
}

function sendReadingLog() {
  if (!state.drawn || state.logged) return;
  state.logged = true;
  const payload = {
    theme: state.theme.name,
    cards: state.drawn.map((draw) => ({
      title: cardTitle(draw.card),
      reversed: draw.reversed
    })),
    question: consentInput.checked ? questionInput.value.trim().slice(0, 500) : null,
    used_ai: false
  };
  fetch("/api/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).then((response) => response.json().catch(() => ({})))
    .then((data) => {
      if (data && data.id) state.lastLogId = data.id;
    })
    .catch(() => {});
}

function updateAIUsed() {
  if (!state.lastLogId) return;
  fetch("/api/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: state.lastLogId, used_ai: true })
  }).catch(() => {});
}

function flipCard(cardEl) {
  const index = Number(cardEl.dataset.index);
  if (state.flipped[index] || !state.drawn) return;
  const draw = state.drawn[index];
  cardEl.classList.add('flipped');
  if (draw.reversed) {
    cardEl.classList.add('reversed');
  }
  const panel = cardsRow.querySelectorAll('.reading-panel')[index];
  renderPanel(panel, draw, index);
  state.flipped[index] = true;
  if (state.flipped.every(Boolean)) {
    renderOverall();
    sendReadingLog();
  }
}

themeGrid.addEventListener('click', (event) => {
  const card = event.target.closest('.theme-card');
  if (!card) return;
  const theme = THEMES.find((t) => t.id === card.dataset.theme);
  if (theme) showReading(theme);
});

cardsRow.addEventListener('click', (event) => {
  const card = event.target.closest('.card');
  if (!card || !card.classList.contains('ready') || card.classList.contains('flipped')) return;
  flipCard(card);
});

cardsRow.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const card = event.target.closest('.card');
  if (!card || !card.classList.contains('ready') || card.classList.contains('flipped')) return;
  event.preventDefault();
  flipCard(card);
});

drawBtn.addEventListener('click', drawCards);

aiButton.addEventListener('click', requestAI);

changeThemeBtn.addEventListener('click', () => {
  readingScreen.classList.remove('active');
  themeScreen.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

renderThemeGrid();
