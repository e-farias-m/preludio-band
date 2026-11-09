// graphics.js
// Generates all visual elements as inline SVG strings — no image assets.
// Three families: staff notation, fingering diagrams, and the home-screen
// instrument icon set (a small custom line-icon system).

const Graphics = (() => {

  const HALF = 8;           // px per diatonic staff step
  const STAFF_SPACE = 2 * HALF; // px between two adjacent staff lines
  const STAFF_BOTTOM_Y = 140; // y of pos0 (E4, bottom line)
  const STAFF_LEFT_X = 30;
  const STAFF_RIGHT_X = 105;

  // Diagram palette — resolved from CSS custom properties so the same markup
  // renders as bright ink on dark panels and dark ink on white "paper".
  const INK = 'var(--dg-ink)';              // staff lines, clef, strong outlines
  const INK_DIM = 'var(--dg-ink-dim)';      // decorative joints, connectors, labels
  const HOUSING = 'var(--dg-housing)';      // instrument body / tube / casing fill
  const HOUSING_EDGE = 'var(--dg-housing-edge)';
  const OPEN = 'var(--dg-open)';            // open hole / vent interior

  function yForPos(pos) { return STAFF_BOTTOM_Y - pos * HALF; }

  function ledgerPositions(pos) {
    const out = [];
    if (pos > 8) {
      const maxL = (pos % 2 === 0) ? pos : pos - 1;
      for (let p = 10; p <= maxL; p += 2) out.push(p);
    } else if (pos < -1) {
      const minL = (pos % 2 === 0) ? pos : pos - 1;
      for (let p = -2; p >= minL; p -= 2) out.push(p);
    }
    return out;
  }

  // A single key/lever drawn as a button with a short label centred on it.
  // Putting the letters inside the button keeps them legible even at the small
  // sizes used by quiz thumbnails, where a caption below would be ~4px tall.
  // Labelled keys are tappable so the app can explain abbreviations (TH, R, L).
  function labeledKey(cx, cy, r, pressed, accentColor, label) {
    const fill = pressed ? accentColor : OPEN;
    const textColor = pressed ? OPEN : accentColor;
    const fontSize = label.length > 1 ? r * 0.8 : r * 1.15;
    const attrs = label ? ` class="fingering-key" data-action="fingering-key" data-key="${label}"` : '';
    let out = `<g${attrs}>`;
    out += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${accentColor}" stroke-width="2"/>`;
    if (label) {
      out += `<text x="${cx}" y="${(cy + fontSize * 0.35).toFixed(1)}" text-anchor="middle" font-size="${fontSize.toFixed(1)}" font-weight="700" fill="${textColor}">${label}</text>`;
    }
    out += `</g>`;
    return out;
  }

  // ── CLEF GLYPHS ──────────────────────────────────────────────────────────
  // Every clef has a "reference line" that must land on one specific staff
  // position: the treble clef's spiral sits on the G line, the bass clef's two
  // dots straddle the F line, and the alto clef's arrow heads point at the
  // middle line (that is what makes it an alto clef).
  //
  // The shapes are Bravura's outlines, embedded as paths (see fonts/OFL.txt)
  // instead of drawn from a system font. That keeps them identical on macOS,
  // Windows, Linux and Android — no glyph fallback, no font-specific metrics,
  // and the clef cannot shift when a fallback font is picked. Coordinates are
  // font units (250 per staff space) with the origin on the clef's reference
  // line, which is exactly where the staff line must pass.
  const CLEF_UNITS_PER_SPACE = 250;
  const CLEF_GLYPH = {
    treble: {
      refPos: 2,
      xMin: 0, xMax: 671, top: 1098, bottom: -658,
      path: 
      'M376 415C374 427 376 428 382 434C398 449 419 470 438 491C522 583 572 702 572 815C572 902 548 988 507 1048 '
      + 'C492 1070 466 1098 455 1098C441 1098 410 1072 390 1050C316 968 292 843 292 739C292 681 299 616 306 575 '
      + 'C308 563 309 561 297 551C233 498 164 437 112 373C43 287 0 194 0 87C0 -87 119 -252 364 -252 '
      + 'C387 -252 413 -250 433 -246C444 -244 446 -243 448 -255C460 -322 475 -409 475 -456C475 -604 375 -622 316 -622 '
      + 'C262 -622 236 -606 236 -593C236 -586 245 -583 268 -576C299 -567 335 -540 335 -482C335 -427 300 -380 239 -380 '
      + 'C172 -380 132 -433 132 -495C132 -560 171 -658 322 -658C389 -658 519 -628 519 -458C519 -401 501 -306 490 -244 '
      + 'C488 -232 489 -233 503 -227C604 -187 671 -102 671 11C671 139 577 252 430 252C404 252 404 252 401 270ZM470 943 '
      + 'C503 943 530 916 530 861C530 792 497 728 419 650C403 634 379 611 356 591C349 585 345 586 343 599 '
      + 'C339 625 337 659 337 691C337 847 409 943 470 943ZM361 262C364 243 364 244 346 238C258 208 201 129 201 44 '
      + 'C201 -46 248 -110 316 -133C324 -136 336 -139 343 -139C351 -139 355 -134 355 -128C355 -121 347 -118 340 -115 '
      + 'C298 -97 268 -54 268 -8C268 49 307 92 368 109C384 113 386 112 388 101L438 -197C440 -208 439 -208 424 -211 '
      + 'C408 -214 388 -216 368 -216C193 -216 80 -119 80 20C80 79 90 158 173 252C233 319 279 356 326 394 '
      + 'C336 402 338 401 340 390ZM430 103C428 115 429 118 441 117C522 110 589 42 589 -46C589 -109 551 -160 495 -188 '
      + 'C483 -194 481 -194 479 -182Z',
    },
    alto: {
      refPos: 4,
      xMin: 0, xMax: 699, top: 506, bottom: -506,
      path: 
      'M230 482C230 496 223 503 209 503H208C194 503 187 496 187 482V-482C187 -496 194 -503 208 -503H209 '
      + 'C223 -503 230 -496 230 -482V-44C230 -36 235 -37 239 -38C265 -45 307 -71 328 -184C331 -200 337 -209 347 -209 '
      + 'C358 -209 363 -199 368 -182C381 -138 404 -89 475 -89C540 -89 558 -153 558 -284C558 -415 535 -474 452 -474 '
      + 'C430 -474 410 -471 394 -466C377 -461 367 -454 367 -447C367 -442 383 -436 394 -432C414 -425 434 -405 434 -367 '
      + 'C434 -323 405 -298 366 -298C323 -298 289 -327 289 -380C289 -443 344 -506 463 -506C627 -506 699 -391 699 -287 '
      + 'C699 -149 623 -53 490 -53C461 -53 442 -58 429 -62C424 -64 418 -65 413 -65C409 -65 404 -64 400 -61 '
      + 'C386 -52 364 -20 364 0C364 20 386 52 400 61C404 64 409 65 413 65C418 65 424 64 429 62C442 58 461 53 490 53 '
      + 'C623 53 699 149 699 287C699 391 627 506 463 506C344 506 289 443 289 380C289 327 323 298 366 298 '
      + 'C405 298 434 323 434 367C434 405 414 425 394 432C383 436 367 442 367 447C367 454 377 461 394 466 '
      + 'C410 471 430 474 452 474C535 474 558 415 558 284C558 153 540 89 475 89C404 89 381 138 368 182 '
      + 'C363 199 358 209 347 209C337 209 331 200 328 184C307 71 265 45 239 38C235 37 230 36 230 44ZM21 503 '
      + 'C7 503 0 496 0 482V-482C0 -496 7 -503 21 -503H107C121 -503 128 -496 128 -482V482C128 496 121 503 107 503Z',
    },
    bass: {
      refPos: 6,
      xMin: -5, xMax: 684, top: 262, bottom: -635,
      path: 
      'M252 262C78 262 0 135 0 39C0 -41 42 -110 123 -110C186 -110 229 -66 229 -4C229 60 182 100 133 100 '
      + 'C106 100 96 93 83 93C70 93 67 101 67 111C67 151 127 224 229 224C335 224 381 120 381 -37 '
      + 'C381 -140 359 -260 297 -356C237 -449 134 -534 10 -605C1 -610 -5 -615 -5 -623C-5 -629 -1 -635 8 -635 '
      + 'C13 -635 19 -633 25 -630C158 -565 286 -489 392 -375C479 -281 531 -159 531 -28C531 146 425 262 252 262ZM629 180 '
      + 'C598 180 574 156 574 125C574 94 598 70 629 70C660 70 684 94 684 125C684 156 660 180 629 180ZM630 -71 '
      + 'C599 -71 576 -94 576 -125C576 -156 599 -179 630 -179C661 -179 684 -156 684 -125C684 -94 661 -71 630 -71Z',
    },
  };

  // Height in staff spaces, used by the tests and the layout comments.
  const CLEF_SPACES = {};
  Object.keys(CLEF_GLYPH).forEach(clef => {
    const g = CLEF_GLYPH[clef];
    CLEF_SPACES[clef] = (g.top - g.bottom) / CLEF_UNITS_PER_SPACE;
  });

  // `yRef` is the y of the clef's reference line on the staff. The path's
  // origin sits on that line, so the transform places it directly.
  function clefText(clef, { x, yRef, space = STAFF_SPACE, color = INK }) {
    const g = CLEF_GLYPH[clef] || CLEF_GLYPH.treble;
    const s = space / CLEF_UNITS_PER_SPACE;
    return `<path class="clef clef-${clef}" d="${g.path}"`
      + ` transform="translate(${x.toFixed(2)} ${yRef.toFixed(2)}) scale(${s.toFixed(5)} ${(-s).toFixed(5)})"`
      + ` fill="${color}"/>`;
  }

  // Draw a clef with its left ink edge at `left`, so the horizontal placement
  // is the same for every glyph regardless of its side bearing.
  function clefAt(clef, left, space, yRef, color) {
    const g = CLEF_GLYPH[clef] || CLEF_GLYPH.treble;
    const s = space / CLEF_UNITS_PER_SPACE;
    return clefText(clef, { x: left - g.xMin * s, yRef, space, color });
  }

  // Width of a clef's ink in staff spaces.
  function clefWidth(clef) {
    const g = CLEF_GLYPH[clef] || CLEF_GLYPH.treble;
    return (g.xMax - g.xMin) / CLEF_UNITS_PER_SPACE;
  }

  // Where each clef's ink starts. The notehead sits to the right of the clef,
  // so the widest clef still clears it.
  const CLEF_STAFF_LEFT = { treble: 20, alto: 20, bass: 20 };
  const CLEF_MELODY_LEFT = { treble: 18, alto: 18, bass: 18 };
  // Song clefs are drawn at 0.8 of the staff spacing: a treble clef is about 7
  // staff spaces tall, so this reaches roughly 1.4 staff heights.
  const CLEF_MELODY_SCALE = 0.8;

  // ── STAFF NOTATION ──────────────────────────────────────────────────────
  function staffSVG({ pos, accidental = null, clef = 'treble', accentColor = 'var(--accent-warm)', width = 130 }) {
    const noteX = (STAFF_LEFT_X + STAFF_RIGHT_X) / 2 + 8;
    const isPercussion = (clef === 'percussion');
    const renderPos = isPercussion ? 4 : pos; // single line sits at the middle line
    const noteY = yForPos(renderPos);
    const stemUp = renderPos <= 4;
    const lineColor = INK;
    const renderH = width * (220 / 130);

    let svg = `<svg viewBox="0 0 130 220" width="${width}" height="${renderH}" xmlns="http://www.w3.org/2000/svg">`;

    // Staff lines
    if (isPercussion) {
      const y = yForPos(4);
      svg += `<line x1="${STAFF_LEFT_X}" y1="${y}" x2="${STAFF_RIGHT_X}" y2="${y}" stroke="${lineColor}" stroke-width="1.5"/>`;
    } else {
      for (let i = 0; i <= 8; i += 2) {
        const y = yForPos(i);
        svg += `<line x1="${STAFF_LEFT_X}" y1="${y}" x2="${STAFF_RIGHT_X}" y2="${y}" stroke="${lineColor}" stroke-width="1.5"/>`;
      }
    }

    // Clef glyph (G clef for treble; simplified bass clef dots+curve otherwise; percussion has no clef)
    if (isPercussion) {
      // no clef glyph
    } else if (clef === 'treble') {
      svg += `<text x="${STAFF_LEFT_X - 8}" y="${STAFF_BOTTOM_Y + 8}" font-size="110" font-family="Georgia, 'Apple Symbols', serif" fill="${lineColor}">&#119070;</text>`;
    } else {
      svg += `<text x="${STAFF_LEFT_X - 6}" y="${yForPos(2)}" font-size="66" font-family="Georgia, 'Apple Symbols', serif" fill="${lineColor}">&#119074;</text>`;
    }

    // Ledger lines
    ledgerPositions(pos).forEach(p => {
      const y = yForPos(p);
      svg += `<line x1="${noteX - 12}" y1="${y}" x2="${noteX + 12}" y2="${y}" stroke="${lineColor}" stroke-width="1.5"/>`;
    });

    // Accidental
    if (accidental) {
      svg += `<text x="${noteX - 24}" y="${noteY + 6}" font-size="22" fill="${accentColor}" font-family="Georgia, serif">${accidental}</text>`;
    }

    // Notehead (filled ellipse, slightly tilted). A dark ring separates it from
    // the bright staff lines so the pitch still reads at thumbnail sizes.
    svg += `<ellipse cx="${noteX}" cy="${noteY}" rx="7.5" ry="5.5" fill="${accentColor}" stroke="${OPEN}" stroke-width="1.5" transform="rotate(-18 ${noteX} ${noteY})"/>`;

    // Stem
    if (stemUp) {
      svg += `<line x1="${noteX + 7}" y1="${noteY}" x2="${noteX + 7}" y2="${noteY - 46}" stroke="${accentColor}" stroke-width="2"/>`;
    } else {
      svg += `<line x1="${noteX - 7}" y1="${noteY}" x2="${noteX - 7}" y2="${noteY + 46}" stroke="${accentColor}" stroke-width="2"/>`;
    }

    svg += `</svg>`;
    return svg;
  }

  // ── MELODY STAFF (a whole tune on one or more systems) ──────────────────
  // `notes` is a list of { pos, accidental, duration } where duration is in
  // beats (1 = quarter, 2 = half, 4 = whole; anything past a whole note is
  // drawn as a whole). The note value is engraved — halves and wholes get an
  // open (hollow) notehead, wholes drop the stem — so the written rhythm
  // matches what the tune actually plays.
  //
  // The tune is laid out in common time (4/4): bar lines fall every four beats
  // and a "4/4" signature is drawn after the clef. When the melody's total is
  // not a whole number of bars, the opening beats are treated as an anacrusis
  // (pickup), so bar lines straddle no note and the final bar is complete.
  //
  // The note at `highlightIndex` is drawn in the accent colour with a soft halo
  // so the tune reads like sheet music with the student's current note called
  // out; the rest stay in ink.
  function melodySVG({ notes = [], highlightIndex = -1, clef = 'treble', accentColor = 'var(--accent-warm)', width = 320, perSystem = 6, beatsPerBar = 4, timeSig = null, pickup = 0, gaps = [], percussion = false }) {
    if (!notes.length) return '';
    const VB_W = 360;
    // Each system leaves room for the clef, which overhangs the staff.
    const SYSTEM_H = 180;
    const TOP_LINE_Y = 64;
    const leftX = 120;         // first note sits past the enlarged clef + time signature
    const lineStartX = 24;
    const rightX = VB_W - 14;

    // Durations drive the bar lines. Bars start at beat 0 unless the song
    // declares a pickup (anacrusis) length. A bar line falls on every bar
    // boundary, and systems are split only between bars.
    const durs = notes.map(n => (typeof n.duration === 'number' && n.duration > 0 ? n.duration : 1));
    const bpb = timeSig ? timeSig.num * 4 / timeSig.den : beatsPerBar;
    const sigNum = timeSig ? timeSig.num : beatsPerBar;
    const sigDen = timeSig ? timeSig.den : 4;
    const gapArr = Array.isArray(gaps) ? gaps : [];
    const starts = [];
    let beatPos = pickup;
    for (let g = 0; g < notes.length; g++) {
      starts.push(beatPos);
      beatPos += (typeof gapArr[g] === 'number' ? gapArr[g] : 0) + durs[g];
    }
    // A note belongs to the bar it starts in, so a bar line never cuts through
    // a note and every bar gets both of its lines. Rest gaps shift the notes
    // they precede, so bars stay whole in songs that have rests.
    const barOf = notes.map((_, g) => Math.floor(starts[g] / bpb + 1e-9));
    const bars = [];
    notes.forEach((_, g) => {
      if (!bars.length || barOf[g] !== barOf[g - 1]) bars.push([]);
      bars[bars.length - 1].push(g);
    });

    const systems = [];
    let current = [];
    let currentCount = 0;
    bars.forEach(bar => {
      if (currentCount > 0 && currentCount + bar.length > perSystem) {
        systems.push(current);
        current = [];
        currentCount = 0;
      }
      bar.forEach(g => current.push(notes[g]));
      currentCount += bar.length;
    });
    if (current.length) systems.push(current);
    const VB_H = systems.length * SYSTEM_H + 8;
    const renderH = width * (VB_H / VB_W);

    let svg = `<svg viewBox="0 0 ${VB_W} ${VB_H}" width="${width}" height="${renderH.toFixed(1)}" xmlns="http://www.w3.org/2000/svg">`;

    systems.forEach((systemNotes, s) => {
      const topLineY = TOP_LINE_Y + s * SYSTEM_H;
      const y = pos => topLineY + (8 - pos) * HALF;

      if (percussion) {
        svg += `<line x1="${lineStartX}" y1="${y(4)}" x2="${rightX}" y2="${y(4)}" stroke="${INK}" stroke-width="1.3"/>`;
      } else {
        for (let p = 0; p <= 8; p += 2) {
          svg += `<line x1="${lineStartX}" y1="${y(p)}" x2="${rightX}" y2="${y(p)}" stroke="${INK}" stroke-width="1.3"/>`;
        }
        const clefName = CLEF_GLYPH[clef] ? clef : 'treble';
        const cmet = CLEF_GLYPH[clefName];
        svg += clefAt(clefName, CLEF_MELODY_LEFT[clefName], STAFF_SPACE * CLEF_MELODY_SCALE, y(cmet.refPos), INK);
      }
      // Time signature: "4" over "4" centred on the middle of the staff.
      if (s === 0) {
        const sigX = lineStartX + 76;
        if (percussion) {
          svg += `<text x="${sigX}" y="${y(4) - 12}" font-size="26" font-weight="700" text-anchor="middle" font-family="Georgia, serif" fill="${INK}">${sigNum}</text>`;
          svg += `<text x="${sigX}" y="${y(4) + 16}" font-size="26" font-weight="700" text-anchor="middle" font-family="Georgia, serif" fill="${INK}">${sigDen}</text>`;
        } else {
          svg += `<text x="${sigX}" y="${y(4) - 1}" font-size="26" font-weight="700" text-anchor="middle" font-family="Georgia, serif" fill="${INK}">${sigNum}</text>`;
          svg += `<text x="${sigX}" y="${y(2) + 15}" font-size="26" font-weight="700" text-anchor="middle" font-family="Georgia, serif" fill="${INK}">${sigDen}</text>`;
        }
      }

      let globalIndex = systems.slice(0, s).reduce((a, sys) => a + sys.length, 0);
      let sysBase = Infinity;
      let sysEnd = 0;
      systemNotes.forEach((note, k) => { const g = globalIndex + k; sysBase = Math.min(sysBase, starts[g]); sysEnd = Math.max(sysEnd, starts[g] + durs[g] + (gapArr[g] || 0)); });
      if (sysBase === Infinity) sysBase = 0;
      const sysSpan = sysEnd - sysBase || 1;
      systemNotes.forEach((note, k) => {
        const g = globalIndex + k;
        const x = leftX + ((starts[g] - sysBase) / sysSpan) * (rightX - leftX);
        const noteY = y(note.pos);
        const lit = g === highlightIndex;
        const color = lit ? accentColor : INK;
        const duration = durs[g];
        const gap = gapArr[g] || 0;
        const effective = gap > 0 ? gap : duration;
        const open = effective >= 2;                     // half and longer: hollow
        const stemmed = effective < 4;                  // whole notes lose the stem

        // Bar line just before this note when the previous note ended a bar.
        if (k > 0 && barOf[g] !== barOf[g - 1]) {
          const bx = x - ((rightX - leftX) / systemNotes.length) / 2;
          if (percussion) {
            svg += `<line x1="${bx}" y1="${y(4) - 12}" x2="${bx}" y2="${y(4) + 12}" stroke="${INK}" stroke-width="1.3"/>`;
          } else {
            svg += `<line x1="${bx}" y1="${y(8)}" x2="${bx}" y2="${y(0)}" stroke="${INK}" stroke-width="1.3"/>`;
          }
        }

        if (lit) svg += `<circle cx="${x}" cy="${noteY}" r="13" fill="${accentColor}" opacity="0.18"/>`;
        if (gap > 0) {
          // A rest stands for the gap: the same head its value calls for, with no
          // ledger line and no stem.
          const restOpen = gap >= 2;
          svg += `<ellipse cx="${x}" cy="${noteY}" rx="6.2" ry="4.6" fill="${restOpen ? 'none' : color}" stroke="${restOpen ? color : OPEN}" stroke-width="${restOpen ? 1.8 : 1.2}" transform="rotate(-18 ${x} ${noteY})"/>`;
        } else {
          ledgerPositions(note.pos).forEach(p => {
            svg += `<line x1="${x - 10}" y1="${y(p)}" x2="${x + 10}" y2="${y(p)}" stroke="${color}" stroke-width="1.3"/>`;
          });
          if (note.accidental) {
            svg += `<text x="${x - 15}" y="${noteY + 5}" font-size="18" fill="${color}" font-family="Georgia, serif">${note.accidental}</text>`;
          }
          // Hollow noteheads read clearly against the staff, so they skip the dark
          // separating ring a filled head needs; both keep the same rotation.
          const headFill = open ? 'none' : color;
          const headStroke = open ? color : OPEN;
          const headStrokeW = open ? 1.8 : 1.2;
          svg += `<ellipse cx="${x}" cy="${noteY}" rx="6.2" ry="4.6" fill="${headFill}" stroke="${headStroke}" stroke-width="${headStrokeW}" transform="rotate(-18 ${x} ${noteY})"/>`;
          if (stemmed) {
            const stemUp = note.pos <= 4;
            const stemX = stemUp ? x + 6 : x - 6;
            const stemEnd = stemUp ? noteY - 34 : noteY + 34;
            svg += `<line x1="${stemX}" y1="${noteY}" x2="${stemX}" y2="${stemEnd}" stroke="${color}" stroke-width="1.6"/>`;
          }
        }
      });

      // Bar line at the end of every system.
      if (percussion) {
        svg += `<line x1="${rightX}" y1="${y(4) - 12}" x2="${rightX}" y2="${y(4) + 12}" stroke="${INK}" stroke-width="1.3"/>`;
      } else {
        svg += `<line x1="${rightX}" y1="${y(8)}" x2="${rightX}" y2="${y(0)}" stroke="${INK}" stroke-width="1.3"/>`;
      }
    });

    svg += `</svg>`;
    return svg;
  }

  // ── RECORDER FINGERING DIAGRAM ──────────────────────────────────────────
  function recorderFingeringSVG(fingeringState, accentColor = 'var(--accent-warm)', size = 130) {
    const [thumb, h1, h2, h3, h4, h5, h6, h7] = fingeringState;
    const cx = 65;
    const tubeTop = 18, tubeBottom = 215, tubeW = 30;
    const holeYs = [62, 84, 106, 132, 154, 176, 198]; // h1..h7
    const holes = [h1, h2, h3, h4, h5, h6, h7];

    let svg = `<svg viewBox="0 0 130 230" width="${size}" height="${size * 230 / 130}" xmlns="http://www.w3.org/2000/svg">`;

    // Mouthpiece notch
    svg += `<path d="M ${cx - 14} ${tubeTop} Q ${cx} ${tubeTop - 10} ${cx + 14} ${tubeTop} L ${cx + 15} ${tubeTop + 14} L ${cx - 15} ${tubeTop + 14} Z" fill="${HOUSING}" stroke="${INK_DIM}" stroke-width="1.5"/>`;

    // Tube body
    svg += `<rect x="${cx - tubeW/2}" y="${tubeTop + 12}" width="${tubeW}" height="${tubeBottom - tubeTop - 12}" rx="10" fill="${HOUSING}" stroke="${HOUSING_EDGE}" stroke-width="1.5"/>`;

    // Joint lines (decorative, suggests head/body/foot joints)
    svg += `<line x1="${cx - tubeW/2}" y1="70" x2="${cx + tubeW/2}" y2="70" stroke="${INK_DIM}" stroke-width="1.5"/>`;
    svg += `<line x1="${cx - tubeW/2}" y1="188" x2="${cx + tubeW/2}" y2="188" stroke="${INK_DIM}" stroke-width="1.5"/>`;

    // Thumb hole (back) — offset left with dashed connector + labeled button
    const thumbY = 46;
    const thumbX = cx - tubeW/2 - 22;
    svg += `<line x1="${cx - tubeW/2 - 2}" y1="${thumbY}" x2="${thumbX + 12}" y2="${thumbY}" stroke="${INK_DIM}" stroke-width="1" stroke-dasharray="2,2"/>`;
    svg += labeledKey(thumbX, thumbY, 12, thumb, accentColor, 'TH');

    // Finger holes 1-7 down the front
    holes.forEach((covered, i) => {
      const y = holeYs[i];
      const r = i < 3 ? 9 : 7.5;
      svg += `<circle cx="${cx}" cy="${y}" r="${r}" fill="${covered ? accentColor : OPEN}" stroke="${accentColor}" stroke-width="2"/>`;
    });

    svg += `</svg>`;
    return svg;
  }

  // ── BRASS VALVE FINGERING DIAGRAM (trumpet, euphonium, tuba style) ──────
  function valveFingeringSVG(fingeringState, accentColor = 'var(--accent-trumpet)', size = 130) {
    const [v1, v2, v3] = fingeringState;
    const positions = [v1, v2, v3];
    const casingX = [34, 65, 96];
    const casingTop = 50, casingH = 110, casingW = 26;

    let svg = `<svg viewBox="0 0 130 200" width="${size}" height="${size * 200 / 130}" xmlns="http://www.w3.org/2000/svg">`;

    // Connecting leadpipe hint
    svg += `<line x1="10" y1="${casingTop + 14}" x2="120" y2="${casingTop + 14}" stroke="${INK_DIM}" stroke-width="6" stroke-linecap="round"/>`;

    positions.forEach((pressed, i) => {
      const x = casingX[i];
      // Casing
      svg += `<rect x="${x - casingW/2}" y="${casingTop}" width="${casingW}" height="${casingH}" rx="13" fill="${HOUSING}" stroke="${HOUSING_EDGE}" stroke-width="1.5"/>`;
      // Button (moves down + fills when pressed)
      const buttonY = pressed ? casingTop + 30 : casingTop + 8;
      svg += `<circle cx="${x}" cy="${buttonY}" r="13" fill="${pressed ? accentColor : OPEN}" stroke="${accentColor}" stroke-width="2.5"/>`;
      // Valve number label
      svg += `<text x="${x}" y="${casingTop + casingH + 22}" font-size="13" font-weight="700" fill="${INK_DIM}" text-anchor="middle">${i + 1}</text>`;
    });

    svg += `</svg>`;
    return svg;
  }

  // ── WOODWIND KEY DIAGRAM (flute, clarinet, sax, oboe, bassoon) ──────────
  // Simplified key pads on a tube — same visual language as recorder but with
  // a distinct label and smaller "key" circles to suggest pads not holes.
  function woodwindFingeringSVG(fingeringState, accentColor = 'var(--accent-flute)', size = 130, instrument = 'clarinet') {
    const [thumb, h1, h2, h3, h4, h5, h6, h7, extra, extra2, sideKey, lhp2, rthumb, rp2, halfHole] = fingeringState;
    const cx = 65;
    const tubeTop = 18, tubeBottom = 215, tubeW = 30;
    const allKeys = [h1, h2, h3, h4, h5, h6, h7];
    const keyYs = [62, 84, 106, 132, 154, 176, 198]; // h1..h7

    const BODY = { clarinet: '#23232B', saxophone: '#C9A227', oboe: '#3B2F2F', bassoon: '#8B6D3B' }[instrument] || HOUSING;
    const BODY_EDGE = { clarinet: '#555', saxophone: '#7A5A10', oboe: '#1F1A1A', bassoon: '#4A3517' }[instrument] || HOUSING_EDGE;
    let svg = `<svg viewBox="0 0 130 230" width="${size}" height="${size * 230 / 130}" xmlns="http://www.w3.org/2000/svg">`;

    // Instrument-specific top/bottom silhouettes
    if (instrument === 'bassoon') {
      // crook: curved tube at the top
      svg += `<path d="M ${cx - 20} ${tubeTop + 4} Q ${cx - 6} ${tubeTop - 12} ${cx + 14} ${tubeTop - 2} Q ${cx + 22} ${tubeTop + 6} ${cx + 12} ${tubeTop + 16}" stroke="#C9C9C9" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    } else if (instrument === 'saxophone') {
      // sax neck hook
      svg += `<path d="M ${cx + 14} ${tubeTop + 2} Q ${cx + 24} ${tubeTop + 2} ${cx + 24} ${tubeTop + 14}" stroke="#7A5A10" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    } else if (instrument === 'oboe') {
      // double reed (pointed)
      svg += `<path d="M ${cx - 6} ${tubeTop + 12} L ${cx} ${tubeTop - 2} L ${cx + 6} ${tubeTop + 12} Z" fill="#1F1A1A" stroke="#555" stroke-width="1"/>`;
    } else {
      // Clarinet beak (angled mouthpiece)
      svg += `<polygon points="${cx - 14},${tubeTop + 14} ${cx + 14},${tubeTop + 14} ${cx + 10},${tubeTop - 2} ${cx - 10},${tubeTop - 2}" fill="#111" stroke="#555" stroke-width="1.2"/>`;
      svg += `<rect x="${cx - 11}" y="${tubeTop + 8}" width="22" height="4" rx="1" fill="#888" stroke="#555" stroke-width="0.8"/>`;
    }

    // Tube body — shape varies by instrument (not a generic rectangle)
    if (instrument === 'oboe') {
      // conical bore: narrower at the top
      svg += `<polygon points="${cx - 11},${tubeTop + 12} ${cx + 11},${tubeTop + 12} ${cx + 16},${tubeBottom - 4} ${cx - 16},${tubeBottom - 4}" fill="${BODY}" stroke="${BODY_EDGE}" stroke-width="1.5"/>`;
    } else if (instrument === 'bassoon') {
      // folded body: long joint + bass joint side by side, joined at the boot
      svg += `<rect x="${cx - 4}" y="${tubeTop + 12}" width="18" height="${tubeBottom - tubeTop - 12}" rx="8" fill="${BODY}" stroke="${BODY_EDGE}" stroke-width="1.5"/>`;
      svg += `<rect x="${cx - 20}" y="${tubeTop + 30}" width="16" height="${tubeBottom - tubeTop - 34}" rx="8" fill="${BODY}" stroke="${BODY_EDGE}" stroke-width="1.5"/>`;
    } else if (instrument === 'saxophone') {
      // straight top, bow curving at the bottom
      svg += `<rect x="${cx - tubeW/2}" y="${tubeTop + 12}" width="${tubeW}" height="150" rx="10" fill="${BODY}" stroke="${BODY_EDGE}" stroke-width="1.5"/>`;
      svg += `<path d="M ${cx - tubeW/2} 180 L ${cx + tubeW/2} 180 Q ${cx + tubeW/2 + 8} 200 ${cx + 4} ${tubeBottom + 8} Q ${cx - 24} ${tubeBottom + 8} ${cx - 22} 195 L ${cx - tubeW/2} 180 Z" fill="${BODY}" stroke="${BODY_EDGE}" stroke-width="1.5"/>`;
    } else {
      svg += `<rect x="${cx - tubeW/2}" y="${tubeTop + 12}" width="${tubeW}" height="${tubeBottom - tubeTop - 12}" rx="10" fill="${BODY}" stroke="${BODY_EDGE}" stroke-width="1.5"/>`;
    }

    // Bottom silhouettes: bell / curved sax body / oboe bell / bassoon boot
    if (instrument === 'clarinet') {
      svg += `<polygon points="${cx - 15},${tubeBottom - 4} ${cx + 15},${tubeBottom - 4} ${cx + 24},${tubeBottom + 10} ${cx - 24},${tubeBottom + 10}" fill="${BODY}" stroke="${BODY_EDGE}" stroke-width="1.5"/>`;
    } else if (instrument === 'saxophone') {
      svg += `<polygon points="${cx - 22},${tubeBottom + 2} ${cx + 28},${tubeBottom + 2} ${cx + 34},${tubeBottom + 14} ${cx - 28},${tubeBottom + 14}" fill="${BODY}" stroke="${BODY_EDGE}" stroke-width="1.5"/>`;
    } else if (instrument === 'oboe') {
      svg += `<polygon points="${cx - 16},${tubeBottom - 4} ${cx + 16},${tubeBottom - 4} ${cx + 22},${tubeBottom + 10} ${cx - 22},${tubeBottom + 10}" fill="${BODY}" stroke="${BODY_EDGE}" stroke-width="1.5"/>`;
    } else if (instrument === 'bassoon') {
      svg += `<path d="M ${cx - 15} ${tubeBottom - 4} Q ${cx} ${tubeBottom + 10} ${cx + 15} ${tubeBottom - 4}" stroke="#C9C9C9" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    }

    // Joint lines (decorative, suggests upper/middle/lower joint)
    svg += `<line x1="${cx - tubeW/2}" y1="70" x2="${cx + tubeW/2}" y2="70" stroke="#C9C9C9" stroke-width="1.5"/>`;
    svg += `<line x1="${cx - tubeW/2}" y1="188" x2="${cx + tubeW/2}" y2="188" stroke="#C9C9C9" stroke-width="1.5"/>`;

    // Register / octave key — offset right, mirrored with the thumb so the two
    // side keys read as a pair.
    // All keys the instrument actually has are always drawn (greyed when not
    // in use) so students recognise the full mechanism from day one; only
    // the keys in the current fingering are highlighted.
    const AUX_SHOW = { clarinet: [8, 9, 10], saxophone: [8, 9, 11, 13], oboe: [8, 9, 11, 13, 14], bassoon: [8, 12, 14] }[instrument] || [8];
    const showIdx = (idx) => AUX_SHOW.includes(idx) || fingeringState[idx] !== undefined;
    if (showIdx(8)) {
      const exX = cx + tubeW/2 + 22, exY = 46;
      svg += `<line x1="${cx + tubeW/2 + 2}" y1="${exY}" x2="${exX - 13}" y2="${exY}" stroke="${INK_DIM}" stroke-width="1" stroke-dasharray="2,2"/>`;
      const regLabel = (instrument === 'saxophone' || instrument === 'oboe') ? '8va' : 'R';
      svg += labeledKey(exX, exY, 13, !!extra, accentColor, regLabel);
    }

    // Thumb / whisper key (offset left of tube)
    {
      const thX = cx - tubeW/2 - 22, thY = 46;
      svg += `<line x1="${cx - tubeW/2 - 2}" y1="${thY}" x2="${thX + 13}" y2="${thY}" stroke="${INK_DIM}" stroke-width="1" stroke-dasharray="2,2"/>`;
      svg += labeledKey(thX, thY, 13, thumb, accentColor, 'TH');
    }

    // Auxiliary little-finger / resonance key (extra2) — offset right, lower.
    // Used by clarinet clarion (left little finger) and oboe F4 (resonance key).
    if (showIdx(9)) {
      const ex2X = cx + tubeW/2 + 22, ex2Y = keyYs[6];
      svg += `<line x1="${cx + tubeW/2 + 2}" y1="${ex2Y}" x2="${ex2X - 12}" y2="${ex2Y}" stroke="${INK_DIM}" stroke-width="1" stroke-dasharray="2,2"/>`;
      svg += labeledKey(ex2X, ex2Y, 12, !!extra2, accentColor, 'L');
    }

    // Top side key (sideKey) — offset left at h2's height. Clarinet A/G# throat
    // key, worked by the left index finger.
    if (showIdx(10)) {
      const skX = cx - tubeW/2 - 22, skY = keyYs[2];
      svg += `<line x1="${cx - tubeW/2 - 2}" y1="${skY}" x2="${skX + 11}" y2="${skY}" stroke="${INK_DIM}" stroke-width="1" stroke-dasharray="2,2"/>`;
      svg += labeledKey(skX, skY, 11, !!sideKey, accentColor, 'A');
    }

    // Second left little-finger key (lhp2) — offset left, lower. Used when the
    // standard left-pinky key is not enough (sax/oboe low B or Bb).
    if (showIdx(11)) {
      const lpX = cx - tubeW/2 - 22, lpY = keyYs[5];
      svg += `<line x1="${cx - tubeW/2 - 2}" y1="${lpY}" x2="${lpX + 11}" y2="${lpY}" stroke="${INK_DIM}" stroke-width="1" stroke-dasharray="2,2"/>`;
      svg += labeledKey(lpX, lpY, 11, !!lhp2, accentColor, 'L2');
    }

    // Right-thumb key (rthumb) — offset right at h2's height. Bassoon right-thumb
    // keys (low Bb, F#, G#), worked by the right thumb.
    if (showIdx(12)) {
      const rtX = cx + tubeW/2 + 22, rtY = keyYs[2];
      svg += `<line x1="${cx + tubeW/2 + 2}" y1="${rtY}" x2="${rtX - 11}" y2="${rtY}" stroke="${INK_DIM}" stroke-width="1" stroke-dasharray="2,2"/>`;
      svg += labeledKey(rtX, rtY, 11, !!rthumb, accentColor, 'RT');
    }

    // Second right little-finger key (rp2, the low E-flat key) — offset right,
    // lower. The right pinky works two keys (a "C" key and the E-flat key), so
    // a low E-flat stays distinct from the low C that shares the same pinky.
    if (rp2 !== undefined) {
      const rpX = cx + tubeW/2 + 22, rpY = keyYs[4];
      svg += `<line x1="${cx + tubeW/2 + 2}" y1="${rpY}" x2="${rpX - 11}" y2="${rpY}" stroke="${INK_DIM}" stroke-width="1" stroke-dasharray="2,2"/>`;
      svg += labeledKey(rpX, rpY, 11, rp2, accentColor, 'Eb');
    }

    // Hand divider between left-hand (1-3) and right-hand (4-7) keys
    {
      const divY = (keyYs[2] + keyYs[3]) / 2;
      svg += `<line x1="${cx - tubeW/2 - 26}" y1="${divY}" x2="${cx + tubeW/2 + 26}" y2="${divY}" stroke="${INK_DIM}" stroke-width="1" stroke-dasharray="4,3"/>`;
      svg += `<text x="${cx - tubeW/2 - 28}" y="${divY + 3}" font-size="7" font-weight="700" fill="${INK_DIM}" text-anchor="middle">L</text>`;
      svg += `<text x="${cx + tubeW/2 + 28}" y="${divY + 3}" font-size="7" font-weight="700" fill="${INK_DIM}" text-anchor="middle">R</text>`;
    }

    // Finger keys 1-7 down the tube — metallic key cups: silver rim,
    // dark pad when open, accent fill when pressed. `halfHole` draws the
    // top key as half-covered (a vent), which no filled/open pad can express.
    allKeys.forEach((pressed, i) => {
      const y = keyYs[i];
      const r = i < 3 ? 9 : 7.5;
      const rimFill = pressed ? accentColor : '#C8C8C8';
      const padFill = pressed ? accentColor : '#3A3A3A';
      svg += `<circle cx="${cx}" cy="${y}" r="${r}" fill="${rimFill}" stroke="#333" stroke-width="1.2"/>`;
      svg += `<ellipse cx="${cx}" cy="${y - r * 0.28}" rx="${r * 0.55}" ry="${r * 0.32}" fill="#fff" opacity="0.35"/>`;
      svg += `<circle cx="${cx}" cy="${y}" r="${r * 0.55}" fill="${padFill}" stroke="#111" stroke-width="0.8"/>`;
      if (i === 0 && halfHole) {
        svg += `<path d="M ${cx} ${y - r} A ${r} ${r} 0 0 0 ${cx} ${y + r} Z" fill="${accentColor}" stroke="${accentColor}" stroke-width="2.5" class="fingering-key" data-action="fingering-key" data-key="HALF"/>`;
      }
    });

    svg += `</svg>`;
    return svg;
  }

  // ── FLUTE FINGERING DIAGRAM (transverse — drawn horizontally) ───────────
  // Unlike the other woodwinds the flute is held sideways, so its diagram is
  // horizontal: embouchure at the left, keys across the body, thumb Bb lever
  // hanging below. (The flute data never uses the generic register/little-
  // finger slots, so they are not drawn here.)
  // Full Boehm (closed-G#) flute, player perspective.
  // fingeringState = [Thumb(Bb lever), L1, L2, L3, R1, R2, R3, C-foot, Eb]
  // G#, C#, B lever and trill keys have no separate state in the curriculum,
  // so they are drawn for completeness in their usual resting state (open)
  // for these beginner notes — band directors can still identify each key.
  function fluteFingeringSVG(fingeringState, accentColor = 'var(--accent-flute)', size = 130) {
    const [thumb, h1, h2, h3, h4, h5, h6, h7, rp2] = fingeringState || [];
    const tubeY = 62, tubeH = 24, tubeLeft = 16, tubeRight = 250;
    const midY = tubeY + tubeH / 2;
    // Main tone holes: L1 L2 L3 | R1 R2 R3
    const L = [88, 110, 132], R = [162, 184, 206];
    const mainXs = [...L, ...R];
    const mainStates = [h1, h2, h3, h4, h5, h6];

    let svg = `<svg viewBox="0 0 280 130" width="${size}" height="${size * 130 / 280}" xmlns="http://www.w3.org/2000/svg">`;

    // Body tube (head + body + foot joints)
    svg += `<rect x="${tubeLeft}" y="${tubeY}" width="${tubeRight - tubeLeft}" height="${tubeH}" rx="${tubeH / 2}" fill="${HOUSING}" stroke="${HOUSING_EDGE}" stroke-width="1.5"/>`;
    svg += `<line x1="70" y1="${tubeY}" x2="70" y2="${tubeY + tubeH}" stroke="${INK_DIM}" stroke-width="1.5"/>`;
    svg += `<line x1="196" y1="${tubeY}" x2="196" y2="${tubeY + tubeH}" stroke="${INK_DIM}" stroke-width="1.5"/>`;
    // Crown (left end cap)
    svg += `<path d="M${tubeLeft} ${tubeY + 2} Q${tubeLeft - 8} ${midY} ${tubeLeft} ${tubeY + tubeH - 2}" stroke="${INK_DIM}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    // Embouchure / lip plate
    svg += `<ellipse cx="44" cy="${midY}" rx="12" ry="8" fill="${HOUSING}" stroke="${INK_DIM}" stroke-width="1.5"/>`;
    svg += `<ellipse cx="44" cy="${midY}" rx="5" ry="3" fill="${OPEN}"/>`;

    // ── Thumb levers (B natural + Bb lever, the TH key) ──
    // B lever: small key above the tube near the head; TH (Bb): below.
    const bX = 60, thX = 66;
    svg += `<line x1="${bX}" y1="${tubeY}" x2="${bX}" y2="${tubeY - 14}" stroke="${INK_DIM}" stroke-width="1"/>`;
    svg += labeledKey(bX, tubeY - 20, 7, false, accentColor, 'B');
    svg += `<line x1="${thX}" y1="${tubeY + tubeH}" x2="${thX}" y2="${tubeY + tubeH + 12}" stroke="${INK_DIM}" stroke-width="1" stroke-dasharray="2,2"/>`;
    svg += labeledKey(thX, tubeY + tubeH + 20, 10, thumb, accentColor, 'TH');

    // ── Left-hand main holes 1-3 + G# key ──
    mainStates.forEach((pressed, i) => {
      const x = mainXs[i], r = i < 3 ? 10 : 8.5;
      svg += `<circle cx="${x}" cy="${midY}" r="${r}" fill="${pressed ? accentColor : OPEN}" stroke="${accentColor}" stroke-width="2.5"/>`;
    });
    // G# key: left pinky, sits above the tube just right of L3
    {
      const gx = 146;
      svg += `<line x1="${gx}" y1="${tubeY}" x2="${gx}" y2="${tubeY - 14}" stroke="${INK_DIM}" stroke-width="1"/>`;
      svg += labeledKey(gx, tubeY - 20, 7, false, accentColor, 'G#');
    }
    // Bb trill: small key between L1 and L2 (above)
    {
      const tx = 99;
      svg += `<line x1="${tx}" y1="${tubeY}" x2="${tx}" y2="${tubeY - 9}" stroke="${INK_DIM}" stroke-width="1"/>`;
      svg += labeledKey(tx, tubeY - 15, 5, false, accentColor, 'Bb');
    }
    // D / D# trill keys between RH fingers (above)
    {
      const dX = 173, d2X = 195;
      svg += `<line x1="${dX}" y1="${tubeY}" x2="${dX}" y2="${tubeY - 9}" stroke="${INK_DIM}" stroke-width="1"/>`;
      svg += labeledKey(dX, tubeY - 15, 5, false, accentColor, 'D');
      svg += `<line x1="${d2X}" y1="${tubeY}" x2="${d2X}" y2="${tubeY - 9}" stroke="${INK_DIM}" stroke-width="1"/>`;
      svg += labeledKey(d2X, tubeY - 15, 5, false, accentColor, 'D#');
    }

    // ── Right-hand little-finger keys: Eb, C#, C ──
    // Eb (D#) key: below/right of R3
    if (rp2 !== undefined) {
      const ebX = 220, ebY = tubeY + tubeH + 18;
      svg += `<line x1="${ebX}" y1="${tubeY + tubeH}" x2="${ebX}" y2="${ebY - 9}" stroke="${INK_DIM}" stroke-width="1" stroke-dasharray="2,2"/>`;
      svg += labeledKey(ebX, ebY, 8, rp2, accentColor, 'Eb');
    }
    // Low C# key: just right of Eb, below the tube
    {
      const csX = 237, csY = tubeY + tubeH + 18;
      svg += `<line x1="${csX}" y1="${tubeY + tubeH}" x2="${csX}" y2="${csY - 9}" stroke="${INK_DIM}" stroke-width="1" stroke-dasharray="2,2"/>`;
      svg += labeledKey(csX, csY, 8, false, accentColor, 'C#');
    }
    // Low C foot key: at the far foot end, below the tube (h7 = C foot)
    {
      const cX = 252, cY = tubeY + tubeH + 18;
      svg += `<line x1="${cX}" y1="${tubeY + tubeH}" x2="${cX}" y2="${cY - 9}" stroke="${INK_DIM}" stroke-width="1" stroke-dasharray="2,2"/>`;
      svg += labeledKey(cX, cY, 8, h7, accentColor, 'C');
    }

    // Foot joint hint (right end)
    svg += `<path d="M${tubeRight} ${tubeY + 2} Q${tubeRight + 10} ${midY} ${tubeRight} ${tubeY + tubeH - 2}" stroke="${INK_DIM}" stroke-width="3" fill="none" stroke-linecap="round"/>`;

    svg += `</svg>`;
    return svg;
  }

  // ── TROMBONE SLIDE POSITION DIAGRAM ──────────────────────────────────────
  // Draws the U-shaped slide with its two inner tubes and moving outer
  // slide. Positions 1-7 run from fully in to fully out; the current
  // position's outer slide is highlighted and a cue labels how far out
  // the slide is (3rd is just out, 4th is half out, 7th fully out — 1st
  // is all the way in, so no cue is needed there).
  function tromboneFingeringSVG(position, accentColor = 'var(--accent-trombone)', size = 130) {
    const tubeTop = 44, tubeBot = 56, tubeLeft = 18, slideBaseX = 78, slideMaxX = 122;
    const posCount = 7;
    const posSpacing = (slideMaxX - slideBaseX) / (posCount - 1);
    const posStart = slideBaseX;
    const pos = Math.max(1, Math.min(7, position || 1));
    const slideEnd = posStart + (pos - 1) * posSpacing;
    const cues = { 2: 'a touch out', 3: 'just out', 4: 'half out', 5: 'mostly out', 6: 'nearly out', 7: 'fully out' };
    const noteNames = { 1: 'B♭', 2: 'A', 3: 'A♭', 4: 'G', 5: 'G♭', 6: 'F', 7: 'E' };

    let svg = `<svg viewBox="0 0 140 110" width="${size}" height="${size * 110 / 140}" xmlns="http://www.w3.org/2000/svg">`;

    // Bell section (left) + mouthpiece
    svg += `<rect x="${tubeLeft - 10}" y="${tubeTop - 2}" width="10" height="6" rx="3" fill="${HOUSING_EDGE}"/>`;
    svg += `<line x1="${tubeLeft}" y1="${tubeTop}" x2="${slideBaseX + 6}" y2="${tubeTop}" stroke="${INK_DIM}" stroke-width="2.5"/>`;
    svg += `<line x1="${tubeLeft}" y1="${tubeBot}" x2="${slideBaseX + 6}" y2="${tubeBot}" stroke="${INK_DIM}" stroke-width="2.5"/>`;
    svg += `<path d="M${tubeLeft} ${tubeTop} Q${tubeLeft - 12} ${tubeTop - 10} ${tubeLeft - 12} ${tubeTop - 16} L ${tubeLeft - 12} ${tubeTop + 16} Q ${tubeLeft - 12} ${tubeTop + 20} ${tubeLeft} ${tubeBot} Z" fill="${HOUSING}" stroke="${INK_DIM}" stroke-width="1.5"/>`;

    // Stationary inner slide tubes (fixed)
    svg += `<line x1="${slideBaseX}" y1="${tubeTop}" x2="${slideMaxX + 6}" y2="${tubeTop}" stroke="${INK_DIM}" stroke-width="2" stroke-dasharray="3,2"/>`;
    svg += `<line x1="${slideBaseX}" y1="${tubeBot}" x2="${slideMaxX + 6}" y2="${tubeBot}" stroke="${INK_DIM}" stroke-width="2" stroke-dasharray="3,2"/>`;

    // Moving outer slide (U-shape) — highlighted up to the current position
    svg += `<line x1="${slideBaseX}" y1="${tubeTop}" x2="${slideEnd}" y2="${tubeTop}" stroke="${accentColor}" stroke-width="4"/>`;
    svg += `<line x1="${slideBaseX}" y1="${tubeBot}" x2="${slideEnd}" y2="${tubeBot}" stroke="${accentColor}" stroke-width="4"/>`;
    svg += `<path d="M${slideEnd} ${tubeTop} Q${slideEnd + 12} ${(tubeTop + tubeBot) / 2} ${slideEnd} ${tubeBot}" stroke="${accentColor}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    svg += `<line x1="${slideBaseX + 8}" y1="${tubeTop}" x2="${slideBaseX + 8}" y2="${tubeBot}" stroke="${accentColor}" stroke-width="2"/>`;

    // Position ruler + numbers + note cues
    for (let i = 1; i <= posCount; i++) {
      const x = posStart + (i - 1) * posSpacing;
      const isActive = i === pos;
      svg += `<line x1="${x}" y1="68" x2="${x}" y2="74" stroke="${isActive ? accentColor : INK_DIM}" stroke-width="${isActive ? 2 : 1}"/>`;
      svg += `<circle cx="${x}" cy="80" r="${isActive ? 8 : 6.5}" fill="${isActive ? accentColor : OPEN}" stroke="${isActive ? '#fff' : INK_DIM}" stroke-width="1"/>`;
      svg += `<text x="${x}" y="84" font-size="8" font-weight="${isActive ? '800' : '600'}" fill="${isActive ? '#fff' : INK_DIM}" text-anchor="middle">${i}</text>`;
      svg += `<text x="${x}" y="95" font-size="7" fill="${isActive ? accentColor : INK_DIM}" text-anchor="middle" font-weight="600">${noteNames[i]}</text>`;
      if (i === pos && cues[i]) {
        svg += `<text x="${x}" y="104" font-size="7" font-weight="700" fill="${accentColor}" text-anchor="middle">${cues[i]}</text>`;
      }
    }

    svg += `</svg>`;
    return svg;
  }

  // ── GLOCKENSPIEL FINGERING (top-down, like the real instrument) ───────
  // Top-down view: wooden case, naturals in the front (longer, silver),
  // sharps/flats behind (shorter, darker steel), low C on the left,
  // high C on the right, pins visible. highlightIdx marks natural bar
  // 0 = low C … 7 = high C. No resonators (glockenspiels don't have them).
  function glockenspielFingeringSVG(fingeringState, accentColor = 'var(--accent-warm)', size = 130, highlightIdx = -1) {
    const [left, right] = fingeringState || [true, false];
    const hand = right ? 'R' : 'L';
    const cx = 65;
    // Lessons still teach C → C (degree 1..8), but the instrument's lowest
    // physical bar is F, so the diagram runs F → F. Remap the highlight
    // so degree 1 (C) lands on the C bar (5th from the left), etc.
    const DEGREE_TO_BAR = { 1: 4, 2: 5, 3: 6, 4: 0, 5: 1, 6: 2, 7: 3, 8: 4 };
    const barIdx = (highlightIdx >= 0 && highlightIdx <= 7)
      ? (DEGREE_TO_BAR[highlightIdx + 1] ?? highlightIdx) : -1;
    let svg = `<svg viewBox="0 0 130 130" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">`;
    // Wooden case (light oak, like the photo)
    svg += `<rect x="4" y="16" width="122" height="88" rx="7" fill="#D9B380" stroke="#8A5A2B" stroke-width="1.4"/>`;
    // Inner recess
    svg += `<rect x="9" y="21" width="112" height="78" rx="4" fill="#E8CFA8" stroke="#8A5A2B" stroke-width="1"/>`;
    // Front row: 12 natural bars. Lowest physical bar = F (left);
    // highest = C (right), about two octaves up the instrument. No resonators.
    const noteNames = ['F','G','A','B','C','D','E','F','G','A','B','C'];
    const natW = 7, natGap = 1.6, natX0 = 12, natY = 52, natH = 44;
    for (let i = 0; i < noteNames.length; i++) {
      const x = natX0 + i * (natW + natGap);
      const isHl = barIdx === i;
      const fill = isHl ? '#F2C24E' : '#D8D8DC';
      const stroke = isHl ? '#8A6D1B' : '#55514A';
      const sw = isHl ? 2.2 : 1.1;
      svg += `<rect x="${x}" y="${natY}" width="${natW}" height="${natH}" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
      // centre groove + pegs
      svg += `<line x1="${x + natW / 2}" y1="${natY + 4}" x2="${x + natW / 2}" y2="${natY + natH - 4}" stroke="#9B978F" stroke-width="1"/>`;
      svg += `<circle cx="${x + natW / 2}" cy="${natY + 6}" r="1.6" fill="#2B2B2B"/><circle cx="${x + natW / 2}" cy="${natY + natH - 6}" r="1.6" fill="#2B2B2B"/>`;
      svg += `<text x="${x + natW / 2}" y="${natY + natH + 10}" font-size="7" font-weight="${isHl ? '800' : '700'}" fill="${isHl ? '#111' : '#3E2412'}" text-anchor="middle" font-family="var(--pauta-font-sans),sans-serif">${noteNames[i]}${i === 7 ? '′' : ''}</text>`;
    }
    // Back row: accidental bars sitting *between* naturals in the gap.
    // Narrower than the gap so they read as in-between, e.g. C♯ between C
    // and D (natural index 4), D♯ between D and E (index 5).
    const accW = 5.5, accY = 26, accH = 26;
    const accStarts = [0, 1, 2, 4, 5, 7, 8, 9]; // F# G# A# C# D# F# G# A#
    const accNames = ['F♯','G♯','A♯','C♯','D♯','F♯','G♯','A♯'];
    for (let k = 0; k < accStarts.length; k++) {
      const i = accStarts[k];
      // Centre the sharp bar in the gap between natural i and i+1.
      const gapCenter = natX0 + i * (natW + natGap) + natW + natGap / 2;
      const x = gapCenter - accW / 2;
      svg += `<rect x="${x}" y="${accY}" width="${accW}" height="${accH}" rx="2" fill="#6E6A68" stroke="#24211D" stroke-width="1"/>`;
      svg += `<circle cx="${gapCenter}" cy="${accY + 5}" r="1.2" fill="#24211D"/><circle cx="${gapCenter}" cy="${accY + accH - 5}" r="1.2" fill="#24211D"/>`;
      svg += `<text x="${gapCenter}" y="${accY - 3}" font-size="5.5" font-weight="700" fill="#3E2412" text-anchor="middle" font-family="var(--pauta-font-sans),sans-serif">${accNames[k]}</text>`;
    }
    // mallet points at the highlighted bar (or centre if none); handle below
    const hlX = (barIdx >= 0 && barIdx < noteNames.length) ? natX0 + barIdx * (natW + natGap) + natW / 2 : cx;
    const malletX = hand === 'R' ? cx + 18 : cx - 18;
    svg += `<line x1="${cx}" y1="118" x2="${malletX}" y2="${natY + 22}" stroke="${accentColor}" stroke-width="2.5" stroke-linecap="round"/>`;
    svg += `<circle cx="${hlX}" cy="${natY + 22}" r="5" fill="${accentColor}" stroke="#fff" stroke-width="1.5"/>`;
    // Hand indicator circle
    svg += `<circle cx="${cx}" cy="118" r="10" fill="${accentColor}" />`;
    svg += `<text x="${cx}" y="122" font-size="11" font-weight="700" fill="#fff" text-anchor="middle">${hand}</text>`;
    svg += `</svg>`;
    return svg;
  }

  // ── SNARE DRUM FINGERING (stick hands) ──────────────────────────────────
  function snareFingeringSVG(fingeringState, accentColor = 'var(--accent-warm)', size = 130) {
    const [left, right] = fingeringState || [true, false];
    const hand = right ? 'R' : 'L';
    const cx = 65;
    let svg = `<svg viewBox="0 0 130 130" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">`;
    // Snare drum (circle)
    svg += `<ellipse cx="${cx}" cy="55" rx="42" ry="14" fill="#21204A" stroke="#524F70" stroke-width="2"/>`;
    svg += `<ellipse cx="${cx}" cy="50" rx="42" ry="14" fill="#161530" stroke="${accentColor}" stroke-width="2"/>`;
    // Stick (hand indicator)
    svg += `<line x1="${cx - 10}" y1="20" x2="${cx}" y2="48" stroke="${accentColor}" stroke-width="3" stroke-linecap="round"/>`;
    svg += `<circle cx="${cx}" cy="95" r="20" fill="${accentColor}" />`;
    svg += `<text x="${cx}" y="102" font-size="18" font-weight="700" fill="#fff" text-anchor="middle">${hand}</text>`;
    svg += `<text x="${cx}" y="126" font-size="9" fill="#8986A8" text-anchor="middle" font-weight="600">HAND</text>`;
    svg += `</svg>`;
    return svg;
  }

  function fingeringSVG(fingeringType, fingeringState, accentColor, size = 130, highlightIdx = -1) {
    if (fingeringType === 'recorder') return recorderFingeringSVG(fingeringState, accentColor, size);
    if (fingeringType === 'trombone') return tromboneFingeringSVG(fingeringState, accentColor, size);
    if (fingeringType === 'flute') return fluteFingeringSVG(fingeringState, accentColor, size * 1.15);
    if (fingeringType === 'glockenspiel') return glockenspielFingeringSVG(fingeringState, accentColor, size, highlightIdx);
    if (fingeringType === 'snare') return snareFingeringSVG(fingeringState, accentColor, size);
    if (['clarinet', 'saxophone', 'oboe', 'bassoon'].includes(fingeringType)) {
      return woodwindFingeringSVG(fingeringState, accentColor, size * 1.15, fingeringType);
    }
    return valveFingeringSVG(fingeringState, accentColor, size);
  }

  // ── INSTRUMENT ICON SET (home screen) ───────────────────────────────────
  // Consistent line-icon language: currentColor stroke, 64x64 viewBox.
  function instrumentIconSVG(id, size = 56) {
    const s = (inner) => `<svg viewBox="0 0 64 64" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

    switch (id) {
      case 'soprano-recorder':
        return s(`
          <path d="M26 8 Q32 4 38 8 L40 18 L24 18 Z"/>
          <rect x="25" y="18" width="14" height="38" rx="5"/>
          <line x1="25" y1="28" x2="39" y2="28"/>
          <line x1="25" y1="46" x2="39" y2="46"/>
          <circle cx="32" cy="34" r="1.8" fill="currentColor"/>
          <circle cx="32" cy="40" r="1.8" fill="currentColor"/>
          <path d="M27 56 L30 60 M37 56 L34 60" />
        `);
      case 'flute':
        return s(`
          <rect x="6" y="27" width="46" height="9" rx="4.5"/>
          <ellipse cx="14" cy="31.5" rx="4" ry="5.5"/>
          <circle cx="14" cy="31.5" r="1.4" fill="currentColor"/>
          <circle cx="26" cy="31.5" r="1.6" fill="currentColor"/>
          <circle cx="36" cy="31.5" r="1.6" fill="currentColor"/>
          <path d="M52 27 L58 31.5 L52 36 Z"/>
        `);
      case 'clarinet':
        return s(`
          <path d="M27 6 L34 10 L31 16 L26 14 Z"/>
          <rect x="25" y="16" width="13" height="40" rx="3"/>
          <line x1="25" y1="26" x2="38" y2="26"/>
          <line x1="25" y1="36" x2="38" y2="36"/>
          <line x1="25" y1="46" x2="38" y2="46"/>
          <path d="M25 56 L22 60 L41 60 L38 56 Z"/>
        `);
      case 'alto-saxophone':
        return s(`
          <path d="M22 8 Q30 6 32 14 L34 38 Q34 50 24 50 Q16 50 17 42 Q18 36 26 38"/>
          <circle cx="22" cy="44" r="6.5"/>
          <circle cx="29" cy="20" r="1.6" fill="currentColor"/>
          <circle cx="31" cy="27" r="1.6" fill="currentColor"/>
          <circle cx="32" cy="33" r="1.6" fill="currentColor"/>
        `);
      case 'oboe':
        return s(`
          <path d="M29 6 L33 9 L31 13 L28 12 Z"/>
          <rect x="27" y="13" width="9" height="42" rx="2.5"/>
          <line x1="27" y1="24" x2="36" y2="24"/>
          <line x1="27" y1="35" x2="36" y2="35"/>
          <line x1="27" y1="46" x2="36" y2="46"/>
          <path d="M27 55 L25 60 L38 60 L36 55 Z"/>
        `);
      case 'bassoon':
        return s(`
          <rect x="20" y="20" width="9" height="38" rx="2.5"/>
          <rect x="33" y="20" width="9" height="38" rx="2.5"/>
          <path d="M20 58 Q20 62 24.5 62 Q29 62 29 58"/>
          <path d="M33 58 Q33 62 37.5 62 Q42 62 42 58"/>
          <path d="M20 20 Q20 12 26 12"/>
          <path d="M38 20 L44 14 L48 8" stroke-width="2"/>
          <line x1="20" y1="32" x2="29" y2="32"/>
          <line x1="33" y1="44" x2="42" y2="44"/>
        `);
      case 'trumpet':
        return s(`
          <line x1="6" y1="32" x2="26" y2="32" stroke-width="4"/>
          <rect x="24" y="22" width="6" height="20" rx="2"/>
          <rect x="32" y="22" width="6" height="20" rx="2"/>
          <rect x="40" y="22" width="6" height="20" rx="2"/>
          <circle cx="27" cy="20" r="3" fill="currentColor"/>
          <circle cx="35" cy="20" r="3" fill="currentColor"/>
          <circle cx="43" cy="20" r="3" fill="currentColor"/>
          <path d="M46 28 L58 24 Q60 32 58 40 L46 36 Z"/>
          <path d="M14 32 Q14 24 20 24 Q26 24 26 32" stroke-width="3"/>
        `);
      case 'trombone':
        return s(`
          <line x1="6" y1="28" x2="34" y2="28" stroke-width="4"/>
          <line x1="10" y1="38" x2="34" y2="38" stroke-width="4"/>
          <line x1="10" y1="28" x2="10" y2="38"/>
          <path d="M34 24 Q44 24 44 33 Q44 42 34 42"/>
          <path d="M44 26 L57 22 Q59 33 57 44 L44 40 Z"/>
        `);
      case 'french-horn':
        return s(`
          <path d="M18 40 Q8 32 14 18 Q20 8 34 12 Q46 16 44 30 Q42 40 34 38" stroke-width="3" fill="none"/>
          <path d="M34 38 Q46 42 46 28 Q44 16 34 12" stroke-width="3" fill="none"/>
          <path d="M18 40 L10 46 L6 42" stroke-width="2.5" fill="none"/>
          <circle cx="22" cy="20" r="2.2" fill="currentColor"/>
          <circle cx="29" cy="16" r="2.2" fill="currentColor"/>
          <circle cx="36" cy="18" r="2.2" fill="currentColor"/>
        `);
      case 'euphonium':
        return s(`
          <path d="M14 44 Q14 26 30 26 Q44 26 44 40" stroke-width="3"/>
          <rect x="24" y="20" width="7" height="22" rx="2.5"/>
          <rect x="33" y="20" width="7" height="22" rx="2.5"/>
          <circle cx="27.5" cy="17" r="3" fill="currentColor"/>
          <circle cx="36.5" cy="17" r="3" fill="currentColor"/>
          <path d="M44 32 Q56 30 58 20 Q59 12 51 10" stroke-width="3"/>
        `);
      case 'tuba':
        return s(`
          <path d="M14 46 Q10 36 18 26 Q26 18 38 22 Q46 24 46 36" stroke-width="3.5" fill="none"/>
          <path d="M46 36 Q58 38 56 24 Q54 12 44 8" stroke-width="3.5" fill="none"/>
          <ellipse cx="14" cy="48" rx="7" ry="5" stroke-width="2.5" fill="none"/>
          <rect x="24" y="18" width="8" height="22" rx="3"/>
          <rect x="34" y="18" width="8" height="22" rx="3"/>
          <circle cx="28" cy="15" r="2.5" fill="currentColor"/>
          <circle cx="38" cy="15" r="2.5" fill="currentColor"/>
        `);
      case 'glockenspiel':
        return s(`
          <rect x="10" y="22" width="8" height="30" rx="2"/>
          <rect x="20" y="22" width="8" height="30" rx="2"/>
          <rect x="30" y="22" width="8" height="30" rx="2"/>
          <rect x="40" y="22" width="8" height="30" rx="2"/>
          <rect x="50" y="22" width="8" height="30" rx="2"/>
          <line x1="14" y1="14" x2="18" y2="22" stroke-width="2"/>
          <line x1="50" y1="14" x2="54" y2="22" stroke-width="2"/>
          <circle cx="16" cy="12" r="2.5" fill="currentColor"/>
          <circle cx="52" cy="12" r="2.5" fill="currentColor"/>
        `);
      case 'snare-drum':
        return s(`
          <ellipse cx="32" cy="36" rx="20" ry="8"/>
          <ellipse cx="32" cy="32" rx="20" ry="8" fill="none"/>
          <line x1="12" y1="36" x2="12" y2="44" stroke-width="2"/>
          <line x1="52" y1="36" x2="52" y2="44" stroke-width="2"/>
          <line x1="20" y1="18" x2="28" y2="32" stroke-width="2.5"/>
          <line x1="44" y1="18" x2="36" y2="32" stroke-width="2.5"/>
          <circle cx="20" cy="16" r="2" fill="currentColor"/>
          <circle cx="44" cy="16" r="2" fill="currentColor"/>
        `);
      default:
        return s(`<circle cx="32" cy="32" r="20"/>`);
    }
  }

  return { staffSVG, melodySVG, fingeringSVG, recorderFingeringSVG, fluteFingeringSVG, valveFingeringSVG, tromboneFingeringSVG, woodwindFingeringSVG, instrumentIconSVG, yForPos, ledgerPositions };
})();
