import { getCharacter } from './character-roster.js';
import { createRabbitWorld } from './rabbit-world.js';

const root = document.querySelector('#portrait');
await createRabbitWorld(root, {
  portraitMode: true,
  startPaused: true,
  character: getCharacter('original/rabbit'),
  callbacks: {
    onReady() {
      document.documentElement.dataset.ready = 'true';
    },
  },
});
