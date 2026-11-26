import React, { useEffect, useRef } from 'react';
import { clamp01, evalCubicBezier, smoothstep } from '../utils/puppyLogic';

function buildToePath(cx: number, cy: number, rx: number, ry: number, deg: number): string {
  const rad = (deg * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const pt = (x: number, y: number) =>
    `${(cx + x * c - y * s).toFixed(2)} ${(cy + x * s + y * c).toFixed(2)}`;
  const k = 0.5523;
  return (
    `M${pt(rx, 0)}` +
    `C${pt(rx, k * ry)} ${pt(k * rx, ry)} ${pt(0, ry)}` +
    `C${pt(-k * rx, ry)} ${pt(-rx, k * ry)} ${pt(-rx, 0)}` +
    `C${pt(-rx, -k * ry)} ${pt(-k * rx, -ry)} ${pt(0, -ry)}` +
    `C${pt(k * rx, -ry)} ${pt(rx, -k * ry)} ${pt(rx, 0)}Z`
  );
}

export const PAW_PATH =
  'M32 30.5c-7.6 0-15.6 8.3-15.6 15.5 0 5.4 4.2 8.3 9.2 8.3 2.6 0 4.5-1.1 6.4-1.1s3.8 1.1 6.4 1.1c5 0 9.2-2.9 9.2-8.3 0-7.2-8-15.5-15.6-15.5z' +
  buildToePath(14.6, 29.2, 5.3, 6.9, -28) +
  buildToePath(24.2, 16.6, 5.5, 7.3, -10) +
  buildToePath(39.8, 16.6, 5.5, 7.3, 10) +
  buildToePath(49.4, 29.2, 5.3, 6.9, 28);

export function PawIcon({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden={!title || undefined}
      role={title ? 'img' : undefined}
      fill="currentColor"
    >
      {title ? <title>{title}</title> : null}
      <path d={PAW_PATH} />
    </svg>
  );
}

function buildFluffyShape(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  lobes: number,
  puff: number,
  startAngle = -Math.PI / 2,
  rotDeg = 0
): string {
  const rad = (rotDeg * Math.PI) / 180;
  const pt = (theta: number, dr: number) => {
    const x = Math.cos(theta) * (rx + dr);
    const y = Math.sin(theta) * (ry + (ry / rx) * dr);
    return `${(cx + x * Math.cos(rad) - y * Math.sin(rad)).toFixed(1)} ${(
      cy +
      x * Math.sin(rad) +
      y * Math.cos(rad)
    ).toFixed(1)}`;
  };
  let d = '';
  for (let i = 0; i < lobes; i++) {
    const a0 = startAngle + (i / lobes) * Math.PI * 2;
    const a1 = startAngle + ((i + 1) / lobes) * Math.PI * 2;
    const mid = (a0 + a1) / 2;
    d += `${i === 0 ? `M${pt(a0, 0)}` : ''}Q${pt(mid, 2.1 * puff)} ${pt(a1, 0)}`;
  }
  return `${d}Z`;
}

export const PUP_COLORS = {
  blush: '#f9b9a6',
  collar: '#a24a1a',
  eyeY: 98,
  fur: '#f2be6b',
  cream: '#fbe3b4',
  furDark: '#e4a352',
  groundY: 228,
  stroke: '#2a170e',
};

export const PUP_W = 300;
export const PUP_H = 240;

const BODY_PIVOT: [number, number] = [196, 206];
export const HEAD_PIVOT: [number, number] = [212, 100];
const SHOULDER_N: [number, number] = [186, 194];
const SHOULDER_F: [number, number] = [168, 192];
const HIP_N: [number, number] = [110, 194];
const HIP_F: [number, number] = [94, 192];
const TAIL_BASE: [number, number] = [84, 150];
const EAR_L_PIVOT: [number, number] = [174, 82];
const EAR_R_PIVOT: [number, number] = [250, 82];

export const PUP_JOINTS = {
  shoulderN: SHOULDER_N,
  shoulderF: SHOULDER_F,
  hipN: HIP_N,
  hipF: HIP_F,
  tailBase: TAIL_BASE,
};

export const PUP_PARTS = {
  body: buildFluffyShape(140, 170, 64, 36, 15, 3.4, 0.95 * Math.PI),
  chest: buildFluffyShape(192, 166, 30, 32, 9, 3.2, 0.6 * Math.PI),
  tail: buildFluffyShape(70, 126, 17, 16, 9, 3.2),
  tailStem: 'M86 152 C80 146 76 140 74 136',
  haunch: buildFluffyShape(110, 204, 30, 24, 10, 3.2, Math.PI),
  haunchPaw:
    'M112 214 C126 212 142 214 146 221 C148 226 144 229 136 229 L116 229 C108 229 104 224 106 219 Z',
  head: buildFluffyShape(212, 100, 51, 46, 16, 3.6),
  topknot: buildFluffyShape(212, 52, 17, 12, 8, 2.9, Math.PI),
  earL: buildFluffyShape(170, 112, 19, 34, 10, 3.2, -Math.PI / 2, 12),
  earR: buildFluffyShape(254, 112, 19, 34, 10, 3.2, -Math.PI / 2, -12),
  muzzle:
    'M188 120 C188 106 200 100 212 100 C224 100 236 106 236 120 C236 133 225 140 212 140 C199 140 188 133 188 120 Z',
  nose: 'M204.5 111.5 Q212 107.2 219.5 111.5 Q218.2 118.4 212 120 Q205.8 118.4 204.5 111.5 Z',
  mouth:
    'M212 120 V124.5 M212 124.5 Q207.2 129.6 202.8 125.2 M212 124.5 Q216.8 129.6 221.2 125.2',
  mouthOpen: 'M203 126 Q212 122 221 126 Q219 138 212 139 Q205 138 203 126 Z',
  tongue: 'M207.6 127.4 Q212 136.6 216.4 127.4 Z',
  collar: 'M178 146 Q212 162 246 146 L246 154 Q212 170 178 154 Z',
  tag: 'M212 160 C212 156 206 155 206 159.4 C206 163 212 166.6 212 168.4 C212 166.6 218 163 218 159.4 C218 155 212 156 212 160 Z',
  ledgePaws:
    'M175 159 C175 148 181 142 190 142 C199 142 205 148 205 159 Z M219 159 C219 148 225 142 234 142 C243 142 249 148 249 159 Z',
  ledgeToes: 'M186 153 v-4.5 M194 153 v-4.5 M230 153 v-4.5 M238 153 v-4.5',
  shadow: { cx: 150, cy: 230, rx: 92, ry: 7 },
};

function buildLegPath(w: number, len: number): string {
  const hw = w / 2;
  return `M${-hw} -14 C${-hw} 4 -12 ${len - 18} -12 ${len - 9} C-12 ${len - 2} -7 ${len} 0 ${len} C9 ${len} 13 ${len - 3} 13 ${len - 9} C13 ${len - 18} ${hw} 4 ${hw} -14`;
}

export const PUP_LEGS = {
  front: buildLegPath(24, 228 - SHOULDER_N[1]),
  frontFar: buildLegPath(22, 228 - SHOULDER_F[1]),
  back: buildLegPath(30, 228 - HIP_N[1]),
  backFar: buildLegPath(28, 228 - HIP_F[1]),
};

export function legToesPath(len: number): string {
  return `M-3.5 ${len - 7} v5 M4.5 ${len - 7} v5`;
}

export interface PupPose {
  bodyRot: number;
  bodyX: number;
  bodyY: number;
  stretch: number;
  headX: number;
  headY: number;
  headRot: number;
  earL: number;
  earR: number;
  tail: number;
  fn: number;
  ff: number;
  bn: number;
  bf: number;
  sit: number;
  eyes: number;
  happy: number;
  tongue: number;
  mouth: number;
  front: number;
}

const BASE_POSE: PupPose = {
  bodyRot: 0,
  bodyX: 0,
  bodyY: 0,
  stretch: 1,
  headX: 0,
  headY: 0,
  headRot: 0,
  earL: 0,
  earR: 0,
  tail: 0,
  fn: 0,
  ff: 0,
  bn: 0,
  bf: 0,
  sit: 0,
  eyes: 1,
  happy: 0,
  tongue: 0,
  mouth: 0,
  front: 0,
};

export const PUP_POSES: Record<string, PupPose> = {
  stand: BASE_POSE,
  walk: { ...BASE_POSE, tail: -6, tongue: 1 },
  sit: { ...BASE_POSE, bodyRot: -24, bodyY: -2, headX: -10, headY: -6, tail: 34, sit: 1, tongue: 1 },
  peek: { ...BASE_POSE, headY: 4, earL: -6, earR: 6, tail: -20, front: 1, tongue: 1 },
  snug: { ...BASE_POSE, headY: 9, headRot: 4, earL: 3, earR: -3, tail: -20, front: 1, tongue: 0 },
  lie: {
    ...BASE_POSE,
    bodyRot: -5,
    bodyY: 22,
    headX: 12,
    headY: 40,
    headRot: 3,
    fn: -84,
    ff: -80,
    sit: 1,
    tail: 58,
    tongue: 0,
  },
  sleep: {
    ...BASE_POSE,
    bodyRot: -5,
    bodyY: 22,
    headX: 14,
    headY: 44,
    headRot: -8,
    fn: -84,
    ff: -80,
    sit: 1,
    tail: 64,
    eyes: 0,
    earL: 4,
    earR: -4,
  },
  settle: {
    ...BASE_POSE,
    bodyRot: -5,
    bodyY: 22,
    headX: 10,
    headY: 16,
    fn: -84,
    ff: -80,
    sit: 1,
    tail: 40,
    tongue: 1,
  },
  hop: {
    ...BASE_POSE,
    bodyRot: -9,
    stretch: 1.06,
    headY: -6,
    fn: -42,
    ff: -32,
    bn: 40,
    bf: 30,
    earL: -26,
    earR: 26,
    tail: -24,
    tongue: 1,
  },
  sniff: {
    ...BASE_POSE,
    bodyRot: 7,
    headX: 16,
    headY: 32,
    headRot: 9,
    tail: -14,
    fn: 6,
    ff: 4,
  },
  bow: {
    ...BASE_POSE,
    bodyRot: 15,
    bodyY: 2,
    headX: 14,
    headY: 30,
    fn: -58,
    ff: -52,
    tail: -32,
    happy: 1,
    tongue: 1,
  },
  beg: {
    ...BASE_POSE,
    bodyRot: -36,
    bodyY: -6,
    headX: -18,
    headY: -18,
    sit: 1,
    fn: -70,
    ff: -64,
    tail: 30,
    happy: 1,
    tongue: 1,
  },
};

const POSE_KEYS = Object.keys(BASE_POSE) as (keyof PupPose)[];

export function lerpPose(a: PupPose, b: PupPose, t: number): PupPose {
  const out = { ...a };
  for (const k of POSE_KEYS) {
    out[k] = a[k] + (b[k] - a[k]) * t;
  }
  return out;
}

export interface PupMotionState {
  phase: number;
  stride: number;
  time: number;
  wag: number;
  gazeX: number;
  gazeY: number;
  blink: number;
  ear: number;
}

export const DEFAULT_PUP_MOTION: PupMotionState = {
  phase: 0,
  stride: 0,
  time: 0,
  wag: 0,
  gazeX: 0,
  gazeY: 0,
  blink: 0,
  ear: 0,
};

const r2 = (n: number) => Math.round(100 * n) / 100;
const rotAt = (deg: number, [x, y]: [number, number]) => `rotate(${r2(deg)} ${x} ${y})`;

export function evalPupRig(e: PupPose, t: PupMotionState = DEFAULT_PUP_MOTION) {
  const h = Math.sin(t.phase);
  const f = Math.sin(t.phase + Math.PI);
  const u = 20 + 10 * t.stride;
  const p = (1 - Math.cos(2 * t.phase)) / 2;
  const g = +(t.stride > 0.01);
  const m = Math.sin(2.4 * t.time) * (1 - g);
  const w = e.bodyY - p * (2.5 + 4 * t.stride) * g + 0.6 * m;
  const v = e.bodyRot + 1.6 * Math.sin(t.phase) * g;
  const j = -e.bodyRot;
  const M = 5 + 17 * t.wag;
  const k = 1.2 + 2.6 * t.wag;
  const tailAngle = e.tail + Math.sin(t.time * k * Math.PI * 2) * M;
  const headBob = -((1 - Math.cos(2 * t.phase - 0.7)) / 2) * (2 + 3 * t.stride) * g + 0.9 * m;

  return {
    body: `translate(${r2(e.bodyX)} ${r2(w)}) ${rotAt(v, BODY_PIVOT)} translate(${BODY_PIVOT[0]} 0) scale(${r2(e.stretch)} 1) translate(${-BODY_PIVOT[0]} 0)`,
    fn: `translate(${SHOULDER_N[0]} ${SHOULDER_N[1]}) rotate(${r2(e.fn + j + h * u * g)})`,
    ff: `translate(${SHOULDER_F[0]} ${SHOULDER_F[1]}) rotate(${r2(e.ff + j + f * u * g)})`,
    bn: `translate(${HIP_N[0]} ${HIP_N[1]}) rotate(${r2(e.bn + f * u * g)})`,
    bf: `translate(${HIP_F[0]} ${HIP_F[1]}) rotate(${r2(e.bf + h * u * g)})`,
    tail: rotAt(tailAngle, TAIL_BASE),
    haunch: `translate(0 ${r2(-(0.06 * e.bodyRot))})`,
    head: `translate(${r2(e.headX)} ${r2(e.headY + headBob)}) ${rotAt(
      e.headRot + 1.4 * Math.sin(t.phase) * g,
      HEAD_PIVOT
    )}`,
    earL: rotAt(e.earL + t.ear + 4 * Math.sin(2 * t.phase) * g, EAR_L_PIVOT),
    earR: rotAt(e.earR - t.ear - 4 * Math.sin(2 * t.phase) * g, EAR_R_PIVOT),
    eyes: `translate(${r2(3.4 * t.gazeX)} ${r2(2.6 * t.gazeY)})`,
    blink: `translate(0 ${r2(98 * t.blink * 0.92)}) scale(1 ${r2(1 - 0.92 * t.blink)})`,
    openEyes: r2(Math.max(0, e.eyes - e.happy)),
    happyEyes: r2(Math.min(e.happy, e.eyes)),
    shutEyes: r2(1 - e.eyes),
    tongue: r2(e.tongue * (1 - e.mouth)),
    mouth: r2(e.mouth),
    backLegs: r2(1 - e.sit),
    haunchOpacity: r2(e.sit * (1 - e.front)),
    side: r2(1 - e.front),
    ledge: r2(e.front),
    shadow: `translate(${r2(0.6 * e.bodyX)} 0) scale(${r2(1 - 0.05 * p * g)} 1)`,
    shadowOpacity: r2(0.12 * (1 - e.front)),
  };
}

const STROKE_BASE = {
  stroke: PUP_COLORS.stroke,
  strokeWidth: 3.4,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
};

const STROKE_NONE = {
  ...STROKE_BASE,
  fill: 'none',
};

function PupLegGroup({
  part,
  d,
  len,
  fill,
  transform,
  opacity,
}: {
  part: string;
  d: string;
  len: number;
  fill: string;
  transform: string;
  opacity?: number;
}) {
  return (
    <g data-p={part} transform={transform} opacity={opacity}>
      <path d={`${d}Z`} fill={fill} />
      <path d={d} {...STROKE_NONE} />
      <path d={legToesPath(len)} {...STROKE_NONE} strokeWidth={2.4} />
    </g>
  );
}

export function PupSvg({
  pose = 'sit',
  facing = 'right',
  className,
  label,
  style,
}: {
  pose?: string;
  facing?: 'left' | 'right';
  className?: string;
  label?: string;
  style?: React.CSSProperties;
}) {
  const p = PUP_POSES[pose] || PUP_POSES.sit;
  const f = evalPupRig(p);
  const rootTransform = facing === 'left' ? `translate(${PUP_W} 0) scale(-1 1)` : undefined;

  return (
    <svg
      viewBox={`0 0 ${PUP_W} ${PUP_H}`}
      className={className}
      style={{ overflow: 'visible', ...style }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={!label || undefined}
      focusable="false"
    >
      <g data-p="root" transform={rootTransform}>
        <ellipse
          data-p="shadow"
          {...PUP_PARTS.shadow}
          fill={PUP_COLORS.stroke}
          opacity={f.shadowOpacity}
          transform={f.shadow}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        />
        <g data-p="body" transform={f.body} opacity={f.side}>
          <PupLegGroup
            part="bf"
            d={PUP_LEGS.backFar}
            len={PUP_COLORS.groundY - 192}
            fill={PUP_COLORS.furDark}
            transform={f.bf}
            opacity={f.backLegs}
          />
          <PupLegGroup
            part="ff"
            d={PUP_LEGS.frontFar}
            len={PUP_COLORS.groundY - 192}
            fill={PUP_COLORS.furDark}
            transform={f.ff}
          />
          <g data-p="tail" transform={f.tail}>
            <path d={PUP_PARTS.tailStem} {...STROKE_NONE} strokeWidth={9} />
            <path
              d={PUP_PARTS.tailStem}
              stroke={PUP_COLORS.fur}
              strokeWidth={4}
              fill="none"
              strokeLinecap="round"
            />
            <path d={PUP_PARTS.tail} fill={PUP_COLORS.fur} {...STROKE_BASE} />
          </g>
          <PupLegGroup
            part="bn"
            d={PUP_LEGS.back}
            len={PUP_COLORS.groundY - 194}
            fill={PUP_COLORS.fur}
            transform={f.bn}
            opacity={f.backLegs}
          />
          <path d={PUP_PARTS.body} fill={PUP_COLORS.fur} {...STROKE_BASE} />
          <path d={PUP_PARTS.chest} fill={PUP_COLORS.fur} {...STROKE_BASE} />
          <PupLegGroup
            part="fn"
            d={PUP_LEGS.front}
            len={PUP_COLORS.groundY - 194}
            fill={PUP_COLORS.fur}
            transform={f.fn}
          />
        </g>
        <g data-p="haunch" opacity={f.haunchOpacity} transform={f.haunch}>
          <path d={PUP_PARTS.haunch} fill={PUP_COLORS.fur} {...STROKE_BASE} />
          <path d={PUP_PARTS.haunchPaw} fill={PUP_COLORS.fur} {...STROKE_BASE} />
          <path d="M132 222v5M139 222v5" {...STROKE_NONE} strokeWidth={2.4} />
        </g>
        <g data-p="head" transform={f.head}>
          <path d={PUP_PARTS.collar} fill={PUP_COLORS.collar} {...STROKE_BASE} strokeWidth={3} />
          <path d={PUP_PARTS.tag} fill={PUP_COLORS.cream} {...STROKE_BASE} strokeWidth={2.4} />
          <path
            data-p="earL"
            d={PUP_PARTS.earL}
            fill={PUP_COLORS.furDark}
            {...STROKE_BASE}
            transform={f.earL}
          />
          <path
            data-p="earR"
            d={PUP_PARTS.earR}
            fill={PUP_COLORS.furDark}
            {...STROKE_BASE}
            transform={f.earR}
          />
          <path d={PUP_PARTS.head} fill={PUP_COLORS.fur} {...STROKE_BASE} />
          <path d={PUP_PARTS.topknot} fill={PUP_COLORS.fur} {...STROKE_BASE} strokeWidth={3} />
          <path d={PUP_PARTS.muzzle} fill={PUP_COLORS.cream} />
          <circle cx={181} cy={116} r={7} fill={PUP_COLORS.blush} opacity={0.85} />
          <circle cx={243} cy={116} r={7} fill={PUP_COLORS.blush} opacity={0.85} />
          <g data-p="eyes" transform={f.eyes}>
            <g data-p="open" opacity={f.openEyes}>
              <g data-p="blink" transform={f.blink}>
                <ellipse cx={194} cy={PUP_COLORS.eyeY} rx={7.4} ry={8.6} fill={PUP_COLORS.stroke} />
                <ellipse cx={230} cy={PUP_COLORS.eyeY} rx={7.4} ry={8.6} fill={PUP_COLORS.stroke} />
                <circle cx={196.6} cy={PUP_COLORS.eyeY - 3.4} r={2.7} fill="#fff" />
                <circle cx={232.6} cy={PUP_COLORS.eyeY - 3.4} r={2.7} fill="#fff" />
                <circle cx={192} cy={PUP_COLORS.eyeY + 3.2} r={1.2} fill="#fff" />
                <circle cx={228} cy={PUP_COLORS.eyeY + 3.2} r={1.2} fill="#fff" />
              </g>
            </g>
          </g>
          <path
            data-p="happy"
            d="M186.5 101 Q194 91.5 201.5 101 M222.5 101 Q230 91.5 237.5 101"
            {...STROKE_NONE}
            opacity={f.happyEyes}
          />
          <path
            data-p="shut"
            d="M186.5 97 Q194 103.5 201.5 97 M222.5 97 Q230 103.5 237.5 97"
            {...STROKE_NONE}
            opacity={f.shutEyes}
          />
          <path d={PUP_PARTS.nose} fill={PUP_COLORS.stroke} />
          <path d={PUP_PARTS.mouth} {...STROKE_NONE} strokeWidth={3} />
          <path
            data-p="tongue"
            d={PUP_PARTS.tongue}
            fill="#e98c8c"
            stroke={PUP_COLORS.stroke}
            strokeWidth={2.2}
            strokeLinejoin="round"
            opacity={f.tongue}
          />
          <g data-p="mouth" opacity={f.mouth}>
            <path d={PUP_PARTS.mouthOpen} fill="#6b2a1c" {...STROKE_BASE} strokeWidth={2.6} />
            <path
              d="M206.5 133.5 Q212 130 217.5 133.5 Q215 138 212 138 Q209 138 206.5 133.5 Z"
              fill="#e98c8c"
            />
          </g>
        </g>
        <g data-p="ledge" opacity={f.ledge}>
          <path d={PUP_PARTS.ledgePaws} fill={PUP_COLORS.fur} {...STROKE_BASE} />
          <path d={PUP_PARTS.ledgeToes} {...STROKE_NONE} strokeWidth={2.4} />
        </g>
      </g>
    </svg>
  );
}

const RIG_Bindings: [string, string, string][] = [
  ['root', 'transform', 'root'],
  ['shadow', 'transform', 'shadow'],
  ['shadow', 'opacity', 'shadowOpacity'],
  ['body', 'transform', 'body'],
  ['body', 'opacity', 'side'],
  ['bf', 'transform', 'bf'],
  ['bf', 'opacity', 'backLegs'],
  ['bn', 'transform', 'bn'],
  ['bn', 'opacity', 'backLegs'],
  ['ff', 'transform', 'ff'],
  ['fn', 'transform', 'fn'],
  ['tail', 'transform', 'tail'],
  ['haunch', 'transform', 'haunch'],
  ['haunch', 'opacity', 'haunchOpacity'],
  ['head', 'transform', 'head'],
  ['earL', 'transform', 'earL'],
  ['earR', 'transform', 'earR'],
  ['eyes', 'transform', 'eyes'],
  ['open', 'opacity', 'openEyes'],
  ['blink', 'transform', 'blink'],
  ['happy', 'opacity', 'happyEyes'],
  ['shut', 'opacity', 'shutEyes'],
  ['tongue', 'opacity', 'tongue'],
  ['mouth', 'opacity', 'mouth'],
  ['ledge', 'opacity', 'ledge'],
];

const expDecay = (dt: number, tau: number) => 1 - Math.exp(-dt / tau);
const clampRange = (v: number, min = -1, max = 1) => Math.max(min, Math.min(max, v));

export class PupDriver {
  svg: SVGSVGElement;
  els = new Map<string, Element>();
  written = new Map<string, string>();
  pose: PupPose;
  target: PupPose;
  m: PupMotionState;
  facing: number;
  facingTarget: number;
  strideTarget = 0;
  wagTarget = 0.35;
  gazeTarget = { x: 0, y: 0 };
  tilt = 0;
  tiltTarget = 0;
  earV = 0;
  nextBlink = 1.2;
  blinkAt = -1;
  woofUntil = 0;
  bounce = 0;
  bounceV = 0;
  offset = 0;
  offsetTarget = 0;
  pet = 0;
  petTarget = 0;
  turn = 0.07;
  lean = 0;

  constructor(svg: SVGSVGElement, initialPose = 'sit', facing = 1) {
    this.svg = svg;
    this.m = { ...DEFAULT_PUP_MOTION };
    svg.querySelectorAll('[data-p]').forEach((el) => {
      const p = (el as HTMLElement).dataset.p;
      if (p) this.els.set(p, el);
    });
    this.pose = { ...(PUP_POSES[initialPose] || PUP_POSES.sit) };
    this.target = this.pose;
    this.facing = facing;
    this.facingTarget = facing;
  }

  setPose(pose: string | PupPose) {
    this.target = typeof pose === 'string' ? PUP_POSES[pose] || PUP_POSES.sit : pose;
  }

  jump(poseName: string, facing?: number) {
    const p = PUP_POSES[poseName] || PUP_POSES.sit;
    this.pose = { ...p };
    this.target = p;
    if (facing) {
      this.facing = this.facingTarget = facing;
    }
  }

  face(dir: number, turn = 0.07) {
    this.facingTarget = dir;
    this.turn = turn;
  }

  get facingDir() {
    return this.facingTarget;
  }

  stride(v: number) {
    this.strideTarget = clampRange(v, 0, 1);
  }

  advance(dist: number) {
    this.m.phase += (dist / 46) * Math.PI;
  }

  walkedTo(dist: number) {
    this.m.phase = (dist / 46) * Math.PI;
  }

  wag(v: number) {
    this.wagTarget = clampRange(v, 0, 1);
  }

  cock(deg: number) {
    this.tiltTarget = deg;
  }

  lookAt(pt: { x: number; y: number } | null) {
    if (!pt) {
      this.gazeTarget = { x: 0, y: 0 };
      return;
    }
    const rect = this.svg.getBoundingClientRect();
    const headX = this.facingTarget > 0 ? HEAD_PIVOT[0] : PUP_W - HEAD_PIVOT[0];
    const sx = rect.left + (headX / PUP_W) * rect.width;
    const sy = rect.top + (PUP_COLORS.eyeY / PUP_H) * rect.height;
    const dx = pt.x - sx;
    const dy = pt.y - sy;
    const dist = Math.hypot(dx, dy) || 1;
    const factor = Math.min(1, dist / 160);
    this.gazeTarget = {
      x: (dx / dist) * factor * this.facingTarget,
      y: (dy / dist) * factor,
    };
  }

  woof(now: number) {
    this.woofUntil = now + 0.34;
    this.bounceV = -150;
    this.earV += 260;
  }

  jolt(mult = 1) {
    this.earV += 220 * mult;
  }

  hop(mult = 1) {
    this.bounceV = -230 * mult;
    this.earV += 200 * mult;
  }

  yawn(now: number, dur = 0.9) {
    this.woofUntil = now + dur;
  }

  dash(offset: number) {
    this.offsetTarget = offset;
  }

  petting(active: boolean) {
    this.petTarget = active ? 1 : 0;
  }

  reset() {
    this.offsetTarget = 0;
    this.tiltTarget = 0;
    this.petTarget = 0;
  }

  tick(dt: number, now: number) {
    dt = Math.min(dt, 0.05);
    const m = this.m;
    m.time = now;
    this.pose = lerpPose(this.pose, this.target, expDecay(dt, 0.16));
    this.facing += (this.facingTarget - this.facing) * expDecay(dt, this.turn);
    m.stride += (this.strideTarget - m.stride) * expDecay(dt, 0.12);
    if (m.stride < 0.012 && this.strideTarget === 0) m.stride = 0;
    m.wag += (this.wagTarget - m.wag) * expDecay(dt, 0.4);
    m.gazeX += (this.gazeTarget.x - m.gazeX) * expDecay(dt, 0.07);
    m.gazeY += (this.gazeTarget.y - m.gazeY) * expDecay(dt, 0.07);
    this.tilt += (this.tiltTarget + 3 * m.gazeX - this.tilt) * expDecay(dt, 0.18);
    this.earV += (-150 * m.ear - 10 * this.earV) * dt;
    m.ear = clampRange(m.ear + this.earV * dt, -28, 28);
    this.bounceV += (-260 * this.bounce - 16 * this.bounceV) * dt;
    this.bounce += this.bounceV * dt;

    const prevOffset = this.offset;
    this.offset += (this.offsetTarget - this.offset) * expDecay(dt, 0.2);
    if (Math.abs(this.offsetTarget - this.offset) < 0.05) {
      this.offset = this.offsetTarget;
    }
    const dOffset = Math.abs(this.offset - prevOffset);
    if (dOffset) this.advance(dOffset);
    const dashStride = dt > 0 ? Math.min(1, dOffset / dt / 180) : 0;

    this.pet += (this.petTarget - this.pet) * expDecay(dt, 0.15);
    if (now > this.nextBlink && this.pose.eyes > 0.6) {
      this.blinkAt = now;
      this.nextBlink = now + 2.2 + 3.8 * Math.random();
      if (Math.random() < 0.18) this.nextBlink = now + 0.32;
    }
    const blinkProg = (now - this.blinkAt) / 0.15;
    m.blink = blinkProg >= 0 && blinkProg <= 1 ? Math.sin(blinkProg * Math.PI) : 0;

    const effectivePose: PupPose = {
      ...this.pose,
      headRot: this.pose.headRot + this.tilt,
      bodyRot: this.pose.bodyRot + this.lean,
      bodyY: this.pose.bodyY + this.bounce,
      headY: this.pose.headY + 1.15 * this.bounce,
      mouth: now < this.woofUntil ? 1 : this.pose.mouth,
      happy: Math.max(this.pose.happy, this.pet),
    };

    const rig = evalPupRig(
      effectivePose,
      dashStride > m.stride ? { ...m, stride: dashStride } : m
    );
    const scaleX =
      Math.abs(this.facing) < 0.02 ? 0.02 * Math.sign(this.facing || 1) : this.facing;
    const rootStr = `translate(${this.offset.toFixed(1)} 0) translate(${
      PUP_W / 2
    } 0) scale(${scaleX.toFixed(3)} 1) translate(${-PUP_W / 2} 0)`;

    for (const [elKey, attr, propKey] of RIG_Bindings) {
      const el = this.els.get(elKey);
      if (!el) continue;
      const val = propKey === 'root' ? rootStr : String((rig as any)[propKey]);
      const cacheKey = `${elKey}:${attr}`;
      if (this.written.get(cacheKey) !== val) {
        el.setAttribute(attr, val);
        this.written.set(cacheKey, val);
      }
    }
  }
}

export interface TrickContext {
  d: PupDriver;
  rest: PupPose;
  facing: number;
  say: (msg: string, dur?: number) => void;
  hearts: () => void;
}

export type TrickStep = [number, (now: number) => void];

const flipDir = (f: number) => (f === 1 ? -1 : 1);

export const PUP_TRICKS: Record<string, (ctx: TrickContext, t0: number) => TrickStep[]> = {
  woof: ({ d, say }, t0) => [
    [t0, (t) => (d.woof(t), say('woof!'))],
    [t0 + 0.42, (t) => (d.woof(t), say('woof woof!'))],
  ],
  spin: ({ d, rest, facing, say }, t0) => [
    [t0, () => (d.setPose('stand'), d.hop(0.5))],
    [t0 + 0.14, () => d.face(flipDir(facing))],
    [t0 + 0.38, () => d.face(facing)],
    [t0 + 0.62, () => d.face(flipDir(facing))],
    [t0 + 0.86, () => (d.face(facing), say('wheee!'))],
    [t0 + 1.3, () => d.setPose(rest)],
  ],
  beg: ({ d, rest, say }, t0) => [
    [t0, () => (d.setPose('beg'), d.wag(1), say('treat, please?', 1.7))],
    [t0 + 1.9, () => (d.setPose(rest), d.wag(0.7))],
  ],
  bow: ({ d, rest, say }, t0) => [
    [t0, () => (d.setPose('bow'), d.wag(1), say('play with me!'))],
    [t0 + 0.55, () => d.hop(0.45)],
    [t0 + 1.7, () => (d.setPose(rest), d.wag(0.7))],
  ],
  hop: ({ d, rest, say }, t0) => [
    [t0, () => (d.setPose('hop'), d.hop(1.1), say('boing!'))],
    [t0 + 0.36, () => d.setPose(rest)],
    [t0 + 0.62, () => (d.setPose('hop'), d.hop(0.8))],
    [t0 + 0.98, () => d.setPose(rest)],
  ],
  love: ({ d, rest, say, hearts }, t0) => [
    [t0, () => (d.setPose({ ...rest, happy: 1, tongue: 1 }), d.wag(1), hearts(), say('I like you!', 1.5))],
    [t0 + 1.9, () => (d.setPose(rest), d.wag(0.7))],
  ],
  tilt: ({ d, say }, t0) => [
    [t0, () => (d.cock(-14), say('hm?'))],
    [t0 + 0.8, () => d.cock(12)],
    [t0 + 1.6, () => d.cock(0)],
  ],
  sneeze: ({ d, say }, t0) => [
    [t0, () => d.cock(-8)],
    [t0 + 0.32, (t) => (d.cock(10), d.jolt(1.4), d.hop(0.35), d.yawn(t, 0.22), say('achoo!'))],
    [t0 + 0.8, () => d.cock(0)],
  ],
  zoomies: ({ d, rest, facing, say }, t0) => [
    [t0, () => (d.setPose('walk'), d.wag(1), say('zoomies!', 2))],
    [t0 + 0.05, () => (d.face(1), d.dash(70))],
    [t0 + 0.5, () => (d.face(-1), d.dash(-70))],
    [t0 + 0.98, () => (d.face(1), d.dash(50))],
    [t0 + 1.4, () => (d.face(-1), d.dash(-30))],
    [t0 + 1.78, () => (d.face(1), d.dash(0))],
    [t0 + 2.25, () => (d.face(facing), d.setPose(rest), d.wag(0.7))],
  ],
  peekaboo: ({ d, say }, t0) => [
    [t0, () => d.setPose({ ...PUP_POSES.peek, headY: 120 })],
    [t0 + 0.55, () => (d.setPose('peek'), d.jolt(1.2), say('peekaboo!'))],
  ],
  wake: ({ d, rest, say }, t0) => [
    [t0, (t) => (d.setPose('settle'), d.yawn(t, 0.9), say('*yaaawn*'))],
    [t0 + 1.25, () => (d.setPose({ ...PUP_POSES.settle, happy: 1 }), d.wag(0.8), say('five more minutes…', 1.6))],
    [t0 + 3.1, () => (d.setPose(rest), d.wag(0), say('zzz', 2))],
  ],
};

const TRICK_NAMES = ['woof', 'spin', 'beg', 'bow', 'hop', 'love', 'tilt', 'sneeze'];
let trickBag: string[] = [];

export function pickNextTrick(lastTrick: string | null, rapidClicks: number): string {
  if (rapidClicks >= 4) return 'zoomies';
  if (!trickBag.length) {
    trickBag = TRICK_NAMES.filter((t) => t !== lastTrick).sort(() => Math.random() - 0.5);
  }
  return trickBag.pop() || 'woof';
}

export function spawnPupHearts(container: HTMLElement, x: number, y: number) {
  for (let i = 0; i < 5; i++) {
    const span = document.createElement('span');
    span.className = 'pup-heart';
    span.textContent = '♥';
    span.style.left = `${x}px`;
    span.style.top = `${y}px`;
    container.append(span);
    const dx = (Math.random() - 0.5) * 90;
    const dy = -70 - 60 * Math.random();
    if (typeof span.animate === 'function') {
      span
        .animate(
          [
            { transform: 'translate(-50%, 0) scale(0.4)', opacity: 0 },
            { opacity: 1, offset: 0.2 },
            {
              transform: `translate(calc(-50% + ${dx.toFixed(0)}px), ${dy.toFixed(0)}px) scale(1.1)`,
              opacity: 0,
            },
          ],
          {
            duration: 1150 + 110 * i,
            delay: 80 * i,
            easing: 'cubic-bezier(.2,.7,.3,1)',
            fill: 'backwards',
          }
        )
        .finished.then(
          () => span.remove(),
          () => span.remove()
        );
    } else {
      setTimeout(() => span.remove(), 1200);
    }
  }
}

const PEEK_TRICKS = ['peekaboo', 'woof', 'tilt', 'sneeze'];
const SNUG_TRICKS = ['tilt', 'love', 'sneeze', 'woof'];

export function PupBuddy({
  pose = 'sit',
  facing = 'right',
  act,
  label,
  className = '',
  style,
  asStop = false,
}: {
  pose?: string;
  facing?: 'left' | 'right';
  act?: string;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
  asStop?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    const bubble = bubbleRef.current;
    if (!el || !bubble) return;
    const svg = el.querySelector('svg');
    if (!svg) return;

    const dir = facing === 'left' ? -1 : 1;
    const driver = new PupDriver(svg as SVGSVGElement, pose, dir);
    driver.wag(0.6);

    let queue: TrickStep[] = [];
    let lastTime = performance.now() / 1000;
    let lastIdleAt = lastTime;
    let bubbleHideAt = 0;
    let pointerPos: { x: number; y: number; t: number } | null = null;
    let lastTrick: string | null = null;
    let rapidCount = 0;
    let lastClickAt = 0;
    let playingUntil = 0;
    let isPlayingAttr = false;

    const ctx: TrickContext = {
      d: driver,
      rest: PUP_POSES[pose] || PUP_POSES.sit,
      facing: dir,
      say: (msg, dur = 1.4) => {
        bubble.textContent = msg;
        bubble.dataset.show = 'true';
        bubbleHideAt = performance.now() / 1000 + dur;
      },
      hearts: () =>
        spawnPupHearts(el, el.clientWidth * (dir > 0 ? 0.7 : 0.3), 0.25 * el.clientHeight),
    };

    let rafId = 0;
    let isActive = false;

    const loop = () => {
      if (!isActive) return;
      const now = performance.now() / 1000;
      const dt = Math.min(0.05, now - lastTime);
      lastTime = now;

      while (queue.length && queue[0][0] <= now) {
        const step = queue.shift();
        step?.[1](now);
      }

      const nowPlaying = now < playingUntil;
      if (isPlayingAttr !== nowPlaying) {
        isPlayingAttr = nowPlaying;
        el.toggleAttribute('data-playing', isPlayingAttr);
      }

      driver.lookAt(pointerPos && now - pointerPos.t < 3 ? pointerPos : null);

      if (act === 'tilt' && !queue.length) {
        const s = Math.sin(0.9 * now);
        driver.cock(s > 0.35 ? 13 : s < -0.35 ? -10 : 0);
      }

      if (!queue.length && now - lastIdleAt > 9) {
        lastIdleAt = now;
        queue =
          Math.random() < 0.5
            ? PUP_TRICKS.tilt(ctx, now)
            : [
                [now, () => driver.wag(1)],
                [now + 2.2, () => driver.wag(0.6)],
              ];
      }

      if (bubble.dataset.show === 'true' && now > bubbleHideAt) {
        bubble.dataset.show = 'false';
      }

      driver.tick(dt, now);
      rafId = requestAnimationFrame(loop);
    };

    const setRunning = (run: boolean) => {
      if (asStop && document.documentElement.dataset.pup) {
        run = false;
      }
      if (run !== isActive) {
        isActive = run;
        if (run) {
          lastTime = performance.now() / 1000;
          rafId = requestAnimationFrame(loop);
        } else {
          cancelAnimationFrame(rafId);
        }
      }
    };

    const io = new IntersectionObserver(([entry]) => setRunning(entry.isIntersecting));
    io.observe(el);

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') {
        pointerPos = { x: e.clientX, y: e.clientY, t: performance.now() / 1000 };
      }
    };

    const onClick = () => {
      const now = performance.now() / 1000;
      rapidCount = now - lastClickAt < 0.7 ? rapidCount + 1 : 1;
      lastClickAt = now;

      const subset = pose === 'peek' ? PEEK_TRICKS : pose === 'snug' ? SNUG_TRICKS : null;
      const avail = subset?.filter((k) => k !== lastTrick) ?? [];
      const chosen = subset
        ? avail[Math.floor(Math.random() * avail.length)]
        : pickNextTrick(lastTrick, rapidCount);
      lastTrick = chosen;
      driver.reset();
      queue = PUP_TRICKS[chosen](ctx, now);
      playingUntil = queue[queue.length - 1][0] + 0.4;
      lastIdleAt = now;
    };

    const onPointerEnter = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') {
        driver.petting(true);
        driver.wag(1);
      }
    };

    const onPointerLeave = () => {
      driver.petting(false);
      driver.wag(0.6);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    el.addEventListener('click', onClick);
    el.addEventListener('pointerenter', onPointerEnter);
    el.addEventListener('pointerleave', onPointerLeave);

    return () => {
      setRunning(false);
      el.removeAttribute('data-playing');
      io.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('click', onClick);
      el.removeEventListener('pointerenter', onPointerEnter);
      el.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [pose, facing, act, asStop]);

  return (
    <div
      ref={rootRef}
      className={`pup-buddy ${className}`}
      style={style}
      data-live=""
      data-facing={facing}
    >
      <PupSvg pose={pose} facing={facing} label={label} />
      <span ref={bubbleRef} aria-hidden="true" className="pup-bubble" data-show="false" />
    </div>
  );
}

export function cuePup(detail: {
  look?: Element | null;
  secs?: number;
  say?: string;
  duration?: number;
  trick?: string;
  hearts?: boolean;
}) {
  window.dispatchEvent(new CustomEvent('pup:cue', { detail }));
}

const PUP_WIDTH = PUP_W;
const PUP_ANCHOR = { x: 150, y: 228 };
const DEFAULT_BOX: [number, number, number, number] = [48, 30, 288, 236];
const POSE_BOXES: Record<string, [number, number, number, number]> = {
  sit: [50, 26, 284, 234],
  peek: [148, 34, 280, 163],
  snug: [148, 40, 280, 163],
  bow: [58, 56, 292, 236],
};
const getPoseBox = (pose: string): [number, number, number, number] => POSE_BOXES[pose] ?? DEFAULT_BOX;
const PEEK_SINK = PUP_ANCHOR.y - 159;
const HOLD_RANGE_MOBILE: [number, number] = [0.6, 0.86];
const HOLD_RANGE_DESKTOP: [number, number] = [0.42, 0.78];
const WALK_TRICKS = ['jump', 'woof', 'love', 'sneeze'];

const remapSmooth = (a: number, b: number, v: number) =>
  b === a ? +(v >= b) : smoothstep(clamp01((v - a) / (b - a)));
const lerpNum = (a: number, b: number, t: number) => a + (b - a) * t;

interface StopTrack {
  kind: 'page' | 'screen' | 'pin';
  top: number;
  from?: number;
  to?: number;
}

interface PupStopPoint {
  x: number;
  track: StopTrack;
  s: number;
  behind: boolean;
  sink: number;
  box: [number, number, number, number];
}

interface PupStopMeta {
  scene: HTMLElement | null;
  pose: string;
  facing: number;
  act: string;
  looks: HTMLElement[];
  track: HTMLElement | null;
}

interface MeasuredJourney {
  lane: boolean;
  stops: PupStopPoint[];
  meta: PupStopMeta[];
  holds: [number, number][];
  blend: number;
  mainTop: number;
}

function evalStopPos(stop: PupStopPoint, sy: number) {
  const tr = stop.track;
  const top =
    tr.kind === 'page'
      ? tr.top - sy
      : tr.kind === 'screen'
      ? tr.top
      : sy < (tr.from ?? 0)
      ? tr.top - (sy - (tr.from ?? 0))
      : sy > (tr.to ?? 0)
      ? tr.top - (sy - (tr.to ?? 0))
      : tr.top;
  return {
    x: stop.x + PUP_ANCHOR.x * stop.s,
    y: top + PUP_ANCHOR.y * stop.s,
  };
}

function findHoldSegment(holds: [number, number][], sy: number) {
  if (!holds.length || sy <= holds[0][1]) return { k: 0, t: 0 };
  for (let i = 0; i < holds.length - 1; i++) {
    const endA = holds[i][1];
    const startB = holds[i + 1][0];
    if (sy < startB) {
      return { k: i, t: clamp01((sy - endA) / Math.max(1, startB - endA)) };
    }
    if (sy <= holds[i + 1][1]) {
      return { k: i + 1, t: 0 };
    }
  }
  return { k: holds.length - 1, t: 0 };
}

const softMax = (x: number, min: number, k: number) => {
  const s = (x - min) / k;
  return s > 20 ? x : min + k * Math.log1p(Math.exp(s));
};
const softMin = (x: number, max: number, k: number) => -softMax(-x, -max, k);

function clampToSafeBox(
  x: number,
  y: number,
  scale: number,
  box: [number, number, number, number],
  safe: { left: number; top: number; right: number; bottom: number },
  k = 8
) {
  const padL = (PUP_ANCHOR.x - box[0]) * scale;
  const padR = (box[2] - PUP_ANCHOR.x) * scale;
  const padT = (PUP_ANCHOR.y - box[1]) * scale;
  const padB = (box[3] - PUP_ANCHOR.y) * scale;
  const cx =
    safe.right - safe.left > padL + padR
      ? softMin(softMax(x, safe.left + padL, k), safe.right - padR, k)
      : (safe.left + safe.right) / 2 - (padR - padL) / 2;
  const cy =
    safe.bottom - safe.top > padT + padB
      ? softMin(softMax(y, safe.top + padT, k), safe.bottom - padB, k)
      : safe.bottom - padB;
  return { x: cx, y: cy };
}

const lerpBox = (
  a: [number, number, number, number],
  b: [number, number, number, number],
  t: number
): [number, number, number, number] => [
  lerpNum(a[0], b[0], t),
  lerpNum(a[1], b[1], t),
  lerpNum(a[2], b[2], t),
  lerpNum(a[3], b[3], t),
];

const setDataAttr = (el: HTMLElement, key: string, val: string) => {
  if (el.dataset[key] !== val) el.dataset[key] = val;
};

function measureJourney(probeEl: HTMLElement): MeasuredJourney {
  const isLane = window.matchMedia('(max-width: 767px), (pointer: coarse) and (max-height: 519px)').matches;
  const vw = document.documentElement.clientWidth;
  const vh = probeEl.getBoundingClientRect().height || window.innerHeight;
  const headerH = document.getElementById('site-header')?.offsetHeight ?? 76;
  const waBar = document.querySelector('[data-whatsapp-bar]');
  const safe = {
    left: 10,
    top: headerH + 10,
    right: vw - 10,
    bottom: vh - 10 - (waBar?.getClientRects().length ? waBar.getBoundingClientRect().height : 0),
  };
  const mainEl = document.getElementById('main');
  const stops: PupStopPoint[] = [];
  const meta: PupStopMeta[] = [];
  const rawHolds: [number, number][] = [];

  const addStopEl = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const pose = el.dataset.pose || 'sit';
    const act = el.dataset.act ?? '';
    const baseScale = rect.width / 300;
    const scale = act === 'basket' || isLane ? baseScale : 1.12 * baseScale;
    const pivot = pose === 'peek' ? { x: PUP_ANCHOR.x, y: 159 } : PUP_ANCHOR;

    const findStickyParent = (node: HTMLElement): HTMLElement | null => {
      for (let p = node.parentElement; p && p !== document.body; p = p.parentElement) {
        if (window.getComputedStyle(p).position === 'sticky') return p;
      }
      return null;
    };

    const stickyParent = findStickyParent(el);
    let track: StopTrack;
    if (!stickyParent) {
      track = { kind: 'page', top: rect.top + window.scrollY };
    } else {
      const stickyTop = parseFloat(window.getComputedStyle(stickyParent).top) || 0;
      const offsetInSticky = rect.top - stickyParent.getBoundingClientRect().top;
      const prevPos = stickyParent.style.position;
      stickyParent.style.position = 'relative';
      const relRect = stickyParent.getBoundingClientRect();
      const container = stickyParent.parentElement!;
      const containerBottom =
        container.getBoundingClientRect().bottom -
        (parseFloat(window.getComputedStyle(container).paddingBottom) || 0);
      stickyParent.style.position = prevPos;
      const from = relRect.top + window.scrollY - stickyTop;
      const to = containerBottom + window.scrollY - relRect.height - stickyTop;
      track =
        to <= from
          ? { kind: 'page', top: relRect.top + window.scrollY + offsetInSticky }
          : { kind: 'pin', top: stickyTop + offsetInSticky, from, to };
    }

    if (track.kind !== 'screen') {
      track.top += pivot.y * (baseScale - scale);
    }

    const stopPt: PupStopPoint = {
      x: rect.left + pivot.x * (baseScale - scale),
      track,
      s: scale,
      behind: el.dataset.behind === 'true',
      sink: 0,
      box: getPoseBox(pose),
    };
    const scene = el.closest<HTMLElement>('[data-pup-scene]');
    stops.push(stopPt);
    meta.push({
      scene,
      pose,
      facing: el.dataset.facing === 'left' ? -1 : 1,
      act,
      looks: scene ? Array.from(scene.querySelectorAll<HTMLElement>('[data-pup-look]')) : [],
      track: act === 'treadmill' ? scene?.querySelector<HTMLElement>('[data-treadmill]') ?? null : null,
    });

    const range = isLane ? HOLD_RANGE_MOBILE : HOLD_RANGE_DESKTOP;
    let hold: [number, number];
    if (stopPt.track.kind === 'pin') {
      hold = [stopPt.track.from ?? 0, stopPt.track.to ?? 0];
    } else {
      const top = stopPt.track.top;
      const boxTop = top + stopPt.box[1] * stopPt.s;
      const boxBottom = top + stopPt.box[3] * stopPt.s;
      const mid = (boxTop + boxBottom) / 2;
      const safeH = safe.bottom - safe.top;
      let hStart = Math.max(mid - (safe.top + range[1] * safeH), boxBottom - safe.bottom);
      let hEnd = Math.min(mid - (safe.top + range[0] * safeH), boxTop - safe.top);
      if (hStart > hEnd) {
        hStart = hEnd = mid - (safe.top + safeH / 2);
      }
      hold = [hStart, hEnd];
    }

    if (!isLane && scene && stopPt.track.kind === 'page' && act !== 'basket' && act !== 'peekaboo') {
      const safeH = safe.bottom - safe.top;
      const sceneLimit = scene.getBoundingClientRect().top + window.scrollY - safe.top + 0.08 * safeH;
      const minStart = stopPt.track.top + stopPt.box[3] * stopPt.s - safe.bottom;
      if (hold[1] > sceneLimit) {
        const clampedEnd = Math.max(sceneLimit, minStart + 0.12 * safeH);
        hold = [Math.max(minStart, clampedEnd - Math.max(hold[1] - hold[0], 0.2 * safeH)), clampedEnd];
      }
    }
    rawHolds.push(hold);
  };

  const stopEls = Array.from(document.querySelectorAll<HTMLElement>('[data-pup-stop]')).filter(
    (el) => el.getClientRects().length > 0
  );

  if (isLane) {
    const laneStops = stopEls.filter((el) => el.dataset.lane === 'true');
    const firstStop = laneStops[0];
    const lastStop = laneStops.length > 1 ? laneStops[laneStops.length - 1] : undefined;
    if (firstStop) addStopEl(firstStop);
    const firstScene = meta[0]?.scene ?? null;
    const otherScenes = Array.from(document.querySelectorAll<HTMLElement>('#main [data-pup-scene]')).filter(
      (sc) => sc !== firstScene && sc.getClientRects().length > 0
    );
    const laneScale = Math.min(0.62, Math.max(0.5, vw / 650));
    const peekBox = getPoseBox('peek');
    otherScenes.forEach((sc, idx) => {
      const isLeft = idx % 2 === 0;
      const xPos = isLeft ? safe.left + 2 - peekBox[0] * laneScale : safe.right - 2 - peekBox[2] * laneScale;
      stops.push({
        x: xPos,
        track: { kind: 'screen', top: 0 },
        s: laneScale,
        behind: false,
        sink: PEEK_SINK,
        box: peekBox,
      });
      meta.push({
        scene: sc,
        pose: 'peek',
        facing: isLeft ? 1 : -1,
        act: 'lane',
        looks: [],
        track: null,
      });
      const r = sc.getBoundingClientRect();
      const sStart = r.top + window.scrollY - 0.42 * vh;
      const sEnd = r.bottom + window.scrollY - 0.58 * vh;
      rawHolds.push(sStart <= sEnd ? [sStart, sEnd] : [(sStart + sEnd) / 2, (sStart + sEnd) / 2]);
    });
    if (lastStop) addStopEl(lastStop);
  } else {
    stopEls.forEach(addStopEl);
  }

  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const minGaps = stops.slice(1).map((st, idx) => {
    const prev = stops[idx];
    const dy = (HOLD_RANGE_DESKTOP[1] - HOLD_RANGE_DESKTOP[0]) * vh;
    const minSpan = (isLane ? 0.32 : 0.5) * vh;
    return Math.min(
      1.4 * vh,
      Math.max(
        minSpan,
        1.15 * Math.hypot(Math.abs(st.x + PUP_ANCHOR.x * st.s - (prev.x + PUP_ANCHOR.x * prev.s)), dy)
      )
    );
  });

  const holds = (() => {
    const res = rawHolds.map(([a, b]): [number, number] => (a <= b ? [a, b] : [(a + b) / 2, (a + b) / 2]));
    if (!res.length) return res;
    res[0][0] = -Infinity;
    const last = res[res.length - 1];
    last[1] = Infinity;
    last[0] = Math.min(last[0], maxScroll - 1);
    for (let i = 0; i < res.length - 1; i++) {
      const cur = res[i];
      const nxt = res[i + 1];
      if (nxt[0] < cur[1]) {
        const mid = (cur[1] + nxt[0]) / 2;
        cur[1] = Math.max(cur[0], mid);
        nxt[0] = Math.min(nxt[1], mid);
        if (nxt[0] < cur[1]) nxt[0] = cur[1];
      }
      let deficit = (minGaps[i] ?? 0) - (nxt[0] - cur[1]);
      if (deficit > 0) {
        const takeCur = Math.min(deficit / 2, cur[1] - cur[0]);
        const takeNxt = Math.min(deficit / 2, nxt[1] - nxt[0]);
        cur[1] -= takeCur;
        nxt[0] += takeNxt;
        deficit -= takeCur + takeNxt;
        const moreNxt = Math.min(deficit, nxt[1] - nxt[0]);
        nxt[0] += moreNxt;
        deficit -= moreNxt;
        if (deficit > 0) cur[1] -= Math.min(deficit, cur[1] - cur[0]);
      }
    }
    for (const h of res) {
      if (h[1] < h[0]) h[1] = h[0];
    }
    return res;
  })();

  return {
    lane: isLane,
    stops,
    meta,
    holds,
    blend: 0.12 * vh,
    mainTop: mainEl ? mainEl.getBoundingClientRect().top + window.scrollY : 0,
  };
}

let activeJourneyCleanup: (() => void) | null = null;

export function PupJourney() {
  const layerRef = useRef<HTMLDivElement>(null);
  const actorRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const bubbleAtRef = useRef<HTMLSpanElement>(null);
  const printsRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let resizeTimer = 0;
    activeJourneyCleanup?.();

    const layer = layerRef.current;
    const actor = actorRef.current;
    const body = bodyRef.current;
    const bubble = bubbleRef.current;
    const bubbleAt = bubbleAtRef.current;
    const printsContainer = printsRef.current;
    const probe = probeRef.current;
    if (!layer || !actor || !body || !bubble || !bubbleAt || !printsContainer || !probe) return;
    const svg = body.querySelector('svg');
    if (!svg) return;

    const docEl = document.documentElement;
    let journey: MeasuredJourney | null = null;
    let driver: PupDriver | null = null;
    let isRunning = false;
    let rafId = 0;

    const printEls = Array.from(printsContainer.children) as HTMLElement[];
    let printIdx = 0;
    let bubbleHideAt = 0;

    const showBubble = (msg: string, now: number, dur = 1.4) => {
      bubble.textContent = msg;
      bubble.dataset.show = 'true';
      bubbleHideAt = now + dur;
    };

    let pointerPos: { x: number; y: number; t: number } | null = null;
    let lookTarget: { el: Element; until: number } | null = null;

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') {
        pointerPos = { x: e.clientX, y: e.clientY, t: performance.now() / 1000 };
      }
    };

    let lastTime = performance.now() / 1000;
    let lastScrollY = window.scrollY;
    let prevPos: { x: number; y: number } | null = null;
    let curSample: any = null;
    const offsetSpring = { x: 0, y: 0, s: 0 };
    let stillTime = 0;
    let holdingIdx = -1;
    let holdEnteredAt = 0;
    let lastIdleAt = 0;
    let queue: TrickStep[] = [];
    let lastLookCycleAt = 0;
    let lookCycleIdx = -1;
    let prevTrackLeft: number | null = null;
    let trackStopTimer = 0;
    let lastPrintSeg = -1;
    let lastPrintStep = 0;
    let nextBasketAt = 0;
    let lastScrollMoveAt = performance.now() / 1000;
    let scrollDir = 1;
    let wasSnapped = false;
    let screenSmooth: { x: number; y: number } | null = null;
    let prevLaneBottom = 0;
    let laneWalked = 0;
    let layerTopOffset = 0;

    const getLaneBottom = () => {
      const bar = document.querySelector('[data-whatsapp-bar]');
      const r = bar?.getClientRects().length ? bar.getBoundingClientRect() : null;
      return r && r.height ? r.top : window.innerHeight - 6;
    };

    const headerEl = document.getElementById('site-header');

    const sampleAtScroll = (j: MeasuredJourney, sy: number) => {
      if (j.lane) {
        const lb = getLaneBottom();
        for (const st of j.stops) {
          if (st.track.kind === 'screen') {
            st.track.top = lb - 159 * st.s;
          }
        }
      }

      const safe = (() => {
        const vw = docEl.clientWidth;
        const top = (headerEl?.offsetHeight ?? 76) + 10;
        if (j.lane) {
          return { left: 10, top, right: vw - 10, bottom: getLaneBottom() + 40 };
        }
        const bar = document.querySelector('[data-whatsapp-bar]');
        const barTop = bar?.getClientRects().length ? bar.getBoundingClientRect().top : window.innerHeight;
        return { left: 10, top, right: vw - 10, bottom: Math.min(window.innerHeight, barTop) - 10 };
      })();

      const { k, t } = findHoldSegment(j.holds, sy);
      if (t <= 0 || k >= j.stops.length - 1) {
        const st = j.stops[k];
        const pos = evalStopPos(st, sy);
        const clamped = clampToSafeBox(pos.x, pos.y, st.s, st.box, safe);
        return {
          x: clamped.x,
          y: clamped.y,
          s: st.s,
          front: !st.behind,
          airborne: false,
          k,
          t: 0,
          walked: 0,
        };
      }

      const stA = j.stops[k];
      const stB = j.stops[k + 1];
      const scrollA = j.holds[k][1];
      const scrollB = j.holds[k + 1][0];
      const span = Math.max(1, scrollB - scrollA);
      const u = clamp01((sy - scrollA) / span);
      const posA = evalStopPos(stA, scrollA);
      const posB = evalStopPos(stB, scrollB);

      const curve = (() => {
        const p0 = { x: posA.x, y: posA.y - stA.sink * stA.s };
        const p1 = { x: posB.x, y: posB.y - stB.sink * stB.s };
        const dx = p1.x - p0.x;
        const safeW = safe.right - safe.left;
        const handleLen = Math.max(0.45 * Math.abs(dx), 0);
        const dir = dx >= 0 ? 1 : -1;
        let c1 = { x: p0.x + dir * handleLen, y: p0.y };
        let c2 = { x: p1.x - dir * handleLen, y: p1.y };
        const minArc = 0.14 * safeW;
        if (Math.abs(dx) < minArc) {
          const bow = ((p0.x + p1.x) / 2 < (safe.left + safe.right) / 2 ? 1 : -1) * (minArc - Math.abs(dx)) * 0.9;
          c1 = { x: c1.x + bow, y: lerpNum(p0.y, p1.y, 0.2) };
          c2 = { x: c2.x + bow, y: lerpNum(p0.y, p1.y, 0.8) };
        }
        const clampPt = (pt: { x: number; y: number }) => ({
          x: Math.min(safe.right, Math.max(safe.left, pt.x)),
          y: Math.min(safe.bottom, Math.max(safe.top, pt.y)),
        });
        return { p0, c1: clampPt(c1), c2: clampPt(c2), p1 };
      })();

      const easeU = u * u * u * (u * (6 * u - 15) + 10);
      const pt = evalCubicBezier(curve.p0, curve.c1, curve.c2, curve.p1, easeU);
      const scale = lerpNum(stA.s, stB.s, smoothstep(clamp01(u / 0.65)));
      const blendWindow = Math.min(0.3, Math.max(0.06, j.blend / span));
      const wA = 1 - remapSmooth(0, blendWindow, u);
      const wB = remapSmooth(1 - blendWindow, 1, u);
      let y =
        pt.y +
        wA * (evalStopPos(stA, sy).y - posA.y) +
        wB * (evalStopPos(stB, sy).y - posB.y) +
        stA.sink * stA.s * (1 - remapSmooth(0, 0.22, u)) +
        stB.sink * stB.s * remapSmooth(0.78, 1, u);
      const x = pt.x;

      let airborne = false;
      if (stA.behind && u < 0.36) {
        y -= Math.sin((u / 0.36) * Math.PI) * Math.min(64 * stA.s, 72);
        airborne = u < 0.32;
      }
      if (stB.behind && u > 0.68) {
        y -= Math.sin(((u - 0.68) / 0.32) * Math.PI) * Math.min(56 * stB.s, 60);
        airborne = true;
      }
      if (stA.sink && u < 0.2) airborne = true;

      const front = !((stA.behind && u < 0.12) || (stB.behind && u > 0.92));
      const box =
        u < 0.5
          ? lerpBox(stA.box, DEFAULT_BOX, remapSmooth(0, stA.sink ? 0.22 : stA.behind ? 0.36 : 0.06, u))
          : lerpBox(DEFAULT_BOX, stB.box, remapSmooth(stB.sink ? 0.78 : stB.behind ? 0.68 : 0.94, 1, u));
      const clamped = clampToSafeBox(x, y, scale, box, safe);

      let walked = 0;
      let prev = curve.p0;
      const steps = Math.max(1, Math.ceil(32 * clamp01(easeU)));
      for (let i = 1; i <= steps; i++) {
        const cur = evalCubicBezier(curve.p0, curve.c1, curve.c2, curve.p1, (i / steps) * clamp01(easeU));
        walked += Math.hypot(cur.x - prev.x, cur.y - prev.y);
        prev = cur;
      }

      return {
        x: clamped.x,
        y: clamped.y,
        s: scale,
        front,
        airborne,
        k,
        t: u,
        walked,
      };
    };

    const makeTrickCtx = (m: PupStopMeta): TrickContext => ({
      d: driver!,
      rest: PUP_POSES[m.pose] || PUP_POSES.sit,
      facing: m.facing,
      say: (msg, dur) => showBubble(msg, performance.now() / 1000, dur),
      hearts: () =>
        curSample &&
        spawnPupHearts(
          layer,
          curSample.x - PUP_ANCHOR.x * curSample.s + (driver!.facingDir > 0 ? 212 : PUP_WIDTH - 212) * curSample.s,
          curSample.y - (PUP_ANCHOR.y - 40) * curSample.s - layerTopOffset
        ),
    });

    const onCue = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      const activeScene = holdingIdx >= 0 ? journey?.meta[holdingIdx]?.scene : null;
      if (!activeScene || (detail.look && !activeScene.contains(detail.look))) return;
      const now = performance.now() / 1000;
      if (detail.look) {
        lookTarget = { el: detail.look, until: now + (detail.secs ?? 1.6) };
      }
      if (detail.say) {
        showBubble(detail.say, now, detail.duration ?? 1.4);
      }
    };

    const onFocusIn = (e: FocusEvent) => {
      const t = e.target;
      if (t instanceof HTMLElement && t.matches('a, button, input, textarea, select, summary')) {
        lookTarget = { el: t, until: performance.now() / 1000 + 1.4 };
      }
    };

    const tick = () => {
      if (!isRunning || !journey || !driver) return;
      const now = performance.now() / 1000;
      const dt = Math.min(0.05, now - lastTime);
      lastTime = now;

      const sy = window.scrollY;
      const dScroll = sy - lastScrollY;
      lastScrollY = sy;
      if (Math.abs(dScroll) > 0.5) {
        lastScrollMoveAt = now;
        scrollDir = dScroll > 0 ? 1 : -1;
      }

      while (queue.length && queue[0][0] <= now) {
        const step = queue.shift();
        step?.[1](now);
      }

      const effectiveScroll =
        now - lastScrollMoveAt > 0.25
          ? (() => {
              const { k, t } = findHoldSegment(journey.holds, sy);
              if (t <= 0 || k >= journey.stops.length - 1) return sy;
              const stA = journey.stops[k];
              const stB = journey.stops[k + 1];
              const snapLow = stA.sink ? 0.22 : stA.behind ? 0.36 : 0;
              const snapHigh = stB.sink ? 0.78 : stB.behind ? 0.68 : 1;
              let snappedT = t;
              if (t < snapLow) snappedT = t < snapLow / 2 ? 0 : snapLow;
              else if (t > snapHigh) snappedT = t > (1 + snapHigh) / 2 ? 1 : snapHigh;
              return snappedT === t
                ? sy
                : journey.holds[k][1] + snappedT * (journey.holds[k + 1][0] - journey.holds[k][1]);
            })()
          : sy;

      const sample = sampleAtScroll(journey, effectiveScroll);
      const isScreenLane =
        journey.lane &&
        (() => {
          const stA = journey.stops[sample.k];
          const stB = sample.t > 0 ? journey.stops[sample.k + 1] : stA;
          return stA.track.kind === 'screen' && stB?.track.kind === 'screen';
        })();

      const decay = Math.exp(-dt / 0.28);
      offsetSpring.x *= decay;
      offsetSpring.y *= decay;
      offsetSpring.s *= decay;
      if (Math.abs(offsetSpring.x) < 0.05 && Math.abs(offsetSpring.y) < 0.05) {
        offsetSpring.x = offsetSpring.y = 0;
      }

      const isSnapped = effectiveScroll !== sy;
      if (isSnapped !== wasSnapped && prevPos && !isScreenLane) {
        offsetSpring.x = prevPos.x - sample.x;
        offsetSpring.y = prevPos.y - sample.y;
      }
      wasSnapped = isSnapped;

      const scale = sample.s + offsetSpring.s;
      let posX = sample.x + offsetSpring.x;
      let posY = sample.y + offsetSpring.y;
      const laneBottom = journey.lane ? getLaneBottom() : 0;
      let isSettled = true;

      if (isScreenLane) {
        if (!screenSmooth) {
          screenSmooth = prevPos ? { x: prevPos.x, y: prevPos.y - prevLaneBottom } : { x: posX, y: posY - laneBottom };
        }
        const k = 1 - Math.exp(-dt / 0.14);
        screenSmooth.x += (posX - screenSmooth.x) * k;
        screenSmooth.y += (posY - laneBottom - screenSmooth.y) * k;
        isSettled = Math.hypot(posX - screenSmooth.x, posY - laneBottom - screenSmooth.y) < 1.5;
        posX = screenSmooth.x;
        posY = laneBottom + screenSmooth.y;
      } else if (screenSmooth) {
        offsetSpring.x = (prevPos?.x ?? posX) - sample.x;
        offsetSpring.y = (prevPos?.y ?? posY) - sample.y;
        posX = sample.x + offsetSpring.x;
        posY = sample.y + offsetSpring.y;
        screenSmooth = null;
      }

      prevLaneBottom = laneBottom;
      curSample = { ...sample, x: posX, y: posY, s: scale };
      setDataAttr(layer, 'anchor', isScreenLane ? 'bottom' : 'top');
      layerTopOffset = isScreenLane ? layer.getBoundingClientRect().top : 0;

      const isHolding = sample.t === 0 && isSettled;
      const segIdx = sample.k;

      if (isHolding) {
        if (holdingIdx !== segIdx) {
          const m = journey.meta[segIdx];
          queue = [];
          lookTarget = null;
          holdingIdx = segIdx;
          holdEnteredAt = now;
          lastIdleAt = now;
          prevTrackLeft = null;
          driver.reset();
          driver.setPose(m.pose);
          driver.face(m.facing, 0.14);
          driver.stride(0);
          driver.wag(m.act === 'basket' ? 0.3 : 0.7);
          driver.jolt(0.4);
          nextBasketAt = now + 2.4;
        }

        const m = journey.meta[segIdx];
        if (m.track && !queue.length) {
          const trackLeft = m.track.getBoundingClientRect().left;
          const dLeft = prevTrackLeft === null ? 0 : trackLeft - prevTrackLeft;
          prevTrackLeft = trackLeft;
          driver.walkedTo(-trackLeft / scale);
          if (Math.abs(dLeft) > 0.15) {
            trackStopTimer = 0;
            driver.setPose('walk');
            driver.stride(1);
            driver.face(dLeft < 0 ? 1 : -1, 0.16);
          } else {
            trackStopTimer += dt;
            if (trackStopTimer > 0.25) {
              driver.setPose('stand');
              driver.stride(0);
            }
          }
        }

        if (m.act === 'tilt' && !queue.length && now - holdEnteredAt > 1.2) {
          const s = Math.sin(0.9 * now);
          driver.cock(s > 0.35 ? 13 : s < -0.35 ? -10 : 0);
        }

        if (m.act === 'basket' && !queue.length && now > nextBasketAt) {
          nextBasketAt = now + 4.5 + 3 * Math.random();
          if (Math.random() < 0.7) driver.jolt(0.55);
          else driver.yawn(now, 0.7);
        }

        const busyLooking =
          (lookTarget && lookTarget.until > now) || (pointerPos && now - pointerPos.t < 2.5);
        if (m.looks.length && !busyLooking && now - holdEnteredAt > 0.8 && now - lastLookCycleAt > 1.7) {
          lastLookCycleAt = now;
          lookCycleIdx = (lookCycleIdx + 1) % (m.looks.length + 1);
          if (lookCycleIdx < m.looks.length) {
            lookTarget = { el: m.looks[lookCycleIdx], until: now + 1.4 };
          }
        }

        if (Math.abs(dScroll) > 0.5) lastIdleAt = now;
        if (!queue.length && !m.track && m.act !== 'basket' && now - lastIdleAt > 9) {
          lastIdleAt = now;
          queue =
            Math.random() < 0.55
              ? PUP_TRICKS.tilt(makeTrickCtx(m), now)
              : [
                  [now, () => driver!.wag(1)],
                  [now + 2.4, () => driver!.wag(0.7)],
                ];
        }
      } else {
        if (holdingIdx !== -1) {
          holdingIdx = -1;
          queue = [];
          driver.reset();
        }
        const moveDist = prevPos ? Math.hypot(posX - prevPos.x, posY - prevPos.y) : 0;
        stillTime = moveDist > 0.25 ? 0 : stillTime + dt;
        let isHop = sample.airborne;
        if (journey.lane && sample.t > 0) {
          const stA = journey.stops[segIdx];
          const stB = journey.stops[segIdx + 1];
          if (stA.sink && sample.t < 0.22) isHop = scrollDir > 0;
          else if (stB?.sink && sample.t > 0.78) isHop = scrollDir < 0;
        }
        if (isHop) {
          driver.setPose('hop');
          driver.stride(0);
        } else if (stillTime > 0.3) {
          driver.setPose('stand');
          driver.stride(0);
          if (stillTime > 2.6 && stillTime - dt <= 2.6) {
            showBubble('coming?', now);
          }
        } else {
          driver.setPose('walk');
          driver.stride(1);
        }

        driver.walkedTo((isScreenLane ? (laneWalked += moveDist) : sample.walked) / Math.max(0.05, scale));

        if (prevPos) {
          const dx = posX - prevPos.x;
          if (Math.abs(dx) > 0.6 && Math.abs(dx) > 0.35 * Math.abs(posY - prevPos.y)) {
            driver.face(dx > 0 ? 1 : -1, 0.16);
          }
        }

        if (!journey.lane) {
          const stepNum = Math.floor(sample.walked / (34 * scale));
          if (lastPrintSeg === segIdx && stepNum !== lastPrintStep && !sample.airborne && prevPos) {
            const isOdd = stepNum & 1;
            const pawOffX = isOdd ? 186 : 110;
            const originX = posX - PUP_ANCHOR.x * scale;
            const originY = posY - PUP_ANCHOR.y * scale;
            const px = originX + (driver.facingDir > 0 ? pawOffX : PUP_WIDTH - pawOffX) * scale;
            const py = originY + 226 * scale + sy - journey.mainTop + (isOdd ? -4 : 4) * scale;
            const angle = Math.atan2(posY - prevPos.y + dScroll, posX - prevPos.x) + Math.PI / 2;
            const pSize = 14 * Math.max(0.75, 1.5 * scale);
            const pEl = printEls[printIdx++ % printEls.length];
            if (pEl) {
              pEl.style.transform = `translate(${(px - pSize / 2).toFixed(1)}px, ${(py - pSize / 2).toFixed(
                1
              )}px) rotate(${angle.toFixed(3)}rad)`;
              pEl.style.width = pEl.style.height = `${pSize.toFixed(1)}px`;
              pEl.animate?.(
                [
                  { opacity: 0 },
                  { opacity: 0.45, offset: 0.08 },
                  { opacity: 0.45, offset: 0.5 },
                  { opacity: 0 },
                ],
                { duration: 2600, easing: 'ease-out' }
              );
            }
          }
          lastPrintSeg = segIdx;
          lastPrintStep = stepNum;
        }
      }

      prevPos = { x: posX, y: posY };
      const u = sample.t;
      journey.meta.forEach((m, idx) => {
        if (m.scene) {
          setDataAttr(m.scene, 'here', String(isHolding && idx === segIdx));
          setDataAttr(m.scene, 'visited', String(idx <= segIdx || (idx === segIdx + 1 && u > 0.92)));
        }
      });

      if (lookTarget && lookTarget.until > now) {
        const r = lookTarget.el.getBoundingClientRect();
        driver.lookAt({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      } else if (pointerPos && now - pointerPos.t < 2.5) {
        driver.lookAt(pointerPos);
      } else {
        driver.lookAt(null);
      }

      actor.style.transform = `translate3d(${(posX - PUP_ANCHOR.x * scale).toFixed(2)}px, ${(
        posY -
        PUP_ANCHOR.y * scale -
        layerTopOffset
      ).toFixed(2)}px, 0)`;
      body.style.transform = `scale(${scale.toFixed(4)})`;
      setDataAttr(layer, 'front', String(sample.front));
      setDataAttr(actor, 'holding', String(isHolding));

      if (bubble.dataset.show === 'true') {
        if (now > bubbleHideAt) {
          bubble.dataset.show = 'false';
        }
        const bx = (driver.facingDir > 0 ? 214 : PUP_WIDTH - 214) * scale;
        bubbleAt.style.transform = `translate(${bx.toFixed(1)}px, ${(30 * scale).toFixed(1)}px)`;
      }

      driver.tick(dt, now);
      rafId = requestAnimationFrame(tick);
    };

    let clickStreak = 0;
    let lastClickAt = 0;
    let lastTrick: string | null = null;
    const pickOther = (list: string[], avoid: string | null) => {
      const avail = list.filter((x) => x !== avoid);
      return avail[Math.floor(Math.random() * avail.length)];
    };

    const onActorClick = () => {
      if (!driver || !journey) return;
      const now = performance.now() / 1000;
      clickStreak = now - lastClickAt < 0.7 ? clickStreak + 1 : 1;
      lastClickAt = now;
      lastIdleAt = now;

      if (holdingIdx < 0) {
        const m = journey.meta[Math.max(0, curSample?.k ?? 0)];
        const trick = pickOther(WALK_TRICKS, lastTrick);
        lastTrick = trick;
        const ctx = makeTrickCtx(m);
        if (trick === 'jump') {
          queue = [
            [now, () => (driver!.hop(1.35), ctx.say(pickOther(['wheee!', 'boing!', 'yip!'], null)))],
            [now + 0.5, () => driver!.hop(0.7)],
          ];
        } else if (trick === 'woof') {
          queue = [
            [now, (t) => (driver!.woof(t), ctx.say('woof!'))],
            [now + 0.4, (t) => driver!.woof(t)],
          ];
        } else if (trick === 'love') {
          queue = [[now, () => (driver!.wag(1), driver!.hop(0.5), ctx.hearts(), ctx.say('I like you!'))]];
        } else {
          queue = [[now, (t) => (driver!.jolt(1.4), driver!.hop(0.4), driver!.yawn(t, 0.22), ctx.say('achoo!'))]];
        }
        return;
      }

      const m = journey.meta[holdingIdx];
      let chosen: string;
      if (m.track) {
        chosen = pickOther(['woof', 'hop', 'love'], lastTrick);
      } else if (m.act === 'basket') {
        chosen = pickOther(['tilt', 'love', 'sneeze', 'woof'], lastTrick);
      } else if (m.pose === 'peek') {
        chosen = pickOther(['peekaboo', 'woof', 'tilt', 'sneeze'], lastTrick);
      } else {
        chosen = pickNextTrick(lastTrick, clickStreak);
        if (chosen === 'zoomies') chosen = 'spin';
      }

      if (chosen === 'peekaboo' && queue.length) return;
      lastTrick = chosen;
      driver.reset();
      queue = PUP_TRICKS[chosen](makeTrickCtx(m), now);
    };

    const onActorEnter = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && driver && holdingIdx >= 0) {
        driver.petting(true);
        driver.wag(1);
      }
    };

    const onActorLeave = () => {
      if (driver) {
        driver.petting(false);
        if (holdingIdx >= 0) {
          driver.wag(journey?.meta[holdingIdx]?.act === 'basket' ? 0.3 : 0.7);
        }
      }
    };

    const startJourney = () => {
      if (isRunning) return;
      const measured = measureJourney(probe);
      if (measured.stops.length < 2) return;
      journey = measured;
      isRunning = true;
      docEl.dataset.pup = measured.lane ? 'lane' : 'live';
      layer.hidden = false;

      const firstMeta = measured.meta[0];
      driver = new PupDriver(svg as SVGSVGElement, firstMeta.pose, firstMeta.facing);
      lastScrollY = window.scrollY;
      prevPos = null;
      lastScrollMoveAt = lastTime = performance.now() / 1000;
      wasSnapped = false;
      screenSmooth = null;

      const now = lastTime;
      const initSample = sampleAtScroll(measured, window.scrollY);
      if (initSample.k === 0 && initSample.t === 0 && firstMeta.act === 'peekaboo') {
        holdingIdx = 0;
        holdEnteredAt = now;
        const duckPose = { ...PUP_POSES.peek, headY: 120 };
        const friends = firstMeta.scene?.querySelectorAll('[data-pup-friend]') ?? [];
        const firstFriend = friends[0];
        const lastFriend = friends[friends.length - 1];
        queue = [
          [now + 0.1, () => driver!.setPose(duckPose)],
          [now + 0.7, (t) => (driver!.setPose('peek'), driver!.jolt(1.2), showBubble('peekaboo!', t, 1.6))],
          [now + 1.5, (t) => firstFriend && (lookTarget = { el: firstFriend, until: t + 0.8 })],
          [now + 2.3, (t) => lastFriend && (lookTarget = { el: lastFriend, until: t + 0.8 })],
          [now + 3.1, () => ((lookTarget = null), driver!.wag(1))],
        ];
      } else {
        holdingIdx = -1;
      }

      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pup:cue', onCue);
      window.addEventListener('focusin', onFocusIn);
      actor.addEventListener('click', onActorClick);
      actor.addEventListener('pointerenter', onActorEnter);
      actor.addEventListener('pointerleave', onActorLeave);
      rafId = requestAnimationFrame(tick);
    };

    const stopJourney = () => {
      if (!isRunning) return;
      isRunning = false;
      cancelAnimationFrame(rafId);
      delete docEl.dataset.pup;
      layer.hidden = true;
      delete layer.dataset.anchor;
      layerTopOffset = 0;
      journey?.meta.forEach((m) => {
        if (m.scene) {
          delete m.scene.dataset.here;
          delete m.scene.dataset.visited;
        }
      });
      journey = null;
      driver = null;
      holdingIdx = -1;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pup:cue', onCue);
      window.removeEventListener('focusin', onFocusIn);
      actor.removeEventListener('click', onActorClick);
      actor.removeEventListener('pointerenter', onActorEnter);
      actor.removeEventListener('pointerleave', onActorLeave);
    };

    const scheduleRemeasure = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (!isRunning || !journey) return;
        const measured = measureJourney(probe);
        if (measured.stops.length < 2) {
          stopJourney();
          return;
        }
        const prev = curSample;
        const laneChanged = measured.lane !== journey.lane;
        journey = measured;
        docEl.dataset.pup = measured.lane ? 'lane' : 'live';
        if (laneChanged) holdingIdx = -1;
        if (prev) {
          const next = sampleAtScroll(measured, window.scrollY);
          offsetSpring.x = prev.x - next.x;
          offsetSpring.y = prev.y - next.y;
          offsetSpring.s = prev.s - next.s;
        }
      }, 120);
    };

    const ro = new ResizeObserver(scheduleRemeasure);
    ro.observe(document.body);
    window.addEventListener('resize', scheduleRemeasure);
    window.addEventListener('load', scheduleRemeasure);
    startJourney();
    document.fonts?.ready.then(scheduleRemeasure);

    const cleanup = () => {
      stopJourney();
      window.clearTimeout(resizeTimer);
      ro.disconnect();
      window.removeEventListener('resize', scheduleRemeasure);
      window.removeEventListener('load', scheduleRemeasure);
      if (activeJourneyCleanup === cleanup) activeJourneyCleanup = null;
    };
    activeJourneyCleanup = cleanup;
    return cleanup;
  }, []);

  return (
    <>
      <div ref={probeRef} aria-hidden="true" className="pup-probe" />
      <div ref={printsRef} aria-hidden="true" className="pup-prints">
        {Array.from({ length: 24 }, (_, idx) => (
          <svg key={idx} viewBox="0 0 64 64">
            <path d={PAW_PATH} />
          </svg>
        ))}
      </div>
      <div ref={layerRef} aria-hidden="true" className="pup-layer" hidden data-front="true">
        <div ref={actorRef} className="pup-actor">
          <div ref={bodyRef} className="pup-actor__body">
            <PupSvg pose="peek" />
          </div>
          <span ref={bubbleAtRef} className="pup-bubble-at">
            <span ref={bubbleRef} className="pup-bubble" data-show="false" />
          </span>
        </div>
      </div>
    </>
  );
}
