// THE WORLD TODAY — Wednesday 25 November 2026.
// A newspaper front page drawn from scratch in Node 22 (standard library
// only) and written as a 1024x1024 PNG. No network, no fonts, no images:
// every letter is plotted from the hand-built 5x7 bitmap font below and
// every picture is drawn from rectangles, lines and circles, so two runs
// produce byte-identical output.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const W = 1024;
const H = 1024;

type RGB = [number, number, number];

// Palette: newsprint on cream paper.
const PAPER: RGB = [247, 241, 222];
const INK: RGB = [26, 26, 26];
const RED: RGB = [168, 30, 30];
const BLUE: RGB = [29, 78, 137];
const SKY: RGB = [190, 216, 235];
const PURPLE: RGB = [106, 61, 154];
const YELLOW: RGB = [242, 194, 0];
const WHITE: RGB = [255, 255, 255];
const GREY: RGB = [120, 118, 110];
const LIGHT: RGB = [233, 226, 205];
const GREEN: RGB = [46, 125, 50];
const ORANGE: RGB = [230, 120, 30];
const DARKBLUE: RGB = [18, 52, 96];

// A 5x7 bitmap font, designed by hand for this program. Each glyph is 7
// rows of 5 cells; '#' is ink, '.' is blank.
const FONT: Record<string, string[]> = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  a: ['.....', '.....', '.###.', '....#', '.####', '#...#', '.####'],
  b: ['#....', '#....', '####.', '#...#', '#...#', '#...#', '####.'],
  c: ['.....', '.....', '.###.', '#....', '#....', '#...#', '.###.'],
  d: ['....#', '....#', '.####', '#...#', '#...#', '#...#', '.####'],
  e: ['.....', '.....', '.###.', '#...#', '#####', '#....', '.###.'],
  f: ['..##.', '.#...', '.#...', '####.', '.#...', '.#...', '.#...'],
  g: ['.....', '.####', '#...#', '#...#', '.####', '....#', '.###.'],
  h: ['#....', '#....', '####.', '#...#', '#...#', '#...#', '#...#'],
  i: ['..#..', '.....', '.##..', '..#..', '..#..', '..#..', '.###.'],
  j: ['...#.', '.....', '..##.', '...#.', '...#.', '...#.', '.##..'],
  k: ['#....', '#....', '#..#.', '#.#..', '##...', '#.#..', '#..#.'],
  l: ['.##..', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  m: ['.....', '.....', '##.#.', '#.#.#', '#.#.#', '#.#.#', '#.#.#'],
  n: ['.....', '.....', '####.', '#...#', '#...#', '#...#', '#...#'],
  o: ['.....', '.....', '.###.', '#...#', '#...#', '#...#', '.###.'],
  p: ['.....', '.....', '####.', '#...#', '#...#', '####.', '#....'],
  q: ['.....', '.....', '.####', '#...#', '#...#', '.####', '....#'],
  r: ['.....', '.....', '#.##.', '##..#', '#....', '#....', '#....'],
  s: ['.....', '.....', '.####', '#....', '.###.', '....#', '####.'],
  t: ['.#...', '.#...', '####.', '.#...', '.#...', '.#...', '..##.'],
  u: ['.....', '.....', '#...#', '#...#', '#...#', '#..##', '.##.#'],
  v: ['.....', '.....', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  w: ['.....', '.....', '#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'],
  x: ['.....', '.....', '#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
  y: ['.....', '.....', '#...#', '#...#', '.####', '....#', '.###.'],
  z: ['.....', '.....', '#####', '...#.', '..#..', '.#...', '#####'],
  '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  '3': ['#####', '...#.', '..#..', '...#.', '....#', '#...#', '.###.'],
  '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '6': ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
  '.': ['.....', '.....', '.....', '.....', '.....', '.##..', '.##..'],
  ',': ['.....', '.....', '.....', '.....', '.##..', '..#..', '.#...'],
  ':': ['.....', '.##..', '.##..', '.....', '.##..', '.##..', '.....'],
  ';': ['.....', '.##..', '.##..', '.....', '.##..', '..#..', '.#...'],
  '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
  '-': ['.....', '.....', '.....', '.###.', '.....', '.....', '.....'],
  "'": ['..#..', '..#..', '.#...', '.....', '.....', '.....', '.....'],
  '"': ['.#.#.', '.#.#.', '.#.#.', '.....', '.....', '.....', '.....'],
  '(': ['...#.', '..#..', '.#...', '.#...', '.#...', '..#..', '...#.'],
  ')': ['.#...', '..#..', '...#.', '...#.', '...#.', '..#..', '.#...'],
  '%': ['##..#', '##.#.', '...#.', '..#..', '.#...', '#.##.', '#..##'],
  '/': ['....#', '...#.', '...#.', '..#..', '.#...', '.#...', '#....'],
  '&': ['.##..', '#..#.', '#.#..', '.#...', '#.#.#', '#..#.', '.##.#'],
  '$': ['..#..', '.####', '#.#..', '.###.', '..#.#', '####.', '..#..'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
  '=': ['.....', '.....', '#####', '.....', '#####', '.....', '.....'],
  '*': ['.....', '..#..', '#.#.#', '.###.', '#.#.#', '..#..', '.....'],
  '#': ['.#.#.', '.#.#.', '#####', '.#.#.', '#####', '.#.#.', '.#.#.'],
  '[': ['.###.', '.#...', '.#...', '.#...', '.#...', '.#...', '.###.'],
  ']': ['.###.', '...#.', '...#.', '...#.', '...#.', '...#.', '.###.'],
  _: ['.....', '.....', '.....', '.....', '.....', '.....', '#####'],
  '<': ['...#.', '..#..', '.#...', '#....', '.#...', '..#..', '...#.'],
  '>': ['.#...', '..#..', '...#.', '....#', '...#.', '..#..', '.#...'],
};

// ---- canvas: a plain RGB buffer ----
const px = new Uint8Array(W * H * 3);

function setPix(x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
}

function rect(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) setPix(i, j, c);
  }
}

function outline(x: number, y: number, w: number, h: number, c: RGB, t = 1): void {
  rect(x, y, w, t, c);
  rect(x, y + h - t, w, t, c);
  rect(x, y, t, h, c);
  rect(x + w - t, y, t, h, c);
}

function hline(x: number, y: number, len: number, c: RGB, t = 1): void {
  rect(x, y, len, t, c);
}

function vline(x: number, y: number, len: number, c: RGB, t = 1): void {
  rect(x, y, t, len, c);
}

// Bresenham line.
function line(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    setPix(x, y, c);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

// Filled circle.
function circle(cx: number, cy: number, r: number, c: RGB): void {
  for (let y = -r; y <= r; y++) {
    const dx = Math.floor(Math.sqrt(r * r - y * y));
    for (let x = -dx; x <= dx; x++) setPix(cx + x, cy + y, c);
  }
}

// Filled triangle (scanline fill between the two edges).
function tri(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: RGB): void {
  const minY = Math.min(y0, y1, y2);
  const maxY = Math.max(y0, y1, y2);
  for (let y = minY; y <= maxY; y++) {
    const xs: number[] = [];
    const edges: [number, number, number, number][] = [
      [x0, y0, x1, y1],
      [x1, y1, x2, y2],
      [x2, y2, x0, y0],
    ];
    for (const [ax, ay, bx, by] of edges) {
      if ((ay <= y && by > y) || (by <= y && ay > y)) {
        xs.push(ax + ((y - ay) * (bx - ax)) / (by - ay));
      }
    }
    if (xs.length >= 2) {
      const a = Math.min(...xs);
      const b = Math.max(...xs);
      for (let x = Math.ceil(a); x <= Math.floor(b); x++) setPix(x, y, c);
    }
  }
}

// ---- text ----
const CELL = 6; // glyph advance in font cells (5 + 1 spacing)

function glyphOf(ch: string): string[] {
  return FONT[ch] ?? FONT[' ']!;
}

function textWidth(s: string, scale: number): number {
  return s.length * CELL * scale;
}

function drawText(s: string, x: number, y: number, scale: number, c: RGB): void {
  let cx = x;
  for (const ch of s) {
    const g = glyphOf(ch);
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r]![col] === '#') {
          rect(cx + col * scale, y + r * scale, scale, scale, c);
        }
      }
    }
    cx += CELL * scale;
  }
}

function drawTextCentered(s: string, cx: number, y: number, scale: number, c: RGB): void {
  drawText(s, cx - Math.floor(textWidth(s, scale) / 2), y, scale, c);
}

// Greedy word wrap to a pixel width.
function wrap(s: string, maxW: number, scale: number): string[] {
  const words = s.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur === '' ? w : cur + ' ' + w;
    if (textWidth(next, scale) <= maxW || cur === '') {
      cur = next;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur !== '') lines.push(cur);
  return lines;
}

// Draw a wrapped paragraph; returns the y just below the last line.
function drawPara(s: string, x: number, y: number, maxW: number, scale: number, c: RGB, lh: number): number {
  const lines = wrap(s, maxW, scale);
  for (const ln of lines) {
    drawText(ln, x, y, scale, c);
    y += lh;
  }
  return y;
}

// A small numbered badge and a red kicker line, as a newspaper section head.
function sectionHead(num: string, kicker: string, x: number, y: number): void {
  rect(x, y, 20, 20, RED);
  drawText(num, x + 7, y + 3, 2, WHITE);
  drawText(kicker, x + 28, y + 3, 2, RED);
}

// ---- layout: a newspaper front page ----
// Paper and double frame.
rect(0, 0, W, H, PAPER);
outline(12, 12, 1000, 1000, INK, 2);
outline(18, 18, 988, 988, INK, 1);

// Masthead.
drawTextCentered('THE WORLD TODAY', 512, 34, 7, INK);
hline(30, 92, 964, INK, 2);
drawTextCentered('WEDNESDAY 25 NOVEMBER 2026', 512, 100, 4, RED);
hline(30, 134, 964, INK, 1);
hline(30, 137, 964, INK, 2);
drawTextCentered('FIVE STORIES FROM FIVE CORNERS OF THE WORLD', 512, 148, 2, INK);
hline(30, 168, 964, GREY, 1);

// ---- 1. Lead story: Shenzhou-24 ----
sectionHead('1', 'SPACE - CHINA AND PAKISTAN', 48, 188);
drawText('SHENZHOU-24 LIFTS OFF', 48, 214, 4, INK);
drawText('WITH PAKISTAN ABOARD', 48, 248, 4, INK);
drawPara(
  "China's Shenzhou-24 launched at 8:18 a.m. Beijing time from Jiuquan, carrying Tang Hongbo, Wu Yi and Pakistan's Muhammad Zeeshan Ali - the first Pakistani in orbit and the first foreign astronaut to visit the Tiangong station.",
  48, 288, 648, 2, INK, 18,
);
hline(48, 386, 648, GREY, 1);
drawText('JIUQUAN - 8:18 A.M. - LONG MARCH 2F', 48, 392, 2, INK);

// Rocket illustration (right of the lead story).
rect(720, 184, 256, 216, SKY);
outline(720, 184, 256, 216, INK, 1);
drawText('JIUQUAN', 732, 194, 2, BLUE);
circle(748, 218, 2, WHITE);
circle(950, 220, 2, WHITE);
circle(760, 300, 2, YELLOW);
circle(940, 320, 2, WHITE);
circle(730, 360, 2, WHITE);
// Launch tower.
rect(872, 210, 10, 184, GREY);
hline(844, 240, 28, GREY, 3);
hline(844, 300, 28, GREY, 3);
hline(844, 350, 28, GREY, 3);
// Rocket body, nose, window, band and fins.
rect(800, 240, 44, 110, WHITE);
outline(800, 240, 44, 110, INK, 1);
tri(800, 240, 844, 240, 822, 196, RED);
circle(822, 272, 8, INK);
circle(822, 272, 6, SKY);
rect(800, 318, 44, 12, RED);
tri(800, 330, 778, 372, 800, 372, RED);
tri(844, 330, 866, 372, 844, 372, RED);
// Flame and ground.
tri(806, 350, 838, 350, 822, 392, ORANGE);
tri(812, 350, 832, 350, 822, 380, YELLOW);
hline(720, 394, 256, INK, 3);

hline(30, 424, 964, INK, 2);

// ---- 2. Australia - Solomon Islands security pact ----
sectionHead('2', 'THE PACIFIC - SECURITY', 48, 440);
drawText('AUSTRALIA SIGNS', 48, 468, 3, INK);
drawText('SECURITY PACT', 48, 494, 3, INK);
drawText('WITH SOLOMONS', 48, 520, 3, INK);
drawPara(
  "Australia and Solomon Islands signed a security pact in Canberra on Wednesday. Australia is now the islands' preferred defence partner, with a bigger role in policing.",
  48, 548, 436, 2, INK, 18,
);
// Two small flags: Australia, then Solomon Islands. The Australian
// flag keeps its Union Jack inside the canton (top-left quarter),
// with the large Federation Star below it and the Southern Cross
// on the fly; the Solomons flag is a blue triangle of stars over
// green, split by a yellow diagonal.
rect(48, 646, 72, 36, BLUE);
outline(48, 646, 72, 36, INK, 1);
line(48, 646, 83, 663, WHITE);
line(83, 646, 48, 663, WHITE);
hline(48, 652, 36, WHITE, 6);
vline(63, 646, 18, WHITE, 6);
hline(48, 654, 36, RED, 2);
vline(64, 646, 18, RED, 2);
circle(66, 673, 3, WHITE);
circle(112, 652, 2, WHITE);
circle(108, 660, 2, WHITE);
circle(116, 672, 2, WHITE);
circle(104, 674, 2, WHITE);
rect(132, 646, 72, 36, BLUE);
tri(132, 682, 204, 646, 204, 682, GREEN);
line(132, 682, 204, 646, YELLOW);
line(133, 682, 204, 647, YELLOW);
outline(132, 646, 72, 36, INK, 1);
circle(146, 656, 2, WHITE);
circle(158, 652, 2, WHITE);
circle(170, 656, 2, WHITE);
circle(152, 664, 2, WHITE);
circle(164, 664, 2, WHITE);

// ---- 3. Asian tech sell-off ----
sectionHead('3', 'MARKETS - ASIA', 540, 440);
drawText('ASIAN TECH SHARES', 540, 468, 3, INK);
drawText('TUMBLE IN AI SELL-OFF', 540, 494, 3, INK);
drawPara(
  "In early trading on Wednesday, Korea's KOSPI fell 4.5%, Japan's Nikkei fell 2.5% and Taiwan fell more than 3%.",
  540, 522, 436, 2, INK, 18,
);
// Falling bars: KOSPI -4.5%, Nikkei -2.5%, TSMC -5%.
const bars: [number, string, string, number][] = [
  [612, 'KOSPI', '-4.5%', 45],
  [758, 'NIKKEI', '-2.5%', 25],
  [904, 'TSMC', '-5%', 50],
];
for (const [cx, name, val, h] of bars) {
  drawTextCentered(name, cx, 598, 2, INK);
  drawTextCentered(val, cx, 612, 2, RED);
  rect(cx - 27, 630, 54, h, RED);
}
hline(540, 630, 436, INK, 2);

vline(512, 436, 246, GREY, 1);

hline(30, 694, 964, INK, 2);

// ---- 4. Sydney CBD gas leak ----
sectionHead('4', 'SYDNEY - CITY', 48, 710);
drawText('SYDNEY STREETS SHUT', 48, 738, 3, INK);
drawText('BY MAJOR GAS LEAK', 48, 764, 3, INK);
drawPara(
  "Busy streets in Sydney's central business district were closed on Wednesday after a major gas leak. Elizabeth St, Market St and King St were shut as HAZMAT fire crews moved in. No casualties were mentioned.",
  48, 792, 436, 2, INK, 18,
);
// Hazard barrier and a traffic cone.
rect(48, 910, 352, 22, YELLOW);
outline(48, 910, 352, 22, INK, 1);
for (let x = 48; x < 400; x += 28) rect(x, 910, 14, 22, INK);
tri(430, 932, 470, 932, 450, 906, ORANGE);
rect(442, 918, 16, 6, WHITE);
rect(424, 932, 52, 4, ORANGE);

// ---- 5. Nayi Chetna 5.0 (India) ----
sectionHead('5', 'INDIA - SOCIETY', 540, 710);
drawText('NAYI CHETNA 5.0', 540, 738, 3, INK);
drawText('TO LAUNCH TODAY', 540, 764, 3, INK);
drawPara(
  "India is to launch the fifth Nayi Chetna gender campaign on Wednesday, the International Day for the Elimination of Violence against Women. It runs to 23 December, focused on women's economic agency, safety and shared care work.",
  540, 792, 436, 2, INK, 18,
);
// Purple date strip for the campaign.
rect(540, 924, 436, 18, PURPLE);
drawTextCentered('25 NOV - 23 DEC 2026', 758, 927, 2, WHITE);

// ---- footer: sources and the day ----
hline(30, 956, 964, INK, 1);
drawText('Sources: Reuters (Northland News Radio, SRN News), Traders Union,', 30, 964, 2, INK);
drawText('Daily Fox News, YourStory. All events of Wednesday 25 November 2026.', 30, 982, 2, INK);

// ---- PNG encoder (deterministic: fixed filters, fixed zlib level) ----
const CRC_TABLE: number[] = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE.push(c >>> 0);
}

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function encodePNG(): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'entry.png'), encodePNG());
