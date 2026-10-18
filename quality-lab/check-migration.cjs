const assert = require('node:assert/strict');
const { runScenario } = require('./dist/migration-sim.js');
function adapter({ delay = 0, cancelAt = Infinity } = {}) {
  let time = 0, readyAt = Infinity, open = false, signedIn = false, cleanups = 0;
  const events = [], actions = [];
  return {
    events, actions,
    now: () => time,
    wait: async (ms) => { time += ms; },
    checkCancelled() { if (time >= cancelAt) throw new Error('cancelled'); },
    highlight() {},
    report: (kind, message) => events.push({ kind, message }),
    action(name) {
      actions.push(name);
      if (name === 'login') signedIn = true;
      if (name === 'open') { open = true; readyAt = time + delay; }
      if (name === 'close') open = false;
      if (name === 'logout') signedIn = false;
    },
    read(id) {
      if (id === 'title') return open ? 'Settings' : '';
      if (id === 'cleanup') return open ? 2 : 1;
      if (id === 'tabs') return time >= readyAt ? 4 : 0;
      if (id === 'enabled') return time >= readyAt ? 1 : 0;
      if (id === 'emptyCode' || id === 'emptyDescription') return '';
      return time >= readyAt;
    },
    teardown() { cleanups++; open = false; signedIn = false; },
    assertClean() { assert.equal(cleanups, 1); assert.equal(open, false); assert.equal(signedIn, false); },
  };
}
(async () => {
  const instant = adapter();
  assert.equal((await runScenario(instant, { retry: false })).status, 'passed');
  instant.assertClean();
  const early = adapter({ delay: 1100 });
  assert.equal((await runScenario(early, { retry: false })).failed, 'tabs');
  assert.equal(early.events.filter((event) => event.kind === 'wait').length, 0);
  early.assertClean();
  const retry = adapter({ delay: 1100 });
  const result = await runScenario(retry, { retry: true });
  assert.equal(result.status, 'passed');
  assert.equal(result.passed, 11);
  assert(retry.events.some((event) => event.kind === 'wait'));
  assert.deepEqual(retry.actions, ['login', 'open', 'close', 'logout']);
  retry.assertClean();
  const late = adapter({ delay: 5000 });
  assert.equal((await runScenario(late, { retry: true })).failed, 'tabs');
  late.assertClean();
  const cancelled = adapter({ delay: 1100, cancelAt: 600 });
  await assert.rejects(runScenario(cancelled), /cancelled/);
  cancelled.assertClean();
  console.log('PASS: immediate render, delayed one-shot failure, retry success, bounded timeout, cancellation, and teardown.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
