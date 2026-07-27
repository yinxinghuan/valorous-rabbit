import './style.css';
import {
  callAigramAPI,
  getGameUuid,
  isInAigram,
  openAigramProfile,
  postAigramAPI,
  telegramId,
} from '@shared/runtime';

const query = new URLSearchParams(location.search);
const baseline = query.get('baseline') === '1';
const localeOverride = localStorage.getItem('game_locale');
const locale = localeOverride === 'en' || localeOverride === 'zh'
  ? localeOverride
  : navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';

const copy = {
  zh: {
    title: '勇兔奔野',
    distance: '距离',
    jump: '轻触起跳',
    gameOver: '被追上了',
    result: '{name} 跑了 {distance} 米',
    carrots: '找到 {count} 根胡萝卜',
    replay: '再跑一次',
    runner: '奔跑者',
    carrotsLabel: '胡萝卜',
    globalRank: '全球名次',
    rankPending: '正在记录',
    rankUnavailable: '暂时离线',
    leaders: '排行榜',
    champion: '当前领跑',
    leaderboardTitle: '原野排行榜',
    closeLeaderboard: '关闭排行榜',
    loadingLeaderboard: '正在载入排行榜…',
    emptyLeaderboard: '还没有跑者，等你留下第一道足迹。',
    leaderboardUnavailable: '排行榜暂时没有回应，请稍后再试。',
    openInAlterU: '在 AlterU 中打开，即可查看全球排行榜与其他跑者。',
    getAlterU: '下载 AlterU',
    you: '你',
    meters: '米',
    soundOn: '关闭声音',
    soundOff: '打开声音',
    unsupported: '这片原野需要 WebGL',
    retry: '重新尝试',
    attribution: '原作 Karim Maaloul',
    baselineHint: '轻触起跳 — 收集胡萝卜 / 躲开刺猬',
  },
  en: {
    title: 'Valorous Rabbit',
    distance: 'Distance',
    jump: 'Tap to jump',
    gameOver: 'Caught at last',
    result: '{name} ran {distance} m',
    carrots: '{count} carrots found',
    replay: 'Run again',
    runner: 'Runner',
    carrotsLabel: 'Carrots',
    globalRank: 'Global rank',
    rankPending: 'Recording',
    rankUnavailable: 'Offline',
    leaders: 'Leaderboard',
    champion: 'Pace setter',
    leaderboardTitle: 'Meadow leaders',
    closeLeaderboard: 'Close leaderboard',
    loadingLeaderboard: 'Loading leaderboard…',
    emptyLeaderboard: 'No runners yet. Leave the first trail.',
    leaderboardUnavailable: 'The leaderboard is resting. Try again soon.',
    openInAlterU: 'Open in AlterU to see the global leaderboard and other runners.',
    getAlterU: 'Get AlterU',
    you: 'YOU',
    meters: 'm',
    soundOn: 'Mute sound',
    soundOff: 'Turn sound on',
    unsupported: 'This meadow needs WebGL',
    retry: 'Try again',
    attribution: 'Original by Karim Maaloul',
    baselineHint: 'Tap to jump — grab the carrots / avoid the hedgehogs',
  },
};

function t(key, vars = {}) {
  return Object.entries(vars).reduce(
    (text, [name, value]) => text.replace(`{${name}}`, String(value)),
    copy[locale][key],
  );
}

document.documentElement.lang = locale;
document.body.classList.toggle('vr-baseline', baseline);

const materialTouchPath = 'M9 11.24V7.5C9 6.12 10.12 5 11.5 5S14 6.12 14 7.5v3.74c1.21-.81 2-2.18 2-3.74C16 5.01 13.99 3 11.5 3S7 5.01 7 7.5c0 1.56.79 2.93 2 3.74zm9.84 4.63l-4.54-2.26c-.17-.07-.35-.11-.54-.11H13v-6c0-.83-.67-1.5-1.5-1.5S10 6.67 10 7.5v10.74l-3.43-.72c-.08-.01-.15-.03-.24-.03-.31 0-.59.13-.79.33l-.79.8 4.94 4.94c.27.27.65.44 1.06.44h6.79c.75 0 1.33-.55 1.44-1.28l.75-5.27c.01-.07.02-.14.02-.2 0-.62-.38-1.16-.92-1.38z';

const app = document.querySelector('#app');
app.dataset.identitySource = query.get('user_name')?.trim() ? 'debug' : 'fallback';
app.innerHTML = `
  <section class="vr-stage" aria-label="${t('title')}">
    <div class="vr-world" id="world"></div>
    <div class="vr-hud" aria-hidden="true">
      <span class="vr-hud__label">${t('distance')}</span>
      <strong class="vr-hud__value" id="distance">0</strong>
    </div>
    <button class="vr-icon-button" id="sound" type="button" aria-label="${t('soundOn')}">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path class="vr-sound-body" d="M4 9v6h4l5 4V5L8 9H4Z"/>
        <path class="vr-sound-wave" d="M16 8.2c1.1 1 1.7 2.3 1.7 3.8s-.6 2.8-1.7 3.8M18.7 5.8c1.8 1.6 2.8 3.7 2.8 6.2s-1 4.6-2.8 6.2"/>
        <path class="vr-sound-slash" d="M5 5l14 14"/>
      </svg>
    </button>
    <div class="vr-gesture" id="gesture" aria-hidden="true">
      <span class="vr-gesture__ring"></span>
      <svg viewBox="0 0 24 24"><path d="${materialTouchPath}"/></svg>
      <span>${baseline ? t('baselineHint') : t('jump')}</span>
    </div>
    <div class="vr-result" id="result" hidden>
      <section class="vr-result__card" aria-labelledby="result-heading">
        <p class="vr-result__eyebrow">${t('gameOver')}</p>
        <h2 class="vr-result__score" id="result-heading">
          <span id="result-distance">0</span><small>${t('meters')}</small>
        </h2>
        <p class="vr-result__runner" id="result-name"></p>
        <p class="vr-result__details">
          <span id="carrot-line"></span>
          <span aria-hidden="true">·</span>
          <span id="result-rank">${isInAigram ? t('rankPending') : 'AlterU'}</span>
        </p>
        <button class="vr-champion" id="leaders" type="button">
          <svg class="vr-champion__crown" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 18 2 7l6 5 4-8 4 8 6-5-1 11H3Zm1 3h16"/>
          </svg>
          <span class="vr-champion__avatar" id="champion-avatar" aria-hidden="true">1</span>
          <span class="vr-champion__copy">
            <small id="champion-label">${t('leaders')}</small>
            <strong id="champion-name">${t('leaders')}</strong>
          </span>
          <span class="vr-champion__score" id="champion-score"></span>
          <svg class="vr-champion__arrow" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9 5 7 7-7 7"/>
          </svg>
        </button>
        <button class="vr-result__replay" id="replay" type="button">${t('replay')}</button>
        <a class="vr-result__credit" href="https://codepen.io/Yakudoo/pen/YGxYej" target="_blank" rel="noreferrer">${t('attribution')}</a>
      </section>
    </div>
    <div class="vr-leaderboard" id="leaderboard" hidden>
      <button class="vr-leaderboard__scrim" type="button" data-close-leaderboard aria-label="${t('closeLeaderboard')}"></button>
      <section class="vr-leaderboard__card" role="dialog" aria-modal="true" aria-labelledby="leaderboard-title">
        <header class="vr-leaderboard__header">
          <div>
            <span>${t('leaders')}</span>
            <h2 id="leaderboard-title">${t('leaderboardTitle')}</h2>
          </div>
          <button class="vr-leaderboard__close" id="leaderboard-close" type="button" aria-label="${t('closeLeaderboard')}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
          </button>
        </header>
        <div class="vr-leaderboard__body" id="leaderboard-body"></div>
      </section>
    </div>
    <div class="vr-error" id="error" hidden>
      <p>${t('unsupported')}</p>
      <button id="retry" type="button">${t('retry')}</button>
    </div>
  </section>
`;

const elements = {
  world: document.querySelector('#world'),
  distance: document.querySelector('#distance'),
  sound: document.querySelector('#sound'),
  gesture: document.querySelector('#gesture'),
  result: document.querySelector('#result'),
  resultDistance: document.querySelector('#result-distance'),
  resultName: document.querySelector('#result-name'),
  carrotLine: document.querySelector('#carrot-line'),
  resultRank: document.querySelector('#result-rank'),
  replay: document.querySelector('#replay'),
  leaders: document.querySelector('#leaders'),
  championAvatar: document.querySelector('#champion-avatar'),
  championLabel: document.querySelector('#champion-label'),
  championName: document.querySelector('#champion-name'),
  championScore: document.querySelector('#champion-score'),
  leaderboard: document.querySelector('#leaderboard'),
  leaderboardBody: document.querySelector('#leaderboard-body'),
  leaderboardClose: document.querySelector('#leaderboard-close'),
  error: document.querySelector('#error'),
  retry: document.querySelector('#retry'),
};

let playerName = query.get('user_name')?.trim() || 'AlterU';
let world = null;
let loadingWorld = false;
let muted = false;
let audioContext = null;
let ready = false;
let gameEnded = false;
let awaitingFirstJump = !baseline;
let offscreen = false;
const gameUuid = getGameUuid();
const canRank = Boolean(isInAigram && telegramId && gameUuid && !baseline);
const leaderboardState = {
  rows: [],
  loaded: false,
  loading: false,
  error: false,
};
let preRunBest = null;
let runNumber = 0;

function normalizeLeaderboard(response) {
  const payload = response?.data ?? response;
  const rawRows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.list) ? payload.list : [];
  return rawRows
    .map((row, index) => ({
      userId: String(row.user_id ?? row.telegram_id ?? ''),
      userName: String(row.user_name || t('runner')).trim() || t('runner'),
      avatarUrl: String(row.head_url || ''),
      score: Math.max(0, Number(row.score) || 0),
      rank: Math.max(1, Number(row.rank) || index + 1),
    }))
    .sort((a, b) => a.rank - b.rank || b.score - a.score);
}

function isSelf(row) {
  return row.userId === String(telegramId);
}

function makeAvatar(row, className = '') {
  if (row?.avatarUrl) {
    const image = document.createElement('img');
    image.className = className;
    image.src = row.avatarUrl;
    image.alt = '';
    image.draggable = false;
    image.addEventListener('error', () => {
      const fallback = document.createElement('span');
      fallback.className = className;
      fallback.textContent = (row.userName[0] || '?').toUpperCase();
      image.replaceWith(fallback);
    }, { once: true });
    return image;
  }
  const fallback = document.createElement('span');
  fallback.className = className;
  fallback.textContent = (row?.userName?.[0] || '?').toUpperCase();
  return fallback;
}

function renderChampion() {
  const champion = leaderboardState.rows[0];
  if (!champion) {
    elements.leaders.classList.remove('is-self');
    elements.championAvatar.replaceChildren(document.createTextNode('1'));
    elements.championLabel.textContent = t('leaders');
    elements.championName.textContent = t('leaderboardTitle');
    elements.championScore.textContent = '';
    return;
  }
  elements.leaders.classList.toggle('is-self', isSelf(champion));
  elements.championAvatar.replaceWith(makeAvatar(champion, 'vr-champion__avatar'));
  elements.championAvatar = document.querySelector('.vr-champion__avatar');
  elements.championLabel.textContent = t('champion');
  elements.championName.textContent = isSelf(champion) ? t('you') : champion.userName;
  elements.championScore.textContent = `${champion.score} ${t('meters')}`;
}

function renderLeaderboardMessage(kind) {
  elements.leaderboardBody.replaceChildren();
  const state = document.createElement('div');
  state.className = `vr-leaderboard__state is-${kind}`;
  const mark = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  mark.setAttribute('viewBox', '0 0 24 24');
  mark.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', kind === 'external'
    ? 'M12 3 8.8 9.5 2 8l4.7 5.2L5.8 20l6.2-2.8 6.2 2.8-.9-6.8L22 8l-6.8 1.5L12 3Z'
    : 'M4 12h16M12 4v16');
  mark.appendChild(path);
  const message = document.createElement('p');
  message.textContent = kind === 'loading'
    ? t('loadingLeaderboard')
    : kind === 'empty' ? t('emptyLeaderboard')
      : kind === 'external' ? t('openInAlterU')
        : t('leaderboardUnavailable');
  state.append(mark, message);
  if (kind === 'external') {
    const link = document.createElement('a');
    link.href = 'https://alteru.app';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = t('getAlterU');
    state.appendChild(link);
  }
  elements.leaderboardBody.appendChild(state);
}

function renderLeaderboardRows() {
  if (!canRank) {
    renderLeaderboardMessage('external');
    return;
  }
  if (leaderboardState.loading && !leaderboardState.loaded) {
    renderLeaderboardMessage('loading');
    return;
  }
  if (leaderboardState.error && !leaderboardState.rows.length) {
    renderLeaderboardMessage('error');
    return;
  }
  if (!leaderboardState.rows.length) {
    renderLeaderboardMessage('empty');
    return;
  }

  const list = document.createElement('div');
  list.className = 'vr-leaderboard__list';
  leaderboardState.rows.forEach((row) => {
    const self = isSelf(row);
    const item = document.createElement(self ? 'div' : 'button');
    item.className = `vr-leaderboard__row${self ? ' is-self' : ''}`;
    if (!self) {
      item.type = 'button';
      item.addEventListener('click', () => {
        if (isInAigram && row.userId) openAigramProfile(row.userId);
      });
    }
    const rank = document.createElement('span');
    rank.className = 'vr-leaderboard__rank';
    rank.textContent = `#${row.rank}`;
    const name = document.createElement('span');
    name.className = 'vr-leaderboard__name';
    name.textContent = self ? t('you') : row.userName;
    const score = document.createElement('strong');
    score.className = 'vr-leaderboard__score';
    score.textContent = `${row.score} ${t('meters')}`;
    item.appendChild(rank);
    if (!self) item.appendChild(makeAvatar(row, 'vr-leaderboard__avatar'));
    item.append(name, score);
    list.appendChild(item);
  });
  elements.leaderboardBody.replaceChildren(list);
}

async function fetchLeaderboard() {
  const response = await callAigramAPI(
    `/note/aigram/ai/game/rank/score/list/by/session_id?session_id=${encodeURIComponent(gameUuid)}`,
    'GET',
  );
  return normalizeLeaderboard(response);
}

async function refreshLeaderboard() {
  if (!canRank || leaderboardState.loading) return leaderboardState.rows;
  leaderboardState.loading = true;
  leaderboardState.error = false;
  if (!leaderboardState.loaded && !elements.leaderboard.hidden) renderLeaderboardRows();
  try {
    leaderboardState.rows = await fetchLeaderboard();
    leaderboardState.loaded = true;
    renderChampion();
    if (!elements.leaderboard.hidden) renderLeaderboardRows();
    return leaderboardState.rows;
  } catch {
    leaderboardState.error = true;
    if (!elements.leaderboard.hidden) renderLeaderboardRows();
    return leaderboardState.rows;
  } finally {
    leaderboardState.loading = false;
    if (!elements.leaderboard.hidden) renderLeaderboardRows();
  }
}

function snapshotPreRunBest() {
  if (!canRank || !leaderboardState.loaded) {
    preRunBest = null;
    return;
  }
  const mine = leaderboardState.rows.find(isSelf);
  preRunBest = mine?.score ?? 0;
}

function sendBeatNotify(rows, myScore, oldBest) {
  if (!canRank || oldBest == null || myScore <= oldBest) return;
  const beaten = rows
    .filter((row) => !isSelf(row) && row.score > oldBest && row.score < myScore)
    .sort((a, b) => b.score - a.score)[0];
  if (!beaten?.userId) return;
  const template = locale === 'zh'
    ? `{sender_name} 刚刚跑过了你的纪录——在《勇兔奔野》跑到 ${myScore} 米。`
    : `{sender_name} just outran your record — ${myScore} m on Valorous Rabbit.`;
  postAigramAPI('/note/aigram/ai/game/record/play', {
    session_id: gameUuid,
    event: 'score_beat',
    config_json: {
      actions: [{
        type: 'notify',
        target_user_id: beaten.userId,
        image: {
          ref_url: 'https://yinxinghuan.github.io/games/posters/valorous-rabbit.png',
          prompt: 'A low-poly red rabbit leaps across a mint spherical meadow while a black wolf gives chase.',
        },
        message: {
          template,
          variables: ['sender_name'],
        },
      }],
    },
  });
}

async function submitRunScore(score, oldBest, resultRun) {
  if (!canRank) return;
  try {
    await callAigramAPI('/note/aigram/ai/game/rank/score/save', 'POST', {
      session_id: gameUuid,
      score,
    });
    const rows = await fetchLeaderboard();
    leaderboardState.rows = rows;
    leaderboardState.loaded = true;
    leaderboardState.error = false;
    sendBeatNotify(rows, score, oldBest);
    renderChampion();
    if (!elements.leaderboard.hidden) renderLeaderboardRows();
    if (resultRun === runNumber) {
      const mine = rows.find(isSelf);
      elements.resultRank.textContent = mine ? `#${mine.rank}` : t('rankUnavailable');
    }
  } catch {
    if (resultRun === runNumber) elements.resultRank.textContent = t('rankUnavailable');
  }
}

async function loadIdentity() {
  if (query.get('user_name')?.trim()) return;
  if (!isInAigram || !telegramId) return;
  try {
    const response = await callAigramAPI(
      `/note/telegram/user/get/info/by/telegram_id?telegram_id=${encodeURIComponent(telegramId)}`,
      'GET',
    );
    playerName = response?.data?.name || response?.data?.user_name || playerName;
    if (response?.data?.name || response?.data?.user_name) {
      app.dataset.identitySource = 'player';
    }
  } catch {
    // Identity enhances the result copy but never blocks first-frame feedback.
  }
}
loadIdentity();

function getAudioContext() {
  if (muted) return null;
  if (!audioContext) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;
    audioContext = new AudioCtor();
  }
  if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  return audioContext;
}

function tone(start, end, duration, type = 'sine', delay = 0, volume = 0.06) {
  const context = getAudioContext();
  if (!context) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const at = context.currentTime + delay;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(start, at);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, end), at + duration);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(volume, at + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(at);
  oscillator.stop(at + duration + 0.02);
}

function playJump() {
  tone(220, 360, 0.09);
}

function playBonus() {
  [520, 660, 820].forEach((frequency, index) => tone(frequency, frequency, 0.1, 'triangle', index * 0.04, 0.05));
}

function playHit() {
  tone(90, 45, 0.22, 'sawtooth', 0, 0.07);
  if (navigator.vibrate) navigator.vibrate(35);
  document.body.classList.add('vr-hit');
  window.setTimeout(() => document.body.classList.remove('vr-hit'), 140);
}

function playGameOver() {
  [196, 164, 130].forEach((frequency, index) => tone(frequency, frequency, 0.24, 'sine', index * 0.15, 0.05));
}

function updatePauseState() {
  world?.setPaused(awaitingFirstJump || document.hidden || offscreen);
}

document.addEventListener('visibilitychange', updatePauseState);
const observer = new IntersectionObserver(([entry]) => {
  offscreen = entry.intersectionRatio < 0.25;
  updatePauseState();
}, { threshold: [0, 0.25, 1] });
observer.observe(app);

function showGestureGuide() {
  if (baseline) {
    elements.gesture.classList.add('is-visible', 'is-baseline');
    return;
  }
  elements.gesture.classList.add('is-visible', 'is-demo');
}

function onGameOver(result) {
  gameEnded = true;
  document.querySelector('.vr-stage').classList.add('is-ended');
  playGameOver();
  const score = Math.max(0, Math.round(result.distance));
  const resultRun = runNumber;
  const oldBest = preRunBest;
  elements.resultDistance.textContent = String(score);
  elements.resultName.textContent = playerName;
  elements.carrotLine.textContent = t('carrots', { count: result.carrots });
  elements.resultRank.textContent = canRank ? t('rankPending') : 'AlterU';
  window.setTimeout(() => {
    elements.result.hidden = false;
    requestAnimationFrame(() => elements.result.classList.add('is-visible'));
  }, 450);
  void submitRunScore(score, oldBest, resultRun);
}

async function initWorld() {
  if (world || loadingWorld) return;
  loadingWorld = true;
  try {
    const { createRabbitWorld } = await import('./rabbit-world.js');
    world = createRabbitWorld(elements.world, {
      baseline,
      startPaused: !baseline,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      callbacks: {
        onReady() {
          ready = true;
          elements.world.classList.add('is-ready');
          showGestureGuide();
        },
        onDistance(value) {
          elements.distance.textContent = String(value).padStart(baseline ? 3 : 1, '0');
        },
        onBonus() {
          playBonus();
          app.classList.add('vr-bonus');
          window.setTimeout(() => app.classList.remove('vr-bonus'), 220);
        },
        onHit: playHit,
        onGameOver,
        onReplay() {
          gameEnded = false;
          document.querySelector('.vr-stage').classList.remove('is-ended');
          elements.result.classList.remove('is-visible');
          window.setTimeout(() => { elements.result.hidden = true; }, 260);
        },
      },
    });
  } catch (error) {
    console.error(error);
    elements.error.hidden = false;
  } finally {
    loadingWorld = false;
  }
}

function jumpFromIntent(event) {
  if (!ready || gameEnded || event.target.closest('button,a')) return;
  getAudioContext();
  if (awaitingFirstJump) {
    snapshotPreRunBest();
    awaitingFirstJump = false;
    world?.setPaused(false);
  }
  elements.gesture.classList.add('is-hidden');
  if (world?.jump()) playJump();
}

elements.world.addEventListener('pointerdown', jumpFromIntent);
elements.replay.addEventListener('pointerdown', (event) => {
  event.stopPropagation();
  runNumber += 1;
  snapshotPreRunBest();
  world?.replay();
});
elements.leaders.addEventListener('click', () => {
  elements.leaderboard.hidden = false;
  renderLeaderboardRows();
  requestAnimationFrame(() => elements.leaderboard.classList.add('is-visible'));
  if (canRank) void refreshLeaderboard();
});
function closeLeaderboard() {
  elements.leaderboard.classList.remove('is-visible');
  window.setTimeout(() => {
    elements.leaderboard.hidden = true;
  }, 220);
}
elements.leaderboardClose.addEventListener('click', closeLeaderboard);
document.querySelector('[data-close-leaderboard]').addEventListener('click', closeLeaderboard);
elements.retry.addEventListener('click', () => location.reload());
elements.sound.addEventListener('click', (event) => {
  event.stopPropagation();
  muted = !muted;
  document.body.classList.toggle('vr-muted', muted);
  elements.sound.setAttribute('aria-label', muted ? t('soundOff') : t('soundOn'));
});
window.addEventListener('keydown', (event) => {
  if (event.code === 'Escape' && !elements.leaderboard.hidden) {
    closeLeaderboard();
    return;
  }
  if ((event.code === 'Space' || event.code === 'ArrowUp') && ready && !gameEnded) {
    event.preventDefault();
    getAudioContext();
    if (awaitingFirstJump) {
      snapshotPreRunBest();
      awaitingFirstJump = false;
      world?.setPaused(false);
    }
    elements.gesture.classList.add('is-hidden');
    if (world?.jump()) playJump();
  } else if (event.code === 'Enter' && gameEnded && elements.leaderboard.hidden) {
    runNumber += 1;
    snapshotPreRunBest();
    world?.replay();
  }
});

void refreshLeaderboard();
void initWorld();
