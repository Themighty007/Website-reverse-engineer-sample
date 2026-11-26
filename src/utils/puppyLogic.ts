export interface SketchGeometry {
  mask: string;
  outline: string;
  retrace: string;
  wash: string;
  doodles: { d: string; color: string; width: number }[];
  tilt: string;
}

export function createSeededRandom(seedStr: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function round1(n: number): number {
  return Math.round(10 * n) / 10;
}

export function catmullRomClosedPath(pts: [number, number][], tension = 0.22): string {
  const len = pts.length;
  let d = `M ${round1(pts[0][0])} ${round1(pts[0][1])}`;
  for (let i = 0; i < len; i++) {
    const p0 = pts[(i - 1 + len) % len];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % len];
    const p3 = pts[(i + 2) % len];
    const c1x = p1[0] + (p2[0] - p0[0]) * tension;
    const c1y = p1[1] + (p2[1] - p0[1]) * tension;
    const c2x = p2[0] - (p3[0] - p1[0]) * tension;
    const c2y = p2[1] - (p3[1] - p1[1]) * tension;
    d += ` C ${round1(c1x)} ${round1(c1y)}, ${round1(c2x)} ${round1(c2y)}, ${round1(p2[0])} ${round1(p2[1])}`;
  }
  return `${d} Z`;
}

function buildOvalPoints(
  rng: () => number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  steps: number,
  jitter: number
): [number, number][] {
  const phase1 = rng() * Math.PI * 2;
  const phase2 = rng() * Math.PI * 2;
  const amp1 = (rng() - 0.5) * jitter * 0.9;
  const amp2 = (rng() - 0.5) * jitter * 0.7;
  const pts: [number, number][] = [];
  for (let i = 0; i < steps; i++) {
    const theta = (i / steps) * Math.PI * 2 - Math.PI / 2;
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    const rFactor = Math.pow(Math.pow(Math.abs(c), 2.5) + Math.pow(Math.abs(s), 2.5), -0.4);
    const offset =
      Math.sin(2 * theta + phase1) * amp1 +
      Math.cos(3 * theta + phase2) * amp2 +
      (rng() - 0.5) * jitter;
    pts.push([cx + c * (rx * rFactor + offset), cy + s * (ry * rFactor + offset)]);
  }
  return pts;
}

function buildDoodleStar(cx: number, cy: number, size: number): string {
  const inner = 0.26 * size;
  return `M ${round1(cx)} ${round1(cy - size)} Q ${round1(cx + inner)} ${round1(cy - inner)} ${round1(cx + size)} ${round1(cy)} Q ${round1(cx + inner)} ${round1(cy + inner)} ${round1(cx)} ${round1(cy + size)} Q ${round1(cx - inner)} ${round1(cy + inner)} ${round1(cx - size)} ${round1(cy)} Q ${round1(cx - inner)} ${round1(cy - inner)} ${round1(cx)} ${round1(cy - size)} Z`;
}

function buildDoodleHeart(cx: number, cy: number, size: number, tiltDeg: number): string {
  const rad = (tiltDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const pt = (x: number, y: number) =>
    `${round1(cx + (x * cos - y * sin) * size)} ${round1(cy + (x * sin + y * cos) * size)}`;
  return `M ${pt(0, 0.35)} C ${pt(-0.1, -0.55)}, ${pt(-1.15, -0.25)}, ${pt(-0.6, 0.45)} C ${pt(-0.3, 0.82)}, ${pt(-0.05, 0.95)}, ${pt(0, 1.1)} C ${pt(0.05, 0.95)}, ${pt(0.3, 0.82)}, ${pt(0.6, 0.45)} C ${pt(1.15, -0.25)}, ${pt(0.1, -0.55)}, ${pt(0, 0.35)} Z`;
}

function buildDoodleLoop(cx: number, cy: number, size: number, angle: number): string {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const pt = (x: number, y: number) =>
    `${round1(cx + (x * c - y * s) * size)} ${round1(cy + (x * s + y * c) * size)}`;
  return `M ${pt(-1, 0.2)} C ${pt(-0.3, -0.9)}, ${pt(0.6, -0.9)}, ${pt(0.3, 0.1)} C ${pt(0.05, 0.85)}, ${pt(-0.6, 0.4)}, ${pt(0.1, -0.2)} C ${pt(0.6, -0.6)}, ${pt(1, -0.1)}, ${pt(1.1, 0.3)}`;
}

const DOODLE_ANCHORS: [number, number][] = [
  [24, 34],
  [296, 34],
  [22, 344],
  [298, 344],
  [20, 190],
  [300, 190],
];

const DOODLE_COLORS = ['#c2622b', '#f2be6b', '#e07a5f'];

export function generateSketchGeometry(slug: string): SketchGeometry {
  const rng = createSeededRandom(slug);
  const basePts = buildOvalPoints(rng, 160, 190, 128, 156, 14, 10);
  const retracePts = basePts.map(([x, y]): [number, number] => [
    x + 4.4 * (rng() - 0.5),
    y + 4.4 * (rng() - 0.5),
  ]);
  const washPts = buildOvalPoints(
    rng,
    160 + (rng() - 0.5) * 12,
    192 + (rng() - 0.5) * 12,
    136,
    163,
    12,
    14
  );

  const count = 2 + Math.floor(2 * rng());
  const usedIndices = new Set<number>();
  const doodles: { d: string; color: string; width: number }[] = [];

  for (let i = 0; i < count; i++) {
    let idx = Math.floor(rng() * DOODLE_ANCHORS.length);
    while (usedIndices.has(idx)) {
      idx = (idx + 1) % DOODLE_ANCHORS.length;
    }
    usedIndices.add(idx);
    const [ax, ay] = DOODLE_ANCHORS[idx];
    const cx = ax + (rng() - 0.5) * 10;
    const cy = ay + (rng() - 0.5) * 12;
    const kind = rng();
    const color = DOODLE_COLORS[i % DOODLE_COLORS.length];
    if (kind < 0.38) {
      doodles.push({ d: buildDoodleStar(cx, cy, 8 + 4 * rng()), color, width: 1.8 });
    } else if (kind < 0.74) {
      doodles.push({
        d: buildDoodleHeart(cx, cy - 4, 9 + 3 * rng(), (rng() - 0.5) * 28),
        color,
        width: 1.9,
      });
    } else {
      doodles.push({
        d: buildDoodleLoop(cx, cy, 10 + 3 * rng(), rng() * Math.PI * 2),
        color,
        width: 2,
      });
    }
  }

  return {
    mask: catmullRomClosedPath(basePts, 0.22),
    outline: catmullRomClosedPath(basePts, 0.22),
    retrace: catmullRomClosedPath(retracePts, 0.22),
    wash: catmullRomClosedPath(washPts, 0.24),
    doodles,
    tilt: `${round1((rng() - 0.5) * 2.4)}deg`,
  };
}

export interface PuppyFilterCriteria {
  origin?: string | null;
  breed?: string | null;
  gender?: string | null;
  collection?: string | null;
}

export interface FilterablePuppy {
  slug: string;
  origin: string;
  collection: string;
  breedSlug: string;
  gender: string;
  [key: string]: any;
}

export function filterPuppies<T extends FilterablePuppy>(
  puppies: T[],
  criteria: PuppyFilterCriteria
): T[] {
  const { origin, breed, gender, collection } = criteria;
  return puppies.filter((p) => {
    if (origin && p.origin !== origin) return false;
    if (collection && p.collection !== collection) return false;
    if (breed && p.breedSlug !== breed) return false;
    if (gender && p.gender !== gender && p.gender !== 'pair') return false;
    return true;
  });
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function filterFaqs(faqs: FaqItem[], query: string): FaqItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return faqs;
  return faqs.filter(
    (item) =>
      item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)
  );
}

export function tokenizeHighlight(
  text: string,
  query: string
): { text: string; highlight: boolean }[] {
  const q = query.trim();
  if (!q) return [{ text, highlight: false }];
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  const qLower = q.toLowerCase();
  return parts
    .filter((p) => p.length > 0)
    .map((part) => ({
      text: part,
      highlight: part.toLowerCase() === qLower,
    }));
}

export function validateEnquiry(input: { name: string; phone: string }): {
  valid: boolean;
  error: string | null;
} {
  const name = (input.name || '').trim();
  const phone = (input.phone || '').trim();
  if (!name) {
    return { valid: false, error: 'Please sign your name at the bottom.' };
  }
  if (!phone) {
    return { valid: false, error: 'Please leave a phone or WhatsApp number so we can write back.' };
  }
  return { valid: true, error: null };
}

export function validateEnquiryForm(input: {
  name: string;
  phone: string;
  email?: string;
  area?: string;
  puppyId?: string;
  message?: string;
  website?: string;
}): {
  ok: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  if ((input.website || '').trim()) {
    errors.website = 'Spam detected';
  }
  const name = (input.name || '').trim();
  const phone = (input.phone || '').trim();
  const email = (input.email || '').trim();
  if (name.length < 2) {
    errors.name = 'Please enter your name (at least 2 characters).';
  }
  if (phone.length < 6) {
    errors.phone = 'Please enter a valid phone or WhatsApp number.';
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }
  return {
    ok: Object.keys(errors).length === 0,
    errors,
  };
}

export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function smoothstep(v: number): number {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
}

export interface Point2D {
  x: number;
  y: number;
}

export function evalCubicBezier(
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  t: number
): Point2D {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
}
