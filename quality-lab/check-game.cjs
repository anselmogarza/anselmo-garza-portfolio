const assert = require('node:assert/strict');
const M = require('./dist/game-model.js');
const expected = {
  endpoint: [1, 0, 0, 0, 1],
  padded: [1, 1, 0, 1, 1],
  swept: [1, 1, 1, 0, 1],
};
for (const mode of Object.keys(expected)) {
  const cases = M.scenarios.map((s) => M.runCase(mode, s.id));
  assert.deepEqual(
    cases.map((s) => s.actual),
    expected[mode],
    mode + ' regression matrix',
  );
  assert.equal(cases.filter((s) => s.pass).length, mode === 'swept' ? 5 : 3);
}
const missed = M.runCase('endpoint', 'fast').evidence;
assert(
  missed.crossing && !missed.endpoint && !missed.detected,
  'Evidence distinguishes crossing from endpoint overlap',
);
for (const mode of ['endpoint', 'padded', 'swept']) {
  const s = M.create(mode);
  s.x = 300;
  s.y = 210;
  M.step(s, { right: true, condition: 'fast' });
  assert.equal(
    s.count,
    mode === 'endpoint' ? 0 : 1,
    'Manual fast movement shares detector',
  );
  const hitch = M.create(mode);
  hitch.x = 240;
  hitch.y = 210;
  M.step(hitch, { right: true, condition: 'hitch' });
  assert.equal(
    hitch.count,
    mode === 'swept' ? 1 : 0,
    'Manual hitch shares detector',
  );
}
const rect = (x, y) => ({ x, y, w: 24, h: 40 });
assert(M.crosses(rect(450, 210), rect(300, 210)), 'Reverse crossing');
assert(M.crosses(rect(360, 210), rect(360, 210)), 'Stationary overlap');
assert(
  !M.crosses(rect(300, 178), rect(450, 178)),
  'Edge-only contact does not collect',
);
assert(
  !M.crosses(rect(200, 100), rect(500, 200)),
  'Diagonal enclosing box alone does not establish crossing',
);
const s = M.create();
M.step(s, { jump: true });
const v = s.vy;
M.step(s, { jump: true });
assert(s.vy > v, 'No double jump');
for (let i = 0; i < 200; i++) M.step(s, { left: true });
assert.equal(s.x, 0);
assert(s.grounded, 'Ground landing');
assert.equal(M.create().count, 0, 'Fresh session clears pickup count');
console.log(
  'PASS: three detector matrices, shared manual collision behavior, crossing geometry, collect-once, single jump, bounds, and landing.',
);
