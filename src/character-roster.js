const glbModules = import.meta.glob('./assets/characters/*.glb', {
  eager: true,
  query: '?url',
  import: 'default',
});

const spriteModules = import.meta.glob('./assets/characters/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});

function assetUrl(file, modules) {
  return modules[`./assets/characters/${file}`] || '';
}

function entry(id, category, names, motion, footprint, stage, price = 0) {
  const file = `${category}__${id}`;
  return {
    key: `${category}/${id}`,
    id,
    category,
    name: names,
    motion,
    footprint,
    stage,
    price,
    glbUrl: assetUrl(`${file}.glb`, glbModules),
    spriteUrl: assetUrl(`${file}.png`, spriteModules),
  };
}

export const CHARACTER_ROSTER = [
  {
    key: 'original/rabbit',
    id: 'rabbit',
    category: 'original',
    name: { zh: '勇兔', en: 'Valorous Rabbit' },
    motion: 'rabbit',
    footprint: [1.64, 1.38, .74],
    stage: 1,
    price: 0,
    glbUrl: '',
    spriteUrl: '',
  },
  entry('kid', 'people', { zh: '小孩', en: 'Kid' }, 'quickstep', [1.3, 2.17, .8], 2, 60),
  entry('granny', 'people', { zh: '老奶奶', en: 'Granny' }, 'shuffle', [1.52, 2.98, .575], 3, 120),
  entry('zombie', 'monsters', { zh: '僵尸', en: 'Zombie' }, 'lurch', [1.42, 2.59, 1.296], 4, 220),
  entry('werewolf', 'monsters', { zh: '狼人', en: 'Werewolf' }, 'prowl', [1.72, 2.32, 1.658], 5, 360),
  entry('ghost', 'monsters', { zh: '幽灵', en: 'Ghost' }, 'float', [1.419, 1.97, .535], 6, 360),
  entry('combatMech', 'mechs', { zh: '战斗机甲', en: 'Combat Mech' }, 'piston', [2.38, 3.14, 1.1], 7, 560),
  entry('minotaur', 'mythic', { zh: '牛头人', en: 'Minotaur' }, 'charge', [2.04, 3.126, 1.84], 8, 560),
  entry('frog', 'animals', { zh: '青蛙', en: 'Frog' }, 'spring', [1.17, .77, 1.4], 9, 220),
  entry('duck', 'animals', { zh: '鸭子', en: 'Duck' }, 'waddle', [1.18, .95, .94], 10, 120),
  entry('chicken', 'animals', { zh: '鸡', en: 'Chicken' }, 'scuttle', [1.21, 1.175, .98], 11, 120),
  entry('firefighter', 'archetypes', { zh: '消防员', en: 'Firefighter' }, 'heroic', [1.8, 2.93, .95], 12, 360),
];

export const STAGES = CHARACTER_ROSTER.map((character, index) => ({
  id: index + 1,
  characterKey: character.key,
  duration: [90, 94, 98, 102, 106, 110, 114, 118, 122, 126, 130, 135][index],
  carrots: [3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6][index],
}));

export const MOTION_PROFILES = {
  quickstep: { cadence: 1.35, bounce: 1.25, lean: .12, limb: .9, arm: 1.05, jump: 1.08, squash: .1, phase: .1 },
  shuffle: { cadence: .72, bounce: .38, lean: -.04, limb: .34, arm: .22, jump: .82, squash: .04, phase: .6 },
  lurch: { cadence: .78, bounce: .72, lean: .24, limb: .62, arm: .18, jump: .9, squash: .06, phase: 1.1, asymmetric: .28 },
  prowl: { cadence: 1.18, bounce: .82, lean: .34, limb: 1.05, arm: .72, jump: 1.12, squash: .08, phase: .3 },
  float: { cadence: .55, bounce: 1.65, lean: .08, limb: 0, arm: 0, jump: 1.15, squash: .02, phase: 1.8, hover: 2.1 },
  piston: { cadence: .82, bounce: .42, lean: .08, limb: .72, arm: .46, jump: .88, squash: .025, phase: .2, stomp: .42 },
  charge: { cadence: .96, bounce: .62, lean: .3, limb: .88, arm: .5, jump: .95, squash: .045, phase: .9, stomp: .25 },
  spring: { cadence: .58, bounce: .55, lean: .06, limb: 0, arm: 0, jump: 1.35, squash: .2, phase: 1.4, hop: true },
  waddle: { cadence: .9, bounce: .52, lean: .02, limb: 0, arm: 0, jump: .82, squash: .08, phase: .4, sway: .22 },
  scuttle: { cadence: 1.55, bounce: .68, lean: .14, limb: 0, arm: 0, jump: .96, squash: .09, phase: .7, sway: .11 },
  heroic: { cadence: 1.02, bounce: .78, lean: .16, limb: .82, arm: 1.12, jump: 1.02, squash: .055, phase: .15 },
};

export function getCharacter(key) {
  return CHARACTER_ROSTER.find((character) => character.key === key) || CHARACTER_ROSTER[0];
}

export function getStage(stageNumber) {
  return STAGES[Math.max(0, Math.min(STAGES.length - 1, stageNumber - 1))];
}
