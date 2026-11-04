const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function fixture() {
  const source = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
  let timeout;
  const Manager = vm.runInNewContext(source.slice(source.indexOf('class ZeroTTSManager'), source.indexOf('// 3. TRẠNG THÁI')) + '\nZeroTTSManager', {
    process: { env: {} }, state: { settings: {} }, console,
    setTimeout: callback => { timeout = callback; return 1; }, clearTimeout() {},
    broadcastNotification() {}
  });
  Manager.prototype.startWorker = function () {};
  const manager = new Manager();
  const writes = [];
  let killed = false;
  manager.ready = true;
  manager.proc = { stdin: { write: payload => writes.push(JSON.parse(payload)) }, kill: () => { killed = true; } };
  return { manager, writes, expire: () => timeout(), killed: () => killed };
}

test('one Python job at a time, with shared results for duplicate requests', async () => {
  const { manager, writes } = fixture();
  const first = manager.synthesize('Xin chào');
  assert.equal(manager.synthesize('Xin chào'), first);
  assert.equal((await manager.synthesize('Cảm ơn')).busy, true);
  assert.equal(writes.length, 1);
  manager.handleWorkerLine(JSON.stringify({ type: 'result', id: writes[0].id, ok: true, url: '/test.wav' }));
  assert.equal((await first).ok, true);
  const next = manager.synthesize('Cảm ơn');
  assert.equal(writes.length, 2);
  manager.handleWorkerLine(JSON.stringify({ type: 'result', id: writes[1].id, ok: true }));
  await next;
});

test('synthesis timeout stops the stalled worker and blocks new work until ready', async () => {
  const { manager, expire, killed, writes } = fixture();
  const result = manager.synthesize('Xin chào');
  assert.equal(manager.synthesisTimeoutMs, 120000);
  expire();
  assert.equal((await result).ok, false);
  assert.equal(killed(), true);
  assert.equal(manager.restartAfterExit, true);
  assert.equal((await manager.synthesize('Cảm ơn')).ok, false);
  assert.equal(writes.length, 1);
});
