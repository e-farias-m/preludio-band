// test-i18n-ui.js
// Renders every screen in Brazilian Portuguese and checks that the student
// never reads English. Band applies t() at render time, so a leftover
// English sentence means a string is not wrapped or a dictionary entry
// is missing.

const fs = require('fs');
const path = require('path');

const read = f => fs.readFileSync(path.join(__dirname, 'js', f), 'utf8');

global.confirm = () => true;

function makeEl() {
  const el = {
    value: '', style: {}, dataset: {}, _text: '', _html: '',
    classList: { add() {}, remove() {}, contains() { return false; } },
    appendChild() {}, addEventListener() {}, focus() {}, remove() {},
    querySelector() { return null; }, querySelectorAll() { return []; },
    setAttribute() {}, hasAttribute() { return false; },
  };
  Object.defineProperty(el, 'textContent', {
    get() { return el._text; },
    set(v) { el._text = String(v); el._html = String(v); },
  });
  Object.defineProperty(el, 'innerHTML', {
    get() { return el._html; },
    set(v) { el._html = String(v); },
  });
  return el;
}
const document = {
  addEventListener() {},
  getElementById() { return makeEl(); },
  createElement() { return makeEl(); },
  body: makeEl(),
  querySelectorAll() { return []; },
  createTreeWalker() { return { nextNode() { return null; } }; },
};
const store = { preludioBandName: 'Test' };
const localStorage = {
  getItem(k) { return k in store ? store[k] : null; },
  setItem(k, v) { store[k] = String(v); },
  removeItem(k) { delete store[k]; },
};
const navigator = { mediaDevices: { getUserMedia: () => Promise.resolve({ getTracks: () => [] }) }, storage: { persist: () => Promise.resolve() } };
class FakeMediaRecorder { constructor() { this.state = 'inactive'; } start() { this.state = 'recording'; } stop() { this.state = 'inactive'; if (this.onstop) this.onstop(); } }
const URL = { createObjectURL: () => 'blob:fake', revokeObjectURL() {} };
const Blob = class {};
const Audio = class { play() { return Promise.resolve(); } };

const sandbox = new Function('document', 'localStorage', 'window', 'navigator', 'MediaRecorder', 'URL', 'Blob', 'Audio', `
${read('curriculum.js')}
${read('graphics.js')}
${read('i18n.js')}
${read('app.js')}
return {
  CURRICULUM, APP, TRANSLATIONS, NOTE_TO_SOLFEGE_PT, NOTE_TO_SOLFEGE_FR, setLang, getLang,
  renderSelectScreen, renderSettingsScreen, renderTutorialScreen, renderMapScreen,
  renderFirstSoundScreen, renderLookupScreen, renderPracticeScreen, renderEarScreen,
  renderMetronomePanel, renderTunerPanel, renderToolWidget, renderReportScreen,
  renderDigestScreen, renderDigestCard, renderLessonScreen, renderPresentPhase,
  renderSongPresentPhase, renderWeakSpots, renderStudentCard, renderBadgeShelf,
  renderInstrumentGrid, renderPlanCard, getNoteLessons, renderQuizPhase,
  renderPlayPhase, renderCompletePhase,
};
`);
const api = sandbox(document, localStorage, {}, navigator, FakeMediaRecorder, URL, Blob, Audio);

let pass = 0;
let fail = 0;
const failures = [];
function check(cond, msg) { if (cond) pass++; else { fail++; failures.push(msg); } }

api.setLang('pt');

function collectScreens() {
  const screens = [];
  const add = (name, html) => { if (typeof html === 'string' && html) screens.push({ name, html }); };

  api.APP.instrumentId = 'flute';
  api.APP.progress = { flute: { completed: { 'fl-1': { stars: 3 }, 'fl-2': { stars: 3 }, 'fl-3': { stars: 3 } }, xp: 300, mastery: {} } };

  add('select', api.renderSelectScreen());
  add('settings', api.renderSettingsScreen());
  add('tutorial', api.renderTutorialScreen());
  add('map', api.renderMapScreen());
  add('first-sound', api.renderFirstSoundScreen());
  add('lookup', api.renderLookupScreen());
  add('practice', api.renderPracticeScreen());
  add('ear', api.renderEarScreen());
  add('metronome', api.renderMetronomePanel());
  add('tuner', api.renderTunerPanel());
  add('tool-widget', api.renderToolWidget());
  add('report', api.renderReportScreen());
  add('digest', api.renderDigestScreen());
  add('student-card', api.renderStudentCard('Ana'));
  add('badge-shelf', api.renderBadgeShelf());
  add('instrument-grid', api.renderInstrumentGrid());
  add('plan-card', api.renderPlanCard('flute'));
  add('weak-spots', api.renderWeakSpots('flute'));

  const notes = api.getNoteLessons('flute');
  add('present', api.renderPresentPhase(api.CURRICULUM.flute, notes[0]));
  const song = api.CURRICULUM.flute.lessons.find(l => l.type === 'song');
  if (song) add('song-present', api.renderSongPresentPhase(api.CURRICULUM.flute, song));

  add('quiz', api.renderQuizPhase(api.CURRICULUM.flute, notes[0]));
  api.APP.play = { running: false, hasPlayed: false };
  add('play', api.renderPlayPhase(api.CURRICULUM.flute, notes[0]));
  api.APP.lastStars = 3; api.APP.lastXp = 10; api.APP.completedBefore = false;
  add('complete', api.renderCompletePhase(api.CURRICULUM.flute, notes[0]));
  return screens;
}

function visibleTexts(html) {
  const out = [];
  const textRe = />([^<>]+)</g;
  let m;
  while ((m = textRe.exec(html))) if (m[1].trim()) out.push(m[1].trim());
  const attrRe = /\s(placeholder|title|aria-label|alt)="([^"]*)"/g;
  while ((m = attrRe.exec(html))) out.push(m[2]);
  return out;
}

// A rendered word is safe when it appears somewhere in the language's
// dictionary (values only — keys stay English, so an unwrapped key used at
// render time still gets flagged). Note names come from the solfège map, and
// the names the tests inject are allow-listed.
function buildCorpus(lang, solfege) {
  const parts = Object.values(api.TRANSLATIONS[lang] || {}).map(v => String(v).toLowerCase());
  if (solfege) parts.push(...Object.values(solfege).map(v => String(v).toLowerCase()));
  return parts.join(' · ');
}

const DYNAMIC_OK = new Set(['ana', 'test', 'bpm', 'undefined', 'largo', 'andante', 'moderato', 'allegro', 'presto', 'half']);

function looksEnglish(text, corpus) {
  const words = text.toLowerCase().match(/[a-zà-ÿ]{3,}/g) || [];
  if (!words.length) return false;
  return words.some(w => !DYNAMIC_OK.has(w) && !corpus.includes(w));
}

// Render every screen in each supported language and make sure the student
// never reads English.
for (const lang of ['pt', 'fr']) {
  const corpus = buildCorpus(lang, lang === 'pt' ? api.NOTE_TO_SOLFEGE_PT : api.NOTE_TO_SOLFEGE_FR);
  api.setLang(lang);
  const screens = collectScreens();
  const leftovers = new Map();
  for (const { name, html } of screens) {
    for (const text of visibleTexts(html)) {
      if (!looksEnglish(text, corpus)) continue;
      if (!leftovers.has(text)) leftovers.set(text, new Set());
      leftovers.get(text).add(name);
    }
  }
  check(leftovers.size === 0,
    `${lang}: these lines are still English:\n    ${[...leftovers.keys()].map(t => JSON.stringify(t) + ' (' + [...leftovers.get(t)].join(',') + ')').join('\n    ')}`);
}
api.setLang('pt');

// ── Dictionary completeness ────────────────────────────────────────────────
// Every literal t()/tFill() key in the app must exist in pt and fr, or that
// language silently falls back to English. Words that are spelled the same in
// both languages on purpose are allow-listed.
const appSrc = read('app.js') + '\n' + read('curriculum.js');
const keyRe = /(?:\b|\W)(?:t|tFill)\(\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g;
const usedKeys = new Set();
let km;
while ((km = keyRe.exec(appSrc))) usedKeys.add(new Function(`return ${km[1]}`)());
const SAME_IN_BOTH = new Set(['XP', 'note', 'notes', 'Note', 'Badges', 'Minutes', 'Instruments', 'sprint', '{n} min', 'Tap', 'Score', 'Subdivision', 'Glockenspiel']);
for (const lang of ['pt', 'fr']) {
  const dict = api.TRANSLATIONS[lang] || {};
  const missing = [...usedKeys].filter(k => !Object.prototype.hasOwnProperty.call(dict, k));
  const untranslated = [...usedKeys].filter(k => Object.prototype.hasOwnProperty.call(dict, k) && dict[k] === k && !SAME_IN_BOTH.has(k));
  check(missing.length === 0, `${lang} dictionary is missing keys:\n    ${missing.map(k => JSON.stringify(k)).join('\n    ')}`);
  check(untranslated.length === 0, `${lang} dictionary leaves keys in English:\n    ${untranslated.map(k => JSON.stringify(k)).join('\n    ')}`);
}

check(api.getLang() === 'pt', 'the app can switch to Portuguese');

if (failures.length) console.log(failures.join('\n'));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
