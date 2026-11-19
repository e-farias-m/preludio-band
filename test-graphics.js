// test-graphics.js
// Renders every fingering/staff diagram in js/graphics.js and checks the SVG
// output is well-formed. Also pins the handful of deliberate design choices
// (horizontal flute, labelled side keys) so they don't silently regress.

const fs = require('fs');
const path = require('path');

const read = f => fs.readFileSync(path.join(__dirname, 'js', f), 'utf8');

const sandbox = new Function(`
${read('curriculum.js')}
${read('graphics.js')}
return { Graphics, CURRICULUM };
`);
const { Graphics, CURRICULUM } = sandbox();

let pass = 0;
let fail = 0;
const failures = [];
function check(cond, msg) {
  if (cond) { pass++; } else { fail++; failures.push(msg); }
}
function isSvg(s) {
  return typeof s === 'string' && s.startsWith('<svg') && s.endsWith('</svg>');
}
// Every circle must sit inside the diagram's viewBox, otherwise an enlarged or
// repositioned key can be clipped at the edges.
function circlesWithinViewBox(svg) {
  const vb = svg.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
  if (!vb) return false;
  const [, w, h] = vb.map(Number);
  const re = /<circle cx="(-?\d+(?:\.\d+)?)" cy="(-?\d+(?:\.\d+)?)" r="(\d+(?:\.\d+)?)"/g;
  let m;
  while ((m = re.exec(svg))) {
    const [cx, cy, r] = [Number(m[1]), Number(m[2]), Number(m[3])];
    if (cx - r < -0.01 || cy - r < -0.01 || cx + r > w + 0.01 || cy + r > h + 0.01) return false;
  }
  return true;
}

const SIZES = [72, 84, 100, 120];
let diagrams = 0;

for (const inst of Object.values(CURRICULUM)) {
  for (const lesson of inst.lessons) {
    if (!lesson.fingeringState) continue;
    for (const size of SIZES) {
      const svg = Graphics.fingeringSVG(inst.fingeringType, lesson.fingeringState, inst.accentColor, size);
      diagrams++;
      check(isSvg(svg), `${inst.id}/${lesson.id} fingering @${size} is not valid SVG`);
      check(!svg.includes('undefined') && !svg.includes('NaN'),
        `${inst.id}/${lesson.id} fingering @${size} contains undefined/NaN`);
      check(circlesWithinViewBox(svg),
        `${inst.id}/${lesson.id} fingering @${size} has a key outside its viewBox`);
    }
    const staff = Graphics.staffSVG({ pos: lesson.staffStep, accidental: lesson.accidental, clef: inst.clef, accentColor: inst.accentColor, width: 96 });
    check(isSvg(staff), `${inst.id}/${lesson.id} staff is not valid SVG`);
  }
}
check(diagrams > 0, 'no fingering diagrams rendered');

// ── Flute is drawn horizontally (transverse) ───────────────────────────────
{
  const flute = CURRICULUM.flute;
  const note = flute.lessons.find(l => l.id === 'fl-1');
  const svg = Graphics.fingeringSVG('flute', note.fingeringState, flute.accentColor, 100);
  check(svg.includes('viewBox="0 0 280 130"'), 'flute diagram should use a horizontal viewBox');
  check(svg.includes('<ellipse'), 'flute diagram should show an embouchure');
  check(svg.includes('>TH<'), 'flute diagram should label the thumb Bb lever');
  check(svg.includes('>G#<'), 'flute diagram should show the G# key');
  check(svg.includes('>Eb<'), 'flute diagram should show the Eb key');
  check(svg.includes('>C#<'), 'flute diagram should show the low C# key');
  check(svg.includes('>C<'), 'flute diagram should show the low C foot key');
  check(svg.includes('data-action="fingering-key"') && svg.includes('data-key="TH"'),
    'the labelled thumb key should be tappable for an explanation');
}

// ── Generic woodwinds label their side keys on the button ──────────────────
{
  const cl = CURRICULUM.clarinet;
  const note = cl.lessons.find(l => l.id === 'cl-7'); // uses register + little finger
  const svg = Graphics.fingeringSVG('clarinet', note.fingeringState, cl.accentColor, 100);
  check(svg.includes('>R<'), 'clarinet register key should be labelled R');
  check(svg.includes('>TH<'), 'clarinet thumb key should be labelled TH');
  check(svg.includes('>L<'), 'clarinet little-finger key should be labelled L');
  check(svg.includes('data-key="R"') && svg.includes('data-key="L"'),
    'clarinet side keys should be tappable for explanations');
}

// ── Brass keeps numbered valve buttons ─────────────────────────────────────
{
  const tr = CURRICULUM.trumpet;
  const note = tr.lessons.find(l => l.id === 'tr-1');
  const svg = Graphics.fingeringSVG('trumpet', note.fingeringState, tr.accentColor, 100);
  check(svg.includes('>1<') && svg.includes('>2<') && svg.includes('>3<'),
    'valve diagram should number the valves 1-3');
}

// ── Home-screen icons render for every instrument ──────────────────────────
for (const inst of Object.values(CURRICULUM)) {
  const icon = Graphics.instrumentIconSVG(inst.id, 56);
  check(isSvg(icon), `${inst.id} home icon is not valid SVG`);
}
check(Graphics.instrumentIconSVG('flute', 56).includes('<ellipse'),
  'flute home icon should show an embouchure to match its diagram');

// ── Melody staff draws every note, wraps, and highlights one ───────────────
{
  const notes = [
    { pos: -2, accidental: null }, { pos: -1, accidental: null },
    { pos: 0, accidental: null }, { pos: 1, accidental: '♭' },
    { pos: 2, accidental: null }, { pos: 3, accidental: null },
    { pos: 4, accidental: null }, { pos: 5, accidental: null },
    { pos: 4, accidental: null }, { pos: 3, accidental: null },
    { pos: 2, accidental: null }, { pos: 1, accidental: null },
    { pos: 0, accidental: null }, { pos: 1, accidental: null },
    { pos: 2, accidental: null }, { pos: 3, accidental: null },
    { pos: 4, accidental: null }, { pos: 3, accidental: null },
    { pos: 2, accidental: null }, { pos: 0, accidental: null },
  ];
  const svg = Graphics.melodySVG({ notes, highlightIndex: 3, clef: 'treble', accentColor: '#e0a020', width: 320 });
  check(isSvg(svg), 'melody staff is valid SVG');
  const heads = (svg.match(/<ellipse/g) || []).length;
  check(heads === notes.length, `melody staff should draw one notehead per note (got ${heads})`);
  const systems = (svg.match(/class="clef clef-treble"/g) || []).length;
  check(systems >= 2, 'a melody longer than one system wraps onto more staves');
  check(svg.includes('#e0a020'), 'the highlighted note uses the accent colour');
  check(svg.includes('♭'), 'an accidental note prints its accidental');
  check(!svg.includes('undefined') && !svg.includes('NaN'), 'melody staff contains no undefined/NaN');
  check(Graphics.melodySVG({ notes: [], highlightIndex: 0 }) === '', 'an empty melody renders nothing');
}

// ── Every curriculum song renders cleanly with dynamic system splitting ─────
{
  let renderedSongs = 0;
  for (const inst of Object.values(CURRICULUM)) {
    if (!inst.lessons) continue;
    for (const song of inst.lessons.filter(l => l.type === 'song')) {
      if (!Array.isArray(song.noteIds) || !song.noteIds.length) continue;
      const durs = Array.isArray(song.durations) && song.durations.length === song.noteIds.length
        ? song.durations : song.noteIds.map(() => 1);
      const notes = [];
      song.noteIds.forEach((id, i) => {
        const n = inst.lessons.find(l => l.id === id);
        if (!n || typeof n.staffStep !== 'number') return;
        notes.push({ pos: n.staffStep, accidental: n.accidental, duration: durs[i] });
      });
      if (!notes.length) continue;
      const svg = Graphics.melodySVG({
        notes, clef: inst.clef, accentColor: inst.accentColor || '#C4832A', width: 320,
        timeSig: song.timeSig, keySig: song.keySig || 0, bpm: song.bpm || 100,
        pickup: song.pickup, gaps: song.gaps || [], percussion: inst.clef === 'percussion',
      });
      renderedSongs++;
      check(isSvg(svg), `${inst.id}/${song.id} song is valid SVG`);
      const heads = (svg.match(/<ellipse/g) || []).length;
      check(heads === notes.length, `${inst.id}/${song.id} draws every notehead (got ${heads}/${notes.length})`);
      check(!svg.includes('undefined') && !svg.includes('NaN'), `${inst.id}/${song.id} song has no undefined/NaN`);
    }
  }
  check(renderedSongs > 100, `the song sweep covers the curriculum (got ${renderedSongs})`);
}

// ── Melody staff engraves note values (quarter / half / whole) ─────────────
{
  const heads = svg => (svg.match(/<ellipse/g) || []).length;
  const headAt = (svg, i) => (svg.match(/<ellipse[^>]*>/g) || [])[i];
  const stems = svg => (svg.match(/<line x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)" stroke="var\(--dg-ink\)" stroke-width="1.5"\/>/g) || []).filter(l => { const m = l.match(/x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)"/); return m[1] === m[3] && Math.abs(parseFloat(m[2]) - parseFloat(m[4])) < 40; }).length;
  const notes = [
    { pos: 0, accidental: null, duration: 1 },
    { pos: 2, accidental: null, duration: 2 },
    { pos: 4, accidental: null, duration: 4 },
  ];
  const svg = Graphics.melodySVG({ notes, accentColor: '#e0a020' });
  check(heads(svg) === 3, 'three-notes of mixed values draw three heads');
  check((headAt(svg, 0) || '').includes('fill="var(--dg-ink)"'), 'a quarter note is a filled notehead');
  check(!(headAt(svg, 1) || '').includes('fill="var(--dg-ink)"') && (headAt(svg, 1) || '').includes('fill="none"'), 'a half note is a hollow notehead');
  check(!(headAt(svg, 2) || '').includes('fill="var(--dg-ink)"') && (headAt(svg, 2) || '').includes('fill="none"'), 'a whole note is a hollow notehead');
  // quarter + half are stemmed, whole is not.
  check(stems(svg) === 2, `quarter and half notes carry stems, whole does not (got ${stems(svg)})`);
  check(Graphics.melodySVG({ notes: [{ pos: 0 }] }).includes('fill="var(--dg-ink)"'), 'a note without a duration defaults to a filled quarter note');
}

// ── Melody staff shows 4/4 and places bar lines on the beats ───────────────
{
  // Vertical bar lines span the full staff (y1 !== y2, x1 === x2); staff lines
  // are horizontal. Count the vertical ones (interior + the closing line).
  const barLines = svg => {
    const lines = svg.match(/<line x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)" stroke="var\(--dg-ink\)" stroke-width="(1(?:\.0)?|3(?:\.0|\.5)?)"/g) || [];
    return lines.filter(l => {
      const m = l.match(/x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)"/);
      return m[1] === m[3] && Math.abs(parseFloat(m[2]) - parseFloat(m[4])) >= 40 && m[1] !== '16';
    }).length;
  };
  const q = n => Array.from({ length: n }, () => ({ pos: 2, accidental: null, duration: 1 }));
  const sig = Graphics.melodySVG({ notes: q(8), accentColor: '#e0a020' });
  check(sig.includes('>4</text>'), 'the 4/4 time signature is drawn');
  const sigTexts = (sig.match(/>4<\/text>/g) || []).length;
  check(sigTexts === 2, `the time signature shows two 4s (got ${sigTexts})`);
  // 8 quarters = 2 bars of 4/4: one interior bar line + one closing line.
  check(barLines(sig) === 2, `8 quarter notes in 4/4 draw 2 bar lines (got ${barLines(sig)})`);
  // 4 quarters = a single bar: no interior bar line, just the closing line.
  check(barLines(Graphics.melodySVG({ notes: q(4), accentColor: '#e0a020' })) === 1,
    'a one-bar tune draws only the closing bar line');
  // 3 quarters is a pickup (anacrusis): the pickup fills no apparent bar, so
  // it draws just the closing line, with no interior bar line cutting it.
  check(barLines(Graphics.melodySVG({ notes: q(3), accentColor: '#e0a020' })) === 1,
    'an incomplete pickup bar draws only the closing bar line');
  // 5 beats (a 1-beat pickup + a full bar): exactly one interior bar line.
  check(barLines(Graphics.melodySVG({ notes: q(5), accentColor: '#e0a020', pickup: 1 })) === 2,
    'a 1-beat pickup plus a full bar draws one interior bar line');
  // A half note must never be split by a bar line: [1,1,1,2] is a 1-beat
  // pickup (bar 1) then a full bar whose last two beats hold the half note,
  // so the bar line lands on the note's end, not through it: one interior
  // bar line (after the pickup) plus the closing line.
  const half = [{ pos: 2, duration: 1 }, { pos: 2, duration: 1 }, { pos: 2, duration: 1 }, { pos: 2, duration: 2 }];
  check(barLines(Graphics.melodySVG({ notes: half, accentColor: '#e0a020', pickup: 1 })) === 2,
    'a half note is never split by a bar line');
  // The closing bar line of the tune is thick; a line that only ends a system
  // stays thin, so a single-bar tune still gets its final (thick) bar line.
  check(/stroke-width="3(?:\.0)?"/.test(Graphics.melodySVG({ notes: q(4), accentColor: '#e0a020' })),
    'the closing bar line of a tune is thick');
  // A short last system stops after its last bar: 5 bars at 4 per system
  // leave one bar, so the staff ends at a quarter of the usable width instead
  // of stretching an empty staff across the page.
  const staffEnds = svg => [...new Set(
    [...svg.matchAll(/<line x1="16" y1="([\d.]+)" x2="([\d.]+)" y2="\1"/g)].map(m => +m[2])
  )];
  const fiveBars = Graphics.melodySVG({ notes: q(20), accentColor: '#e0a020' });
  const ends = staffEnds(fiveBars);
  check(ends.length === 2 && ends[1] < ends[0],
    `the last system ends after its last bar (got ${JSON.stringify(ends)})`);
  const closing = [...fiveBars.matchAll(/<line x1="([\d.]+)"[^>]*stroke-width="3(?:\.0)?"/g)].map(m => +m[1]);
  check(closing.length === 1 && closing[0] === ends[1],
    `the closing bar line sits at the end of the short last system (got ${JSON.stringify(closing)})`);
  // A tune that fills its last system still reaches the right margin.
  check(staffEnds(Graphics.melodySVG({ notes: q(16), accentColor: '#e0a020' }))[0] === 348,
    'a full last system still spans the whole staff width');
  // A key signature (here, one sharp) is drawn to the right of the clef.
  check(Graphics.melodySVG({ notes: q(4), keySig: 1, accentColor: '#e0a020' }).includes('\u266F'),
    'a one-sharp key signature is drawn');
  // A pair of eighth notes gets a beam instead of two bare stems.
  check(Graphics.melodySVG({ notes: [{ pos: 2, duration: 0.5 }, { pos: 3, duration: 0.5 }], accentColor: '#e0a020' }).includes('<path d="M'),
    'a pair of eighth notes is beamed');
  // Rests come from the engraved Bravura rest glyph, not a fake notehead.
  check(Graphics.melodySVG({ notes: [{ pos: 2, duration: 1 }], gaps: [1], accentColor: '#e0a020' }).includes('class="rest rest-quarter"'),
    'a quarter rest is drawn from the engraved rest glyph');
  // The song's written tempo is drawn as a marking above the staff.
  check(Graphics.melodySVG({ notes: [{ pos: 2, duration: 1 }], bpm: 100 }).includes('\u2669=100'), 'the song tempo is drawn above the staff');
  // Ledger notes reach outside the staff, so the viewBox must grow with the
  // tune's range instead of clipping them at the edge.
  const deep = Graphics.melodySVG({ notes: [{ pos: -5, duration: 1 }], accentColor: '#e0a020' });
  const deepH = parseFloat(deep.match(/viewBox="0 0 [\d.]+ ([\d.]+)"/)[1]);
  const deepYs = [...deep.matchAll(/(?:cy|y1|y2|y)="(-?[\d.]+)"/g)].map(m => parseFloat(m[1]));
  check(deepYs.length > 0 && Math.max(...deepYs) <= deepH,
    `a low ledger note fits inside the viewBox (max y ${Math.max(...deepYs)} of ${deepH})`);
  const high = Graphics.melodySVG({ notes: [{ pos: 14, duration: 1 }], accentColor: '#e0a020' });
  const highH = parseFloat(high.match(/viewBox="0 0 [\d.]+ ([\d.]+)"/)[1]);
  const highYs = [...high.matchAll(/(?:cy|y1|y2|y)="(-?[\d.]+)"/g)].map(m => parseFloat(m[1]));
  check(highYs.length > 0 && Math.min(...highYs) >= 0 && Math.max(...highYs) <= highH,
    `a high ledger note fits inside the viewBox (y ${Math.min(...highYs)}..${Math.max(...highYs)} of ${highH})`);
}

// ── Ledger lines stop at the notehead ──────────────────────────────────────
// A note in a space hangs off the last line above it; nothing is drawn past
// the head. Low B (B3) is the space under the C4 ledger line, so it gets C4
// only — not an extra line at A3 underneath.
{
  const cases = [
    [-2, [-2]], [-3, [-2]], [-4, [-2, -4]], [-5, [-2, -4]], [-6, [-2, -4, -6]],
    [-1, []], [0, []], [8, []], [9, []], [10, [10]], [11, [10]], [12, [10, 12]],
  ];
  for (const [pos, want] of cases) {
    const got = Graphics.ledgerPositions(pos);
    check(JSON.stringify(got) === JSON.stringify(want),
      `pos ${pos} should have ledger lines ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
  }

  const b3 = Graphics.staffSVG({ pos: -3, clef: 'treble', accentColor: '#F2C24E', width: 130 });
  const ledgerYs = [...b3.matchAll(/<line x1="[\d.]+" y1="([\d.]+)" x2="[\d.]+" y2="[\d.]+" stroke="var\(--dg-ink\)" stroke-width="1.5"\/>/g)]
    .map(m => Number(m[1]));
  const below = ledgerYs.filter(y => y > 140).sort((a, b) => a - b);
  check(JSON.stringify(below) === JSON.stringify([156]),
    `B3 should get exactly the C4 ledger line (got y=${JSON.stringify(below)})`);
  const noteY = 140 - (-3) * 8;
  check(!below.some(y => y > noteY), 'B3 should not have a ledger line under the notehead');
}

// ── Optional markings: repeats, articulations, dynamics, slurs ─────────────
{
  const q = n => Array.from({ length: n }, () => ({ pos: 2, accidental: null, duration: 1 }));
  const base = { notes: q(4), accentColor: '#e0a020' };
  const withRepeats = Graphics.melodySVG({ ...base, repeatStart: true, repeatEnd: true });
  check((withRepeats.match(/r="1.2"/g) || []).length >= 4, 'start and end repeat signs draw repeat dots');
  const withDyn = Graphics.melodySVG({ ...base, dynamics: [{ index: 0, text: 'f' }] });
  check(withDyn.includes('>f</text>'), 'a dynamic marking is drawn below the staff');
  const withArt = Graphics.melodySVG({ ...base, articulations: [{ index: 0, type: 'staccato' }] });
  check(withArt.includes('r="2.2"'), 'a staccato articulation dot is drawn');
  const withSlur = Graphics.melodySVG({ notes: q(2), accentColor: '#e0a020', slurs: [{ from: 0, to: 1 }] });
  check(withSlur.includes('stroke-width="1.5"') && withSlur.includes(' Q'), 'a slur arc is drawn between notes');
}

if (failures.length) console.log(failures.join('\n'));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
