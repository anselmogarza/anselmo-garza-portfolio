/* Browser simulation, not a C# or Playwright runtime. */
(() => {
  const steps = [
    ['login', 'await LoginAsync();', 'Sign in', 'login'],
    ['open', 'await home.OpenWindowAsync<SettingsScreen>();', 'Open Settings', 'open'],
    ['title', 'await Argue.AreEqual("Settings", () => screen.TitleAsync());', 'Window title', 'Settings'],
    ['tabs', 'await Argue.AreEqual(4, () => screen.VisibleTabCountAsync());', 'Visible tabs', 4],
    ['enabled', 'await Argue.AreEqual(1, () => screen.EnabledTabCountAsync());', 'Enabled tabs', 1],
    ['selected', 'await Argue.IsTrue(() => screen.GeneralTab.IsSelectedAsync());', 'General tab selected', true],
    ['focus', 'await Argue.IsTrue(() => screen.CodeField.IsFocusedAsync());', 'Code field focused', true],
    ['required', 'await Argue.IsTrue(() => screen.CodeField.IsRequiredAsync());', 'Code is required', true],
    ['description', 'await Argue.IsTrue(() => screen.DescriptionField.IsRequiredAsync());', 'Description is required', true],
    ['emptyCode', 'await Argue.AreEqual("", () => screen.CodeField.GetValueAsync());', 'Code starts empty', ''],
    ['emptyDescription', 'await Argue.AreEqual("", () => screen.DescriptionField.GetValueAsync());', 'Description starts empty', ''],
    ['flags', 'await Argue.IsTrue(() => screen.FlagsAreUncheckedAsync());', 'Flags start unchecked', true],
    ['close', 'await screen.CloseAsync();', 'Close Settings', 'close'],
    ['cleanup', 'await home.AssertBrowserTabCount();', 'One simulated browser tab remains', 1],
    ['logout', 'await home.LogoutAsync();', 'Sign out', 'logout'],
  ];

  async function runScenario(adapter, { retry = true, timeout = 1800, interval = 100 } = {}) {
    let passed = 0;
    try {
      for (const [id, , label, expected] of steps) {
        adapter.checkCancelled();
        adapter.highlight(id);
        await adapter.wait(140);
        if (['login', 'open', 'close', 'logout'].includes(id)) {
          await adapter.action(expected);
          adapter.report('action', label);
          continue;
        }
        const start = adapter.now();
        let attempts = 0;
        while (true) {
          adapter.checkCancelled();
          const actual = adapter.read(id);
          attempts++;
          if (actual === expected) {
            passed++;
            adapter.report('pass', `${label}: PASS${attempts > 1 ? ` after ${attempts} observations` : ''}`);
            break;
          }
          if (!retry || adapter.now() - start >= timeout) {
            adapter.report('fail', `${label}: FAIL — expected ${JSON.stringify(expected)}, observed ${JSON.stringify(actual)} (${attempts} observation${attempts === 1 ? '' : 's'})`);
            return { status: 'failed', passed, failed: id };
          }
          adapter.report('wait', `${label}: observed ${JSON.stringify(actual)}; retrying…`);
          await adapter.wait(Math.min(interval, timeout - (adapter.now() - start)));
        }
      }
      return { status: 'passed', passed };
    } finally {
      // Cleanup even if an assertion fails or a walkthrough is cancelled.
      await adapter.teardown();
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runScenario, steps };
    return;
  }

  const $ = (id) => document.getElementById(id);
  const code = $('sim-code');
  const log = $('sim-log');
  const codeLines = new Map();
  function colorCode(line, statement) {
    const tokens = /(?<comment>\/\/[^\n]*)|(?<string>"(?:[^"\\]|\\.)*")|(?<control>\bawait\b)|(?<keyword>\bvar\b)|(?<type>\b(?:Argue|Assert|SettingsScreen)\b)|(?<method>\b[A-Za-z_]\w*(?=(?:<\w+>)?\())|(?<number>\b\d+\b)|(?<property>(?<=\.)[A-Za-z_]\w*)/g;
    let offset = 0;
    for (const match of statement.matchAll(tokens)) {
      line.append(document.createTextNode(statement.slice(offset, match.index)));
      const token = document.createElement('span');
      token.className = `cs-${Object.keys(match.groups).find((key) => match.groups[key] !== undefined)}`;
      token.textContent = match[0]; line.append(token);
      offset = match.index + match[0].length;
    }
    line.append(document.createTextNode(statement.slice(offset)));
  }
  for (const [id, statement] of steps) {
    const line = document.createElement('span');
    line.className = 'sim-code-line'; line.dataset.step = id;
    // Text nodes ensure the illustrative source is never interpreted as HTML.
    colorCode(line, statement);
    code.append(line); codeLines.set(id, line);
  }
  function showAssertionMode(retry) {
    for (const [id, original] of steps) {
      let statement = original;
      if (!retry) {
        statement = statement.replace('await Argue.AreEqual(', 'Assert.AreEqual(').replace(', () => ', ', await ');
        statement = statement.replace('await Argue.IsTrue(() => ', 'Assert.IsTrue(await ');
        if (id === 'cleanup') statement = 'Assert.AreEqual(1, context.Pages.Count);';
      }
      codeLines.get(id).replaceChildren();
      colorCode(codeLines.get(id), statement);
    }
    document.querySelector('.sim-source h3').textContent = retry
      ? 'RETRY-CAPABLE MODEL · ACTIVE STEP HIGHLIGHTED'
      : 'ONE-SHOT COMPARISON · ACTIVE STEP HIGHLIGHTED';
  }
  $('sim-retry').addEventListener('change', () => showAssertionMode($('sim-retry').checked));
  let controller;
  let busy = false;
  let renderTimer;

  function renderInitial() {
    clearTimeout(renderTimer);
    $('mock-window').hidden = true;
    $('mock-fields').hidden = true;
    $('mock-tabs').replaceChildren();
    $('mock-loading').hidden = false;
    $('mock-pages').textContent = '1';
    $('mock-session').textContent = 'Signed out';
    $('mock-code').value = ''; $('mock-description').value = '';
    $('mock-active').checked = false; $('mock-archived').checked = false;
  }
  function renderFields() {
    $('mock-loading').hidden = true;
    for (const [index, label] of ['General', 'Details', 'History', 'Audit'].entries()) {
      const tab = document.createElement('button');
      tab.type = 'button'; tab.textContent = label;
      tab.dataset.mockTab = 'true'; tab.disabled = index !== 0;
      tab.setAttribute('aria-pressed', String(index === 0));
      $('mock-tabs').append(tab);
    }
    $('mock-fields').hidden = false;
    $('mock-code').focus({ preventScroll: true });
  }
  function setBusy(value) {
    busy = value;
    $('sim-run').disabled = value;
    $('sim-retry').disabled = value;
    $('sim-delay').disabled = value;
    $('sim-reset').textContent = value ? 'Stop & reset' : 'Reset';
  }
  function addLog(kind, message) {
    const item = document.createElement('li'); item.className = `sim-event sim-${kind}`;
    item.textContent = `${kind === 'wait' ? 'WAIT' : kind === 'pass' ? 'PASS' : kind === 'fail' ? 'FAIL' : 'STEP'} · ${message}`;
    log.append(item);
    log.scrollTop = log.scrollHeight;
  }
  $('sim-run').addEventListener('click', async () => {
    if (busy) return;
    renderInitial(); log.replaceChildren();
    controller = new AbortController();
    const signal = controller.signal;
    const delayed = $('sim-delay').checked;
    const retry = $('sim-retry').checked;
    showAssertionMode(retry);
    setBusy(true);
    $('sim-summary').textContent = 'Running JavaScript against the mock UI…';
    const checkCancelled = () => { if (signal.aborted) throw new DOMException('Cancelled', 'AbortError'); };
    const wait = (ms) => new Promise((resolve, reject) => {
      checkCancelled();
      const onAbort = () => { clearTimeout(timer); reject(new DOMException('Cancelled', 'AbortError')); };
      const timer = setTimeout(() => { signal.removeEventListener('abort', onAbort); resolve(); }, ms);
      signal.addEventListener('abort', onAbort, { once: true });
    });
    const reads = {
      title: () => $('mock-title').textContent,
      tabs: () => $('mock-tabs').querySelectorAll('[data-mock-tab]').length,
      enabled: () => $('mock-tabs').querySelectorAll('[data-mock-tab]:not(:disabled)').length,
      selected: () => $('mock-tabs').querySelector('[aria-pressed="true"]')?.textContent === 'General',
      focus: () => document.activeElement === $('mock-code'),
      required: () => $('mock-code').required,
      description: () => $('mock-description').required,
      emptyCode: () => $('mock-code').value,
      emptyDescription: () => $('mock-description').value,
      flags: () => !$('mock-active').checked && !$('mock-archived').checked,
      cleanup: () => Number($('mock-pages').textContent),
    };
    const teardown = () => {
      clearTimeout(renderTimer);
      $('mock-window').hidden = true;
      $('mock-pages').textContent = '1';
      $('mock-session').textContent = 'Signed out';
    };
    try {
      const result = await runScenario({
        wait, now: () => performance.now(), checkCancelled,
        highlight(id) { codeLines.forEach((line, key) => line.classList.toggle('sim-current', key === id)); },
        report: addLog,
        read: (id) => reads[id](),
        action(action) {
          if (action === 'login') $('mock-session').textContent = 'Demo user · signed in';
          if (action === 'open') {
            $('mock-window').hidden = false; $('mock-pages').textContent = '2';
            if (delayed) renderTimer = setTimeout(() => { if (!signal.aborted) renderFields(); }, 1100);
            else renderFields();
          }
          if (action === 'close') { $('mock-window').hidden = true; $('mock-pages').textContent = '1'; }
          if (action === 'logout') $('mock-session').textContent = 'Signed out';
        },
        teardown,
      }, { retry });
      if (!signal.aborted) {
        $('sim-summary').textContent = result.status === 'passed'
          ? `PASS · ${result.passed} assertions passed. Settings closed; one simulated tab remains; signed out.`
          : `FAIL · ${result.passed} assertion(s) passed before failure. Teardown closed Settings and signed out. Try retry-capable assertions with delayed rendering.`;
        addLog('action', 'Teardown complete: mock session and window cleaned up.');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        $('sim-summary').textContent = 'The walkthrough encountered an unexpected error. Reset and try again.';
        addLog('fail', error.message);
      }
    } finally {
      setBusy(false);
      // Restore focus only when a hidden mock field still owns it.
      if ($('mock-fields').contains(document.activeElement)) $('sim-run').focus({ preventScroll: true });
    }
  });
  $('sim-reset').addEventListener('click', () => {
    controller?.abort(); renderInitial(); log.replaceChildren();
    codeLines.forEach((line) => line.classList.remove('sim-current'));
    $('sim-summary').textContent = 'Ready. Run with delayed rendering, then compare one-shot and retry-capable assertions.';
    // A cancelled run retains its lock until its teardown finishes.
    if (!busy) setBusy(false);
  });
  renderInitial();
  showAssertionMode($('sim-retry').checked);
})();
