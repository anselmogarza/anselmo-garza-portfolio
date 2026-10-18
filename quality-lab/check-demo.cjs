const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const elements = new Map();
function element() { return { dataset: {}, classList: { toggle() {} }, handlers: {}, children: [], disabled: false, textContent: '', innerHTML: '', setAttribute() {}, focus() {}, append(...children) { this.children.push(...children); }, replaceChildren(...children) { this.children = children; }, addEventListener(name, fn) { this.handlers[name] = fn; } }; }
const get = (id) => { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); };
const tabs = ['results', 'timeline', 'code'].map((panel) => Object.assign(element(), { dataset: { panel } }));
const steps = Array.from({ length: 4 }, element);
const document = { getElementById: get, querySelectorAll: (selector) => selector === '[role=tab]' ? tabs : steps, createElement: element };
vm.runInNewContext(fs.readFileSync(__dirname + '/dist/app.js', 'utf8'), { document, performance, setTimeout });
(async () => {
  await get('run').handlers.click();
  assert.match(get('result-output').innerHTML, /FAIL/);
  assert.equal(get('fix').disabled, false);
  const timelineMessages = () => get('timeline-output').children.map((row) => row.children[1].textContent);
  assert.deepEqual(timelineMessages(), [
    'Save request started',
    'Success notification emitted',
    'Assertion: persisted order exists → FAIL',
    'Order persisted in browser model',
  ]);
  get('fix').handlers.click();
  assert.match(get('result-output').innerHTML, /VERIFICATION PENDING/);
  await get('run').handlers.click();
  assert.match(get('result-output').innerHTML, /PASS/);
  assert.deepEqual(timelineMessages(), [
    'Save request started',
    'Order persisted in browser model',
    'Success notification emitted',
    'Assertion: persisted order exists → PASS',
  ]);
  get('reset').handlers.click();
  assert.equal(get('mode').textContent, 'BUG PRESENT');
  const pending = get('run').handlers.click();
  get('reset').handlers.click();
  await pending;
  assert.match(get('result-output').innerHTML, /AWAITING EXECUTION/);
  assert.equal(get('run').disabled, false);
  console.log('PASS: failing scenario, fix, verification, reset, and reset during execution.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
