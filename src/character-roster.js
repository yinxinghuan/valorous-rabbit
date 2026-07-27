import inventory from './assets/character-inventory.json';
import originalRabbitSprite from './assets/original-rabbit.png';

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

const FEATURED_KEYS = [
  'people/kid',
  'people/granny',
  'monsters/zombie',
  'monsters/werewolf',
  'monsters/ghost',
  'mechs/combatMech',
  'mythic/minotaur',
  'animals/frog',
  'animals/duck',
  'animals/chicken',
  'archetypes/firefighter',
];

const MOTION_BY_CHARACTER = {
  'people/shopkeeper': 'careful',
  'people/granny': 'shuffle',
  'people/oldman': 'shuffle',
  'people/blonde': 'graceful',
  'people/kid': 'quickstep',
  'people/businessman': 'brisk',
  'people/officeWoman': 'brisk',
  'people/student': 'quickstep',
  'people/darkWoman': 'graceful',
  'people/worker': 'workhorse',
  'people/teen': 'swagger',
  'people/fitWoman': 'athletic',
  'people/chef': 'careful',
  'people/bigGuy': 'lumber',
  'people/commuter': 'brisk',
  'archetypes/cop': 'patrol',
  'archetypes/nurse': 'brisk',
  'archetypes/firefighter': 'heroic',
  'archetypes/construction': 'workhorse',
  'archetypes/delivery': 'quickstep',
  'archetypes/cowboy': 'swagger',
  'archetypes/punk': 'swagger',
  'archetypes/rapper': 'lumber',
  'archetypes/biker': 'swagger',
  'archetypes/goth': 'graceful',
  'archetypes/paramedic': 'athletic',
  'monsters/vampire': 'glide',
  'monsters/werewolf': 'prowl',
  'monsters/zombie': 'lurch',
  'monsters/ghost': 'float',
  'monsters/skeleton': 'rattle',
  'monsters/mummy': 'wrapped',
  'office/executive': 'brisk',
  'office/courier': 'burdened',
  'office/janitor': 'workhorse',
  'office/barista': 'careful',
  'office/securityGuard': 'patrol',
  'villains/swat': 'tactical',
  'villains/viking': 'charge',
  'mechs/combatMech': 'piston',
  'mythic/minotaur': 'charge',
  'animals/pig': 'trot',
  'animals/cow': 'heavyTrot',
  'animals/cat': 'feline',
  'animals/fox': 'sprint',
  'animals/chicken': 'scuttle',
  'animals/frog': 'spring',
  'animals/dog': 'bound',
  'animals/sheep': 'trot',
  'animals/rabbit': 'hop',
  'animals/bear': 'heavyTrot',
  'animals/duck': 'waddle',
};

const PRICE_OVERRIDES = {
  'people/kid': 60,
  'people/granny': 120,
  'monsters/zombie': 220,
  'monsters/werewolf': 360,
  'monsters/ghost': 360,
  'mechs/combatMech': 560,
  'mythic/minotaur': 560,
  'animals/frog': 220,
  'animals/duck': 120,
  'animals/chicken': 120,
  'archetypes/firefighter': 360,
};

const reverseFacingKeys = new Set(
  inventory.characters
    .filter((character) => character.category === 'animals')
    .map((character) => character.key),
);

function assetUrl(stem, extension, modules) {
  return modules[`./assets/characters/${stem}.${extension}`] || '';
}

function priceFor(character, index) {
  if (PRICE_OVERRIDES[character.key]) return PRICE_OVERRIDES[character.key];
  return [60, 120, 220, 360, 560][Math.min(4, Math.floor(index / 11))];
}

const missingMotion = inventory.characters
  .filter((character) => !MOTION_BY_CHARACTER[character.key])
  .map((character) => character.key);
const extraMotion = Object.keys(MOTION_BY_CHARACTER)
  .filter((key) => !inventory.characters.some((character) => character.key === key));
if (missingMotion.length || extraMotion.length) {
  throw new Error(`Character motion roster mismatch. Missing: ${missingMotion.join(', ') || 'none'}; extra: ${extraMotion.join(', ') || 'none'}`);
}

const inventoryByKey = new Map(inventory.characters.map((character) => [character.key, character]));
const orderedSharedCharacters = [
  ...FEATURED_KEYS.map((key) => inventoryByKey.get(key)),
  ...inventory.characters.filter((character) => !FEATURED_KEYS.includes(character.key)),
];

const sharedRoster = orderedSharedCharacters.map((character, index) => {
  if (!character) throw new Error('Featured character is missing from the live inventory.');
  const glbUrl = assetUrl(character.assetStem, 'glb', glbModules);
  const spriteUrl = assetUrl(character.assetStem, 'png', spriteModules);
  if (!glbUrl || !spriteUrl) throw new Error(`Missing copied assets for ${character.key}`);
  return {
    ...character,
    motion: MOTION_BY_CHARACTER[character.key],
    stage: index + 2,
    price: priceFor(character, index),
    facingYaw: reverseFacingKeys.has(character.key) ? Math.PI : 0,
    glbUrl,
    spriteUrl,
  };
});

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
    facingYaw: 0,
    glbUrl: '',
    spriteUrl: originalRabbitSprite,
  },
  ...sharedRoster,
];

export const STAGES = CHARACTER_ROSTER.map((character, index) => ({
  id: index + 1,
  characterKey: character.key,
  duration: Math.min(150, 90 + index * 2),
  carrots: Math.min(10, 3 + Math.floor(index / 6)),
}));

export const MOTION_PROFILES = {
  quickstep: { cadence: 1.35, bounce: 1.25, lean: .12, limb: .9, arm: 1.05, jump: 1.08, squash: .1, phase: .1 },
  shuffle: { cadence: .72, bounce: .38, lean: -.04, limb: .34, arm: .22, jump: .82, squash: .04, phase: .6 },
  careful: { cadence: .82, bounce: .46, lean: .02, limb: .48, arm: .32, jump: .9, squash: .045, phase: .45 },
  graceful: { cadence: .92, bounce: .62, lean: .04, limb: .58, arm: .72, jump: 1, squash: .05, phase: .8, sway: .035 },
  brisk: { cadence: 1.08, bounce: .74, lean: .11, limb: .72, arm: .78, jump: 1.02, squash: .055, phase: .2 },
  workhorse: { cadence: .88, bounce: .58, lean: .15, limb: .66, arm: .58, jump: .94, squash: .06, phase: .5, stomp: .08 },
  swagger: { cadence: .9, bounce: .66, lean: .08, limb: .68, arm: .86, jump: 1, squash: .055, phase: 1.2, sway: .07 },
  athletic: { cadence: 1.28, bounce: .9, lean: .2, limb: .94, arm: 1.08, jump: 1.14, squash: .08, phase: .15 },
  lumber: { cadence: .72, bounce: .52, lean: .1, limb: .58, arm: .46, jump: .86, squash: .06, phase: .95, stomp: .17 },
  patrol: { cadence: 1, bounce: .62, lean: .12, limb: .7, arm: .64, jump: .98, squash: .05, phase: .3, stomp: .06 },
  burdened: { cadence: .94, bounce: .64, lean: .21, limb: .72, arm: .38, jump: .92, squash: .06, phase: .55 },
  tactical: { cadence: 1.12, bounce: .56, lean: .25, limb: .78, arm: .52, jump: 1.04, squash: .045, phase: .1, stomp: .08 },
  lurch: { cadence: .78, bounce: .72, lean: .24, limb: .62, arm: .18, jump: .9, squash: .06, phase: 1.1, asymmetric: .28 },
  prowl: { cadence: 1.18, bounce: .82, lean: .34, limb: 1.05, arm: .72, jump: 1.12, squash: .08, phase: .3 },
  glide: { cadence: .7, bounce: .72, lean: .09, limb: .52, arm: .9, jump: 1.08, squash: .035, phase: 1.4, hover: .65, sway: .035 },
  float: { cadence: .55, bounce: 1.65, lean: .08, limb: 0, arm: 0, jump: 1.15, squash: .02, phase: 1.8, hover: 2.1 },
  rattle: { cadence: 1.42, bounce: .84, lean: .16, limb: .98, arm: .92, jump: 1.06, squash: .025, phase: .9, sway: .055 },
  wrapped: { cadence: .62, bounce: .42, lean: .22, limb: .34, arm: .12, jump: .84, squash: .035, phase: .35, asymmetric: .14 },
  piston: { cadence: .82, bounce: .42, lean: .08, limb: .72, arm: .46, jump: .88, squash: .025, phase: .2, stomp: .42 },
  charge: { cadence: .96, bounce: .62, lean: .3, limb: .88, arm: .5, jump: .95, squash: .045, phase: .9, stomp: .25 },
  spring: { cadence: .58, bounce: .55, lean: .06, limb: 0, arm: 0, jump: 1.35, squash: .2, phase: 1.4, hop: true },
  waddle: { cadence: .9, bounce: .52, lean: .02, limb: 0, arm: 0, jump: .82, squash: .08, phase: .4, sway: .22 },
  scuttle: { cadence: 1.55, bounce: .68, lean: .14, limb: 0, arm: 0, jump: .96, squash: .09, phase: .7, sway: .11 },
  heroic: { cadence: 1.02, bounce: .78, lean: .16, limb: .82, arm: 1.12, jump: 1.02, squash: .055, phase: .15 },
  trot: { cadence: 1.05, bounce: .48, lean: .08, limb: 0, arm: 0, jump: .94, squash: .07, phase: .25, sway: .045 },
  heavyTrot: { cadence: .7, bounce: .36, lean: .13, limb: 0, arm: 0, jump: .82, squash: .045, phase: .75, sway: .035, stomp: .16 },
  feline: { cadence: 1.22, bounce: .38, lean: .19, limb: 0, arm: 0, jump: 1.2, squash: .075, phase: .1, sway: .025 },
  sprint: { cadence: 1.48, bounce: .62, lean: .27, limb: 0, arm: 0, jump: 1.18, squash: .08, phase: .4, hop: true },
  bound: { cadence: 1.18, bounce: .66, lean: .17, limb: 0, arm: 0, jump: 1.12, squash: .095, phase: 1, hop: true, sway: .04 },
  hop: { cadence: .82, bounce: .58, lean: .08, limb: 0, arm: 0, jump: 1.3, squash: .15, phase: .6, hop: true },
};

export function getCharacter(key) {
  return CHARACTER_ROSTER.find((character) => character.key === key) || CHARACTER_ROSTER[0];
}

export function getStage(stageNumber) {
  return STAGES[Math.max(0, Math.min(STAGES.length - 1, stageNumber - 1))];
}
