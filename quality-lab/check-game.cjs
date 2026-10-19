const assert = require('node:assert/strict');
const game = require('./dist/game-model.js');
for (const fixed of [false, true]) {
  const s = game.create(fixed);
  for (let tick = 0; tick < game.replayTicks; tick++)
    game.step(s, game.replayInput(tick));
  assert.equal(s.coin.visible, false, 'Replay touches and removes coin');
  assert.equal(
    s.score,
    fixed ? 1 : 0,
    'Score assertion fails before and passes after fix',
  );
  assert.equal(
    s.coin.collected,
    fixed,
    'Complete pickup recorded only after fix',
  );
  assert(s.grounded, 'Replay lands on platform');
  const score = s.score,
    events = s.events.length;
  game.pickup(s);
  assert.equal(s.score, score, 'Repeated callback awards no extra point');
  assert.equal(
    s.events.length,
    events,
    'Repeated callback produces no pickup events',
  );
  assert.deepEqual(
    s.events,
    fixed
      ? [
          'Player touched the coin.',
          'Pickup recorded: score increased to 1.',
          'Coin removed from the screen.',
        ]
      : [
          'Player touched the coin.',
          'Coin removed from the screen.',
          'Score unchanged: the pickup handler never awards the point.',
        ],
  );
}
// Collection state persists even if presentation visibility changes.
const awardedCoin = { visible: true, collected: false, value: 3 };
const player = { score: 2 };
game.collectCoin(awardedCoin, player);
assert.equal(player.score, 5, 'Award the configured coin value');
awardedCoin.visible = true;
game.collectCoin(awardedCoin, player);
assert.equal(
  player.score,
  5,
  'Visibility changes cannot award the same coin twice',
);
const s = game.create();
game.step(s, { jump: true });
const v = s.vy;
game.step(s, { jump: true });
assert(s.vy > v, 'No double jump');
for (let i = 0; i < 200; i++) game.step(s, { left: true });
assert.equal(s.x, 0);
assert(s.grounded, 'Ground landing');
const fresh = game.create();
assert(fresh.coin.visible);
assert.equal(fresh.score, 0);
assert.deepEqual(fresh.events, []);
console.log(
  'PASS: coin removal, missing score, fix, duplicate guard, event order, single jump, landing, bounds, and fresh state.',
);
