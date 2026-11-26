import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Link,
  ResponsiveMedia,
  RevealScope,
  usePathname,
  usePhotoViewer,
  useSearchParams,
} from './GlobalShell';
import { Polaroid } from './HomeComponents';
import { PAW_PATH, PawIcon, PupBuddy } from './PupEngine';
import { validateEnquiryForm } from '../utils/puppyLogic';

const fmt2 = (n: number) => n.toFixed(2);

function generateOrganicPoints(
  rng: () => number,
  radius: number,
  amp: number,
  steps = 40,
  startAngle = 0,
  arc = 2 * Math.PI
): [number, number][] {
  const phases = [6.28 * rng(), 6.28 * rng(), 6.28 * rng()];
  const stretch = 1 + (rng() - 0.5) * 0.05;
  const pts: [number, number][] = [];
  for (let i = 0; i < steps; i++) {
    const theta = startAngle + (i / (arc >= 2 * Math.PI ? steps : steps - 1)) * arc;
    const r =
      radius +
      amp *
        (0.55 * Math.sin(2 * theta + phases[0]) +
          0.3 * Math.sin(3 * theta + phases[1]) +
          0.15 * Math.sin(5 * theta + phases[2]));
    pts.push([50 + Math.cos(theta) * r * stretch, 50 + (Math.sin(theta) * r) / stretch]);
  }
  return pts;
}

function pointsToCatmullRom(pts: [number, number][], closed: boolean): string {
  const n = pts.length;
  const getPt = (idx: number) => pts[closed ? (idx + n) % n : Math.min(n - 1, Math.max(0, idx))];
  let d = `M${fmt2(pts[0][0])} ${fmt2(pts[0][1])}`;
  const count = closed ? n : n - 1;
  for (let i = 0; i < count; i++) {
    const p0 = getPt(i - 1);
    const p1 = getPt(i);
    const p2 = getPt(i + 1);
    const p3 = getPt(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${fmt2(c1[0])} ${fmt2(c1[1])} ${fmt2(c2[0])} ${fmt2(c2[1])} ${fmt2(p2[0])} ${fmt2(p2[1])}`;
  }
  return closed ? `${d}Z` : d;
}

const WASH_COLORS = ['#f2be6b', '#f9cdbf', '#bfddf5', '#fbe3b4', '#e8c39a'];
const INK_COLORS = ['#c2622b', '#a24a1a', '#2a170e', '#d4893f'];
const DOODLE_KINDS = ['sparkle', 'heart', 'dashes', 'swirl', 'dots', 'paw'] as const;

function buildMaskDataUri(pathD: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="${pathD}" fill="#000"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const STATUS_MAP: Record<string, string> = {
  available: 'Available',
  reserved: 'Reserved',
  rehomed: 'Gone home',
};

const SKETCH_SIZES =
  '(min-width: 1536px) 17rem, (min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw';

function SketchDoodle({ d }: { d: any }) {
  const transform = `translate(${d.x.toFixed(1)} ${d.y.toFixed(1)}) rotate(${d.rot.toFixed(
    0
  )}) scale(${d.size.toFixed(2)})`;
  const strokeProps = {
    fill: 'none',
    stroke: d.ink,
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <g transform={transform}>
      <g className="tp-sketch__doodle">
        {d.kind === 'sparkle' && (
          <path
            d="M0 -6c.6 3.6 2.4 5.4 6 6-3.6.6-5.4 2.4-6 6-.6-3.6-2.4-5.4-6-6 3.6-.6 5.4-2.4 6-6z"
            fill={d.ink}
          />
        )}
        {d.kind === 'heart' && (
          <path
            d="M0 5C-4.6 1.8-6.4-.8-6.4-3.2c0-1.9 1.5-3.3 3.3-3.3 1.3 0 2.4.7 3.1 1.9.7-1.2 1.8-1.9 3.1-1.9 1.8 0 3.3 1.4 3.3 3.3C6.4-.8 4.6 1.8 0 5z"
            {...strokeProps}
          />
        )}
        {d.kind === 'dashes' && <path d="M-5 -5l4 2M-6 0h5M-5 5l4 -2" {...strokeProps} />}
        {d.kind === 'swirl' && (
          <path
            d="M0 0c1.6-.6 2.4 1.4.8 2.6-2 1.4-4.6-.4-4-3 .7-3 4.8-3.8 6.8-1.2 2.4 3-0.2 7.4-3.8 7.2"
            {...strokeProps}
          />
        )}
        {d.kind === 'dots' && (
          <g fill={d.ink}>
            <circle cx="-4" cy="1" r="1.2" />
            <circle cx="0" cy="-2" r="1.2" />
            <circle cx="4" cy="1" r="1.2" />
          </g>
        )}
        {d.kind === 'paw' && (
          <path
            d={PAW_PATH}
            transform="scale(.17) translate(-32 -34)"
            fill={d.ink}
            opacity={0.85}
          />
        )}
      </g>
    </g>
  );
}

function buildSketchGeometry(seedStr: string) {
  const rng = (() => {
    let h = 0x811c9dc5;
    for (const ch of seedStr) {
      h = Math.imul(h ^ ch.charCodeAt(0), 0x1000193);
    }
    let state = h >>> 0;
    return () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
    };
  })();

  const mask = pointsToCatmullRom(generateOrganicPoints(rng, 45.5, 2.6), true);
  const outline = pointsToCatmullRom(generateOrganicPoints(rng, 47.8, 3.1), true);
  const startAngle = rng() * Math.PI * 2;
  const retrace = pointsToCatmullRom(
    generateOrganicPoints(rng, 49, 3.4, 30, startAngle, Math.PI * (1.15 + 0.5 * rng())),
    false
  );
  const wash = {
    d: pointsToCatmullRom(generateOrganicPoints(rng, 46.5, 3.6), true),
    dx: (rng() - 0.5) * 9,
    dy: 3 + 4 * rng(),
    color: WASH_COLORS[Math.floor(rng() * WASH_COLORS.length)],
  };
  const tilt = (rng() - 0.5) * 5;
  const zones = [
    [0.86, 1.08],
    [1.16, 1.42],
    [-0.08, 0.16],
  ]
    .map((z) => ({ z, k: rng() }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.z);

  const numDoodles = 2 + Math.floor(2 * rng());
  const doodles: any[] = [];
  const used = new Set<string>();
  for (let i = 0; i < numDoodles; i++) {
    let kind: string = DOODLE_KINDS[Math.floor(rng() * DOODLE_KINDS.length)];
    if (used.has(kind)) {
      kind = DOODLE_KINDS.find((k) => !used.has(k)) ?? kind;
    }
    used.add(kind);
    const [zMin, zMax] = zones[i];
    const angle = Math.PI * (zMin + rng() * (zMax - zMin));
    const dist = 55 + 4 * rng();
    doodles.push({
      kind,
      x: 50 + Math.cos(angle) * dist,
      y: 50 + Math.sin(angle) * dist,
      rot: (rng() - 0.5) * 50,
      size: 0.85 + 0.35 * rng(),
      ink: INK_COLORS[Math.floor(rng() * INK_COLORS.length)],
    });
  }

  return { mask, outline, retrace, wash, tilt, doodles };
}

export function SketchCard({
  pup,
  index = 0,
  sizes = SKETCH_SIZES,
  preload = false,
  small = false,
}: {
  pup: any;
  index?: number;
  sizes?: string;
  preload?: boolean;
  small?: boolean;
}) {
  const geom = useMemo(() => buildSketchGeometry(pup.slug), [pup.slug]);
  const hasVideo = pup.media?.some((m: any) => m.kind === 'video');
  const statusText = STATUS_MAP[pup.status] ?? 'Available';

  return (
    <Link
      href={`/puppies/${pup.slug}`}
      className={`tp-sketch${small ? ' tp-sketch--small' : ''}`}
      data-reveal=""
      style={
        {
          '--tilt': `${geom.tilt.toFixed(2)}deg`,
          '--d': `${(index % 8) * 70}ms`,
          '--wash': geom.wash.color,
        } as React.CSSProperties
      }
      aria-label={`${pup.displayName}${pup.name ? `, ${pup.breed}` : ''}, ${pup.genderLabel?.toLowerCase()}${
        pup.age ? `, ${pup.age}` : ''
      }, ${statusText.toLowerCase()}`}
    >
      <span className="tp-sketch__frame">
        <svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          className="tp-sketch__wash"
          style={{ translate: `${geom.wash.dx.toFixed(1)}% ${geom.wash.dy.toFixed(1)}%` }}
        >
          <path d={geom.wash.d} />
        </svg>
        <span
          className="tp-sketch__photo"
          style={{
            maskImage: buildMaskDataUri(geom.mask),
            WebkitMaskImage: buildMaskDataUri(geom.mask),
          }}
        >
          {pup.cover && <ResponsiveMedia media={pup.cover} sizes={sizes} preload={preload} alt="" />}
        </span>
        <svg aria-hidden="true" viewBox="0 0 100 100" className="tp-sketch__ink">
          <path d={geom.outline} pathLength={1} className="tp-sketch__line" />
          <path
            d={geom.retrace}
            pathLength={1}
            className="tp-sketch__line tp-sketch__line--retrace"
          />
          {geom.doodles.map((d, idx) => (
            <SketchDoodle key={idx} d={d} />
          ))}
        </svg>
        {!small && <span className="tp-sketch__sticker font-scrawl">{statusText}</span>}
        {hasVideo && !small && <span className="tp-sketch__video">▶ video</span>}
        {small && (
          <span className="tp-sketch__sticker tp-sketch__sticker--home font-scrawl">
            gone home ♥
          </span>
        )}
      </span>
      <span className="tp-sketch__name font-plush">{pup.displayName}</span>
      {!small && (
        <span className="tp-sketch__meta">
          {pup.name ? `${pup.breed} · ` : ''}
          {pup.genderLabel?.toLowerCase()}
          {pup.age ? ` · ${pup.age}` : ''}
        </span>
      )}
    </Link>
  );
}

const FILTER_KEYS = ['origin', 'breed', 'gender', 'collection'] as const;

function StickerChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className="tp-sticker-chip">
      {children}
    </button>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-scrawl mr-1 w-full shrink-0 text-cocoa-soft sm:w-28">{label}</span>
      {children}
    </div>
  );
}

export function PuppyBrowser({
  puppies = [],
  breeds = [],
  whatsappHref,
}: {
  puppies: any[];
  breeds: any[];
  whatsappHref: string;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const filters = {
    origin: searchParams.get('origin') ?? '',
    breed: searchParams.get('breed') ?? '',
    gender: searchParams.get('gender') ?? '',
    collection: searchParams.get('collection') ?? '',
  };

  const toggleFilter = (key: keyof typeof filters, val: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (val && filters[key] !== val) {
      next.set(key, val);
    } else {
      next.delete(key);
    }
    const qs = next.toString();
    window.history.replaceState(null, '', qs ? `${pathname}?${qs}` : pathname);
  };

  const clearFilters = () => {
    window.history.replaceState(null, '', pathname);
  };

  const filtered = useMemo(
    () =>
      puppies.filter(
        (p) =>
          (!filters.origin || p.origin?.slug === filters.origin) &&
          (!filters.breed || p.breeds?.some((b: any) => b.slug === filters.breed)) &&
          (!filters.gender || p.gender === filters.gender || p.gender === 'male-female') &&
          (!filters.collection || p.collections?.some((c: any) => c.slug === filters.collection))
      ),
    [puppies, filters.origin, filters.breed, filters.gender, filters.collection]
  );

  const hasFilters = FILTER_KEYS.some((k) => Boolean(filters[k]));
  const availableBreeds = breeds.filter((b) =>
    puppies.some((p) => p.breeds?.some((pb: any) => pb.slug === b.slug))
  );
  const hasKoreanTeacup = puppies.some((p) =>
    p.collections?.some((c: any) => c.slug === 'korean-teacup')
  );
  const hasLocal = puppies.some((p) => p.origin?.slug === 'local');

  return (
    <div>
      <div role="group" aria-label="Filter puppies" className="tp-sketchpad flex flex-col gap-4">
        <FilterRow label="where">
          <StickerChip
            active={!filters.origin && !filters.collection}
            onClick={clearFilters}
          >
            Everywhere
          </StickerChip>
          {hasLocal && (
            <StickerChip
              active={filters.origin === 'local'}
              onClick={() => toggleFilter('origin', 'local')}
            >
              In Dubai
            </StickerChip>
          )}
          <StickerChip
            active={filters.origin === 'imported'}
            onClick={() => toggleFilter('origin', 'imported')}
          >
            Imported
          </StickerChip>
          {hasKoreanTeacup && (
            <StickerChip
              active={filters.collection === 'korean-teacup'}
              onClick={() => toggleFilter('collection', 'korean-teacup')}
            >
              Korean Teacup
            </StickerChip>
          )}
        </FilterRow>
        <FilterRow label="breed">
          {availableBreeds.map((b) => (
            <StickerChip
              key={b.slug}
              active={filters.breed === b.slug}
              onClick={() => toggleFilter('breed', b.slug)}
            >
              {b.name}
            </StickerChip>
          ))}
        </FilterRow>
        <FilterRow label="boy or girl">
          <StickerChip
            active={filters.gender === 'male'}
            onClick={() => toggleFilter('gender', 'male')}
          >
            Boys
          </StickerChip>
          <StickerChip
            active={filters.gender === 'female'}
            onClick={() => toggleFilter('gender', 'female')}
          >
            Girls
          </StickerChip>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="link-ink ml-auto text-[0.95rem] font-semibold"
            >
              Clear filters
            </button>
          )}
        </FilterRow>
      </div>
      <p className="font-scrawl mt-10 text-lg text-[var(--ink-soft)]" aria-live="polite">
        {filtered.length === 1 ? '1 puppy' : `${filtered.length} puppies`}{' '}
        {hasFilters ? 'match' : 'looking for a home'}
      </p>
      {filtered.length > 0 ? (
        <RevealScope>
          <div className="tp-sketches mt-8">
            {filtered.map((pup, idx) => (
              <div key={pup.id}>
                <SketchCard pup={pup} index={idx} sizes={SKETCH_SIZES} preload={idx < 3} />
              </div>
            ))}
          </div>
        </RevealScope>
      ) : (
        <div className="tp-sketchpad mt-10 grid items-center gap-6 md:grid-cols-[auto_1fr] md:gap-10">
          <PupBuddy
            pose="sit"
            act="tilt"
            className="mx-auto w-44 md:w-52"
            label="Teddy, tilting his head"
          />
          <div>
            <p className="font-plush text-big">No puppies match just now.</p>
            <p className="mt-3 max-w-[48ch] text-cocoa-soft">
              Tell us what you&apos;re hoping for and we&apos;ll let you know what&apos;s in our
              showroom or what we can bring in for you.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp"
              >
                Ask on WhatsApp
              </a>
              <button type="button" onClick={clearFilters} className="btn btn-ghost">
                Show all puppies
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const WALL_SIZES = '(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 45vw';

export function MemoryWall({ photos = [] }: { photos: any[] }) {
  const { open, viewer } = usePhotoViewer(photos, WALL_SIZES);
  return (
    <>
      <RevealScope>
        <ul className="tp-wall" aria-label="Photos from TeddyPups families">
          {photos.map((photo, idx) => (
            <li
              key={photo.id}
              className="tp-wall__item"
              data-reveal=""
              style={{ '--d': `${(idx % 4) * 60}ms` } as React.CSSProperties}
            >
              <button
                type="button"
                className="tp-wall__print"
                onClick={() => open(idx)}
                aria-label={`Open photo ${idx + 1} of ${photos.length}${
                  photo.caption ? `: ${photo.caption}` : ''
                }`}
              >
                <Polaroid media={photo} order={idx} sizes={WALL_SIZES} priority={idx < 2} />
                <PawIcon className="tp-wall__paw" />
              </button>
            </li>
          ))}
        </ul>
      </RevealScope>
      {viewer}
    </>
  );
}

const STEP_STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const JOURNEY_ICONS: Record<string, React.ReactNode[]> = {
  local: [
    <svg key="find" viewBox="0 0 48 48">
      <circle cx="21" cy="21" r="12" {...STEP_STROKE} />
      <path d="m30 30 10 10" {...STEP_STROKE} />
      <path
        d="M21 27c-3-2-4.4-3.6-4.4-5.2a2.2 2.2 0 0 1 4.4-.4 2.2 2.2 0 0 1 4.4.4c0 1.6-1.4 3.2-4.4 5.2z"
        fill="currentColor"
      />
    </svg>,
    <svg key="choose" viewBox="0 0 48 48">
      <path
        d="M24 40C11 31 6 24.5 6 17.8 6 12.4 10.2 8 15.4 8c3.7 0 6.8 2.1 8.6 5.3C25.8 10.1 28.9 8 32.6 8 37.8 8 42 12.4 42 17.8 42 24.5 37 31 24 40z"
        {...STEP_STROKE}
      />
      <path d="m17 22 5 5 9-10" {...STEP_STROKE} />
    </svg>,
    <svg key="meet" viewBox="0 0 48 48">
      <path
        d="M14 18c-3-6-1-10 3-10s5 4 4 8M34 18c3-6 1-10-3-10s-5 4-4 8"
        {...STEP_STROKE}
      />
      <ellipse cx="24" cy="27" rx="13" ry="12" {...STEP_STROKE} />
      <circle cx="19.5" cy="25" r="1.6" fill="currentColor" />
      <circle cx="28.5" cy="25" r="1.6" fill="currentColor" />
      <path d="M22 31h4l-2 2z" {...STEP_STROKE} fill="currentColor" strokeWidth={1.6} />
    </svg>,
    <svg key="home" viewBox="0 0 48 48">
      <path d="M5 30V18h22v12M27 22h8l6 6v2H27" {...STEP_STROKE} />
      <path d="M5 30h36" {...STEP_STROKE} />
      <circle cx="13" cy="33" r="3.4" {...STEP_STROKE} />
      <circle cx="34" cy="33" r="3.4" {...STEP_STROKE} />
      <path
        d="M16 26c-2.3-1.6-3.4-2.8-3.4-4a1.7 1.7 0 0 1 3.4-.4 1.7 1.7 0 0 1 3.4.4c0 1.2-1.1 2.4-3.4 4z"
        fill="currentColor"
      />
    </svg>,
  ],
  imported: [
    <svg key="reserve" viewBox="0 0 48 48">
      <rect x="7" y="10" width="34" height="30" rx="5" {...STEP_STROKE} />
      <path d="M7 19h34M16 6v8M32 6v8" {...STEP_STROKE} />
      <path d="m17 29 5 5 9-9" {...STEP_STROKE} />
    </svg>,
    <svg key="consult" viewBox="0 0 48 48">
      <path
        d="M6 12a5 5 0 0 1 5-5h16a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5h-9l-6 5v-5h-1a5 5 0 0 1-5-5z"
        {...STEP_STROKE}
      />
      <path
        d="M36 17h1a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5h-1v5l-6-5h-6a5 5 0 0 1-4-2"
        {...STEP_STROKE}
      />
    </svg>,
    <svg key="fly" viewBox="0 0 48 48">
      <path
        transform="matrix(-1 0 0 1 48 0)"
        d="M4 27l13-1.5 8-10h4l-4 9.5 9-.8 4-4.7h3l-2 6.6 2 6.6h-3l-4-4.7-9-.8 4 9.5h-4l-8-10L4 29z"
        {...STEP_STROKE}
      />
    </svg>,
    <svg key="welcome" viewBox="0 0 48 48">
      <path d="M6 23 24 8l18 15M11 19v21h26V19" {...STEP_STROKE} />
      <path
        d="M24 35c-4.6-3.2-6.8-5.7-6.8-8.2a3.4 3.4 0 0 1 6.8-.8 3.4 3.4 0 0 1 6.8.8c0 2.5-2.2 5-6.8 8.2z"
        fill="currentColor"
      />
    </svg>,
  ],
};

const STEP_TINTS = ['#fbe3b4', '#fde6de', '#e3f0fb', '#e6f2df'];

function JourneyPostcard({ kind }: { kind: string }) {
  if (kind === 'imported') {
    return (
      <div aria-hidden="true" className="tp-postcard tp-postcard--sky">
        <svg viewBox="0 0 320 150" className="tp-postcard__route" preserveAspectRatio="none">
          <path d="M28 128C90 20 230 20 292 118" />
        </svg>
        <svg viewBox="0 0 64 40" className="tp-postcard__plane" aria-hidden="true">
          <path
            d="M4 22l20-2 12-14h6l-6 14 14-1 6-7h4l-3 10 3 10h-4l-6-7-14-1 6 14h-6L24 24 4 22z"
            fill="#fffdf8"
            stroke="currentColor"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="font-scrawl tp-postcard__from">Europe · Korea</span>
        <span className="font-scrawl tp-postcard__to">Dubai</span>
      </div>
    );
  }
  return (
    <div aria-hidden="true" className="tp-postcard">
      <span className="tp-postcard__sun" />
      <svg viewBox="0 0 300 120" className="tp-postcard__city" aria-hidden="true">
        <path
          d="M4 116h292M20 116V78h16v38M44 116V60h18v56M70 116V84h12v32M150 116V36l4-6v-14l3-4 3 4v14l4 6v80M118 116V70l12-8v54M174 116V64l14 8v44M200 116V82h18v34M226 116V56h14v60M248 116V88h22v28"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-scrawl tp-postcard__to tp-postcard__to--left">Downtown Dubai</span>
    </div>
  );
}

export function Journeys({ journeys = [] }: { journeys: any[] }) {
  const [activeKey, setActiveKey] = useState<string>(journeys[0]?.key ?? '');
  const [ready, setReady] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(t);
  }, []);

  const activeIdx = Math.max(
    0,
    journeys.findIndex((j) => j.key === activeKey)
  );

  const selectByIndex = (idx: number) => {
    const wrapped = (idx + journeys.length) % journeys.length;
    setActiveKey(journeys[wrapped].key);
    tabRefs.current[wrapped]?.focus();
  };

  return (
    <section
      className="tp-journeys"
      aria-labelledby="two-ways-title"
      data-ready={ready || undefined}
    >
      <div className="tp-journeys__top">
        <div>
          <p className="font-scrawl tp-journeys__kicker">choose your way</p>
          <h2 id="two-ways-title" className="font-plush text-big">
            Two ways home
          </h2>
        </div>
        <div className="tp-journeys__pick">
          <div
            role="tablist"
            aria-label="Ways to bring your puppy home"
            className="tp-switch"
            style={{ '--at': activeIdx, '--n': journeys.length } as React.CSSProperties}
          >
            <span aria-hidden="true" className="tp-switch__thumb" />
            {journeys.map((j, idx) => (
              <button
                key={j.key}
                ref={(el) => {
                  tabRefs.current[idx] = el;
                }}
                type="button"
                role="tab"
                id={`tab-${j.key}`}
                aria-selected={activeKey === j.key}
                aria-controls={`panel-${j.key}`}
                tabIndex={activeKey === j.key ? 0 : -1}
                onClick={() => setActiveKey(j.key)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight') selectByIndex(idx + 1);
                  if (e.key === 'ArrowLeft') selectByIndex(idx - 1);
                }}
                className="tp-switch__tab"
              >
                <span className="font-plush tp-switch__label">{j.label}</span>
                <span className="tp-switch__hint">{j.hint}</span>
              </button>
            ))}
          </div>
          <PupBuddy
            pose="sit"
            act="tilt"
            className="tp-journeys__teddy"
            label="Teddy, waiting to see which way you pick"
          />
        </div>
      </div>
      {journeys.map((j) => (
        <div
          key={j.key}
          role="tabpanel"
          id={`panel-${j.key}`}
          aria-labelledby={`tab-${j.key}`}
          hidden={ready && activeKey !== j.key}
          className="tp-journey"
        >
          <div className="tp-journey__head">
            <div>
              <h3 className="font-plush tp-journey__title">{j.heading}</h3>
              {j.body && <p className="text-lede mt-4 text-[var(--ink-soft)]">{j.body}</p>}
              {j.note && <p className="font-scrawl mt-4 text-toffee-ink">{j.note}</p>}
            </div>
            <JourneyPostcard kind={j.key} />
          </div>
          <ol className="tp-steps">
            {(j.steps ?? []).map((step: any, sIdx: number) => (
              <li
                key={step.title}
                className="tp-step"
                style={
                  {
                    '--i': sIdx,
                    '--tint': STEP_TINTS[sIdx % STEP_TINTS.length],
                  } as React.CSSProperties
                }
              >
                <span aria-hidden="true" className="tp-step__icon">
                  {(JOURNEY_ICONS[j.key] ?? JOURNEY_ICONS.local)[sIdx % 4]}
                </span>
                <span className="tp-step__num font-plush">Step {sIdx + 1}</span>
                <h4 className="font-plush-text tp-step__title">{step.title}</h4>
                <p className="tp-step__text">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </section>
  );
}

const NOTE_TILTS = [-1.6, 1.2, -0.8, 1.8, -1.2, 0.7, -1.9, 1.4];
const NOTE_PINS = ['var(--color-toffee)', 'var(--color-sky-deep)', '#d9a13c', '#c45a6a'];

function HighlightText({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <>
      {parts.map((part, idx) =>
        idx % 2 === 1 ? <mark key={idx}>{part}</mark> : <React.Fragment key={idx}>{part}</React.Fragment>
      )}
    </>
  );
}

export function NoticeBoard({ faqs = [], askHref }: { faqs: any[]; askHref: string }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const searchId = useId();
  const qLower = query.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      qLower
        ? faqs.filter((f) => `${f.question} ${f.answer}`.toLowerCase().includes(qLower))
        : faqs,
    [faqs, qLower]
  );

  return (
    <div className="tp-notes" data-open={openId || qLower ? '' : undefined}>
      <aside className="tp-notes__side" aria-label="Find a question">
        <label htmlFor={searchId} className="font-scrawl tp-notes__label">
          sniff out a question
        </label>
        <div className="tp-notes__search">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="tp-notes__lens">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m15.5 15.5 5 5" />
          </svg>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="delivery, Korea, vaccinated…"
            autoComplete="off"
          />
        </div>
        <p className="tp-notes__count" aria-live="polite">
          {query.trim()
            ? `${filtered.length} ${filtered.length === 1 ? 'note' : 'notes'} found`
            : `${faqs.length} notes on the board`}
        </p>
        <div className="tp-notes__teddy">
          <span aria-hidden="true" className="tp-notes__bubble font-plush">
            <span className="tp-notes__q">?</span>
            <span className="tp-notes__a">!</span>
          </span>
          <PupBuddy pose="sit" act="tilt" label="Teddy, reading the notes" />
        </div>
        <a
          href={askHref}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-whatsapp tp-notes__ask"
        >
          Ask your own question
        </a>
      </aside>
      <RevealScope className="tp-notes__board">
        <ul className="tp-notes__list">
          {filtered.map((faq, idx) => {
            const unfolded =
              openId === faq.id || (Boolean(qLower) && faq.answer.toLowerCase().includes(qLower));
            return (
              <li
                key={faq.id}
                className="tp-note"
                data-reveal=""
                data-unfolded={unfolded || undefined}
                style={
                  {
                    '--tilt': `${NOTE_TILTS[idx % NOTE_TILTS.length]}deg`,
                    '--pin': NOTE_PINS[idx % NOTE_PINS.length],
                    '--i': idx,
                  } as React.CSSProperties
                }
              >
                <span aria-hidden="true" className="tp-note__pin" />
                <h2 className="tp-note__q">
                  <button
                    type="button"
                    id={`q-${faq.id}`}
                    aria-expanded={unfolded}
                    aria-controls={`a-${faq.id}`}
                    onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                  >
                    <span className="font-plush-text">
                      <HighlightText text={faq.question} query={query} />
                    </span>
                    <span aria-hidden="true" className="tp-note__chevron" />
                  </button>
                </h2>
                <div
                  id={`a-${faq.id}`}
                  role="region"
                  aria-labelledby={`q-${faq.id}`}
                  className="tp-note__answer"
                  inert={!unfolded ? ('' as any) : undefined}
                >
                  <div className="tp-note__flap">
                    <p>
                      <HighlightText text={faq.answer} query={query} />
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {!filtered.length && (
          <div className="tp-note tp-note--empty">
            <span aria-hidden="true" className="tp-note__pin" />
            <p className="font-plush-text text-[1.2rem] font-bold">
              No note about “{query.trim()}” yet.
            </p>
            <p className="mt-2">
              <a
                href={askHref}
                target="_blank"
                rel="noopener noreferrer"
                className="link-ink"
              >
                Ask us on WhatsApp
              </a>{' '}
              and we&apos;ll answer.
            </p>
          </div>
        )}
      </RevealScope>
    </div>
  );
}

function LetterBlank({
  name,
  label,
  error,
  size = 14,
  ...rest
}: {
  name: string;
  label: string;
  error?: string;
  size?: number;
  [key: string]: any;
}) {
  return (
    <span className="tp-blank" style={{ '--size': `${size}ch` } as React.CSSProperties}>
      <input
        name={name}
        aria-label={label}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${name}-err` : undefined}
        {...rest}
      />
    </span>
  );
}

export function LetterForm({
  puppies = [],
  success,
  whatsappHref,
}: {
  puppies: { id: string; label: string }[];
  success: { heading: string; body: string };
  whatsappHref: string;
}) {
  const [state, setState] = useState<{
    ok: boolean;
    message?: string;
    errors?: Record<string, string>;
  }>({ ok: false });
  const [pending, setPending] = useState(false);
  const [phase, setPhase] = useState<'writing' | 'sealing' | 'posting' | 'sent'>('writing');
  const postRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const sentRef = useRef<HTMLDivElement>(null);
  const [minH, setMinH] = useState<number | undefined>(undefined);
  const selectId = useId();
  const noteId = useId();

  useEffect(() => {
    if (!state.ok) return;
    const timers = [
      window.setTimeout(() => {
        setMinH(postRef.current?.offsetHeight);
        setPhase('sealing');
      }, 0),
      window.setTimeout(() => setPhase('posting'), 750),
      window.setTimeout(() => {
        setMinH(undefined);
        setPhase('sent');
      }, 1750),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [state.ok]);

  useEffect(() => {
    const el = sentRef.current;
    if (phase !== 'sent' || !el) return;
    el.focus({ preventScroll: true });
    const top = el.getBoundingClientRect().top;
    const headerH =
      16 * parseFloat(window.getComputedStyle(document.documentElement).getPropertyValue('--header-h')) ||
      76;
    if (top < headerH + 8) {
      window.scrollBy({ top: top - headerH - 24, behavior: 'smooth' });
    }
  }, [phase]);

  useEffect(() => {
    if (!state.ok && state.errors) {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
  }, [state]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const validation = validateEnquiryForm({
      name: String(fd.get('name') ?? ''),
      phone: String(fd.get('phone') ?? ''),
      email: String(fd.get('email') ?? ''),
      area: String(fd.get('area') ?? ''),
      puppyId: String(fd.get('puppyId') ?? ''),
      message: String(fd.get('message') ?? ''),
      website: String(fd.get('website') ?? ''),
    });

    if (!validation.ok) {
      setState({
        ok: false,
        message: 'Please check the highlighted lines in your letter.',
        errors: validation.errors,
      });
      return;
    }

    setPending(true);
    window.setTimeout(() => {
      setPending(false);
      setState({ ok: true });
    }, 250);
  };

  const errors = state.errors ?? {};
  const errorEntries = Object.entries(errors).filter(([k]) => k !== 'website');

  return (
    <div ref={postRef} className="tp-post" data-phase={phase} style={{ minHeight: minH }}>
      {phase !== 'sent' && (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          noValidate
          className="tp-letterform"
          aria-hidden={phase !== 'writing' || undefined}
          inert={phase !== 'writing' ? ('' as any) : undefined}
        >
          <span aria-hidden="true" className="tp-letter__stamp">
            <PawIcon className="size-9" />
          </span>
          <p className="font-scrawl tp-letterform__greeting">Dear TeddyPups,</p>
          {state.message && !state.ok && (
            <div role="alert" className="tp-letterform__alert">
              <p className="font-semibold">{state.message}</p>
              {errorEntries.length > 0 && (
                <ul>
                  {errorEntries.map(([field, err]) => (
                    <li key={field} id={`${field}-err`}>
                      {err}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <p className="tp-letterform__line">
            my name is{' '}
            <LetterBlank
              name="name"
              label="Your name (required)"
              autoComplete="name"
              required
              minLength={2}
              maxLength={80}
              size={16}
              error={errors.name}
            />
            , and you can reach me on{' '}
            <LetterBlank
              name="phone"
              label="Phone or WhatsApp number with country code (required)"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              size={15}
              placeholder="+971 50 123 4567"
              error={errors.phone}
            />{' '}
            or by email at{' '}
            <LetterBlank
              name="email"
              label="Email (optional)"
              type="email"
              autoComplete="email"
              size={20}
              placeholder="optional"
              error={errors.email}
            />
            .
          </p>
          <p className="tp-letterform__line">
            I live in{' '}
            <LetterBlank
              name="area"
              label="Your area (optional)"
              autoComplete="address-level2"
              maxLength={80}
              size={13}
              placeholder="e.g. Dubai Marina"
              error={errors.area}
            />
            , and I&apos;m curious about{' '}
            <span className="tp-blank tp-blank--select">
              <label htmlFor={selectId} className="sr-only">
                Puppy you&apos;re interested in (optional)
              </label>
              <select id={selectId} name="puppyId" defaultValue="">
                <option value="">any puppy (not sure yet)</option>
                {puppies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </span>
            .
          </p>
          <label htmlFor={noteId} className="sr-only">
            Your message (optional)
          </label>
          <textarea
            id={noteId}
            name="message"
            rows={4}
            maxLength={2000}
            placeholder="Anything else you'd like to tell us…"
            className="tp-letterform__note"
            aria-invalid={Boolean(errors.message) || undefined}
          />
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>
              Website
              <input name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
            </label>
          </div>
          <div className="tp-letterform__sign">
            <p className="font-scrawl">with love, a future puppy parent</p>
            <button
              type="submit"
              disabled={pending}
              className="btn btn-primary disabled:opacity-70"
            >
              {pending ? 'Sealing the envelope…' : 'Post my letter'}
            </button>
          </div>
        </form>
      )}
      {(phase === 'sealing' || phase === 'posting') && (
        <div aria-hidden="true" className="tp-post__scene">
          <svg viewBox="0 0 160 112" className="tp-post__envelope">
            <rect
              x="4"
              y="18"
              width="152"
              height="90"
              rx="6"
              fill="#fffdf8"
              stroke="#2a170e"
              strokeWidth="4"
            />
            <path
              d="M6 104 64 62M154 104 96 62"
              fill="none"
              stroke="#2a170e"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              className="tp-post__flap"
              d="M6 22 80 74 154 22"
              fill="#fbe3b4"
              stroke="#2a170e"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <circle cx="80" cy="72" r="11" fill="#a24a1a" stroke="#2a170e" strokeWidth="3" />
          </svg>
          <svg viewBox="0 0 200 260" className="tp-post__box">
            <rect
              x="86"
              y="170"
              width="28"
              height="86"
              fill="#5a3a28"
              stroke="#2a170e"
              strokeWidth="4"
            />
            <path
              d="M30 70a70 54 0 0 1 140 0v104H30z"
              fill="#c2622b"
              stroke="#2a170e"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            <rect x="58" y="86" width="84" height="14" rx="7" fill="#2a170e" />
            <path
              d="M44 128h112"
              stroke="#2a170e"
              strokeWidth="3"
              strokeLinecap="round"
              opacity=".35"
            />
            <g className="tp-post__flag">
              <path
                d="M170 120V64"
                stroke="#2a170e"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="M170 64h22v16h-22"
                fill="#f2be6b"
                stroke="#2a170e"
                strokeWidth="4"
                strokeLinejoin="round"
              />
            </g>
          </svg>
        </div>
      )}
      {phase === 'sent' && (
        <div ref={sentRef} tabIndex={-1} role="status" className="tp-post__sent">
          <svg
            viewBox="0 0 200 150"
            aria-hidden="true"
            className="tp-post__box tp-post__box--sent"
          >
            <rect
              x="86"
              y="96"
              width="28"
              height="52"
              fill="#5a3a28"
              stroke="#2a170e"
              strokeWidth="4"
            />
            <path
              d="M30 50a70 44 0 0 1 140 0v52H30z"
              fill="#c2622b"
              stroke="#2a170e"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            <rect x="58" y="58" width="84" height="12" rx="6" fill="#2a170e" />
            <path d="M170 92V22" stroke="#2a170e" strokeWidth="5" strokeLinecap="round" />
            <path
              d="M170 22h22v16h-22"
              fill="#f2be6b"
              stroke="#2a170e"
              strokeWidth="4"
              strokeLinejoin="round"
            />
          </svg>
          <p className="font-plush mt-4 text-[2rem]">{success?.heading}</p>
          <p className="mx-auto mt-2 max-w-[40ch] text-cocoa-soft">{success?.body}</p>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-whatsapp mt-6"
          >
            WhatsApp us
          </a>
        </div>
      )}
    </div>
  );
}

export function StoryRibbon() {
  const ref = useRef<HTMLDivElement>(null);
  const [scaleY, setScaleY] = useState(0);

  useEffect(() => {
    const update = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const startY = 0.3 * window.innerHeight;
      const endY = window.innerHeight;
      const total = r.height - (endY - startY);
      const current = startY - r.top;
      setScaleY(Math.min(1, Math.max(0, current / Math.max(1, total))));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="tp-ribbon">
      <div className="tp-ribbon__track">
        <div
          className="tp-ribbon__band"
          style={{ transform: `scaleY(${scaleY.toFixed(4)})`, transformOrigin: 'top' }}
        />
      </div>
    </div>
  );
}

const GALLERY_SIZES = '(min-width: 1024px) 55vw, 92vw';

export function PuppyGallery({ name, media = [] }: { name: string; media: any[] }) {
  const [index, setIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const count = media.length;
  const current = media[index];

  const goTo = useCallback(
    (nextIdx: number) => {
      if (!count) return;
      setIndex(((nextIdx % count) + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goTo(index + 1);
      if (e.key === 'ArrowLeft') goTo(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen, index, goTo]);

  if (!current) return null;

  const itemLabel = (idx: number) =>
    `${name}, ${media[idx].kind === 'video' ? 'video' : 'photo'} ${idx + 1} of ${count}`;

  const resolveUrl = (u?: string) =>
    u && u.startsWith('/media/') ? `https://puppy.instabizweb.com${u}` : u;

  return (
    <div>
      <div className="tp-storypage relative aspect-[4/5] md:aspect-[5/6]">
        <button
          key={current.id}
          type="button"
          className="absolute inset-0 block size-full"
          onClick={() => {
            dialogRef.current?.showModal();
            setModalOpen(true);
          }}
          aria-label={`Open ${itemLabel(index)} full screen`}
        >
          {current.kind === 'video' ? (
            <video
              src={resolveUrl(current.url)}
              poster={resolveUrl(current.poster?.url)}
              className="size-full object-cover"
              muted
              loop
              playsInline
              autoPlay
              aria-label={current.alt}
            />
          ) : (
            <ResponsiveMedia
              media={current}
              sizes={GALLERY_SIZES}
              preload={index === 0}
              quality={85}
            />
          )}
        </button>
        {count > 1 && (
          <div className="absolute inset-x-4 bottom-4 flex justify-between">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              className="grid size-12 place-items-center rounded-full border-2 border-cocoa bg-milk/95 text-xl font-bold"
              aria-label="Previous photo"
            >
              ‹
            </button>
            <span className="self-center rounded-full bg-cocoa/80 px-3 py-1 text-sm font-semibold text-milk">
              {index + 1} / {count}
            </span>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              className="grid size-12 place-items-center rounded-full border-2 border-cocoa bg-milk/95 text-xl font-bold"
              aria-label="Next photo"
            >
              ›
            </button>
          </div>
        )}
      </div>
      {count > 1 && (
        <ul
          className="mt-3 flex gap-3 overflow-x-auto px-1 pb-2 pt-2 [scrollbar-width:thin]"
          aria-label={`All photos of ${name}`}
        >
          {media.map((item, idx) => (
            <li key={item.id} className="shrink-0">
              <button
                type="button"
                onClick={() => goTo(idx)}
                aria-label={itemLabel(idx)}
                aria-current={idx === index}
                className={`relative block size-20 overflow-hidden rounded-2xl border-2 transition ${
                  idx === index
                    ? '-translate-y-0.5 border-cocoa ring-4 ring-honey'
                    : 'border-cocoa/30 opacity-70 hover:opacity-100'
                }`}
              >
                <ResponsiveMedia
                  media={item.kind === 'video' && item.poster ? item.poster : item}
                  sizes="5rem"
                />
                {item.kind === 'video' && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 grid place-items-center bg-cocoa/35 text-lg text-milk"
                  >
                    ▶
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      <dialog
        ref={dialogRef}
        aria-label={`${name} gallery`}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-cocoa/95 p-0 text-milk backdrop:bg-cocoa/70"
        onClose={() => setModalOpen(false)}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        {modalOpen && (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <p className="font-scrawl text-lg">{itemLabel(index)}</p>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="h-11 rounded-full bg-milk px-5 font-semibold text-cocoa"
              >
                Close
              </button>
            </div>
            <div className="relative flex-1 touch-pan-y">
              <div className="absolute inset-0">
                {current.kind === 'video' ? (
                  <video
                    src={resolveUrl(current.url)}
                    poster={resolveUrl(current.poster?.url)}
                    controls
                    autoPlay
                    playsInline
                    className="size-full object-contain"
                  />
                ) : (
                  <ResponsiveMedia
                    media={current}
                    sizes="95vw"
                    quality={85}
                    eager
                    style={{
                      objectFit: 'contain',
                      objectPosition: '50% 50%',
                      backgroundColor: 'transparent',
                    }}
                  />
                )}
              </div>
            </div>
            {count > 1 && (
              <div className="flex justify-center gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
                <button
                  type="button"
                  onClick={() => goTo(index - 1)}
                  className="h-12 rounded-full border-2 border-milk px-6 font-semibold"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => goTo(index + 1)}
                  className="h-12 rounded-full bg-honey px-6 font-semibold text-cocoa"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </dialog>
    </div>
  );
}

function EnquiryField({
  label,
  name,
  error,
  hint,
  ...rest
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  [key: string]: any;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-[0.95rem] font-semibold">
        {label}
        {rest.required ? (
          <span className="text-toffee-ink"> *</span>
        ) : (
          <span className="font-normal text-cocoa-soft"> (optional)</span>
        )}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        className="mt-1.5 h-12 w-full rounded-2xl border-2 border-cocoa/60 bg-milk px-4 text-base outline-none transition-[border-color,box-shadow] focus:border-cocoa focus:shadow-[0_0_0_4px_rgb(242_190_107/0.6)] aria-[invalid=true]:border-[#b3261e]"
        {...rest}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-cocoa-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="mt-1 text-sm font-semibold text-[#b3261e]">
          {error}
        </p>
      )}
    </div>
  );
}

export function EnquiryForm({
  puppy,
  puppies,
  success,
  whatsappHref,
  compact = false,
}: {
  puppy?: { id: string; label: string };
  puppies?: { id: string; label: string }[];
  success: { heading: string; body: string };
  whatsappHref: string;
  compact?: boolean;
}) {
  const [state, setState] = useState<{
    ok: boolean;
    message?: string;
    errors?: Record<string, string>;
  }>({ ok: false });
  const [pending, setPending] = useState(false);
  const selectId = useId();
  const msgId = useId();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const validation = validateEnquiryForm({
      name: String(fd.get('name') ?? ''),
      phone: String(fd.get('phone') ?? ''),
      email: String(fd.get('email') ?? ''),
      area: String(fd.get('area') ?? ''),
      puppyId: String(fd.get('puppyId') ?? ''),
      message: String(fd.get('message') ?? ''),
      website: String(fd.get('website') ?? ''),
    });

    if (!validation.ok) {
      setState({
        ok: false,
        message: 'Please check the highlighted fields below.',
        errors: validation.errors,
      });
      return;
    }

    setPending(true);
    window.setTimeout(() => {
      setPending(false);
      setState({ ok: true });
    }, 250);
  };

  if (state.ok) {
    return (
      <div
        role="status"
        className="tp-sent rounded-[2rem] border-[3px] border-cocoa bg-honey p-8 text-center"
      >
        <svg viewBox="0 0 120 84" className="tp-envelope mx-auto w-32" aria-hidden="true">
          <path
            d="M6 10h108v68H6z"
            fill="#fffdf8"
            stroke="#2a170e"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M6 10l54 40 54-40"
            fill="none"
            stroke="#2a170e"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <circle cx="94" cy="62" r="12" fill="#c2622b" stroke="#2a170e" strokeWidth="2.5" />
        </svg>
        <p className="font-plush mt-4 text-[2rem]">{success?.heading}</p>
        <p className="mx-auto mt-2 max-w-[38ch] text-cocoa-soft">{success?.body}</p>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-whatsapp mt-6"
        >
          WhatsApp us
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {state.message && (
        <p role="alert" className="rounded-2xl bg-blush px-4 py-3 font-semibold">
          {state.message}
        </p>
      )}
      <div className={compact ? 'space-y-5' : 'grid gap-5 sm:grid-cols-2'}>
        <EnquiryField
          label="Your name"
          name="name"
          autoComplete="name"
          required
          minLength={2}
          maxLength={80}
          error={state.errors?.name}
        />
        <EnquiryField
          label="Phone or WhatsApp"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          error={state.errors?.phone}
          hint="With country code, e.g. +971 50 123 4567"
        />
        <EnquiryField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          error={state.errors?.email}
        />
        <EnquiryField
          label="Your area"
          name="area"
          autoComplete="address-level2"
          maxLength={80}
          error={state.errors?.area}
          hint="e.g. Dubai Marina"
        />
      </div>
      {puppy ? (
        <input type="hidden" name="puppyId" value={puppy.id} />
      ) : (
        puppies && (
          <div>
            <label htmlFor={selectId} className="block text-[0.95rem] font-semibold">
              Puppy you&apos;re interested in{' '}
              <span className="font-normal text-cocoa-soft">(optional)</span>
            </label>
            <select
              id={selectId}
              name="puppyId"
              className="mt-1.5 h-12 w-full rounded-2xl border-2 border-cocoa/60 bg-milk px-4 text-base"
              defaultValue=""
            >
              <option value="">Not sure yet</option>
              {puppies.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        )
      )}
      <div>
        <label htmlFor={msgId} className="block text-[0.95rem] font-semibold">
          Message <span className="font-normal text-cocoa-soft">(optional)</span>
        </label>
        <textarea
          id={msgId}
          name="message"
          rows={compact ? 3 : 4}
          maxLength={2000}
          className="mt-1.5 w-full rounded-2xl border-2 border-cocoa/60 bg-milk px-4 py-3 text-base outline-none focus:border-cocoa focus:shadow-[0_0_0_4px_rgb(242_190_107/0.6)]"
          defaultValue={puppy ? `Hi! I'd love to know more about ${puppy.label}.` : ''}
        />
        {state.errors?.message && (
          <p className="mt-1 text-sm font-semibold text-[#b3261e]">{state.errors.message}</p>
        )}
      </div>
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary w-full disabled:opacity-70 sm:w-auto"
      >
        {pending ? 'Sending…' : 'Send enquiry'}
      </button>
    </form>
  );
}
