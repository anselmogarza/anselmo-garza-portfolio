const assert = require('node:assert/strict');
const M = require('./dist/game-model.js');
for (const fixed of [false, true]) {
  const s = M.create(fixed);
  for (let t = 0; t < M.replayTicks; t++) M.step(s, M.replayInput(t));
  assert(s.contact, 'Replay must reach the visible coin');
  assert.equal(
    s.collected,
    fixed,
    'Identical pickup replay fails before and passes after fix',
  );
  assert(s.grounded, 'Replay ends on platform');
}
const s = M.create();
M.step(s, { jump: true });
const velocity = s.vy;
M.step(s, { jump: true });
assert(s.vy > velocity, 'Airborne jump cannot reset jump velocity');
for (let i = 0; i < 200; i++) M.step(s, { left: true });
assert.equal(s.x, 0, 'Player stays inside screen');
assert(s.grounded, 'Player lands on ground');
assert.equal(M.create().collected, false, 'Reset clears pickup');
console.log(
  'PASS: pickup regression, replay contact, landing, single jump, bounds, and reset.',
);
