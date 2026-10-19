// Optional Windows browser QA. Uses installed Edge and Node.js 22+, no packages.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { spawn } = require('node:child_process');
const root = path.join(__dirname, 'dist');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const edge =
  process.env.EDGE_PATH ||
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
let browser, server, socket;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'quality-lab-edge-'));
const pending = new Map();
let sequence = 0;
async function send(method, params = {}) {
  const id = ++sequence;
  const result = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`CDP timeout: ${method}`));
    }, 10000);
    pending.set(id, {
      resolve: (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      reject,
    });
  });
  socket.send(JSON.stringify({ id, method, params }));
  return result;
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails)
    throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
async function waitFor(expression) {
  for (let i = 0; i < 100; i++) {
    if (await evaluate(expression)) return;
    await sleep(100);
  }
  throw new Error(`Condition timed out: ${expression}`);
}
async function screenshot(filename) {
  const result = await send('Page.captureScreenshot', { format: 'png' });
  const output = path.join(os.tmpdir(), filename);
  fs.writeFileSync(output, Buffer.from(result.data, 'base64'));
  console.log(`Screenshot: ${output}`);
}
(async () => {
  assert(fs.existsSync(edge), 'Set EDGE_PATH to an installed Edge executable.');
  server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(
      new URL(req.url, 'http://localhost').pathname,
    );
    const file = path.resolve(root, '.' + pathname);
    if (
      !file.startsWith(root + path.sep) ||
      !fs.existsSync(file) ||
      !fs.statSync(file).isFile()
    ) {
      res.writeHead(404);
      res.end();
      return;
    }
    const types = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.pdf': 'application/pdf',
    };
    res.setHeader(
      'Content-Type',
      types[path.extname(file)] || 'application/octet-stream',
    );
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/game.html`;
  browser = spawn(
    edge,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--remote-debugging-port=0',
      `--user-data-dir=${profile}`,
      url,
    ],
    { windowsHide: true, stdio: 'ignore' },
  );
  let port;
  for (let i = 0; i < 100; i++) {
    const file = path.join(profile, 'DevToolsActivePort');
    if (fs.existsSync(file)) {
      port = fs.readFileSync(file, 'utf8').split('\n')[0];
      break;
    }
    await sleep(100);
  }
  assert(port, 'Edge debugging endpoint did not start.');
  let target;
  for (let i = 0; i < 50; i++) {
    const targets = await (
      await fetch(`http://127.0.0.1:${port}/json/list`)
    ).json();
    target = targets.find((item) => item.type === 'page' && item.url === url);
    if (target) break;
    await sleep(100);
  }
  assert(target, 'Game browser tab not found.');
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve) =>
    socket.addEventListener('open', resolve, { once: true }),
  );
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (!pending.has(message.id)) return;
    const promise = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) promise.reject(new Error(JSON.stringify(message.error)));
    else promise.resolve(message.result);
  });
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1100,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await waitFor('Boolean(window.PickupGame)');
  await evaluate('document.getElementById("test").click()');
  await waitFor(
    'document.getElementById("result").textContent.startsWith("FAIL")',
  );
  assert(await evaluate('document.getElementById("hitboxes").checked'));
  await screenshot('quality-lab-game-desktop.png');
  await evaluate('document.getElementById("fix").click()');
  assert(
    await evaluate(
      'document.getElementById("result").textContent.includes("pending")',
    ),
  );
  await evaluate('document.getElementById("test").click()');
  await waitFor(
    'document.getElementById("result").textContent.startsWith("PASS")',
  );
  assert.equal(
    await evaluate('document.getElementById("count").textContent'),
    'Collected: 1 / 1',
  );
  await evaluate(
    'document.getElementById("test").click(); document.getElementById("reset").click()',
  );
  await sleep(2800);
  assert(
    await evaluate(
      'document.getElementById("result").textContent.startsWith("Ready")',
    ),
  );
  assert.equal(
    await evaluate('document.getElementById("mode").textContent'),
    'BUG PRESENT',
  );
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  assert(
    await evaluate('document.documentElement.scrollWidth <= innerWidth'),
    'Mobile overflow',
  );
  await screenshot('quality-lab-game-mobile.png');
  console.log(
    'PASS: browser failure, hitboxes, fix, pending verification, passing retest, reset cancellation, and mobile layout.',
  );
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (socket?.readyState === WebSocket.OPEN) {
      try {
        await send('Browser.close');
      } catch {}
      socket.close();
    }
    browser?.kill();
    server?.closeAllConnections();
    server?.close();
  });
