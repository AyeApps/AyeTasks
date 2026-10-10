#!/usr/bin/env node
// Guardián de estilos. Falla (exit 1) si aparece un color, fuente, espaciado, radio o borde escrito
// a mano fuera de src/constants/theme.ts. Reglas en GEMINI.md (raíz del repo).
//
// Uso (desde mobile/):
//   npm run lint:styles            -> solo líneas nuevas/modificadas respecto a HEAD (+ archivos sin trackear)
//   npm run lint:styles -- --all   -> reporte completo de todo src/ y App.tsx (deuda existente incluida)
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..'); // mobile/
const ALL = process.argv.includes('--all');

// Archivos donde los literales están permitidos
const SKIP = new Set([
  'src/constants/theme.ts', // única fuente de verdad
  'src/i18n/translations.ts',
]);

const RULES = [
  { name: 'color hex (usa colors.* de useTheme())', re: /['"`]#[0-9a-fA-F]{3,8}['"`]/ },
  { name: 'color rgb/hsl (usa colors.* de useTheme())', re: /['"`](?:rgba?|hsla?)\(/ },
  {
    name: 'color con nombre (usa colors.*)',
    re: /\b(?:color|backgroundColor|borderColor|border(?:Top|Bottom|Left|Right)Color|tintColor|shadowColor|placeholderTextColor|fill|stroke)\s*[:=]\s*\{?\s*['"](?:white|black|red|green|blue|orange|yellow|gray|grey)['"]/,
  },
  { name: 'THEME.colors es siempre DARK (usa colors de useTheme())', re: /\bTHEME\.colors\b/ },
  { name: 'fontFamily literal (usa THEME.fonts.*)', re: /\bfontFamily\s*:\s*(?!THEME\.fonts\.)(?:['"`]|Platform\.)/ },
  {
    name: 'espaciado literal (usa THEME.spacing.*)',
    re: /\b(?:padding|margin)(?:Top|Bottom|Left|Right|Horizontal|Vertical|Start|End)?\s*:\s*(?:4|8|16|24|32|48)\b(?!\.)|\b(?:gap|rowGap|columnGap)\s*:\s*(?:4|8|16|24|32|48)\b(?!\.)/,
  },
  { name: 'radio literal (usa THEME.radius.*)', re: /\bborder(?:\w*)Radius\s*:\s*(?:2|4|6)\b(?!\.)/ },
  { name: 'borde literal (usa THEME.borders.*)', re: /\bborder(?:Top|Bottom|Left|Right)?Width\s*:\s*(?:1|2)\b(?!\.)/ },
  { name: 'fontSize literal (usa THEME.text.*)', re: /\bfontSize\s*:\s*\d/ },
  { name: 'fontWeight literal (usa THEME.weight.*)', re: /\bfontWeight\s*:\s*['"`](?:\d00|bold|normal)['"`]/ },
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?)$/.test(name) && !/\.(test|spec)\./.test(name)) out.push(relative(ROOT, p));
  }
  return out;
}

function inScope(f) {
  return (f.startsWith('src/') || f === 'App.tsx') && /\.(tsx?|jsx?)$/.test(f) && !SKIP.has(f);
}

// Quita comentarios conservando los saltos de línea (para no perder números de línea)
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ''))
    .replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');
}

// { archivo: Set(líneas) } con las líneas añadidas respecto a HEAD; null = revisar todo el archivo
function changedLines() {
  const sh = (c) => execSync(c, { cwd: ROOT, encoding: 'utf8' });
  const prefix = sh('git rev-parse --show-prefix').trim(); // "mobile/"
  const map = new Map();
  const diff = sh('git diff -U0 --no-color HEAD -- .');
  let file = null;
  for (const line of diff.split('\n')) {
    const f = line.match(/^\+\+\+ b\/(.*)$/);
    if (f) { file = f[1].startsWith(prefix) ? f[1].slice(prefix.length) : null; continue; }
    const h = line.match(/^@@ -\S+ \+(\d+)(?:,(\d+))? @@/);
    if (h && file) {
      const start = +h[1], count = h[2] === undefined ? 1 : +h[2];
      if (!map.has(file)) map.set(file, new Set());
      for (let i = 0; i < count; i++) map.get(file).add(start + i);
    }
  }
  for (const f of sh('git ls-files --others --exclude-standard -- .').split('\n').filter(Boolean)) map.set(f, null);
  return map;
}

const targets = ALL
  ? new Map([...walk(join(ROOT, 'src')), 'App.tsx'].map((f) => [f, null]))
  : changedLines();

let violations = 0;
for (const [file, lines] of [...targets].sort()) {
  if (!inScope(file)) continue;
  let src;
  try { src = readFileSync(join(ROOT, file), 'utf8'); } catch { continue; } // borrado
  stripComments(src).split('\n').forEach((text, i) => {
    const n = i + 1;
    if (lines && !lines.has(n)) return;
    const errs = RULES.filter((r) => r.re.test(text)).map((r) => r.name);
    if (errs.length) {
      violations++;
      console.log(`${file}:${n}  [${errs.join(', ')}]  ${text.trim().slice(0, 110)}`);
    }
  });
}

const scope = ALL ? 'en todo el proyecto' : 'en líneas nuevas/modificadas';
console.log(
  violations
    ? `\nFALLA: ${violations} línea(s) con valores escritos a mano ${scope}. Usa los tokens de src/constants/theme.ts (ver GEMINI.md).`
    : `OK: sin colores, fuentes, espaciados, radios ni bordes escritos a mano ${scope}.`
);
process.exit(violations ? 1 : 0);
