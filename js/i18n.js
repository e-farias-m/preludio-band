// i18n.js — Brazilian Portuguese translation layer for Preludio Band.
// Loaded before app.js. Exposes globals: LANG, TRANSLATIONS, t, setLang,
// getLang, initLang, applyI18nToDOM.

const LANG_STORAGE_KEY = 'preludioBandLang';

// Default language: browser locale (pt* -> 'pt', else 'en').
function detectDefaultLang() {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'pt' || saved === 'en' || saved === 'fr') return saved;
  } catch (e) {}
  try {
    const nav = (typeof navigator !== 'undefined' && (navigator.language || navigator.userLanguage)) || 'en';
    if (/^pt/i.test(nav)) return 'pt';
    if (/^fr/i.test(nav)) return 'fr';
  } catch (e) {}
  return 'en';
}

var LANG = detectDefaultLang();

// Translation tables. 'en' is identity (source strings). 'pt' holds PT-BR.
var TRANSLATIONS = { en: {}, pt: {}, fr: {} };

var NOTE_TO_SOLFEGE_PT = {
  'C': 'Dó', 'C#': 'Dó#', 'Cb': 'Sib', 'Db': 'Réb', 'D': 'Ré', 'D#': 'Ré#', 'Eb': 'Mib',
  'E': 'Mi', 'F': 'Fá', 'F#': 'Fá#', 'Gb': 'Solb', 'G': 'Sol', 'G#': 'Sol#', 'Ab': 'Láb',
  'A': 'Lá', 'A#': 'Lá#', 'Bb': 'Sib', 'B': 'Si'
};

function noteToSolfeggio(str) {
  if (typeof str !== 'string') return str;
  if (LANG === 'pt') {
    if (/^[A-G][#b]?$/.test(str.trim())) {
      return NOTE_TO_SOLFEGE_PT[str.trim()] || str;
    }
  }
  return str;
}

// User overrides
function getUserOverrides(lang) {
  try {
    const raw = localStorage.getItem(OVERRIDE_STORAGE_KEY + '_' + lang);
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}
function setUserOverride(lang, key, value) {
  try {
    const overrides = getUserOverrides(lang);
    if (value === null || value === '' || value === TRANSLATIONS[lang]?.[key]) {
      delete overrides[key];
    } else {
      overrides[key] = value;
    }
    localStorage.setItem(OVERRIDE_STORAGE_KEY + '_' + lang, JSON.stringify(overrides));
  } catch (e) {}
}
function clearUserOverrides(lang) {
  try { localStorage.removeItem(OVERRIDE_STORAGE_KEY + '_' + lang); } catch (e) {}
}

function t(str) {
  if (typeof str !== 'string') return str;
  const overrides = getUserOverrides(LANG);
  if (Object.prototype.hasOwnProperty.call(overrides, str)) {
    return overrides[str];
  }
  if (LANG === 'pt') {
    if (TRANSLATIONS.pt && Object.prototype.hasOwnProperty.call(TRANSLATIONS.pt, str)) {
      return TRANSLATIONS.pt[str];
    }
    const sol = noteToSolfeggio(str);
    if (sol !== str) return sol;
  }
  if (LANG === 'fr' && TRANSLATIONS.fr && Object.prototype.hasOwnProperty.call(TRANSLATIONS.fr, str)) {
    return TRANSLATIONS.fr[str];
  }
  return str;
}

function getLang() { return LANG; }
function setLang(lang) {
  if (lang !== 'pt' && lang !== 'en' && lang !== 'fr') return;
  LANG = lang;
  try { localStorage.setItem(LANG_STORAGE_KEY, lang); } catch (e) {}
  if (typeof render === 'function') render();
  applyI18nToDOM();
}
function initLang() {
  LANG = detectDefaultLang();
}

// Apply translations to static DOM nodes tagged with data-i18n.
function applyI18nToDOM() {
  try {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        const val = t(key);
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          if (el.placeholder !== undefined && el.getAttribute('data-i18n-attr') === 'placeholder') el.placeholder = val;
        } else {
          el.textContent = val;
        }
      }
    });

    if (LANG === 'pt') {
      ptTranslateSubtree(document.body);
    } else if (LANG === 'fr') {
      const dict = TRANSLATIONS[LANG] || {};
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
      const nodes = [];
      let node;
      while ((node = walker.nextNode())) {
        nodes.push(node);
      }
      nodes.forEach(textNode => {
        const parent = textNode.parentElement;
        if (!parent) return;
        const tag = parent.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return;
        const original = textNode.nodeValue;
        if (!original) return;
        const trimmed = original.trim();
        if (!trimmed) return;

        if (dict && Object.prototype.hasOwnProperty.call(dict, trimmed)) {
          textNode.nodeValue = original.replace(trimmed, dict[trimmed]);
          return;
        }

        if (LANG === 'pt') {
          const sol = noteToSolfeggio(trimmed);
          if (sol !== trimmed) {
            textNode.nodeValue = original.replace(trimmed, sol);
            return;
          }
        }

        let replaced = original;
        const keys = Object.keys(dict).sort((a, b) => b.length - a.length);
        keys.forEach(key => {
          if (key.length >= 2 && replaced.indexOf(key) !== -1) {
            const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const re = new RegExp('(?<![\\w])' + escaped + '(?![\\w])', 'g');
            replaced = replaced.replace(re, dict[key]);
          }
        });
        if (replaced !== original) {
          textNode.nodeValue = replaced;
        }
      });

      document.querySelectorAll('[title], [aria-label], [placeholder]').forEach(el => {
        ['title', 'aria-label', 'placeholder'].forEach(attr => {
          const val = el.getAttribute(attr);
          if (val && val.trim()) {
            const trimmed = val.trim();
            if (dict && Object.prototype.hasOwnProperty.call(dict, trimmed)) {
              el.setAttribute(attr, dict[trimmed]);
            } else if (dict) {
              let replaced = val;
              const keys = Object.keys(dict).sort((a, b) => b.length - a.length);
              keys.forEach(key => {
                if (key.length >= 2 && replaced.indexOf(key) !== -1) {
                  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                  const re = new RegExp('(?<![\\w])' + escaped + '(?![\\w])', 'g');
                  replaced = replaced.replace(re, dict[key]);
                }
              });
              if (replaced !== val) el.setAttribute(attr, replaced);
            }
          }
        });
      });
    }
  } catch (e) {}
}

TRANSLATIONS.pt = {
  "1st position (slide all the way in). Buzz a firm centred pitch.": "1ª posição (cancro totalmente recolhido). Buzz firme e centrado.",
  "1st position. Bb is the 4th partial — one octave above Bb2. Faster air, firmer buzz.": "1ª posição. Sib é o 4º parcial — uma oitava acima de Sib2. Ar mais rápido, buzz mais firme.",
  "1st position. F is the 3rd harmonic. Faster air than the low notes.": "1ª posição. Fá é o 3º harmônico. Ar mais rápido que as notas graves.",
  "2nd position (just past 1st). Small precise slide movement.": "2ª posição (logo após a 1ª). Movimento pequeno e preciso do cancro.",
  "3rd position (slide just past the bell rim). Steady air.": "3ª posição (cancro logo após a borda da campana). Ar estável.",
  "4th position (handle aligns with bell rim). Listen for a clear pitch.": "4ª posição (alça alinhada com a borda da campana). Ouça um som claro.",
  "4th position. G is the 4th partial. Keep the air speed up.": "4ª posição. Sol é o 4º parcial. Mantenha a velocidade do ar.",
  "6th position (slide well past the bell rim). Keep the buzz steady.": "6ª posição (cancro bem além da borda da campana). Mantenha o buzz estável.",
  "A bright fanfare using all eight notes of your first octave — C to C.": "Um fanfarra brilhante usando todas as oito notas da sua primeira oitava — Dó a Dó.",
  "A bright fanfare using all eight notes of your first octave — F to F.": "Um fanfarra brilhante usando todas as oito notas da sua primeira oitava — Fá a Fá.",
  "A classic English nursery rhyme using C, D, and E — your first three chalumeau notes.": "Uma cantiga de roda inglesa usando Dó, Ré e Mi — suas três primeiras notas do chalumeau.",
  "A classic English nursery rhyme using D, C, and Bb — sliding between 4th, 6th, and 1st positions.": "Uma cantiga de roda inglesa usando Ré, Dó e Sib — deslizando entre as 4ª, 6ª e 1ª posições.",
  "A classic English nursery rhyme using D, C, and Bb — the first three notes of your scale, below the staff.": "Uma cantiga de roda inglesa usando Ré, Dó e Sib — as três primeiras notas da sua escala, abaixo da pauta.",
  "A classic English nursery rhyme using D, C, and Bb — the first three notes of your scale.": "Uma cantiga de roda inglesa usando Ré, Dó e Sib — as três primeiras notas da sua escala.",
  "A classic English nursery rhyme using E, D, and C — the first three notes of your scale.": "Uma cantiga de roda inglesa usando Mi, Ré e Dó — as três primeiras notas da sua escala.",
  "A classic English nursery rhyme using E, D, and C — your first three alto sax notes.": "Uma cantiga de roda inglesa usando Mi, Ré e Dó — suas três primeiras notas do saxofone alto.",
  "A classic English nursery rhyme using E, D, and C — your first three bassoon notes.": "Uma cantiga de roda inglesa usando Mi, Ré e Dó — suas três primeiras notas do fagote.",
  "A classic English nursery rhyme using E, D, and C — your first three flute notes.": "Uma cantiga de roda inglesa usando Mi, Ré e Dó — suas três primeiras notas da flauta.",
  "A classic English nursery rhyme using E, D, and C — your first three oboe notes.": "Uma cantiga de roda inglesa usando Mi, Ré e Dó — suas três primeiras notas do oboé.",
  "A classic melody using A, G, and F — the first three notes of your scale with valves.": "Uma melodia clássica usando Lá, Sol e Fá — as três primeiras notas da sua escala com válvulas.",
  "A flat sitting a whole step below your tonic.": "Uma nota alterada (bemol) um tom abaixo da sua tônica.",
  "A grounding melody connecting all your notes across the octave.": "Uma melodia de base conectando todas as suas notas ao longo da oitava.",
  "A half-step above the 4th degree.": "Um semitom acima do 4º grau.",
  "A key (left index side key). Thumb off. All other keys open.": "Uma tecla (tecla lateral do indicador esquerdo). Polegar solto. Demais teclas abertas.",
  "A lowered third colours the tonic.": "Uma terça menor colore a tônica.",
  "A melodic phrase connecting all your slide positions.": "Uma frase melódica conectando todas as suas posições do cancro.",
  "A melodic phrase connecting all your valve combinations.": "Uma frase melódica conectando todas as suas combinações de válvulas.",
  "A melodic phrase connecting every note of the full octave.": "Uma frase melódica conectando cada nota da oitava completa.",
  "A melodic phrase connecting every note of your alto sax octave.": "Uma frase melódica conectando cada nota da sua oitava de saxofone alto.",
  "A melodic phrase connecting every note of your bassoon octave.": "Uma frase melódica conectando cada nota da sua oitava de fagote.",
  "A melodic phrase connecting every note of your flute octave.": "Uma frase melódica conectando cada nota da sua oitava de flauta.",
  "A melodic phrase connecting every note of your oboe octave.": "Uma frase melódica conectando cada nota da sua oitava de oboé.",
  "A raised note alternating with your tonic.": "Uma nota elevada alternando com a sua tônica.",
  "A short warm-up on your very first note. Relax and keep the tone steady!": "Um aquecimento curto na sua primeira nota. Relaxe e mantenha o som estável!",
  "A traditional folk melody that steps up and down your first five notes.": "Uma melodia folclórica tradicional que sobe e desce suas cinco primeiras notas.",
  "A two-note song that steps from your first note to your second and back.": "Uma canção de duas notas que vai da sua primeira nota à segunda e volta.",
  "A — 2nd position. Just past 1st.": "Lá — 2ª posição. Logo após a 1ª.",
  "A — left index and middle fingers. No octave key needed.": "Lá — indicador e médio da mão esquerda. Sem chave de oitava.",
  "A — lift your left ring finger. Just first two fingers.": "Lá — levante o anelar esquerdo. Apenas os dois primeiros dedos.",
  "A — lift your left ring finger. Just thumb and first two left fingers plus Eb key.": "Lá — levante o anelar esquerdo. Apenas polegar e os dois primeiros dedos da esquerda mais a tecla de Mib.",
  "A — top A side key with left index.": "Lá — tecla lateral superior de Lá com o indicador esquerdo.",
  "A — whisper key off, left hand down with right index and middle fingers.": "Lá — chave de sussurro desligada, mão esquerda apoiada com indicador e médio da mão direita.",
  "An arpeggio reaching up to the note above your octave.": "Um arpejo que alcança a nota acima da sua oitava.",
  "An arpeggio that touches the highest note you have learned.": "Um arpejo que toca a nota mais aguda que você aprendeu.",
  "An arpeggio up to the note just below the top of your range.": "Um arpejo até a nota logo abaixo do topo do seu registro.",
  "B — left index finger only. No octave key.": "Si — apenas indicador esquerdo. Sem chave de oitava.",
  "B — left thumb and left index, plus the Eb key.": "Si — polegar e indicador esquerdos, mais a tecla de Mib.",
  "B — the clarion register! Thumb hole closed, all fingers down, register key, and the left little-finger E key.": "Si — registro clarino! Buraco do polegar fechado, todos os dedos abaixados, chave de registro e tecla Mi do mindinho esquerdo.",
  "B — whisper key off, left hand down with the right index finger.": "Si — chave de sussurro desligada, mão esquerda apoiada com o indicador direito.",
  "Bb — 1st position. An octave above your low Bb!": "Sib — 1ª posição. Uma oitava acima do seu Sib grave!",
  "Bb — 1st position. Slide all the way in!": "Sib — 1ª posição. Cancro totalmente recolhido!",
  "Big, smooth moves.": "Movimentos grandes e suaves.",
  "Bounce between your tonic and the note just below it.": "Salte entre a sua tônica e a nota logo abaixo dela.",
  "C — 6th position. A long reach!": "Dó — 6ª posição. Um alcance longo!",
  "C — left index finger only (thumb off), plus the Eb key. Your first note in the second octave.": "Dó — apenas indicador esquerdo (polegar solto), mais a tecla de Mib. Sua primeira nota na segunda oitava.",
  "C — left index plus right index fingers. No octave key.": "Dó — indicador esquerdo mais indicador direito. Sem chave de oitava.",
  "C — left middle finger only. The top of your first octave!": "Dó — apenas médio esquerdo. O topo da sua primeira oitava!",
  "C — same as B but switch to the right little-finger F key. All fingers stay down.": "Dó — igual ao Si, mas troque para a tecla Fá do mindinho direito. Todos os dedos ficam abaixados.",
  "C — thumb hole + all three left-hand rings closed.": "Dó — buraco do polegar + as três argolas da mão esquerda fechadas.",
  "C — whisper key off, just the left hand down.": "Dó — chave de sussurro desligada, apenas a mão esquerda abaixada.",
  "D — 4th position. Slide lines up with the bell.": "Ré — 4ª posição. O cancro alinha com a campana.",
  "D — a whole step below E. Add your right ring finger.": "Ré — um tom abaixo de Mi. Adicione o anelar direito.",
  "D — all main keys covered, no octave key needed.": "Ré — todas as teclas principais cobertas, sem chave de oitava.",
  "D — all main keys covered. Left thumb and all three left-hand fingers, plus all three right hand fingers.": "Ré — todas as teclas principais cobertas. Polegar e três dedos da esquerda, mais os três dedos da direita.",
  "D — lift left ring finger. Two left-hand rings down.": "Ré — levante o anelar esquerdo. Duas argolas da esquerda abaixadas.",
  "E — a half-step below F. Add your right middle finger.": "Mi — um semitom abaixo de Fá. Adicione o médio direito.",
  "E — a half-step below F. Left hand down, right index and middle fingers.": "Mi — um semitom abaixo de Fá. Mão esquerda abaixada, indicador e médio direitos.",
  "E — only the first left-hand ring closed.": "Mi — apenas a primeira argola da esquerda fechada.",
  "E — right ring and pinky lift.": "Mi — anelar e mindinho direitos levantados.",
  "E — whisper key with only the left index finger down.": "Mi — chave de sussurro com apenas o indicador esquerdo abaixado.",
  "Eb — 3rd position. Just past the bell.": "Mib — 3ª posição. Logo após a campana.",
  "F — left hand down, right index and middle fingers, plus the F resonance key.": "Fá — mão esquerda abaixada, indicador e médio direitos, mais a tecla de ressonância de Fá.",
  "F — left hand down, right index finger, and the Eb key.": "Fá — mão esquerda abaixada, indicador direito e a tecla de Mib.",
  "F — right index finger only with the left hand down.": "Fá — apenas indicador direito com a mão esquerda abaixada.",
  "F — thumb hole only, all fingers off.": "Fá — apenas buraco do polegar, todos os dedos soltos.",
  "F — whisper key with no fingers down. An open, resonant note.": "Fá — chave de sussurro sem dedos abaixados. Uma nota aberta e ressonante.",
  "Firm air, no pinching.": "Ar firme, sem apertar.",
  "Firm air, steady support.": "Ar firme, apoio estável.",
  "G — 4th position. Fourth harmonic.": "Sol — 4ª posição. Quarto harmônico.",
  "G — completely open. No fingers down, no register key.": "Sol — totalmente aberto. Nenhum dedo abaixado, sem chave de registro.",
  "G — left hand only plus the Eb key with your right pinky.": "Sol — apenas mão esquerda mais a tecla de Mib com o mindinho direito.",
  "G — left hand only! A warm, open oboe note.": "Sol — apenas mão esquerda! Uma nota de oboé quente e aberta.",
  "G — left hand only. A wide-open, resonant note.": "Sol — apenas mão esquerda. Uma nota aberta e ressonante.",
  "G — whisper key with a half-hole on the left index and all other main fingers down.": "Sol — chave de sussurro com meio-furo no indicador esquerdo e demais dedos principais abaixados.",
  "Hear the pull to resolve.": "Ouça a atração para resolver.",
  "Keep every step even.": "Mantenha cada passo uniforme.",
  "Keep the flat centred and match it to the tonic.": "Mantenha o bemol centrado e ajustado à tônica.",
  "Keep the top note relaxed.": "Mantenha a nota aguda relaxada.",
  "Leap a full octave from your tonic.": "Salte uma oitava completa a partir da tônica.",
  "Leap between a high flat and your tonic.": "Salte entre um bemol agudo e a tônica.",
  "Left index only, thumb off. Keep the Eb key down with your right pinky.": "Apenas indicador esquerdo, polegar solto. Mantenha a tecla de Mib abaixada com o mindinho direito.",
  "Left middle finger only (left index and thumb open). No octave key.": "Apenas médio esquerdo (indicador e polegar soltos). Sem chave de oitava.",
  "Left thumb + all three left fingers + all three right fingers, plus the footjoint C key with your right pinky. Warm, supported air.": "Polegar e três dedos da esquerda + três dedos da direita, mais a tecla Dó do pé com o mindinho direito. Ar quente e apoiado.",
  "Left thumb + all three left fingers + all three right fingers. Right pinky up. Blow across the embouchure hole.": "Polegar e três dedos da esquerda + três dedos da direita. Mindinho direito solto. Sopre através do orifício de embocadura.",
  "Left thumb + all three left fingers + right index. Add the Eb key with your right pinky.": "Polegar e três dedos da esquerda + indicador direito. Adicione a tecla de Mib com o mindinho direito.",
  "Left thumb + all three left fingers. Right pinky on the Eb key. Right index, middle, ring up.": "Polegar e três dedos da esquerda. Mindinho direito na tecla de Mib. Indicador, médio e anelar direitos soltos.",
  "Left thumb + left index + left middle. Left ring up. Right pinky on Eb key.": "Polegar + indicador + médio esquerdos. Anelar esquerdo solto. Mindinho direito na tecla de Mib.",
  "Left thumb + left index only. Add the Eb key with your right pinky.": "Polegar + indicador esquerdos apenas. Adicione a tecla de Mib com o mindinho direito.",
  "Left thumb on the whisper key. Left index, middle, and ring down. Right hand open. Slow, warm, steady air.": "Polegar na chave de sussurro. Indicador, médio e anelar esquerdos abaixados. Mão direita aberta. Ar lento, quente e estável.",
  "Lift every finger and the thumb. The clarinet sings open on G.": "Levante todos os dedos e o polegar. O clarinete canta aberto em Sol.",
  "Listen for the repeating pattern — just those three notes, so make every one count!": "Ouça o padrão que se repete — apenas essas três notas, então faça cada uma valer!",
  "Low C (written) — all fingers down including the low C key.": "Dó grave (escrito) — todos os dedos abaixados incluindo a tecla Dó grave.",
  "Low C — the bottom of the bassoon. Whisper key with all three left fingers down.": "Dó grave — o fundo do fagote. Chave de sussurro com os três dedos esquerdos abaixados.",
  "Low C — the bottom of the flute. Every main key covered, plus the little-finger C key.": "Dó grave — o fundo da flauta. Todas as teclas principais cobertas, mais a tecla Dó do mindinho.",
  "Low C — the bottom of the oboe. All six main fingers down plus the low C key.": "Dó grave — o fundo do oboé. Os seis dedos principais abaixados mais a tecla Dó grave.",
  "Low D — whisper key with the left index and middle fingers down.": "Ré grave — chave de sussurro com indicador e médio esquerdos abaixados.",
  "Match the pitch to your tonic.": "Ajuste a altura à sua tônica.",
  "Mix up your first five notes and songs — Bb1, C2, D2, Eb2, and F2.": "Misture suas cinco primeiras notas e canções — Sib1, Dó2, Ré2, Mib2 e Fá2.",
  "Mix up your first five notes and songs — Bb2, C3, D3, Eb3, and F3.": "Misture suas cinco primeiras notas e canções — Sib2, Dó3, Ré3, Mib3 e Fá3.",
  "Mix up your first five notes and songs — C, D, E, F, and G.": "Misture suas cinco primeiras notas e canções — Dó, Ré, Mi, Fá e Sol.",
  "Mix up your first five notes and songs — F, G, A, Bb, and C.": "Misture suas cinco primeiras notas e canções — Fá, Sol, Lá, Sib e Dó.",
  "Move smoothly between just two notes. Keep each pitch centred!": "Mova-se suavemente entre apenas duas notas. Mantenha cada som centrado!",
  "No octave key. All three left fingers + all three right fingers, plus the low C key with your right pinky. Focused, steady air through the reed.": "Sem chave de oitava. Três dedos da esquerda + três da direita, mais a tecla Dó grave com o mindinho direito. Ar focado e estável pelo palheto.",
  "No octave key. All three left fingers + right index + right middle.": "Sem chave de oitava. Três dedos da esquerda + indicador e médio direitos.",
  "No octave key. All three left fingers + all three right fingers, plus the low C key with your right pinky. Focused, steady air through the reed.": "Sem chave de oitava. Três dedos da esquerda + três da direita, mais a tecla Dó grave com o mindinho direito. Ar focado e estável pelo palheto.",
  "No octave key. All three left fingers + right index + right middle.": "Sem chave de oitava. Três dedos da esquerda + indicador e médio direitos.",
  "No octave key. All three left fingers + right index + right middle. Press the F resonance key with your right hand.": "Sem chave de oitava. Três dedos da esquerda + indicador e médio direitos. Pressione a tecla de ressonância de Fá com a mão direita.",
  "No octave key. All three left fingers down. Right hand completely open.": "Sem chave de oitava. Três dedos da esquerda abaixados. Mão direita totalmente aberta.",
  "No octave key. All three left fingers down. Right hand open.": "Sem chave de oitava. Três dedos da esquerda abaixados. Mão direita aberta.",
  "No octave key. All three left fingers down. Right index and middle down. Right ring and pinky up.": "Sem chave de oitava. Três dedos da esquerda abaixados. Indicador e médio direitos abaixados. Anelar e mindinho direitos soltos.",
  "No octave key. All three left fingers down. Right index finger only.": "Sem chave de oitava. Três dedos da esquerda abaixados. Apenas indicador direito.",
  "No octave key. All three left-hand and all three right-hand fingers down. Firm embouchure corners, focused air through the reed.": "Sem chave de oitava. Três dedos da esquerda e três da direita abaixados. Cantos da embocadura firmes, ar focado pelo palheto.",
  "No octave key. All three left-hand and all three right-hand fingers down. Right pinky on low C key.": "Sem chave de oitava. Três dedos da esquerda e três da direita abaixados. Mindinho direito na tecla Dó grave.",
  "No octave key. Left index + left middle only. Left ring up. Right hand open.": "Sem chave de oitava. Indicador + médio esquerdos apenas. Anelar esquerdo solto. Mão direita aberta.",
  "No octave key. Left index + left middle. Right hand open.": "Sem chave de oitava. Indicador + médio esquerdos. Mão direita aberta.",
  "No octave key. Left index + right index. Thumb and other fingers open.": "Sem chave de oitava. Indicador esquerdo + indicador direito. Polegar e demais dedos soltos.",
  "No octave key. Left index only. Right hand open and left ring up.": "Sem chave de oitava. Apenas indicador esquerdo. Mão direita aberta e anelar esquerdo solto.",
  "No octave key. Left index only. Thumb and all other fingers open.": "Sem chave de oitava. Apenas indicador esquerdo. Polegar e demais dedos soltos.",
  "No octave key. Same as E but add your right ring finger.": "Sem chave de oitava. Igual a Mi, mas adicione o anelar direito.",
  "No valves — E is the 5th partial of the open series.": "Sem válvulas — Mi é o 5º parcial da série aberta.",
  "No valves — the 6th partial.": "Sem válvulas — o 6º parcial.",
  "No valves — the 8th partial. Octave above your first C.": "Sem válvulas — o 8º parcial. Uma oitava acima do seu primeiro Dó.",
  "No valves — the fundamental resonance of the F horn.": "Sem válvulas — a ressonância fundamental da trompa em Fá.",
  "No valves. 6th partial. Faster air than E.": "Sem válvulas. 6º parcial. Ar mais rápido que Mi.",
  "No valves. 8th partial. Firm embouchure, fast air.": "Sem válvulas. 8º parcial. Embocadura firme, ar rápido.",
  "No valves. Bb is on the third line. Faster, more focused air.": "Sem válvulas. Sib está na terceira linha. Ar mais rápido e focado.",
  "No valves. Bb is the 2nd partial of the Bb bugle. Deep breath, steady air.": "Sem válvulas. Sib é o 2º parcial do clarim em Sib. Respiração profunda, ar estável.",
  "No valves. Bb is the 4th harmonic. Tighter embouchure, faster air.": "Sem válvulas. Sib é o 4º harmônico. Embocadura mais fechada, ar mais rápido.",
  "No valves. C is the 4th partial of the Bb bugle. Buzz a firm middle-register pitch.": "Sem válvulas. Dó é o 4º parcial do clarim em Sib. Buzz firme no registro médio.",
  "No valves. C is the 4th partial of the F horn.": "Sem válvulas. Dó é o 4º parcial da trompa em Fá.",
  "No valves. E is the 5th partial of the open series.": "Sem válvulas. Mi é o 5º parcial da série aberta.",
  "No valves. F is the 3rd harmonic. Faster air.": "Sem válvulas. Fá é o 3º harmônico. Ar mais rápido.",
  "No valves. F is the 3rd partial. First note on the staff.": "Sem válvulas. Fá é o 3º parcial. Primeira nota na pauta.",
  "No valves. Faster, more focused air for the 6th partial.": "Sem válvulas. Ar mais rápido e focado para o 6º parcial.",
  "No valves. Full, relaxed breath. Slow, wide air stream.": "Sem válvulas. Respiração cheia e relaxada. Fluxo de ar lento e amplo.",
  "No valves. Tighten the embouchure. Fast, supported air.": "Sem válvulas. Feche a embocadura. Ar rápido e apoiado.",
  "Open again — C above the staff completes the octave.": "Aberto novamente — Dó acima da pauta completa a oitava.",
  "Open again — an octave above your low Bb!": "Aberto novamente — uma oitava acima do seu Sib grave!",
  "Open — an octave above your low Bb!": "Aberto — uma oitava acima do seu Sib grave!",
  "Open — no valves. Let the horn ring.": "Aberto — sem válvulas. Deixe a trompa soar.",
  "Open — the tonic tuba note. Feel the resonance.": "Aberto — a tônica da tuba. Sinta a ressonância.",
  "Play the note a few times, long and even. Listen for a clear, centred sound.": "Toque a nota algumas vezes, longa e uniforme. Ouça um som claro e centrado.",
  "Press valve 1 with your index finger.": "Pressione a válvula 1 com o indicador.",
  "Reach down to the lowest note of your range and back.": "Desça até a nota mais grave do seu registro e volte.",
  "Relax and support the low note.": "Relaxe e apoie a nota grave.",
  "Review all alto sax notes and songs together — the full C4 to C5 octave.": "Revise todas as notas e canções do saxofone alto juntas — a oitava completa de Dó4 a Dó5.",
  "Review all bassoon notes and songs together — the full C3 to C4 octave.": "Revise todas as notas e canções do fagote juntas — a oitava completa de Dó3 a Dó4.",
  "Review all clarinet notes and songs across the full octave.": "Revise todas as notas e canções do clarinete ao longo da oitava completa.",
  "Review all euphonium notes and songs together — the full Bb2 to Bb3 octave.": "Revise todas as notas e canções do eufônio juntas — a oitava completa de Sib2 a Sib3.",
  "Review all flute notes and songs together — the full C4 to C5 octave.": "Revise todas as notas e canções da flauta juntas — a oitava completa de Dó4 a Dó5.",
  "Review all horn notes and songs together — the full F4 to F5 octave.": "Revise todas as notas e canções da trompa juntas — a oitava completa de Fá4 a Fá5.",
  "Review all oboe notes and songs together — the full C4 to C5 octave.": "Revise todas as notas e canções do oboé juntas — a oitava completa de Dó4 a Dó5.",
  "Review all trombone notes and songs together — the full Bb2 to Bb3 octave.": "Revise todas as notas e canções do trombone juntas — a oitava completa de Sib2 a Sib3.",
  "Review all trumpet notes and songs together — the full C4 to C5 octave.": "Revise todas as notas e canções da trompete juntas — a oitava completa de Dó4 a Dó5.",
  "Review all tuba notes and songs together — the full Bb1 to Bb2 octave.": "Revise todas as notas e canções da tuba juntas — a oitava completa de Sib1 a Sib2.",
  "Review your first five notes and songs — Bb2 through F3.": "Revise suas cinco primeiras notas e canções — de Sib2 a Fá3.",
  "Review your first five notes and songs — C through G in the chalumeau.": "Revise suas cinco primeiras notas e canções — de Dó a Sol no chalumeau.",
  "Same as F but add your right middle finger.": "Igual a Fá, mas adicione o médio direito.",
  "Small, controlled moves.": "Movimentos pequenos e controlados.",
  "Support the top note without pinching.": "Apoie a nota aguda sem apertar.",
  "Take it slowly and listen for the stepwise motion across five notes.": "Vá devagar e ouça o movimento por graus conjuntos ao longo de cinco notas.",
  "The highest note in your range.": "A nota mais aguda do seu registro.",
  "The leading tone leaning home to the tonic.": "A sensível inclinando-se para a tônica.",
  "The tonic — no valves! Also known as concert Bb, the fundamental resonance of the trumpet.": "A tônica — sem válvulas! Também conhecida como Sib de concerto, a ressonância fundamental da trompete.",
  "The tune behind \"Mary Had a Little Lamb\" — a short melody that walks down and back up the first three notes of your scale.": "A melodia por trás de \"Mary Had a Little Lamb\" — uma melodia curta que desce e sobe as três primeiras notas da sua escala.",
  "This fanfare leaps between all your notes. Keep the air strong and the valves crisp!": "Esta fanfarra salta entre todas as suas notas. Mantenha o ar forte e as válvulas precisas!",
  "This fanfare-style melody uses every combination at least once. Keep the air steady!": "Esta melodia em estilo de fanfarra usa cada combinação pelo menos uma vez. Mantenha o ar estável!",
  "This fanfare-style melody uses every note at least once. Let the tuba resonate!": "Esta melodia em estilo de fanfarra usa cada nota pelo menos uma vez. Deixe a tuba ressoar!",
  "This melody leaps across the chalumeau and into the clarion. Keep the air supported!": "Esta melodia salta pelo chalumeau e entra no clarino. Mantenha o ar apoiado!",
  "This melody leaps across the full range. Crisp articulation and steady air!": "Esta melodia salta por todo o registro. Articulação precisa e ar estável!",
  "This melody leaps across the full range. Keep the air supported and the tone warm!": "Esta melodia salta por todo o registro. Mantenha o ar apoiado e o som quente!",
  "This melody leaps across the full range. Slow, warm air with a steady buzz!": "Esta melodia salta por todo o registro. Ar lento e quente com buzz estável!",
  "This melody leaps across the full range. Support the air and let the tone sing!": "Esta melodia salta por todo o registro. Apoie o ar e deixe o som cantar!",
  "This melody uses every position at least once. Keep the buzz steady!": "Esta melodia usa cada posição pelo menos uma vez. Mantenha o buzz estável!",
  "Thumb hole + first ring (left index). All other fingers open.": "Buraco do polegar + primeira argola (indicador esquerdo). Demais dedos soltos.",
  "Thumb hole + left-hand rings 1 and 2. Ring finger open.": "Buraco do polegar + argolas 1 e 2 da mão esquerda. Anelar solto.",
  "Thumb hole + left-hand rings 1-2-3. Right hand open.": "Buraco do polegar + argolas 1-2-3 da mão esquerda. Mão direita aberta.",
  "Thumb hole closed + all fingers down + register key. Press the right little-finger F key instead of the left.": "Buraco do polegar fechado + todos os dedos abaixados + chave de registro. Pressione a tecla Fá do mindinho direito em vez da esquerda.",
  "Thumb hole closed + all left and right fingers down + register key. Add the left little-finger E key.": "Buraco do polegar fechado + todos os dedos esquerdos e direitos abaixados + chave de registro. Adicione a tecla Mi do mindinho esquerdo.",
  "Thumb hole only. All fingers off the rings.": "Apenas buraco do polegar. Todos os dedos soltos das argolas.",
  "Valve 1 again — half-step below E.": "Válvula 1 de novo — um semitom abaixo de Mi.",
  "Valve 1 alone — Eb sits just below the staff.": "Apenas válvula 1 — Mib fica logo abaixo da pauta.",
  "Valve 1 alone — a whole step below F.": "Apenas válvula 1 — um tom abaixo de Fá.",
  "Valve 1 only (index finger).": "Apenas válvula 1 (indicador).",
  "Valve 1 only (index finger). Whole step below F.": "Apenas válvula 1 (indicador). Um tom abaixo de Fá.",
  "Valve 1 — whole step above C.": "Válvula 1 — um tom acima de Dó.",
  "Valve 1. Fifth partial with first valve down.": "Válvula 1. Quinto parcial com a primeira válvula abaixada.",
  "Valve 1. Half-step below E.": "Válvula 1. Um semitom abaixo de Mi.",
  "Valve 1. Relax the embouchure slightly — this is a whole step lower than G.": "Válvula 1. Relax a embocadura levemente — esta é um tom mais grave que Sol.",
  "Valve 2 alone — A in the second space.": "Apenas válvula 2 — Lá no segundo espaço.",
  "Valve 2 alone — just the middle finger.": "Apenas válvula 2 — apenas o médio.",
  "Valve 2 only (middle finger). Half-step below Bb.": "Apenas válvula 2 (médio). Um semitom abaixo de Sib.",
  "Valve 2 only. Half-step below C.": "Apenas válvula 2. Um semitom abaixo de Dó.",
  "Valve 2 — half-step below C5.": "Válvula 2 — um semitom abaixo de Dó5.",
  "Valve 2. Half-step below C5.": "Válvula 2. Um semitom abaixo de Dó5.",
  "Valves 1 and 2 from the 8th partial.": "Válvulas 1 e 2 a partir do 8º parcial.",
  "Valves 1 and 2 together — index and middle finger.": "Válvulas 1 e 2 juntas — indicador e médio.",
  "Valves 1 and 2 — G in the middle of the staff.": "Válvulas 1 e 2 — Sol no meio da pauta.",
  "Valves 1 and 2 — stepping up from F.": "Válvulas 1 e 2 — subindo a partir de Fá.",
  "Valves 1 and 2 — up another step.": "Válvulas 1 e 2 — mais um passo.",
  "Valves 1 and 2 — whole step below B.": "Válvulas 1 e 2 — um tom abaixo de Si.",
  "Valves 1 and 2. Clean, simultaneous valve motion.": "Válvulas 1 e 2. Movimento limpo e simultâneo das válvulas.",
  "Valves 1 and 2. D sits below the bass staff.": "Válvulas 1 e 2. Ré fica abaixo da pauta de baixo.",
  "Valves 1 and 2. D sits on the third line of the bass staff.": "Válvulas 1 e 2. Ré fica na terceira linha da pauta de baixo.",
  "Valves 1 and 2. Faster air than G.": "Válvulas 1 e 2. Ar mais rápido que Sol.",
  "Valves 1 and 2. G is on the second line of the bass clef.": "Válvulas 1 e 2. Sol está na segunda linha da clave de fá.",
  "Valves 1 and 2. Whole step above F.": "Válvulas 1 e 2. Um tom acima de Fá.",
  "Valves 1 and 2. Whole step below B.": "Válvulas 1 e 2. Um tom abaixo de Si.",
  "Valves 1 and 3 together — your first valve combination.": "Válvulas 1 e 3 juntas — sua primeira combinação de válvulas.",
  "Valves 1 and 3 — a whole step below D.": "Válvulas 1 e 3 — um tom abaixo de Ré.",
  "Valves 1 and 3. Keep the buzz centred and the air fast.": "Válvulas 1 e 3. Mantenha o buzz centrado e o ar rápido.",
  "Valves 1 and 3. Whole step below D.": "Válvulas 1 e 3. Um tom abaixo de Ré.",
  "Whisper key off. All three left fingers + right index.": "Chave de sussurro desligada. Três dedos da esquerda + indicador direito.",
  "Whisper key off. All three left fingers only. Right hand open.": "Chave de sussurro desligada. Apenas três dedos da esquerda. Mão direita aberta.",
  "Whisper key off. Left hand down + right index + right middle.": "Chave de sussurro desligada. Mão esquerda abaixada + indicador e médio direitos.",
  "Whisper key on. Left index + left middle down, left ring up. Right hand open.": "Chave de sussurro ligada. Indicador + médio esquerdos abaixados, anelar solto. Mão direita aberta.",
  "Whisper key on. Left index half-hole (cracked open), left middle + ring down, all three right fingers down.": "Chave de sussurro ligada. Meio-furo no indicador esquerdo (entreaberto), médio + anelar abaixados, três dedos direitos abaixados.",
  "Whisper key on. Left index only. Left middle and ring up. Right hand open.": "Chave de sussurro ligada. Apenas indicador esquerdo. Médio e anelar soltos. Mão direita aberta.",
  "Whisper key on. No fingers down at all. Open throat, slow air.": "Chave de sussurro ligada. Nenhum dedo abaixado. Garganta aberta, ar lento.",
  "Your first note — F in 1st position, the third harmonic of the open horn.": "Sua primeira nota — Fá na 1ª posição, o terceiro harmônico da trompa aberta.",
  "Your first note — no valves, the 6th partial of the open tube.": "Sua primeira nota — sem válvulas, o 6º parcial do tubo aberto.",
  "Your first note — open, the 3rd harmonic of the Bb bugle.": "Sua primeira nota — aberto, o 3º harmônico do clarim em Sib.",
  "Your first note — open, the 3rd harmonic.": "Sua primeira nota — aberto, o 3º harmônico.",
  "Step through each note carefully. Feel how the rings seal with your fingertips!": "Percorra cada nota com cuidado. Sinta como as argolas selam com as pontas dos dedos!",
  "Step through each note carefully. Feel the slide moving between 4th, 6th, and 1st positions!": "Percorra cada nota com cuidado. Sinta o cancro se movendo entre as 4ª, 6ª e 1ª posições!",
  "Step through each note from E down to C. Feel the right hand lifting!": "Percorra cada nota de Mi até Dó. Sinta a mão direita levantando!",
  "Step through each note slowly. Notice how your right hand alternates between keys!": "Percorra cada nota devagar. Observe como a mão direita alterna entre as teclas!",
  "Step through each note with warm, supported air. The whisper key stays on for these notes!": "Percorra cada nota com ar quente e apoiado. A chave de sussurro fica ligada nessas notas!",
  "Step through each note. Feel the right fingers lifting one at a time!": "Percorra cada nota. Sinta os dedos direitos levantando um de cada vez!",
  "Step through each note. Feel the valves changing between combinations below the staff!": "Percorra cada nota. Sinta as válvulas mudando entre as combinações abaixo da pauta!",
  "Step through each note. Feel the valves changing between combinations!": "Percorra cada nota. Sinta as válvulas mudando entre as combinações!",
  "Step through each note. The pattern repeats. Feel how the valves move in sequence!": "Percorra cada nota. O padrão se repete. Sinta como as válvulas se movem em sequência!",
  "Step through each note. The pattern repeats. Feel how the valves move!": "Percorra cada nota. O padrão se repete. Sinta como as válvulas se movem!",
  "Steps up and down your first six notes.": "Passos para cima e para baixo nas suas seis primeiras notas.",
  "Support the high note.": "Apoie a nota aguda.",
  "Support the top note without pinching.": "Apoie a nota do topo sem apertar.",
  "Trumpet": "Trompete",
  "Flute": "Flauta",
  "Clarinet": "Clarinete",
  "Alto Saxophone": "Saxofone Alto",
  "Oboe": "Oboé",
  "Bassoon": "Fagote",
  "Euphonium": "Eufônio",
  "French Horn": "Trompa",
  "Trombone": "Trombone",
  "Tuba": "Tuba",
  "My First Note": "Minha Primeira Nota",
  "Step Up and Down": "Subindo e Descendo",
  "Hot Cross Buns": "Hot Cross Buns",
  "Lightly Row": "Lightly Row",
  "Merrily We Roll Along": "Merrily We Roll Along",
  "Review 1": "Revisão 1",
  "Review 2": "Revisão 2",
  "Trumpet Tune": "Melodia de Trompete",
  "Flute Song": "Canção de Flauta",
  "Clarinet Song": "Canção de Clarinete",
  "Saxophone Song": "Canção de Saxofone",
  "Oboe Song": "Canção de Oboé",
  "Bassoon Song": "Canção de Fagote",
  "Euphonium Air": "Ária de Eufônio",
  "Horn Calls": "Chamadas da Trompa",
  "Slide Serenade": "Serenata do Cancro",
  "Tuba Foundation": "Fundamento da Tuba",
  "Learn": "Aprender",
  "Practice": "Praticar",
  "Teach": "Ensinar",
  "Input": "Entrada",
  "Untitled Score": "Partitura sem título",
  "Metronome": "Metrônomo",
  "Count-in": "Contagem",
  "Mixer": "Mixer",
  "Hide Palette": "Ocultar Paleta",
  "Dot": "Ponto",
  "Sharp": "Sustenido",
  "Flat": "Bemol",
  "Natural": "Bequadro",
  "Triplet": "Tercina",
  "Chord": "Acorde",
  "Voice": "Voz",
  "Whole": "Semibreve",
  "Half": "Mínima",
  "Quarter": "Semínima",
  "8th": "Colcheia",
  "16th": "Semicolcheia",
  "32nd": "Fusa",
  "64th": "Semifusa",
  "Rest": "Pausa",
  "Octave 4": "Oitava 4",
  "Solfege": "Solfège",
  "Measure": "Compasso",
  "Line Break": "Quebra de linha",
  "Continuous": "Contínuo",
  "Select": "Selecionar",
  "Back to my path": "Voltar ao meu caminho",
  "Badges": "Insígnias",
  "Active days": "Dias ativos",
  "BPM": "BPM",
  "Audio": "Áudio",
  "Search": "Buscar",
  "Dynamics": "Dinâmica",
  "Artic": "Articulação",
  "Lines": "Linhas",
  "Text": "Texto",
  "Clef": "Clave",
  "Bars": "Compassos",
  "Tempo": "Andamento",
  "Search Palette": "Paleta de Busca",
  "Treble": "Sol",
  "Bass": "Fá",
  "Alto": "Dó (alto)",
  "Tenor": "Dó (tenor)",
  "Percussion": "Percussão",
  "Normal": "Normal",
  "Double": "Duplo",
  "Final": "Final",
  "Remove": "Remover",
  "More": "Mais",
  "Oct ↓": "Oit ↓",
  "Oct ↑": "Oit ↑",
  "Staccato": "Staccato",
  "Accent": "Acento",
  "Tenuto": "Tenuto",
  "Marcato": "Marcato",
  "Portato": "Portato",
  "Martellato": "Martellato",
  "Fermata": "Fermata",
  "Trill": "Trinado",
  "Tie": "Ligadura",
  "Slur": "Ligadura de frase",
  "Cresc": "Cresc.",
  "Dim": "Dim.",
  "Eraser": "Borracha",
  "Octave": "Oitava",

  "First notes, first wins.": "Primeiras notas, primeiras vitórias.",
  "Pick an instrument to start your very first lessons — fingerings, notes, and your first sounds.": "Escolha um instrumento para começar suas primeiras aulas — digitações, notas e seus primeiros sons.",
  "You're set up on ${savedInst.shortName}. Pick up where you left off.": "Você está configurado em ${savedInst.shortName}. Continue de onde parou.",
  "Ready to play?": "Pronto para tocar?",
  "You're set up on": "Você está configurado em",
  "Pick up where you left off.": "Continue de onde parou.",
  "Ready, ${escapeHtml(studentName)}?": "Pronto, ${escapeHtml(studentName)}?",
  "Progress report": "Relatório de progresso",
  "Settings": "Configurações",
  "Switch instrument": "Trocar instrumento",
  "Welcome to Preludio Band!": "Bem-vindo ao Preludio Band!",
  "What's your name?": "Qual é o seu nome?",
  "Your name...": "Seu nome...",
  "Start practicing": "Começar a praticar",
  "📈 Your week in music is ready!": "📈 Sua semana na música está pronta!",
  "+ Import Song": "+ Importar canção",
  "▶ My take": "▶ Minha gravação",
  "▶ Play whole melody": "▶ Tocar a melodia inteira",
  "▶ Play with recording": "▶ Tocar com a gravação",
  "▶ Replay count-in": "▶ Repetir a contagem",
  "▶ Start count-in": "▶ Iniciar a contagem",
  "❔ How this app works": "❔ Como este app funciona",
  "All done — nice work!": "Tudo pronto — bom trabalho!",
  "Badge unlocked:": "Medalha desbloqueada:",
  "Audio analysis not supported here.": "Análise de áudio não suportada aqui.",
  "Check your pitch against the floating tuner.": "Confira a afinação com o afinador flutuante.",
  "Clear all lesson progress and XP for all instruments. This cannot be undone.": "Apaga todo o progresso das aulas e o XP de todos os instrumentos. Esta ação não pode ser desfeita.",
  "Click sound": "Som do clique",
  "Could not access the microphone.": "Não foi possível acessar o microfone.",
  "Could not play the recording.": "Não foi possível reproduzir a gravação.",
  "Daily practice (minutes)": "Prática diária (minutos)",
  "Delete imported song": "Excluir canção importada",
  "Faster": "Mais rápido",
  "Finish the previous note first.": "Termine a nota anterior primeiro.",
  "Get ready...": "Prepare-se...",
  "Hear a short phrase, then echo it back — by ear.": "Ouça uma frase curta e repita — de ouvido.",
  "Hear it": "Ouvir",
  "Hear the model": "Ouvir o modelo",
  "Hide for now": "Ocultar por enquanto",
  "Hide weekly progress": "Ocultar o progresso semanal",
  "in tune ✓": "afinado ✓",
  "Learn a couple of notes first.": "Aprenda algumas notas primeiro.",
  "Learn two notes to unlock ear training.": "Aprenda duas notas para liberar o treino auditivo.",
  "Look up any note's fingering and sound.": "Consulte a digitação e o som de qualquer nota.",
  "Metronome and tuner": "Metrônomo e afinador",
  "Microphone not available for tuning.": "Microfone indisponível para afinação.",
  "Microphone not available here.": "Microfone indisponível aqui.",
  "New badges this week": "Novas insígnias esta semana",
  "Next ›": "Próximo ›",
  "Nice. Tap Start to try again, or confirm below.": "Muito bem. Toque em Iniciar para tentar de novo ou confirme abaixo.",
  "No badges yet": "Nenhuma insígnia ainda",
  "No new badges this week": "Nenhuma insígnia nova esta semana",
  "No notes to show yet.": "Ainda não há notas para mostrar.",
  "No practice recorded yet — play a lesson to start the report.": "Nenhuma prática registrada ainda — toque uma aula para iniciar o relatório.",
  "Not quite — try again.": "Quase — tente de novo.",
  "On the staff": "Na pauta",
  "Open the floating metronome and tuner.": "Abra o metrônomo e o afinador flutuantes.",
  "Play again": "Jogar novamente",
  "Play it on your instrument": "Toque no seu instrumento",
  "Play note": "Tocar nota",
  "Play now!": "Toque agora!",
  "Practice report": "Relatório de prática",
  "Practice today to start a streak!": "Pratique hoje para começar uma sequência!",
  "Progress reset.": "Progresso zerado.",
  "Reset all progress": "Zerar todo o progresso",
  "Reset all progress for all instruments? This cannot be undone.": "Zerar todo o progresso de todos os instrumentos? Esta ação não pode ser desfeita.",
  "Reset progress": "Zerar progresso",
  "Review complete!": "Revisão concluída!",
  "Skip the tour": "Pular o tour",
  "Song complete!": "Canção concluída!",
  "Song not found.": "Canção não encontrada.",
  "Start listening": "Começar a ouvir",
  "Student name": "Nome do aluno",
  "Switch between the light \"paper\" theme and the dark theme.": "Alterne entre o tema claro \"papel\" e o tema escuro.",
  "Tap play, then follow along with the recording.": "Toque em Play e acompanhe a gravação.",
  "Tap Start, then play along on the count.": "Toque em Iniciar e toque junto com a contagem.",
  "Tap the notes in the order you heard them.": "Toque nas notas na ordem em que você as ouviu.",
  "This week in music": "Esta semana na música",
  "Time signature": "Fórmula de compasso",
  "Try another": "Tentar outra",
  "Unit 1 · First Notes": "Unidade 1 · Primeiras notas",
  "Your drills will favour the notes you miss most.": "Seus exercícios vão priorizar as notas que você mais erra.",
  "Your notes": "Suas notas",
  "Done": "Pronto",
  "Back": "Voltar",
  "Score": "Pontuação",
  "Note": "Nota",
  "New": "Novo",
  "Best:": "Melhor:",
  "fingerings": "digitações",
  "First sound ·": "Primeiro som ·",
  "Listening for": "Ouvindo a nota",
  "notes ·": "notas ·",
  "songs": "canções",
  "Tap": "Marcar",
  "Turn on your microphone and the app hears whether": "Ligue o microfone e o app ouve se",
  "is right — green means you nailed it.": "está certo — verde significa que você acertou.",

};

// French (Canadian French) translations - starter set
TRANSLATIONS.fr = {
  "Language": "Langue",
  "Welcome to Preludio Band!": "Bienvenue au Preludio Band !",
  "What's your name?": "Quel est votre nom ?",
  "Your name...": "Votre nom...",
  "Start practicing": "Commencer à pratiquer",
  "Lesson": "Leçon",
  "Map": "Carte",
  "Practice": "Pratique",
  "Settings": "Paramètres",
  "Report": "Rapport",
  "Fingering chart": "Doigtés",
  "Metronome": "Métronome",
  "Tuner": "Accordeur",
  "Play": "Jouer",
  "Listen": "Écouter",
  "Next": "Suivant",
  "Back": "Retour",
  "Complete": "Terminé",
  "Review": "Réviser",
  "Song": "Chanson",
  "Notes": "Notes",
  "Level": "Niveau",
  "Badges": "Badges",
  "Start": "Démarrer",
  "Stop": "Arrêter",
  "Save": "Enregistrer",
  "Cancel": "Annuler",
  "Done": "Terminé",
  "Close": "Fermer",
  "Back to my path": "Retour à mon parcours",
  "Got it — let's play!": "Compris — jouons !",
  "Ready to play?": "Prêt à jouer ?",
  "Continue": "Continuer",
  "Switch instrument": "Changer d'instrument",
  "Ready for your first lesson": "Prêt pour votre première leçon",
  "First notes, first wins.": "Premières notes, premières victoires.",
  "Pick a recorder to start your very first lessons — fingerings, notes, and your first sounds.": "Choisissez un instrument pour commencer vos premières leçons — doigtés, notes et vos premiers sons.",
  "Practice today to start a streak!": "Pratiquez aujourd'hui pour commencer une série !",
  "No badges yet": "Aucun badge pour l'instant",
  "Focus areas": "Points à travailler",
  "Learn a couple of notes first.": "Apprenez quelques notes d'abord.",
  "How many can you get?": "Combien pouvez-vous en avoir ?",
  "Finish a couple of lessons to unlock the timed drills.": "Terminez quelques leçons pour débloquer les exercices chronométrés.",
  "Sight-reading": "Lecture à vue",
  "Finger gym": "Gymnastique des doigts",
  "See a note on the staff, name it fast.": "Voyez une note sur la portée, nommez-la vite.",
  "See a note name, match its fingering fast.": "Voyez le nom de la note, trouvez le bon doigté vite.",
  "Which note is this?": "Quelle est cette note ?",
  "Which fingering plays this note?": "Quel doigté joue cette note ?",
  "Play again": "Rejouer",
  "Back": "Retour",
  "Instruments": "Instruments",
  "No practice recorded yet — play a lesson to start the report.": "Aucune pratique enregistrée — jouez une leçon pour commencer le rapport.",
  "New here? Make your first sound": "Nouveau ? Faites votre premier son",
  "Warm up your sound": "Échauffez votre son",
  "Practice drills": "Exercices de pratique",
  "Timed games to build speed and confidence.": "Jeux chronométrés pour gagner en vitesse et confiance.",
  "Learn 2 notes to unlock timed drills.": "Apprenez 2 notes pour débloquer les exercices chronométrés.",
  "Sight Reading Challenge": "Défi de lecture à vue",
  "How this app works": "Comment fonctionne cette app",
  "Review this note": "Réviser cette note",
  "Meet your next note": "Rencontrez votre prochaine note",
  "Fingering": "Doigté",
  "On the staff": "Sur la portée",
  "Sheet music": "Partition",
  "Note": "Note",
  "of": "de",
  "Prev": "Précédent",
  "Next": "Suivant",
  "Replay": "Rejouer",
  "Play whole melody": "Jouer la mélodie entière",
  "No notes to show yet.": "Aucune note à afficher pour l'instant.",
  "Student name": "Nom de l'élève",
  "Save": "Enregistrer",
  "Reset progress": "Réinitialiser le progrès",
  "Switch instrument": "Changer d'instrument",
  "My path": "Mon parcours",
  "Continue": "Continuer",
  "notes": "notes",
  "songs": "chansons",
  "Your Stats": "Vos statistiques",
  "Total XP": "XP total",
  "Lessons done": "Leçons terminées",
  "Day streak": "Jours consécutifs",
  "Per instrument": "Par instrument",
  "Recent activity": "Activité récente",
  "Clear analytics data": "Effacer les données d'analyse",
  "Play again": "Rejouer",
  "Badges": "Badges",
  "Focus:": "Focus :",
  "Tune": "Accorder",
  "Count-in": "Compte",
  "Stop": "Arrêter",
  "Start": "Démarrer",
  "Lessons": "Leçons",
  "Hear it": "Entendre",
  "Play note": "Jouer la note",
  "Hear the model": "Entendre le modèle",
  "Listen to how it sounds...": "Écoutez comme ça sonne...",
  "Listen...": "Écoutez...",
  "Get ready...": "Préparez-vous...",
  "Go!": "Allez !",
  "Try again": "Réessayez",
  "Next note": "Note suivante",
  "Skip": "Passer",
  "Hint": "Indice",
  "Practice": "Pratique",
  "Practice report": "Rapport de pratique",
  "Quick tour": "Visite rapide",
  "First sound": "Premier son",
  "Back to": "Retour à",
  "Back to my path": "Retour à mon parcours",
  "Got it — let's play!": "Compris — jouons !",
  "Ready,": "Prêt,",
  "You're set up on": "Vous êtes configuré sur",
  "Pick up where you left off.": "Continuez où vous vous êtes arrêté.",
  "Continue": "Continuer",
  "Ready for your first lesson": "Prêt pour votre première leçon",
  "notes": "notes",
  "songs": "chansons",
  "First notes, first wins.": "Premières notes, premières victoires.",
  "Language": "Langue",
  "Welcome to Preludio Band!": "Bienvenue au Preludio Band !",
};

const PT_EXTRA = {
  "+ Import Song": "+ Importar canção",
  "16ths": "Semicolcheias",
  "8ths": "Colcheias",
  "A quick guide to your first sound, before note one.": "Um guia rápido para o seu primeiro som, antes da primeira nota.",
  "A side key": "Chave lateral de Lá",
  "A — valves 1 and 2.": "Lá — válvulas 1 e 2.",
  "Aim slightly down, as if blowing across the top of a bottle.": "Direcione o ar um pouco para baixo, como se soprasse sobre a boca de uma garrafa.",
  "All done — nice work!": "Tudo pronto — bom trabalho!",
  "Almost There": "Quase lá",
  "Alto Sax": "Sax alto",
  "Appearance": "Aparência",
  "Audio analysis not supported here.": "Análise de áudio não suportada aqui.",
  "Audio failed to load.": "Falha ao carregar o áudio.",
  "Back": "Voltar",
  "Beats": "Tempos",
  "Beep": "Bipe",
  "Blow a steady, focused airstream and hold a clear tone.": "Sopre uma coluna de ar constante e focada e sustente um som claro.",
  "Blow a thin, steady stream of air across the tone hole.": "Sopre um fio de ar fino e constante sobre o buraco de sopro.",
  "Blow warm, fast air — like fogging up a window — and hold a steady tone.": "Sopre ar quente e rápido — como embaçar uma janela — e sustente um som firme.",
  "Bounce Back": "Volta por cima",
  "Buzz through the instrument — rest the mouthpiece, never press hard.": "Vibre através do instrumento — apoie o bocal, nunca aperte com força.",
  "C — open, the 8th partial.": "Dó — solta, o 8º harmônico.",
  "Call & response": "Chamada e resposta",
  "Check your pitch against the floating tuner.": "Confira a afinação com o afinador flutuante.",
  "Clear all lesson progress and XP for all instruments. This cannot be undone.": "Apaga todo o progresso das aulas e o XP de todos os instrumentos. Esta ação não pode ser desfeita.",
  "Click": "Clique",
  "Click sound": "Som do clique",
  "Climb the Ladder": "Subindo a escada",
  "Continue": "Continuar",
  "Continue to quiz": "Continuar para o quiz",
  "Copy failed — try Print instead.": "Falha ao copiar — tente imprimir.",
  "Copy recap": "Copiar recapitulação",
  "Copy summary": "Copiar resumo",
  "Could not access the microphone.": "Não foi possível acessar o microfone.",
  "Could not play the recording.": "Não foi possível reproduzir a gravação.",
  "Count-in…": "Contagem…",
  "Daily practice (minutes)": "Prática diária (minutos)",
  "Day streak": "Sequência de dias",
  "Deep Down": "Lá no fundo",
  "Delete imported song": "Excluir canção importada",
  "Done": "Pronto",
  "Ear training": "Treino auditivo",
  "Error reading file.": "Erro ao ler o arquivo.",
  "Euph.": "Eufônio",
  "Export MusicXML": "Exportar MusicXML",
  "E♭ key": "Chave de Mi♭",
  "Faster": "Mais rápido",
  "Finger gym": "Academia de dedos",
  "Fingering": "Digitação",
  "Fingering chart": "Tabela de digitação",
  "Finish a couple of lessons to unlock the timed drills.": "Conclua algumas aulas para liberar os exercícios cronometrados.",
  "Finish the previous note first.": "Termine a nota anterior primeiro.",
  "Firm your bottom lip over the bottom teeth like a cushion.": "Firme o lábio de baixo sobre os dentes de baixo, como uma almofada.",
  "First Song": "Primeira canção",
  "First Song: Complete a song": "Primeira canção: conclua uma canção",
  "First Steps": "Primeiros passos",
  "First Steps: Complete your first lesson": "Primeiros passos: conclua sua primeira aula",
  "Flat Third": "Terça bemol",
  "Fr. Horn": "Trompa",
  "Fri": "Sex",
  "Full Octave": "Oitava completa",
  "Full Octave: Learn all 8 notes on an instrument": "Oitava completa: aprenda as 8 notas de um instrumento",
  "Gently set the mouthpiece on your lips and buzz again.": "Apoie o bocal com delicadeza nos lábios e vibre de novo.",
  "Get ready...": "Prepare-se...",
  "Goal Getter": "Meta batida",
  "Goal Getter: Reach your weekly practice goal": "Meta batida: alcance sua meta semanal de prática",
  "Golden Ear": "Ouvido de ouro",
  "Golden Ear: Echo a phrase by ear, note for note": "Ouvido de ouro: repita uma frase de ouvido, nota por nota",
  "Got it — let’s play!": "Entendi — vamos tocar!",
  "HALF": "MEIO",
  "Half-hole": "Meio buraco",
  "Hear a short phrase, then echo it back — by ear.": "Ouça uma frase curta e repita — de ouvido.",
  "Hear a target note": "Ouvir uma nota-alvo",
  "Hear it": "Ouvir",
  "Hear the model": "Ouvir o modelo",
  "Hide for now": "Ocultar por enquanto",
  "Hide weekly progress": "Ocultar o progresso semanal",
  "High and Low": "Agudo e grave",
  "I played it!": "Toquei!",
  "If there is no crow, open your jaw and use more air. If it is tight and pinched, relax your lips around the reed.": "Se a palheta não \"cantar\", abra a mandíbula e use mais ar. Se estiver apertado e esganiçado, relaxe os lábios ao redor da palheta.",
  "Instruments": "Instrumentos",
  "Learn a couple of notes first.": "Aprenda algumas notas primeiro.",
  "Learn two notes to unlock ear training.": "Aprenda duas notas para liberar o treino auditivo.",
  "Left little finger": "Mindinho esquerdo",
  "Lesson complete!": "Aula concluída!",
  "Level": "Nível",
  "Listen for a clear, hollow whistle — that is your sound.": "Ouça um assobio claro e oco — esse é o seu som.",
  "Look up any note's fingering and sound.": "Consulte a digitação e o som de qualquer nota.",
  "Make your first buzz": "Faça seu primeiro zumbido",
  "Make your first sound": "Faça seu primeiro som",
  "Marathon": "Maratona",
  "Marathon: Practice for 30 minutes in total": "Maratona: pratique 30 minutos no total",
  "Meet your next note": "Conheça sua próxima nota",
  "Metronome / Tuner": "Metrônomo / Afinador",
  "Metronome / tuner": "Metrônomo / afinador",
  "Metronome and tuner": "Metrônomo e afinador",
  "Metronome volume": "Volume do metrônomo",
  "Microphone not available for tuning.": "Microfone indisponível para afinação.",
  "Microphone not available here.": "Microfone indisponível aqui.",
  "Microphone unavailable.": "Microfone indisponível.",
  "Minutes": "Minutos",
  "Mon": "Seg",
  "New": "Novo",
  "New badges this week": "Novas insígnias esta semana",
  "New here? Make your first sound": "Novo por aqui? Faça seu primeiro som",
  "Next": "Próximo",
  "Next ›": "Próximo ›",
  "Nice. Tap Start to try again, or confirm below.": "Muito bem. Toque em Iniciar para tentar de novo ou confirme abaixo.",
  "No badges yet": "Nenhuma insígnia ainda",
  "No buzz? Tighten the corners and speed up the air. Thin or pinched? Relax the middle of your lips.": "Sem zumbido? Firme os cantos e acelere o ar. Som fino ou apertado? Relaxe o meio dos lábios.",
  "No new badges this week": "Nenhuma insígnia nova esta semana",
  "No notes to show yet.": "Ainda não há notas para mostrar.",
  "No practice logged this week — pick a lesson to start.": "Nenhuma prática registrada esta semana — escolha uma aula para começar.",
  "No practice recorded yet — play a lesson to start the report.": "Nenhuma prática registrada ainda — toque uma aula para iniciar o relatório.",
  "No score yet": "Sem pontuação ainda",
  "No sound? Re-aim a little lower and use faster air. Stay relaxed — do not press or bite.": "Sem som? Mire um pouco mais para baixo e use um ar mais rápido. Fique relaxado — não aperte nem morda.",
  "No valves. Faster air.": "Sem válvulas. Ar mais rápido.",
  "Not quite — try again.": "Quase — tente de novo.",
  "Note": "Nota",
  "Now place the reed on the instrument and take it a little at a time.": "Agora coloque a palheta no instrumento e introduza-a aos poucos.",
  "Octave Leap": "Salto de oitava",
  "On a Roll": "Embalado",
  "On a Roll: Practice 3 days in a row": "Embalado: pratique 3 dias seguidos",
  "On a brass instrument the sound starts with your lips, not the metal. Get a buzz first — the instrument just makes it louder.": "Em um instrumento de metal, o som começa nos seus lábios, não no metal. Primeiro obtenha o zumbido — o instrumento só o deixa mais forte.",
  "On the staff": "Na pauta",
  "Open the floating metronome and tuner.": "Abra o metrônomo e o afinador flutuantes.",
  "POSITION": "POSIÇÃO",
  "Planner": "Planejador",
  "Planner: Finish a full practice plan": "Planejador: conclua um plano de prática completo",
  "Play again": "Jogar novamente",
  "Play it on your instrument": "Toque no seu instrumento",
  "Play note": "Tocar nota",
  "Play now!": "Toque agora!",
  "Playing…": "Tocando…",
  "Practice drills": "Exercícios de prática",
  "Practice report": "Relatório de prática",
  "Practice today to start a streak!": "Pratique hoje para começar uma sequência!",
  "Preset…": "Predefinições…",
  "Print": "Imprimir",
  "Progress reset.": "Progresso zerado.",
  "Quick Fingers": "Dedos ágeis",
  "Quick Fingers: Score 15 in a Finger gym sprint": "Dedos ágeis: faça 15 pontos em um sprint da Academia de dedos",
  "Quick tour": "Tour rápido",
  "Reach Higher": "Mais alto ainda",
  "Record yourself and compare with the model.": "Grave-se e compare com o modelo.",
  "Register key": "Chave de registro",
  "Relax your lips into a soft \"ooo\" shape.": "Relaxe os lábios em um formato suave de \"uuu\".",
  "Report copied to clipboard.": "Relatório copiado para a área de transferência.",
  "Reset all progress": "Zerar todo o progresso",
  "Reset all progress for all instruments? This cannot be undone.": "Zerar todo o progresso de todos os instrumentos? Esta ação não pode ser desfeita.",
  "Reset progress": "Zerar progresso",
  "Rest your top teeth on the mouthpiece.": "Apoie os dentes de cima no bocal.",
  "Review complete!": "Revisão concluída!",
  "Right-thumb key": "Chave do polegar direito",
  "Rising Star": "Estrela em ascensão",
  "Rising Star: Earn 500 XP": "Estrela em ascensão: ganhe 500 XP",
  "Roll your lips slightly over your teeth to cushion the reed.": "Dobre levemente os lábios sobre os dentes para amortecer a palheta.",
  "Sat": "Sáb",
  "Save": "Salvar",
  "Score": "Pontuação",
  "Second left little finger key": "Segunda chave do mindinho esquerdo",
  "See a note name, match its fingering fast.": "Veja o nome da nota e encontre a digitação rápido.",
  "See a note on the staff, name it fast.": "Veja uma nota na pauta e diga o nome rápido.",
  "Shape your lips into a firm \"mmm\" — corners tight, middle relaxed.": "Dê aos lábios um formato firme de \"mmm\" — cantos firmes, meio relaxado.",
  "Sharp Turn": "Curva do sustenido",
  "Sheet music": "Partitura",
  "Sight-reading": "Leitura à primeira vista",
  "Skip the tour": "Pular o tour",
  "Soak the reed in water so it is soft and ready.": "Deixe a palheta de molho na água para ficar macia e pronta.",
  "Song complete!": "Canção concluída!",
  "Song not found.": "Canção não encontrada.",
  "Squeaks mean the reed is too far in or your lip is too tight. No sound? Use more air and loosen your jaw.": "Guinchos indicam que a palheta está muito para dentro ou que o lábio está muito apertado. Sem som? Use mais ar e relaxe a mandíbula.",
  "Start listening": "Começar a ouvir",
  "Student name": "Nome do aluno",
  "Sun": "Dom",
  "Switch between the light \"paper\" theme and the dark theme.": "Alterne entre o tema claro \"papel\" e o tema escuro.",
  "Switch to dark theme": "Mudar para o tema escuro",
  "Switch to light theme": "Mudar para o tema claro",
  "Take a big breath and blow a fast, steady stream of air.": "Respire fundo e sopre um fluxo de ar rápido e constante.",
  "Take in the mouthpiece: about a third of it on clarinet, more on saxophone.": "Coloque o bocal na boca: cerca de um terço no clarinete e mais no saxofone.",
  "Take just the reed and blow — it should crow like a duck call.": "Pegue só a palheta e sopre — ela deve soar como um chamado de pato.",
  "Tap": "Marcar",
  "Tap Start, then play along on the count.": "Toque em Iniciar e toque junto com a contagem.",
  "Tap play, then follow along with the recording.": "Toque em Play e acompanhe a gravação.",
  "Tap the notes in the order you heard them.": "Toque nas notas na ordem em que você as ouviu.",
  "Tempo preset": "Andamento predefinido",
  "The flute makes sound when a thin stream of air splits across the tone hole — not by blowing into it.": "A flauta soa quando um fino fio de ar se divide ao passar pelo buraco de sopro — e não soprando dentro dele.",
  "The reed vibrates to make your sound. A good reed setup and a warm, fast airstream are everything.": "A palheta vibra para produzir o som. Uma boa montagem da palheta e um ar quente e rápido são tudo.",
  "The two reeds vibrate together. Start by making the reed \"crow\" on its own, then play it on the instrument.": "As duas palhetas vibram juntas. Comece fazendo a palheta \"cantar\" sozinha, com um som agudo e estridente, e depois toque no instrumento.",
  "This week in music": "Esta semana na música",
  "Thu": "Qui",
  "Thumb": "Polegar",
  "Time signature": "Fórmula de compasso",
  "Tip": "Dica",
  "Top Note": "Nota mais aguda",
  "Top of the Range": "Topo da extensão",
  "Triplets": "Tercinas",
  "Try another": "Tentar outra",
  "Tue": "Ter",
  "Tuner": "Afinador",
  "Turn your head so the air reaches the far edge of the hole.": "Vire a cabeça para o ar alcançar a borda mais distante do buraco.",
  "Unit 1 · First Notes": "Unidade 1 · Primeiras notas",
  "Valves 1 and 2.": "Válvulas 1 e 2.",
  "Wed": "Qua",
  "Week Strong": "Semana firme",
  "Week Strong: Practice 7 days in a row": "Semana firme: pratique 7 dias seguidos",
  "Weekly digest": "Resumo semanal",
  "Weekly goal": "Meta semanal",
  "Weekly recap copied.": "Resumo semanal copiado.",
  "Welcome! This is a one-minute tour of how the app works. You can skip it and replay it any time from your lesson map.": "Boas-vindas! Este é um tour de um minuto sobre como o app funciona. Você pode pulá-lo e repeti-lo quando quiser, no mapa de aulas.",
  "Wet the reed, then line its tip up with the mouthpiece tip.": "Umedeça a palheta e alinhe a ponta dela com a ponta do bocal.",
  "Which note does this fingering play?": "Qual nota esta digitação toca?",
  "Wood": "Madeira",
  "You got the basics down!": "Você dominou o básico!",
  "You should hear a buzzy, brassy hum from your lips.": "Você deve ouvir um zumbido metálico saindo dos lábios.",
  "Your drills will favour the notes you miss most.": "Seus exercícios vão priorizar as notas que você mais erra.",
  "Your notes": "Suas notas",
  "in tune ✓": "afinado ✓",
  "— A key worked by your right thumb, such as the bassoon low Bb, F#, or G#.": "— Uma chave acionada pelo polegar direito, como o Si♭ grave, o Fá♯ ou o Sol♯ do fagote.",
  "— A second key in the left little-finger group. It adds the low B or Bb that the main key cannot reach alone.": "— Uma segunda chave do grupo do mindinho esquerdo. Acrescenta o Si ou Si♭ grave que a chave principal não alcança sozinha.",
  "— A second key in the right little-finger group. Your right pinky rests here for the low E-flat; the low C uses the other pinky key.": "— Uma segunda chave do grupo do mindinho direito. O mindinho direito descansa aqui para o Mi♭ grave; o Dó grave usa a outra chave do mindinho.",
  "— An auxiliary key worked by your left pinky. On some notes it doubles as a resonance key.": "— Uma chave auxiliar acionada pelo mindinho esquerdo. Em algumas notas também funciona como chave de ressonância.",
  "— Roll your left index finger so the hole is only half covered. This vent is needed for certain middle-register notes.": "— Role o indicador esquerdo para o buraco ficar só meio coberto. Essa abertura é necessária para algumas notas do registro médio.",
  "— The octave (speaker) key just above the thumb — press it to jump up into the higher register.": "— A chave de oitava (speaker) logo acima do polegar — pressione para saltar ao registro mais agudo.",
  "— The throat A key, worked by your left index finger — it opens the clarinet’s A and G# in the upper register.": "— A chave de Lá da garganta, acionada pelo indicador esquerdo — abre o Lá e o Sol♯ do clarinete no registro agudo.",
  "— Your left thumb. It covers the back hole on recorder, works the thumb key on other woodwinds, or the Bb lever on flute.": "— Seu polegar esquerdo. Cobre o buraco de trás na flauta doce, aciona a chave do polegar nos outros instrumentos de madeira ou a alavanca de Si♭ na flauta.",
  "‹ Prev": "‹ Anterior",
  "⏺ Record yourself": "⏺ Grave-se",
  "▶ My take": "▶ Minha gravação",
  "▶ Play whole melody": "▶ Tocar a melodia inteira",
  "▶ Play with recording": "▶ Tocar com a gravação",
  "▶ Replay count-in": "▶ Repetir a contagem",
  "▶ Start": "▶ Iniciar",
  "▶ Start count-in": "▶ Iniciar a contagem",
  "❔ How this app works": "❔ Como este app funciona",
  "🌙 Dark theme": "🌙 Tema escuro",
  "🎧 Listen & match": "🎧 Ouvir e combinar",
  "🎼 Fingering chart": "🎼 Tabela de digitação",
  "👂 Golden ear! Perfect echo.": "👂 Ouvido de ouro! Eco perfeito.",
  "📈 Your week in music is ready!": "📈 Sua semana na música está pronta!",
  "📋 Progress report": "📋 Relatório de progresso",
  "🔊 Hear a target note": "🔊 Ouvir uma nota-alvo",
  "🔊 Hear it": "🔊 Ouvir"
};

Object.assign(TRANSLATIONS.pt, Object.fromEntries(Object.entries(PT_EXTRA).filter(([k]) => !(k in TRANSLATIONS.pt))));

const PT_INSTRUMENTS = { 'Flute': 'Flauta', 'Clarinet': 'Clarinete', 'Alto Sax': 'Sax alto', 'Oboe': 'Oboé', 'Bassoon': 'Fagote',
  'Trumpet': 'Trompete', 'Trombone': 'Trombone', 'Fr. Horn': 'Trompa', 'Euph.': 'Eufônio', 'Tuba': 'Tuba' };
const ptInst = s => PT_INSTRUMENTS[s] || t(s);
const ptNote = s => {
  const m = s.trim().match(/^([A-G])([#b♯♭]?)(\d*)$/);
  if (!m) return s;
  const acc = m[2] === 'b' ? '♭' : m[2] === '#' ? '♯' : m[2];
  return (NOTE_TO_SOLFEGE_PT[m[1]] || m[1]) + acc + m[3];
};
const PT_HEAD = { 'Practice': 'Prática', 'Fingering chart': 'Tabela de digitação', 'First sound': 'Primeiro som' };
const PT_PATTERNS = [
  [/^Badges · (\d+)\/(\d+)$/, (a, b) => `Insígnias · ${a}/${b}`],
  [/^(\d+) min to reach your (\d+)-minute goal$/, (a, b) => `${a} min para atingir sua meta de ${b} minutos`],
  [/^You're set up on ([^.]+)$/, n => `Você escolheu: ${ptInst(n)}`],
  [/^Learn (\d+) notes to unlock timed drills\.$/, n => `Aprenda ${n} notas para liberar os exercícios cronometrados.`],
  [/^(Practice|Fingering chart|First sound) · (.+)$/, (k, n) => `${PT_HEAD[k]} · ${ptInst(n)}`],
  [/^(\d+) of (\d+) notes learned$/, (a, b) => `${a} de ${b} notas aprendidas`],
  [/^New — (\d+) correct$/, n => `Novo — ${n} acertos`],
  [/^Note (\d+) of (\d+)$/, (a, b) => `Nota ${a} de ${b}`],
  [/^(\d+) of (\d+) on first try$/, (a, b) => `${a} de ${b} de primeira`],
  [/^Sounds as concert (.+) \((.+) instrument\)\.$/, (n, i) => `Soa como ${ptNote(n)} de concerto (instrumento em ${ptNote(i)}).`],
  [/^Ready, (.+)\?$/, n => `Pronto, ${n}?`],
  [/^Best: (\d+) names · (\d+) fingerings$/, (a, b) => `Melhor: ${a} nomes · ${b} digitações`],
  [/^Best: (.+)$/, n => `Melhor: ${n}`],
  [/^Listening for (.+)$/, n => `Ouvindo a nota ${n}`],
  [/^Turn on your microphone and the app hears whether (.+) is right — green means you nailed it\.$/, n => `Ligue o microfone e o app ouve se ${n} está certo — verde significa que você acertou.`],
  [/^(\d+)\/(\d+) notes · (\d+)\/(\d+) songs$/, (a, b, c, d) => `${a}/${b} notas · ${c}/${d} canções`],
  [/^(\S+) Plan complete! \+(\d+) XP$/, (i, n) => `${i} Plano concluído! +${n} XP`],
  [/^(\S+) Badge unlocked: (.+)$/, (i, n) => `${i} Insígnia desbloqueada: ${t(n)}`],
  [/^(.+) is coming soon!$/, n => `${n} em breve!`],
  [/^Imported "(.+)"$/, n => `Importado "${n}"`],
  [/^Import error: (.+)$/, n => `Erro ao importar: ${n}`],
];
// Full translation of one line: exact entry or solfege (t), then anchored patterns.
function tx(str) {
  if (typeof str !== 'string' || LANG !== 'pt') return str;
  const trimmed = str.trim();
  if (!trimmed) return str;
  const hit = t(trimmed);
  if (hit !== trimmed) return str.replace(trimmed, hit);
  for (const [re, fn] of PT_PATTERNS) {
    const m = trimmed.match(re);
    if (m) return str.replace(trimmed, fn(...m.slice(1)));
  }
  return str;
}
function ptTranslateText(node) {
  const p = node.parentElement;
  if (!p || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(p.tagName)) return;
  if (p.closest && p.closest('[translate="no"]')) return;
  const v = node.nodeValue, out = tx(v);
  if (out !== v) node.nodeValue = out;
}
const PT_ATTRS = ['title', 'aria-label', 'placeholder', 'alt'];
function ptTranslateAttrs(el) {
  for (const a of PT_ATTRS) {
    const v = el.getAttribute && el.getAttribute(a);
    if (v && v.trim()) { const out = tx(v); if (out !== v) el.setAttribute(a, out); }
  }
}
function ptTranslateSubtree(root) {
  if (!root) return;
  if (root.nodeType === 3) { ptTranslateText(root); return; }
  if (root.nodeType !== 1) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n; while ((n = w.nextNode())) ptTranslateText(n);
  ptTranslateAttrs(root);
  root.querySelectorAll('[title],[aria-label],[placeholder],[alt]').forEach(ptTranslateAttrs);
}
let _ptObserver = null;
function ptStartObserver() {
  if (_ptObserver || typeof MutationObserver === 'undefined' || !document.body) return;
  _ptObserver = new MutationObserver(records => {
    if (LANG !== 'pt') return;
    for (const r of records) {
      if (r.type === 'childList') r.addedNodes.forEach(ptTranslateSubtree);
      else if (r.type === 'characterData') ptTranslateText(r.target);
      else if (r.type === 'attributes') ptTranslateAttrs(r.target);
    }
  });
  _ptObserver.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: PT_ATTRS });
}
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ptStartObserver);
  else ptStartObserver();
}

