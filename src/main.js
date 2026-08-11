import './style.css';
import {
  callAigramAPI,
  getGameUuid,
  isInAigramNow,
  openAigramProfile,
  postAigramAPI,
  getTelegramId,
} from '@shared/runtime';
import {
  CHARACTER_ROSTER,
  STAGES,
  getCharacter,
  getStage,
} from './character-roster.js';

const query = new URLSearchParams(location.search);
const baseline = query.get('baseline') === '1';
const localeOverride = alteruLocalStorage.getItem('game_locale');
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
    openProfile: '打开 {name} 的资料',
    you: '你',
    meters: '米',
    seconds: '秒',
    stage: '第 {n} 关',
    stageProgress: '{time}秒 · {carrots}/{goal} 胡萝卜',
    wardrobe: '角色商店',
    collection: '{n} 位逃亡者',
    closeWardrobe: '关闭角色商店',
    wallet: '胡萝卜',
    owned: '已拥有',
    equipped: '已装备',
    trial: '本关试用',
    buy: '{price} 根解锁',
    insufficient: '胡萝卜还不够',
    purchaseSuccess: '已解锁 {name}',
    levelComplete: '逃出来了',
    levelFailed: '差一点逃掉',
    nextRunner: '下一位',
    levelResult: '坚持 {time} 秒 · {carrots}/{goal} 胡萝卜',
    allClear: '主线完成',
    endless: '无尽追逐',
    campaign: '返回主线',
    modeSwitch: '模式切换',
    endlessHint: '进入距离排行榜',
    campaignHint: '继续逐关解锁角色',
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
    openProfile: 'Open {name}’s profile',
    you: 'YOU',
    meters: 'm',
    seconds: 's',
    stage: 'Stage {n}',
    stageProgress: '{time}s · {carrots}/{goal} carrots',
    wardrobe: 'Character shop',
    collection: '{n} runners',
    closeWardrobe: 'Close character shop',
    wallet: 'Carrots',
    owned: 'Owned',
    equipped: 'Equipped',
    trial: 'Stage trial',
    buy: 'Unlock · {price}',
    insufficient: 'Not enough carrots',
    purchaseSuccess: '{name} unlocked',
    levelComplete: 'Made it out',
    levelFailed: 'Nearly escaped',
    nextRunner: 'Next runner',
    levelResult: '{time}s · {carrots}/{goal} carrots',
    allClear: 'Campaign clear',
    endless: 'Endless run',
    campaign: 'Return to campaign',
    modeSwitch: 'Switch mode',
    endlessHint: 'Enter the distance leaderboard',
    campaignHint: 'Keep unlocking the cast',
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
const SAVE_KEY = 'valorous_rabbit_cast_v1';
const gameUuid = getGameUuid();
let cloudSaveTimer = 0;

function loadProgress() {
  try {
    const saved = JSON.parse(alteruLocalStorage.getItem(SAVE_KEY) || '{}');
    return {
      stage: Math.max(1, Math.min(STAGES.length, Number(saved.stage) || 1)),
      wallet: Math.max(0, Number(saved.wallet) || 0),
      unlocked: Array.from(new Set(['original/rabbit', ...(saved.unlocked || [])])),
      selected: saved.selected || 'original/rabbit',
      _lastActive: Number(saved._lastActive) || 0,
    };
  } catch {
    return { stage: 1, wallet: 0, unlocked: ['original/rabbit'], selected: 'original/rabbit', _lastActive: 0 };
  }
}

let progress = loadProgress();
function withDebugGoal(stage) {
  if (!query.has('stage_duration') && !query.has('stage_carrots')) return stage;
  return {
    ...stage,
    duration: Math.max(1, Number(query.get('stage_duration')) || stage.duration),
    carrots: Math.max(0, Number(query.get('stage_carrots')) || 0),
  };
}

let activeStage = withDebugGoal(getStage(progress.stage));
let gameMode = query.get('mode') === 'campaign' ? 'campaign' : 'endless';
let activeCharacter = getCharacter(
  query.get('character') || (gameMode === 'endless' ? progress.selected : activeStage.characterKey),
);
let resultKind = 'failed';
let shopOpen = false;

function saveProgress() {
  progress = { ...progress, _lastActive: Date.now() };
  alteruLocalStorage.setItem(SAVE_KEY, JSON.stringify(progress));
  if (isInAigramNow() && gameUuid) {
    window.clearTimeout(cloudSaveTimer);
    cloudSaveTimer = window.setTimeout(() => {
      postAigramAPI('/note/aigram/ai/game/save/data', {
        session_id: gameUuid,
        resource_data: JSON.stringify(progress),
      });
    }, 1000);
  }
}

const app = document.querySelector('#app');
app.dataset.identitySource = query.get('user_name')?.trim() ? 'debug' : 'fallback';
app.innerHTML = `
  <section class="vr-stage" aria-label="${t('title')}">
    <div class="vr-world" id="world"></div>
    <div class="vr-hud" aria-hidden="true">
      <span class="vr-hud__label" id="hud-label">${gameMode === 'campaign' ? t('stage', { n: activeStage.id }) : t('distance')}</span>
      <strong class="vr-hud__value" id="distance">0</strong>
      <span class="vr-hud__mission" id="mission">${gameMode === 'campaign' ? t('stageProgress', { time: 0, carrots: 0, goal: activeStage.carrots }) : ''}</span>
    </div>
    <div class="vr-cast-dock">
      <button class="vr-cast-button" id="cast" type="button" aria-label="${t('wardrobe')}">
        <span class="vr-cast-button__portrait" id="cast-portrait" aria-hidden="true"></span>
        <svg class="vr-cast-button__switch" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m8 7 3-3 3 3M11 4v7m5 6-3 3-3-3m3 3v-7"/>
        </svg>
      </button>
      <div class="vr-wallet" id="wallet" aria-label="${t('wallet')}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21c4-3.5 6-7 6-11a6 6 0 0 0-12 0c0 4 2 7.5 6 11Zm0-11c-3-2.7-4.7-4.7-5-7 2.8.2 4.5 1.5 5 4 .5-2.5 2.2-3.8 5-4-.3 2.3-2 4.3-5 7Z"/></svg>
        <strong id="wallet-value">${progress.wallet}</strong>
      </div>
    </div>
    <button class="vr-icon-button" id="sound" type="button" aria-label="${t('soundOn')}">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path class="vr-sound-body" d="M4 9v6h4l5 4V5L8 9H4Z"/>
        <path class="vr-sound-wave" d="M16 8.2c1.1 1 1.7 2.3 1.7 3.8s-.6 2.8-1.7 3.8M18.7 5.8c1.8 1.6 2.8 3.7 2.8 6.2s-1 4.6-2.8 6.2"/>
        <path class="vr-sound-slash" d="M5 5l14 14"/>
      </svg>
    </button>
    <button class="vr-icon-button vr-icon-button--leaders" id="leaders-shortcut" type="button" aria-label="${t('leaders')}">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 18 2 7l6 5 4-8 4 8 6-5-1 11H3Zm1 3h16"/>
      </svg>
    </button>
    <div class="vr-gesture" id="gesture" aria-hidden="true">
      <span class="vr-gesture__ring"></span>
      <svg viewBox="0 0 24 24"><path d="${materialTouchPath}"/></svg>
      <span>${baseline ? t('baselineHint') : t('jump')}</span>
    </div>
    <div class="vr-result" id="result" hidden>
      <section class="vr-result__card" aria-labelledby="result-heading">
        <p class="vr-result__eyebrow" id="result-eyebrow">${t('gameOver')}</p>
        <h2 class="vr-result__score" id="result-heading">
          <span id="result-distance">0</span><small id="result-unit">${t('meters')}</small>
        </h2>
        <p class="vr-result__runner" id="result-name"></p>
        <p class="vr-result__details">
          <span id="carrot-line"></span>
          <span aria-hidden="true">·</span>
          <span id="result-rank">${isInAigramNow() ? t('rankPending') : 'AlterU'}</span>
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
    <div class="vr-shop" id="shop" hidden>
      <button class="vr-shop__scrim" type="button" data-close-shop aria-label="${t('closeWardrobe')}"></button>
      <section class="vr-shop__panel" role="dialog" aria-modal="true" aria-labelledby="shop-title">
        <header class="vr-shop__header">
          <div class="vr-shop__heading">
            <span>${t('collection', { n: CHARACTER_ROSTER.length })}</span>
            <h2 id="shop-title">${t('wardrobe')}</h2>
          </div>
          <div class="vr-shop__tools">
            <div class="vr-shop__balance" aria-label="${t('wallet')}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21c4-3.5 6-7 6-11a6 6 0 0 0-12 0c0 4 2 7.5 6 11Zm0-11c-3-2.7-4.7-4.7-5-7 2.8.2 4.5 1.5 5 4 .5-2.5 2.2-3.8 5-4-.3 2.3-2 4.3-5 7Z"/></svg>
              <strong id="shop-wallet">${progress.wallet}</strong>
            </div>
            <button class="vr-shop__close" id="shop-close" type="button" aria-label="${t('closeWardrobe')}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
            </button>
          </div>
        </header>
        <p class="vr-shop__notice" id="shop-notice" aria-live="polite"></p>
        <button class="vr-shop__mode" id="mode-toggle" type="button">
          <svg class="vr-shop__mode-route" viewBox="0 0 64 32" aria-hidden="true">
            <path class="vr-shop__mode-route-main" d="M7 24.5c6-1 5.3-8.2 11.5-8.5 6.4-.3 6 7.6 12.4 7.1 6.8-.5 6.2-11 13.4-12.1 4.2-.6 7.5 1.6 11.7 0"/>
            <path class="vr-shop__mode-route-pencil" d="M7.5 26.2c6.2-1.4 6.1-7.6 11.1-8.2 6-.7 6.5 7.2 12.2 6.7 7.6-.7 6.6-11.2 13.7-12.3"/>
            <circle cx="7" cy="24.5" r="3.2"/>
            <circle class="vr-shop__mode-route-dot" cx="7" cy="24.5" r=".9"/>
            <path d="M44.5 11.7V4.5m.2.5c4.3-1.8 6.1 2.2 10.6.2l-1.1 5.2c-3.7 1.5-5.5-2-9.6-.4"/>
            <path class="vr-shop__mode-route-crown" d="M46.5 27h14M48 24.5l-1-8 4 3.5 3-6 3 6 4-3.5-1 8H48Z"/>
          </svg>
          <span class="vr-shop__mode-copy">
            <small>${t('modeSwitch')}</small>
            <strong id="mode-title">${gameMode === 'endless' ? t('campaign') : t('endless')}</strong>
            <em id="mode-hint">${gameMode === 'endless' ? t('campaignHint') : t('endlessHint')}</em>
          </span>
          <svg class="vr-shop__mode-arrow" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9 5 7 7-7 7"/>
          </svg>
        </button>
        <div class="vr-shop__grid" id="shop-grid"></div>
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
  hudLabel: document.querySelector('#hud-label'),
  mission: document.querySelector('#mission'),
  cast: document.querySelector('#cast'),
  castPortrait: document.querySelector('#cast-portrait'),
  wallet: document.querySelector('#wallet'),
  walletValue: document.querySelector('#wallet-value'),
  sound: document.querySelector('#sound'),
  gesture: document.querySelector('#gesture'),
  result: document.querySelector('#result'),
  resultEyebrow: document.querySelector('#result-eyebrow'),
  resultDistance: document.querySelector('#result-distance'),
  resultUnit: document.querySelector('#result-unit'),
  resultName: document.querySelector('#result-name'),
  carrotLine: document.querySelector('#carrot-line'),
  resultRank: document.querySelector('#result-rank'),
  replay: document.querySelector('#replay'),
  leaders: document.querySelector('#leaders'),
  leadersShortcut: document.querySelector('#leaders-shortcut'),
  championAvatar: document.querySelector('#champion-avatar'),
  championLabel: document.querySelector('#champion-label'),
  championName: document.querySelector('#champion-name'),
  championScore: document.querySelector('#champion-score'),
  leaderboard: document.querySelector('#leaderboard'),
  leaderboardBody: document.querySelector('#leaderboard-body'),
  leaderboardClose: document.querySelector('#leaderboard-close'),
  shop: document.querySelector('#shop'),
  shopGrid: document.querySelector('#shop-grid'),
  shopWallet: document.querySelector('#shop-wallet'),
  shopNotice: document.querySelector('#shop-notice'),
  shopClose: document.querySelector('#shop-close'),
  modeToggle: document.querySelector('#mode-toggle'),
  modeTitle: document.querySelector('#mode-title'),
  modeHint: document.querySelector('#mode-hint'),
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
let leaderboardOpen = false;
const canViewLeaderboard = Boolean(gameUuid && !baseline);
const canRank = Boolean(gameUuid && !baseline && gameMode === 'endless');
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
  return row.userId === String(getTelegramId());
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
  if (!canViewLeaderboard) {
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
      item.setAttribute('aria-label', t('openProfile', { name: row.userName }));
      item.addEventListener('click', () => {
        if (isInAigramNow() && row.userId) openAigramProfile(row.userId);
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
  if (!canViewLeaderboard || leaderboardState.loading) return leaderboardState.rows;
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

function updateWallet() {
  elements.walletValue.textContent = String(progress.wallet);
  elements.shopWallet.textContent = String(progress.wallet);
}

function characterMedia(character) {
  const image = document.createElement('img');
  image.src = character.spriteUrl;
  image.alt = '';
  image.loading = 'lazy';
  image.draggable = false;
  return image;
}

function updateCastPortrait() {
  elements.castPortrait.replaceChildren(characterMedia(activeCharacter));
}

function renderShop() {
  const previousScroll = elements.shopGrid.scrollTop;
  elements.shopGrid.replaceChildren();
  updateWallet();
  updateCastPortrait();
  elements.modeToggle.hidden = false;
  elements.modeTitle.textContent = gameMode === 'endless' ? t('campaign') : t('endless');
  elements.modeHint.textContent = gameMode === 'endless' ? t('campaignHint') : t('endlessHint');
  elements.modeToggle.setAttribute(
    'aria-label',
    `${elements.modeTitle.textContent} · ${elements.modeHint.textContent}`,
  );
  CHARACTER_ROSTER.forEach((character) => {
    const owned = progress.unlocked.includes(character.key);
    const equipped = gameMode === 'endless' && progress.selected === character.key;
    const trial = gameMode === 'campaign' && activeStage.characterKey === character.key && !owned;
    const card = document.createElement('button');
    card.type = 'button';
    card.dataset.characterKey = character.key;
    const stateKey = equipped ? 'equipped' : trial ? 'trial' : owned ? 'owned' : 'locked';
    card.dataset.state = stateKey;
    card.className = `vr-shop__item${equipped ? ' is-equipped' : ''}${trial ? ' is-trial' : ''}`;
    const media = document.createElement('span');
    media.className = 'vr-shop__media';
    const index = document.createElement('span');
    index.className = 'vr-shop__index';
    index.textContent = String(character.stage).padStart(2, '0');
    media.append(index, characterMedia(character));
    card.appendChild(media);
    const copyBox = document.createElement('span');
    copyBox.className = 'vr-shop__item-copy';
    const name = document.createElement('strong');
    name.textContent = character.name[locale];
    const state = document.createElement('small');
    state.textContent = equipped
      ? t('equipped')
      : trial ? t('trial')
        : owned ? t('owned')
          : t('buy', { price: character.price });
    card.setAttribute('aria-label', `${character.name[locale]} · ${state.textContent}`);
    copyBox.append(name, state);
    card.appendChild(copyBox);
    card.addEventListener('click', async () => {
      elements.shopNotice.textContent = '';
      if (!owned && !trial) {
        if (progress.wallet < character.price) {
          elements.shopNotice.textContent = t('insufficient');
          card.classList.add('is-denied');
          window.setTimeout(() => card.classList.remove('is-denied'), 260);
          tone(140, 110, .09, 'square', 0, .035);
          tone(140, 110, .09, 'square', .1, .035);
          return;
        }
        progress.wallet -= character.price;
        progress.unlocked = [...progress.unlocked, character.key];
        if (gameMode === 'endless') progress.selected = character.key;
        saveProgress();
        updateWallet();
        elements.shopNotice.textContent = t('purchaseSuccess', { name: character.name[locale] });
        playUnlock();
        if (gameMode === 'endless' && world) {
          activeCharacter = character;
          await world.setCharacter(character);
        }
        renderShop();
        return;
      }
      if (owned) {
        progress.selected = character.key;
        saveProgress();
        if (gameMode === 'endless' && world) {
          activeCharacter = character;
          await world.setCharacter(character);
        }
        renderShop();
      }
    });
    elements.shopGrid.appendChild(card);
  });
  requestAnimationFrame(() => {
    elements.shopGrid.scrollTop = previousScroll;
  });
}

function openShop() {
  shopOpen = true;
  elements.shopNotice.textContent = '';
  renderShop();
  elements.shop.hidden = false;
  requestAnimationFrame(() => elements.shop.classList.add('is-visible'));
  updatePauseState();
}

function closeShop() {
  shopOpen = false;
  elements.shop.classList.remove('is-visible');
  window.setTimeout(() => {
    if (!shopOpen) elements.shop.hidden = true;
  }, 220);
  updatePauseState();
}

async function loadIdentity() {
  if (query.get('user_name')?.trim()) return;
  if (!isInAigramNow() || !getTelegramId()) return;
  try {
    const response = await callAigramAPI(
      `/note/telegram/user/get/info/by/telegram_id?telegram_id=${encodeURIComponent(getTelegramId())}`,
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

async function hydrateCloudProgress() {
  if (!isInAigramNow() || !gameUuid || !getTelegramId()) return;
  try {
    const response = await callAigramAPI(
      `/note/aigram/ai/game/get/data/list?session_id=${encodeURIComponent(gameUuid)}`,
      'GET',
    );
    const rows = Array.isArray(response?.data) ? response.data : [];
    const mine = rows.find((row) => String(row.user_id) === String(getTelegramId()));
    if (!mine?.resource_data) return;
    const cloud = JSON.parse(mine.resource_data);
    if ((Number(cloud._lastActive) || 0) <= (progress._lastActive || 0)) return;
    progress = {
      stage: Math.max(1, Math.min(STAGES.length, Number(cloud.stage) || 1)),
      wallet: Math.max(0, Number(cloud.wallet) || 0),
      unlocked: Array.from(new Set(['original/rabbit', ...(cloud.unlocked || [])])),
      selected: cloud.selected || 'original/rabbit',
      _lastActive: Number(cloud._lastActive) || 0,
    };
    alteruLocalStorage.setItem(SAVE_KEY, JSON.stringify(progress));
    if (awaitingFirstJump && gameMode === 'campaign') {
      activeStage = withDebugGoal(getStage(progress.stage));
      activeCharacter = getCharacter(activeStage.characterKey);
      updateCastPortrait();
      elements.hudLabel.textContent = t('stage', { n: activeStage.id });
      elements.mission.textContent = t('stageProgress', {
        time: 0,
        carrots: 0,
        goal: activeStage.carrots,
      });
      if (world) await world.startRun(activeCharacter, activeStage);
    }
    updateWallet();
    renderShop();
  } catch {
    // Local progression remains authoritative when the bridge is unavailable.
  }
}
void hydrateCloudProgress();

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

function playLevelComplete() {
  [392, 523, 659, 784].forEach((frequency, index) => tone(frequency, frequency, .16, 'triangle', index * .1, .055));
}

function playUnlock() {
  tone(440, 880, .28, 'triangle', 0, .055);
  tone(660, 660, .12, 'sine', .18, .04);
}

function updatePauseState() {
  world?.setPaused(awaitingFirstJump || document.hidden || offscreen || shopOpen || leaderboardOpen);
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
  resultKind = 'failed';
  gameEnded = true;
  document.querySelector('.vr-stage').classList.add('is-ended');
  playGameOver();
  const score = Math.max(0, Math.round(result.distance));
  const resultRun = runNumber;
  const oldBest = preRunBest;
  elements.resultEyebrow.textContent = gameMode === 'campaign' ? t('levelFailed') : t('gameOver');
  elements.resultDistance.textContent = String(score);
  elements.resultUnit.textContent = t('meters');
  elements.resultName.textContent = gameMode === 'campaign' ? activeCharacter.name[locale] : playerName;
  elements.carrotLine.textContent = gameMode === 'campaign'
    ? t('levelResult', {
      time: Math.floor(result.elapsed || 0),
      carrots: result.carrots,
      goal: activeStage.carrots,
    })
    : t('carrots', { count: result.carrots });
  elements.resultRank.textContent = gameMode === 'campaign'
    ? t('stage', { n: activeStage.id })
    : canRank ? t('rankPending') : 'AlterU';
  elements.leaders.hidden = gameMode === 'campaign';
  elements.replay.textContent = t('replay');
  window.setTimeout(() => {
    elements.result.hidden = false;
    requestAnimationFrame(() => elements.result.classList.add('is-visible'));
  }, 450);
  void submitRunScore(score, oldBest, resultRun);
}

function onLevelComplete(result) {
  resultKind = 'complete';
  gameEnded = true;
  document.querySelector('.vr-stage').classList.add('is-ended', 'is-complete');
  playLevelComplete();
  if (!progress.unlocked.includes(activeCharacter.key)) {
    progress.unlocked = [...progress.unlocked, activeCharacter.key];
    progress.selected = activeCharacter.key;
    playUnlock();
  }
  if (activeStage.id < STAGES.length) progress.stage = Math.max(progress.stage, activeStage.id + 1);
  saveProgress();
  renderShop();
  elements.resultEyebrow.textContent = activeStage.id === STAGES.length ? t('allClear') : t('levelComplete');
  elements.resultDistance.textContent = String(Math.floor(result.elapsed));
  elements.resultUnit.textContent = t('seconds');
  elements.resultName.textContent = activeCharacter.name[locale];
  elements.carrotLine.textContent = t('levelResult', {
    time: Math.floor(result.elapsed),
    carrots: result.carrots,
    goal: activeStage.carrots,
  });
  elements.resultRank.textContent = t('owned');
  elements.leaders.hidden = true;
  elements.replay.textContent = activeStage.id === STAGES.length ? t('replay') : t('nextRunner');
  window.setTimeout(() => {
    elements.result.hidden = false;
    requestAnimationFrame(() => elements.result.classList.add('is-visible'));
  }, 320);
}

async function initWorld() {
  if (world || loadingWorld) return;
  loadingWorld = true;
  try {
    const { createRabbitWorld } = await import('./rabbit-world.js');
    world = await createRabbitWorld(elements.world, {
      baseline,
      startPaused: !baseline,
      character: baseline ? getCharacter('original/rabbit') : activeCharacter,
      stageGoal: gameMode === 'campaign' ? activeStage : null,
      debugCatchAfter: query.get('catch_after'),
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
        onProgress(value) {
          if (gameMode !== 'campaign') return;
          elements.mission.textContent = t('stageProgress', {
            time: Math.min(activeStage.duration, Math.floor(value.elapsed)),
            carrots: value.carrots,
            goal: activeStage.carrots,
          });
        },
        onBonus() {
          if (!baseline) {
            progress.wallet += 1;
            saveProgress();
            updateWallet();
          }
          playBonus();
          app.classList.add('vr-bonus');
          window.setTimeout(() => app.classList.remove('vr-bonus'), 220);
        },
        onHit: playHit,
        onGameOver,
        onLevelComplete,
        onReplay() {
          gameEnded = false;
          document.querySelector('.vr-stage').classList.remove('is-ended', 'is-complete');
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
elements.replay.addEventListener('pointerdown', async (event) => {
  event.stopPropagation();
  runNumber += 1;
  snapshotPreRunBest();
  if (gameMode === 'campaign') {
    if (resultKind === 'complete' && activeStage.id < STAGES.length) {
      activeStage = withDebugGoal(getStage(activeStage.id + 1));
      activeCharacter = getCharacter(activeStage.characterKey);
      updateCastPortrait();
    }
    elements.hudLabel.textContent = t('stage', { n: activeStage.id });
    elements.mission.textContent = t('stageProgress', {
      time: 0,
      carrots: 0,
      goal: activeStage.carrots,
    });
    await world?.startRun(activeCharacter, activeStage);
  } else {
    world?.replay();
  }
});
elements.cast.addEventListener('click', (event) => {
  event.stopPropagation();
  openShop();
});
elements.shopClose.addEventListener('click', closeShop);
document.querySelector('[data-close-shop]').addEventListener('click', closeShop);
elements.modeToggle.addEventListener('click', () => {
  const url = new URL(location.href);
  if (gameMode === 'endless') url.searchParams.set('mode', 'campaign');
  else url.searchParams.delete('mode');
  location.href = url.href;
});
function openLeaderboard() {
  leaderboardOpen = true;
  elements.leaderboard.hidden = false;
  renderLeaderboardRows();
  requestAnimationFrame(() => elements.leaderboard.classList.add('is-visible'));
  if (canViewLeaderboard) void refreshLeaderboard();
  updatePauseState();
}

elements.leaders.addEventListener('click', openLeaderboard);
elements.leadersShortcut.addEventListener('click', (event) => {
  event.stopPropagation();
  openLeaderboard();
});
function closeLeaderboard() {
  leaderboardOpen = false;
  elements.leaderboard.classList.remove('is-visible');
  window.setTimeout(() => {
    elements.leaderboard.hidden = true;
  }, 220);
  updatePauseState();
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
  if (event.code === 'Escape' && !elements.shop.hidden) {
    closeShop();
    return;
  }
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
  } else if (event.code === 'Enter' && gameEnded && elements.leaderboard.hidden && elements.shop.hidden) {
    runNumber += 1;
    snapshotPreRunBest();
    if (gameMode === 'campaign') {
      elements.replay.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    } else {
      world?.replay();
    }
  }
});

renderShop();
if (isInAigramNow()) void refreshLeaderboard();
void initWorld();
if (query.get('leaderboard') === '1') openLeaderboard();
