const http = require('http');
const WebSocket = require('ws');
const TOKEN = process.env.TOKEN || '';
const LESSON2_ID = process.env.LESSON2_ID || '';

function get(path) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port: 9222, path }, (res) => {
      let d = ''; res.on('data', (c) => (d += c)); res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

(async () => {
  const list = JSON.parse(await get('/json/list'));
  const page = list.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl, { perMessageDeflate: false });
  let id = 0; const pending = new Map();
  const send = (method, params = {}) => new Promise((res) => { const m = ++id; pending.set(m, res); ws.send(JSON.stringify({ id: m, method, params })); });
  ws.on('message', (raw) => { const msg = JSON.parse(raw); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); } });
  await new Promise((r) => ws.on('open', r));
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 800, deviceScaleFactor: 1, mobile: false });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `try{localStorage.setItem('typeoye_token','${TOKEN}');}catch(e){}` });

  const read = async () => {
    return (await send('Runtime.evaluate', { returnByValue: true, expression: `(() => {
      const bodyText = document.body.innerText;
      const counter = [...document.querySelectorAll('span')].map(s=>s.textContent).find(t=>t && t.includes('Exercise') && t.includes('of'));
      const h2 = document.querySelector('main h2');
      const replay = !!document.querySelector('[data-testid="replay-badge"]');
      return { url: location.pathname, counter, header: h2 ? h2.textContent.trim() : null, replay,
        hasTyping: !!document.querySelector('.tt-text-shell') };
    })()` })).result.value;
  };

  const nav = async (url) => { await send('Page.navigate', { url }); await new Promise((r) => setTimeout(r, 2800)); };

  const out = {};
  // 1. Open L2 (partial: ex1 done) -> must resume at exercise 2.
  await nav('http://localhost:5173/urdu-lessons/' + LESSON2_ID);
  out.openL2_partial = await read();

  // 2. Refresh -> must still resume at exercise 2 (server-persisted, not session).
  await nav('http://localhost:5173/urdu-lessons/' + LESSON2_ID);
  out.openL2_afterRefresh = await read();

  // 3. Open L1 (fully complete) -> completion/replay state.
  await nav('http://localhost:5173/urdu-lessons');
  await new Promise((r) => setTimeout(r, 800));
  // find completed level 1 link
  const l1 = (await send('Runtime.evaluate', { returnByValue: true, expression: `(() => {
    const a=document.querySelector('[data-testid="urdu-completed-level-1"]'); return a? a.getAttribute('href'):null;
  })()` })).result.value;
  if (l1) { await nav('http://localhost:5173' + l1); out.openL1_complete = await read(); }

  // 4. Start a fresh session (clear sessionStorage) then reopen L2 -> still exercise 2 (proves no session dependency).
  await send('Runtime.evaluate', { expression: `try{sessionStorage.clear();}catch(e){}` });
  await nav('http://localhost:5173/urdu-lessons/' + LESSON2_ID);
  out.openL2_newSession = await read();

  console.log(JSON.stringify(out, null, 2));
  ws.close();
})().catch((e) => { console.error(e); process.exit(1); });
