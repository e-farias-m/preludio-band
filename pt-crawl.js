// Runtime Portuguese coverage check for Preludio Band (re-runnable regression test).
// Renders every screen for every instrument in pt mode, then reports text that is still English.
// Usage:  node pt-crawl.js <path-to-preludio-band-repo> [label] [studentName]
// Needs:  npm i puppeteer-core @sparticuz/chromium   (or set CHROME_PATH to a local Chrome/Chromium)
// Notes:  - Screens are driven by setting APP state directly; a few quiz states throw (counted as "screen errors")
//           because their state is not initialised. They throw identically before and after any fix.
//         - "Still-English" uses a word list built from the app's own dictionary (English keys minus Portuguese values);
//           lines that already contain Portuguese words/diacritics are ignored. Expect to eyeball the list.
const http = require('http'), fs = require('fs'), path = require('path'), vm = require('vm');
const puppeteer = require('puppeteer-core');
const [,, rootDir, label = 'run', name = 'Newman'] = process.argv;
if (!rootDir) { console.log('usage: node pt-crawl.js <repo> [label] [name]'); process.exit(1); }
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const srv = http.createServer((q, r) => {
  const u = q.url.split('?')[0]; if (!u.startsWith('/band/')) { r.writeHead(404); return r.end(); }
  const f = path.join(rootDir, u.slice(6) || 'index.html');
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
});
// English lexicon from the app's own dictionary
const ctx = { window: {}, localStorage: { getItem() { return null }, setItem() {} }, navigator: { language: 'en' }, document: { documentElement: {}, readyState: 'complete', body: null, querySelectorAll() { return [] } }, NodeFilter: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(rootDir, 'js/i18n.js'), 'utf8') + ';this.T=TRANSLATIONS;', ctx);
const en = new Set(), pt = new Set();
Object.keys(ctx.T.pt).join(' ').split(/[^A-Za-z']+/).filter(w => w.length >= 3).forEach(w => en.add(w.toLowerCase()));
Object.values(ctx.T.pt).join(' ').split(/[^A-Za-zÀ-ÿ']+/).filter(w => w.length >= 3).forEach(w => pt.add(w.toLowerCase()));
'the and your you for with are this that from all new best back next done play start try again more less not yet have has will can get set see use tap pick choose select hear listen note notes song songs lesson practice score badge streak week day today tour reset progress student name names fingerings'.split(' ').forEach(w => en.add(w));
const ALLOW = new Set(['preludio', 'band', 'xml', 'bpm', 'xp', 'mic', 'pdf', 'csv', 'json', 'flute', 'oboe', 'tuba', 'sax', 'clarinet', 'trumpet', 'trombone', 'horn']);
const isEn = w => en.has(w) && !pt.has(w) && !ALLOW.has(w);
const looksPortuguese = t => /[ãçõéêíóúâà]/i.test(t) || /\b(de|do|da|para|você|seu|sua|com|que|uma|um|nos|na|no|e|o|a)\b/i.test(t) || /^(Blue Note|Trombone|Tuba)$/.test(t);
(async () => {
  await new Promise(r => srv.listen(8300, '127.0.0.1', r));
  let executablePath = process.env.CHROME_PATH, args = ['--no-sandbox'];
  if (!executablePath) { const c = require('@sparticuz/chromium').default; executablePath = await c.executablePath(); args = [...c.args.filter(a => !/single-process|no-zygote/.test(a)), '--no-sandbox']; }
  const b = await puppeteer.launch({ executablePath, args, headless: 'shell' });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await p.setRequestInterception(true); p.on('request', r => /fonts\.g/.test(r.url()) ? r.abort() : r.continue());
  await p.evaluateOnNewDocument(() => { localStorage.setItem('preludioBandLang', 'pt'); });
  const pageErrors = []; p.on('pageerror', e => pageErrors.push(e.message.slice(0, 100)));
  await p.goto('http://127.0.0.1:8300/band/', { waitUntil: 'load' }); await new Promise(r => setTimeout(r, 800));
  const result = await p.evaluate(async (nm) => {
    LS.setItem(NAME_KEY, nm); const out = [], tick = () => new Promise(r => setTimeout(r, 0));
    const grab = (tag) => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), a = []; let n;
      while ((n = w.nextNode())) { const pe = n.parentElement; if (!pe || /SCRIPT|STYLE/.test(pe.tagName)) continue; const t = n.nodeValue.trim(); if (t) a.push({ tag, k: 'text', t, unk: typeof tx === 'function' ? tx(t) === t : null }); }
      document.querySelectorAll('[title],[aria-label],[placeholder],[alt]').forEach(e => ['title', 'aria-label', 'placeholder', 'alt'].forEach(at => { const v = e.getAttribute(at); if (v && v.trim()) a.push({ tag, k: at, t: v.trim() }); })); return a; };
    const screens = ['select', 'settings', 'report', 'digest', 'tutorial', 'map', 'practice', 'ear', 'first-sound', 'lookup'];
    for (const id of INSTRUMENT_ORDER) { APP.instrumentId = id;
      for (const s of screens) { try { APP.screen = s; render(); await tick(); out.push(...grab(id + ':' + s)); } catch (e) { out.push({ tag: id + ':' + s, k: 'ERR', t: String(e.message).slice(0, 80) }); } }
      for (const li of [0, 1, 4, 9]) for (const ph of ['present', 'quiz', 'play', 'complete']) { try { APP.screen = 'lesson'; APP.lessonIndex = li; APP.phase = ph; if (ph === 'quiz' && typeof startQuiz === 'function') startQuiz(); render(); await tick(); out.push(...grab(id + ':lesson' + li + ':' + ph)); } catch (e) { out.push({ tag: id + ':lesson' + li + ':' + ph, k: 'ERR', t: String(e.message).slice(0, 80) }); } } }
    const dyn = []; for (const m of ['Progress reset.', 'Song complete!', 'Could not access the microphone.', 'Report copied to clipboard.', 'Imported "My Song"']) { showToast(m); await new Promise(r => setTimeout(r, 40)); dyn.push([m, document.getElementById('toast').textContent]); }
    APP.instrumentId = INSTRUMENT_ORDER[0]; APP.screen = 'map'; render(); await tick(); const t0 = performance.now(); for (let i = 0; i < 20; i++) applyI18nToDOM(); return { out, dyn, ms: (performance.now() - t0) / 20 };
  }, name);
  const seen = new Map(); let errc = 0;
  for (const r of result.out) { if (r.k === 'ERR') { errc++; continue; } if (looksPortuguese(r.t)) continue;
    const left = (r.t.match(/[A-Za-z][A-Za-z']{2,}/g) || []).map(w => w.toLowerCase()).filter(isEn); if (left.length && !seen.has(r.t)) seen.set(r.t, { k: r.k, left: [...new Set(left)] }); }
  const unk = new Map(); for (const r of result.out) { if (r.k !== 'text' || !r.unk || seen.has(r.t) || looksPortuguese(r.t) || !/[A-Za-z]{3,}/.test(r.t) || /^[\d\W]*$/.test(r.t)) continue; unk.set(r.t, 1); }
  console.log(`[${label}] nodes=${result.out.length} screen-errors=${errc} page-errors=${pageErrors.length} still-English=${seen.size} applyI18nToDOM=${result.ms.toFixed(1)}ms`);
  console.log('toasts:', result.dyn.map(([a, b]) => a + ' => ' + b).join(' | '));
  console.log(`unrecognised-by-translator (review: proper nouns/names are expected here): ${unk.size}`); [...unk.keys()].slice(0, 400).forEach(x => console.log('  ?', x.slice(0, 100)));
  [...seen].forEach(([t, v]) => console.log('  -', v.k === 'text' ? '' : '[' + v.k + '] ', t.slice(0, 110), '{', v.left.join(','), '}'));
  await b.close(); srv.close();
})().catch(e => { console.log('FAIL', e.stack.slice(0, 400)); process.exit(1); });
