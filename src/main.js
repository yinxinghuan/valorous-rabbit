import './style.css';
import { callAigramAPI, isInAigram, telegramId } from '@shared/runtime';

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
      <p class="vr-result__eyebrow">${t('gameOver')}</p>
      <h2 id="result-line"></h2>
      <p id="carrot-line"></p>
      <button id="replay" type="button">${t('replay')}</button>
      <a href="https://codepen.io/Yakudoo/pen/YGxYej" target="_blank" rel="noreferrer">${t('attribution')}</a>
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
  resultLine: document.querySelector('#result-line'),
  carrotLine: document.querySelector('#carrot-line'),
  replay: document.querySelector('#replay'),
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
  elements.resultLine.textContent = t('result', { name: playerName, distance: result.distance });
  elements.carrotLine.textContent = t('carrots', { count: result.carrots });
  window.setTimeout(() => {
    elements.result.hidden = false;
    requestAnimationFrame(() => elements.result.classList.add('is-visible'));
  }, 450);
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
    awaitingFirstJump = false;
    world?.setPaused(false);
  }
  elements.gesture.classList.add('is-hidden');
  if (world?.jump()) playJump();
}

elements.world.addEventListener('pointerdown', jumpFromIntent);
elements.replay.addEventListener('pointerdown', (event) => {
  event.stopPropagation();
  world?.replay();
});
elements.retry.addEventListener('click', () => location.reload());
elements.sound.addEventListener('click', (event) => {
  event.stopPropagation();
  muted = !muted;
  document.body.classList.toggle('vr-muted', muted);
  elements.sound.setAttribute('aria-label', muted ? t('soundOff') : t('soundOn'));
});
window.addEventListener('keydown', (event) => {
  if ((event.code === 'Space' || event.code === 'ArrowUp') && ready && !gameEnded) {
    event.preventDefault();
    getAudioContext();
    if (awaitingFirstJump) {
      awaitingFirstJump = false;
      world?.setPaused(false);
    }
    elements.gesture.classList.add('is-hidden');
    if (world?.jump()) playJump();
  } else if (event.code === 'Enter' && gameEnded) {
    world?.replay();
  }
});

void initWorld();
