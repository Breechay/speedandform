// Exact editorial previews, not screenshots of transient plan state.
// Run with sharp installed, or CODEX_PRIMARY_RUNTIME_NODE_MODULES pointing to it.
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url);
let sharp;
try { sharp = require('sharp'); }
catch { sharp = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'sharp')); }
const cards = [
  ['plans', 'PLANS', ['See how the', 'work builds.'], 'Free to read. Free to run.', 'Training with purpose, in sequence.', true],
  ['labs', 'LIVING STUDIES', ['The work.', 'The response.'], 'The next decision.', 'Two open questions. Individual responses.'],
  ['race-pace-durability', 'HALF MARATHON · 15 WEEKS', ['Race Pace', 'Durability'], 'Broken → continuous → late', '5 → 6 → 8 → 12 continuous miles · final 12 inside 16'],
  ['raise-the-ceiling-plan', 'SIX-WEEK PLAN', ['Raise the', 'Ceiling'], 'Tuesday · Thursday · Saturday', 'Simon + Lisa · Individual working bands · One 10K'],
  ['speed-that-endures', 'LIVING STUDY', ['Speed That', 'Endures'], 'How much of the pace can you keep?', 'José + Hope · The work, the response and what changes'],
  ['raise-the-ceiling-study', 'LIVING STUDY', ['Raise the', 'Ceiling'], 'How much more speed is available?', 'Simon + Lisa · Six weeks · A 10K read']
];
const esc = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;');
await mkdir('og', { recursive: true });
for (const [name, label, lines, question, detail, paper] of cards) {
  const bg = paper ? '#ece6da' : '#07110f', ink = paper ? '#11100e' : '#f2f4ef';
  const muted = paper ? '#5f5a52' : '#adb7b2', accent = paper ? ink : '#c9ff36';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <rect width="1200" height="630" fill="${bg}"/>
    <g font-family="DejaVu Sans, sans-serif" fill="${ink}">
      <text x="64" y="82" font-size="30" font-weight="bold" letter-spacing="-2">FORM<tspan fill="${accent}">.</tspan></text>
      <text x="64" y="152" font-size="16" letter-spacing="3" fill="${muted}">${esc(label)}</text>
      <text x="60" y="260" font-size="84" letter-spacing="-4" font-weight="bold">${esc(lines[0])}</text>
      <text x="60" y="350" font-size="84" letter-spacing="-4" font-weight="bold">${esc(lines[1])}</text>
      <text x="64" y="420" font-size="28" fill="${accent}">${esc(question)}</text>
      <path d="M64 476 H1136" stroke="${muted}" stroke-opacity=".3"/>
      <text x="64" y="527" font-size="21" fill="${muted}">${esc(detail)}</text>
      <text x="64" y="576" font-size="15" fill="${muted}">speedandform.com</text>
    </g></svg>`;
  await sharp(Buffer.from(svg)).png().toFile(`og/${name}.png`);
}
console.log(`Built ${cards.length} previews at 1200 × 630.`);
