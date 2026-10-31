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
  CURRICULUM, APP, setLang, getLang,
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

const screens = [];
function add(name, html) { if (typeof html === 'string' && html) screens.push({ name, html }); }

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

function visibleTexts(html) {
  const out = [];
  const textRe = />([^<>]+)</g;
  let m;
  while ((m = textRe.exec(html))) if (m[1].trim()) out.push(m[1].trim());
  const attrRe = /\s(placeholder|title|aria-label|alt)="([^"]*)"/g;
  while ((m = attrRe.exec(html))) out.push(m[2]);
  return out;
}

const ENGLISH_WORDS = new Set([
  'the', 'your', 'you', 'and', 'with', 'from', 'this', 'that', 'play', 'tap',
  'learn', 'sound', 'lesson', 'start', 'open', 'settings', 'progress', 'review',
  'record', 'listen', 'choose', 'every', 'before', 'after', 'first', 'next',
  'last', 'new', 'all', 'when', 'how', 'what', 'their', 'into', 'about',
  'here', 'there', 'more', 'good', 'ready', 'again', 'still', 'only', 'also',
  'than', 'then', 'them', 'these', 'those', 'where', 'while', 'does', 'make',
  'takes', 'give', 'turn', 'keep', 'help', 'show', 'see', 'try', 'use', 'now',
  'one', 'two', 'three', 'was', 'were', 'will', 'would', 'should', 'could',
  'have', 'has', 'had', 'been', 'being', 'does', 'done', 'going', 'want',
  'need', 'time', 'minute', 'day', 'week', 'note', 'notes', 'string', 'strings',
]);

function looksEnglish(text) {
  const words = text.toLowerCase().match(/[a-zà-ÿ']+/g) || [];
  if (words.length < 3) return false;
  let hits = 0;
  words.forEach(w => { if (ENGLISH_WORDS.has(w)) hits++; });
  return hits >= 3 && hits / words.length > 0.4;
}

const leftovers = new Map();
for (const { name, html } of screens) {
  for (const text of visibleTexts(html)) {
    if (!looksEnglish(text)) continue;
    if (!leftovers.has(text)) leftovers.set(text, new Set());
    leftovers.get(text).add(name);
  }
}

check(leftovers.size === 0,
  `these lines are still English:\n    ${[...leftovers.keys()].map(t => JSON.stringify(t) + ' (' + [...leftovers.get(t)].join(',') + ')').join('\n    ')}`);

check(api.getLang() === 'pt', 'the app can switch to Portuguese');

if (failures.length) console.log(failures.join('\n'));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
