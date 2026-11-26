import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import {
  Link,
  ResponsiveImage,
  ResponsiveMedia,
  RevealScope,
  usePhotoViewer,
} from './GlobalShell';
import { PAW_PATH, PawIcon, PupBuddy, cuePup } from './PupEngine';

const LINEUP_SEATS: [number, number, number, number][] = [
  [9, 8.6, 0.62, -5],
  [22.5, 10.4, 0.8, 3],
  [35, 9.2, 0.7, -2],
  [65, 9.4, 0.74, 3],
  [77.5, 10.6, 0.82, -3],
  [91, 8.4, 0.6, 4],
];

const SWAP_DELAYS = [1900, 2500, 1700, 2300, 2000, 2800, 1800];

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function HeroLineup({ friends = [] }: { friends: any[] }) {
  const count = Math.min(LINEUP_SEATS.length, friends.length);
  const [activeIndices, setActiveIndices] = useState<number[]>(() =>
    friends.slice(0, count).map((_, idx) => idx)
  );
  const [seatStates, setSeatStates] = useState<Record<number, 'duck' | 'pop' | undefined>>({});
  const [poppedSeat, setPoppedSeat] = useState<number | null>(null);
  const [hoveredSeat, setHoveredSeat] = useState<number | null>(null);
  const [wingIdx, setWingIdx] = useState<number | null>(friends.length > count ? count : null);

  const listRef = useRef<HTMLUListElement>(null);
  const wingRef = useRef<HTMLSpanElement>(null);
  const activeRef = useRef(activeIndices);

  useEffect(() => {
    activeRef.current = activeIndices;
  }, [activeIndices]);

  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl || !count) return;
    const hasExtra = friends.length > count;
    const sceneEl = listEl.closest<HTMLElement>('[data-pup-scene]');
    let isIntersecting = true;
    let pauseUntil = 0;
    let alive = true;

    const io = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry.isIntersecting;
      },
      { threshold: 0.35 }
    );
    io.observe(listEl);

    const delaySwap = () => {
      pauseUntil = performance.now() + 1200;
    };
    window.addEventListener('scroll', delaySwap, { passive: true });
    window.addEventListener('pointerdown', delaySwap, { passive: true });
    listEl.addEventListener('pointerover', delaySwap, { passive: true });

    const initialPool = friends.map((_, i) => i).filter((i) => !activeRef.current.includes(i));
    let pool = initialPool.includes(count)
      ? [count, ...shuffleArray(initialPool.filter((i) => i !== count))]
      : shuffleArray(initialPool);
    let seatQueue: number[] = [];
    let lastSeat = -1;
    let delayCursor = 0;
    let timers: number[] = [];
    const schedule = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(fn, ms));
    };
    let retryCount = 0;

    const stepSwap = () => {
      if (
        document.hidden ||
        !isIntersecting ||
        performance.now() <= pauseUntil ||
        sceneEl?.dataset.here === 'false'
      ) {
        schedule(stepSwap, 900);
        return;
      }
      if (!hasExtra) {
        performSwap();
        return;
      }
      if (!pool.length) {
        pool = shuffleArray(friends.map((_, i) => i).filter((i) => !activeRef.current.includes(i)));
      }
      const preloadImg =
        wingRef.current?.dataset.for === String(pool[0])
          ? wingRef.current.querySelector('img')
          : null;
      if (!preloadImg || !preloadImg.complete || !preloadImg.naturalWidth) {
        if (++retryCount < 15) {
          schedule(stepSwap, 400);
        } else {
          const shifted = pool.shift();
          if (shifted !== undefined) pool.push(shifted);
          setWingIdx(pool[0] ?? null);
          retryCount = 0;
          schedule(stepSwap, 800);
        }
        return;
      }
      retryCount = 0;
      preloadImg.decode().then(performSwap, performSwap);
    };

    const performSwap = () => {
      if (!seatQueue.length) {
        seatQueue = shuffleArray(
          Array.from(listEl.children)
            .map((el, idx) => (el.getClientRects().length ? idx : -1))
            .filter((idx) => idx >= 0)
        ).filter((idx, pos, arr) => !(pos === 0 && idx === lastSeat && arr.length > 1));
      }
      const seat = seatQueue.shift();
      if (seat === undefined) {
        schedule(stepSwap, 2000);
        return;
      }
      lastSeat = seat;
      const nextFriendIdx = hasExtra ? pool.shift()! : activeRef.current[seat];
      setSeatStates((prev) => ({ ...prev, [seat]: 'duck' }));

      schedule(() => {
        if (hasExtra) {
          const outgoing = activeRef.current[seat];
          setActiveIndices((prev) => prev.map((val, idx) => (idx === seat ? nextFriendIdx : val)));
          pool.push(outgoing);
          setWingIdx(pool[0] ?? null);
        }
        setSeatStates((prev) => ({ ...prev, [seat]: 'pop' }));
        setPoppedSeat(seat);
        schedule(() => {
          setPoppedSeat((cur) => (cur === seat ? null : cur));
        }, 1800);
        schedule(() => {
          setSeatStates((prev) => ({ ...prev, [seat]: undefined }));
        }, 700);
      }, 360);

      schedule(stepSwap, SWAP_DELAYS[delayCursor++ % SWAP_DELAYS.length]);
    };

    if (hasExtra) setWingIdx(pool[0] ?? null);
    schedule(stepSwap, 1600);

    return () => {
      alive = false;
      void alive;
      timers.forEach(window.clearTimeout);
      timers = [];
      io.disconnect();
      window.removeEventListener('scroll', delaySwap);
      window.removeEventListener('pointerdown', delaySwap);
      listEl.removeEventListener('pointerover', delaySwap);
    };
  }, [friends, count]);

  if (!count) return null;

  const getSeatStyle = (idx: number): React.CSSProperties => {
    const [x, w, peek, tilt] = LINEUP_SEATS[idx];
    return {
      '--x': `${x}%`,
      '--w': `${w}rem`,
      '--peek': peek,
      '--tilt': `${tilt}deg`,
      '--i': idx,
    } as React.CSSProperties;
  };

  const clearHover = (idx: number) => () => {
    setHoveredSeat((cur) => (cur === idx ? null : cur));
  };

  return (
    <>
      <ul ref={listRef} className="tp-lineup" aria-label="Some of the puppies in our showroom">
        {activeIndices.map((friendIdx, seatIdx) => {
          const friend = friends[friendIdx];
          if (!friend) return null;
          return (
            <li key={seatIdx} className="tp-lineup__seat" style={getSeatStyle(seatIdx)}>
              <Link
                href={`/puppies/${friend.slug}`}
                className="tp-lineup__pup"
                data-pup-friend=""
                data-state={seatStates[seatIdx]}
                aria-label={`Meet ${friend.displayName}, ${friend.breed}`}
                onPointerEnter={() => setHoveredSeat(seatIdx)}
                onPointerLeave={clearHover(seatIdx)}
                onFocus={() => setHoveredSeat(seatIdx)}
                onBlur={clearHover(seatIdx)}
              >
                <span className="tp-lineup__photo">
                  <ResponsiveMedia
                    key={friend.id}
                    media={friend.cover}
                    sizes="11rem"
                    preload={seatIdx < 2}
                    eager
                  />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <ul aria-hidden="true" className="tp-lineup tp-lineup--tags">
        {activeIndices.map((friendIdx, seatIdx) => {
          const friend = friends[friendIdx];
          if (!friend) return null;
          return (
            <li key={seatIdx} className="tp-lineup__seat" style={getSeatStyle(seatIdx)}>
              <span
                className="tp-lineup__ghost"
                data-state={seatStates[seatIdx]}
                data-tag={poppedSeat === seatIdx || hoveredSeat === seatIdx ? 'show' : undefined}
              >
                <span className="tp-lineup__name font-scrawl">{friend.displayName}</span>
              </span>
            </li>
          );
        })}
      </ul>
      {wingIdx !== null && friends[wingIdx] && (
        <span
          ref={wingRef}
          aria-hidden="true"
          className="tp-lineup__wings"
          data-for={wingIdx}
        >
          <ResponsiveMedia media={friends[wingIdx].cover} sizes="11rem" alt="" eager />
        </span>
      )}
    </>
  );
}

function PupStop({
  pose,
  facing = 'right',
  act,
  behind = false,
  lane = false,
  className = '',
  style,
  label,
}: {
  pose: string;
  facing?: 'left' | 'right';
  act?: string;
  behind?: boolean;
  lane?: boolean;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
}) {
  return (
    <div
      data-pup-stop=""
      data-pose={pose}
      data-facing={facing}
      data-act={act}
      data-behind={behind || undefined}
      data-lane={lane || undefined}
      className={`pup-stop ${className}`}
      style={style}
    >
      <PupBuddy pose={pose} facing={facing} label={label} asStop />
    </div>
  );
}

function Scene({
  tone,
  className = '',
  style,
  children,
  ...rest
}: {
  tone: { top: string; bottom: string; dark?: boolean; sunset?: boolean };
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  [key: string]: any;
}) {
  return (
    <section
      data-pup-scene=""
      data-tone={tone?.dark ? 'dark' : 'light'}
      className={`tp-scene ${className}`}
      style={
        {
          '--sky-top': tone?.top,
          '--sky-bottom': tone?.bottom,
          ...style,
        } as React.CSSProperties
      }
      {...rest}
    >
      {children}
      {tone?.sunset && (
        <div aria-hidden="true" className="tp-horizon">
          <span className="tp-horizon__sun" />
          <svg viewBox="0 0 1440 160" preserveAspectRatio="none" className="tp-horizon__city">
            <path d="M0 160V118h34v-14h22v-22h30v34h18V96h26v30h22v-18h16v-30h34v40h20V70h28v56h24V98h18v-26h30v54h20v-38h26v-40l14-6 14 6v40h22v46h18V84h26v-30h22v50h24V76h36v50h20V96h18v-58h30v44h14V96h22v-30h16v22h26v-52l6-8v-24l4-6v-30l3-18 3 18v30l4 6v24l6 8v52h26v30h22V82h30v-20h24v48h20V90h28v-36h26v56h18V74h30v36h22V94h26v-24h30v62h20V102h26v20h34v38z" />
          </svg>
        </div>
      )}
    </section>
  );
}

const STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  reserved: 'Reserved',
  rehomed: 'Gone home',
};

const DOOR_COLORS = ['#a24a1a', '#5a3a28', '#d4893f', '#b8644a', '#7a4a2e'];

function DoorCard({
  pup,
  index,
  sizes,
  preload = false,
}: {
  pup: any;
  index: number;
  sizes: string;
  preload?: boolean;
}) {
  const hasVideo = pup.media?.some((m: any) => m.kind === 'video');
  return (
    <Link
      href={`/puppies/${pup.slug}`}
      className="tp-door__link"
      style={{ '--door': DOOR_COLORS[index % DOOR_COLORS.length] } as React.CSSProperties}
    >
      <span className="tp-door__plate">
        <span className="font-plush tp-door__name">{pup.displayName}</span>
        <span className="tp-door__meta">
          {pup.name ? `${pup.breed}, ` : ''}
          {pup.genderLabel?.toLowerCase()}
          {pup.age ? `, ${pup.age}` : ''}
          {hasVideo ? ', with video' : ''}
        </span>
      </span>
      <span className="tp-door__frame">
        <span className="tp-door__room">
          {pup.cover && <ResponsiveMedia media={pup.cover} sizes={sizes} preload={preload} />}
        </span>
        <span aria-hidden="true" className="tp-door__way">
          <span className="tp-door__leaf">
            <PawIcon className="tp-door__peephole" />
            <span className="tp-door__knob" />
          </span>
        </span>
        <span className="tp-door__tag font-scrawl">
          {STATUS_LABELS[pup.status] ?? 'Available'}
        </span>
      </span>
    </Link>
  );
}

export function Meet({
  section,
  puppies = [],
  tone,
}: {
  section: any;
  puppies: any[];
  tone: any;
}) {
  const pinRangeRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const hallRef = useRef<HTMLDivElement>(null);
  const [maxScrollX, setMaxScrollX] = useState(0);
  const [isPinned, setIsPinned] = useState(false);

  useLayoutEffect(() => {
    const measure = () => {
      const desktop = window.matchMedia('(min-width: 1024px)').matches;
      setIsPinned(desktop);
      const track = trackRef.current;
      const hall = hallRef.current;
      if (hall && track && desktop) {
        const stage = hall.parentElement!;
        const head = stage.querySelector<HTMLElement>('.tp-meet__head');
        const maxPlateH = Math.max(
          64,
          ...Array.from(track.querySelectorAll<HTMLElement>('.tp-door__plate')).map(
            (el) => el.offsetHeight
          )
        );
        const floorH = hall.querySelector<HTMLElement>('.tp-meet__floor')?.offsetHeight ?? 0;
        const doorW = Math.max(
          128,
          Math.min(
            256,
            0.15 * window.innerWidth,
            (stage.clientHeight - (head ? head.offsetTop + head.offsetHeight : 0) - floorH - maxPlateH - 40) /
              1.3
          )
        );
        hall.style.setProperty('--door-w', `${doorW.toFixed(0)}px`);
      } else {
        hall?.style.removeProperty('--door-w');
      }
      setMaxScrollX(track ? Math.max(0, track.scrollWidth - window.innerWidth) : 0);
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    if (hallRef.current?.parentElement) ro.observe(hallRef.current.parentElement);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    const pinRange = pinRangeRef.current;
    if (!isPinned || !track || !pinRange) {
      if (track) track.style.transform = '';
      return;
    }

    let rafId = 0;
    let currentX = 0;
    let targetX = 0;

    const applyX = (xVal: number, notifyPup: boolean) => {
      track.style.transform = `translate3d(${xVal.toFixed(1)}px, 0, 0)`;
      hallRef.current?.style.setProperty('--floor-x', `${xVal.toFixed(1)}px`);
      const threshold = 0.36 * window.innerWidth;
      for (const child of Array.from(track.children) as HTMLElement[]) {
        const shouldOpen = child.offsetLeft + xVal < threshold;
        if ((child.dataset.open === 'true') !== shouldOpen) {
          child.dataset.open = String(shouldOpen);
          if (shouldOpen && notifyPup) {
            cuePup({ look: child, secs: 0.9 });
          }
        }
      }
    };

    const updateTarget = () => {
      const r = pinRange.getBoundingClientRect();
      const scrollable = Math.max(1, r.height - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -r.top / scrollable));
      targetX = -progress * maxScrollX;
    };

    const tick = () => {
      updateTarget();
      const diff = targetX - currentX;
      if (Math.abs(diff) > 0.2) {
        currentX += diff * 0.22;
        applyX(currentX, true);
        rafId = requestAnimationFrame(tick);
      } else if (currentX !== targetX) {
        currentX = targetX;
        applyX(currentX, false);
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tick);
    };

    updateTarget();
    currentX = targetX;
    applyX(currentX, false);

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
    };
  }, [isPinned, maxScrollX]);

  if (!puppies.length) return null;

  return (
    <Scene
      tone={tone}
      aria-labelledby="meet-title"
      className="tp-meet"
      data-pinned={isPinned || undefined}
    >
      <div
        ref={pinRangeRef}
        data-pin-range=""
        style={
          {
            height: isPinned ? `calc(100vh + ${Math.round(0.8 * maxScrollX)}px)` : undefined,
            '--pinned': +!!isPinned,
          } as React.CSSProperties
        }
      >
        <div className="tp-meet__stage">
          <header className="tp-meet__head gutter">
            <div>
              <h2 id="meet-title" className="font-plush text-huge">
                {section?.heading}
              </h2>
              {section?.body && (
                <p className="text-lede mt-3 max-w-[44ch] text-[var(--ink-soft)]">
                  {section.body}
                </p>
              )}
            </div>
            {section?.data?.ctaLabel && (
              <Link
                href={section.data.ctaHref ?? '/puppies'}
                className="btn btn-primary shrink-0"
              >
                {section.data.ctaLabel}
              </Link>
            )}
          </header>
          <div ref={hallRef} className="tp-meet__hall">
            <ul
              ref={trackRef}
              className="tp-meet__track"
              data-treadmill=""
              aria-label="Puppies looking for a family"
            >
              {puppies.map((pup, idx) => (
                <li
                  key={pup.id}
                  className="tp-door"
                  data-open={isPinned ? 'false' : 'true'}
                >
                  <DoorCard
                    pup={pup}
                    index={idx}
                    sizes="(min-width: 1024px) 15rem, 44vw"
                  />
                </li>
              ))}
              <li className="tp-door tp-door--all" data-open="true">
                <Link
                  href={section?.data?.ctaHref ?? '/puppies'}
                  className="tp-door__link"
                >
                  <span className="tp-door__frame tp-door__frame--all">
                    <span className="font-plush tp-door__all">Meet them all</span>
                  </span>
                </Link>
              </li>
            </ul>
            <div aria-hidden="true" className="tp-meet__floor" />
            <PupStop
              pose={isPinned ? 'walk' : 'sit'}
              act={isPinned ? 'treadmill' : undefined}
              className="tp-meet__teddy"
            />
          </div>
        </div>
      </div>
    </Scene>
  );
}

export function Flight({ photo, label }: { photo?: string; label?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const planeRef = useRef<SVGGElement>(null);
  const clipId = useId();

  useEffect(() => {
    const updatePlane = (progress: number) => {
      const path = pathRef.current;
      const plane = planeRef.current;
      if (!path || !plane) return;
      const total = path.getTotalLength();
      const dist = Math.min(total, Math.max(0, progress * total));
      const pt = path.getPointAtLength(dist);
      const nextPt = path.getPointAtLength(Math.min(total, dist + 1));
      const prevPt = path.getPointAtLength(Math.max(0, dist - 1));
      const angle = (180 * Math.atan2(nextPt.y - prevPt.y, nextPt.x - prevPt.x)) / Math.PI;
      plane.setAttribute(
        'transform',
        `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)}) rotate(${angle.toFixed(1)})`
      );
      plane.style.opacity = String(Math.min(1, Math.max(0, (progress - 0.11) / 0.06)));
    };

    const onScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const startY = 0.95 * window.innerHeight;
      const endY = 0.25 * window.innerHeight;
      const totalSpan = startY - endY + r.height;
      const current = startY - r.top;
      const progress = Math.min(1, Math.max(0, current / Math.max(1, totalSpan)));
      updatePlane(progress);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const resolvedPhoto =
    typeof photo === 'string' && photo.startsWith('/media/')
      ? `https://puppy.instabizweb.com${photo}`
      : photo;

  return (
    <div ref={containerRef} className="tp-flight">
      <svg viewBox="0 0 660 300" role="img" aria-label={label}>
        <defs>
          <clipPath id={clipId}>
            <circle r="25" />
          </clipPath>
        </defs>
        <path
          ref={pathRef}
          d="M40 250 C 170 40, 470 20, 620 168"
          className="tp-flight__route"
        />
        <circle cx="40" cy="250" r="7" className="tp-flight__dot" />
        <circle cx="620" cy="168" r="7" className="tp-flight__dot" />
        <text x="40" y="284" textAnchor="middle" className="tp-flight__label">
          Korea
        </text>
        <text x="620" y="202" textAnchor="middle" className="tp-flight__label">
          Dubai
        </text>
        <g ref={planeRef} transform="translate(410 70)">
          <g transform="translate(-126 -78)">
            <path d="M28 60 L8 26 L34 26 L60 54 Z" className="tp-flight__wing" />
            <path
              d="M108 112 L142 156 L172 156 L158 112 Z"
              className="tp-flight__wing tp-flight__wing--far"
            />
            <path
              d="M20 80 C20 52 52 44 80 44 L168 44 C200 44 224 60 232 80 C224 100 200 112 168 112 L80 112 C52 112 20 104 20 80 Z"
              className="tp-flight__body"
            />
            <path d="M104 44 L138 2 L168 2 L154 44 Z" className="tp-flight__wing" />
            <path d="M206 64 C215 67 221 73 224 80" className="tp-flight__line" />
          </g>
          {resolvedPhoto && (
            <g transform="translate(10 2)">
              <image
                href={resolvedPhoto}
                x="-25"
                y="-25"
                width="50"
                height="50"
                clipPath={`url(#${clipId})`}
                preserveAspectRatio="xMidYMid slice"
              />
              <circle r="25" className="tp-flight__porthole" />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}

function ChatVideoMessage({ media }: { media: any }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  const resolvedUrl =
    media?.url && media.url.startsWith('/media/')
      ? `https://puppy.instabizweb.com${media.url}`
      : media?.url;
  const posterUrl =
    media?.poster?.url && media.poster.url.startsWith('/media/')
      ? `https://puppy.instabizweb.com${media.poster.url}`
      : media?.poster?.url;

  return (
    <div className="tp-msg tp-msg--them tp-msg--media">
      <div className="tp-video">
        <video
          ref={videoRef}
          src={resolvedUrl}
          poster={posterUrl}
          muted
          loop
          playsInline
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          aria-label={media?.alt || 'Puppy video'}
        />
        <button
          type="button"
          className="tp-video__btn"
          onClick={() => {
            const v = videoRef.current;
            if (!v) return;
            if (v.paused) v.play();
            else v.pause();
          }}
          aria-label={playing ? 'Pause video' : 'Play video'}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {playing ? (
              <path d="M7 5h3v14H7zM14 5h3v14h-3z" />
            ) : (
              <path d="M8 5v14l11-7z" />
            )}
          </svg>
        </button>
      </div>
    </div>
  );
}

export function Chat({
  section,
  tone,
  business,
  greeting,
  whatsappHref,
  breeds = [],
}: {
  section: any;
  tone: any;
  business: string;
  greeting: string;
  whatsappHref: string;
  breeds: any[];
}) {
  const items: any[] = section?.data?.items ?? [];
  const images = (section?.media ?? []).filter((m: any) => m.kind === 'image').slice(0, 4);
  const video = (section?.media ?? []).find((m: any) => m.kind === 'video') ?? null;

  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  );
  const [activeStep, setActiveStep] = useState(-1);
  const [typing, setTyping] = useState(false);

  const stepsRef = useRef<HTMLOListElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const staticMode = !isDesktop;
  const shownStep = staticMode ? items.length - 1 : activeStep;

  useEffect(() => {
    if (staticMode || !stepsRef.current) return;
    const children = Array.from(stepsRef.current.children);
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveStep(children.indexOf(entry.target as HTMLElement));
          }
        }
      },
      { rootMargin: '-28% 0px -62% 0px' }
    );
    children.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [staticMode, items.length]);

  const prevStepRef = useRef(-1);
  useEffect(() => {
    if (staticMode) return;
    const advanced = activeStep > prevStepRef.current;
    prevStepRef.current = activeStep;
    if (!advanced || activeStep < 0) return;
    setTyping(true);
    const t = window.setTimeout(() => {
      setTyping(false);
      const stepEl = screenRef.current?.querySelector(`[data-step="${activeStep}"]`);
      if (stepEl) {
        cuePup({
          look: stepEl,
          secs: 1.4,
          say: activeStep === 1 ? 'ooh, photos!' : activeStep === 2 ? 'home soon!' : undefined,
        });
      }
    }, 750);
    return () => window.clearTimeout(t);
  }, [activeStep, staticMode]);

  return (
    <Scene tone={tone} aria-labelledby="journey-title" className="tp-chat">
      <div className="tp-chat__grid gutter" data-pin-range="">
        <div className="tp-chat__story">
          <h2 id="journey-title" className="font-plush text-huge">
            {section?.heading}
          </h2>
          {section?.body && (
            <p className="text-lede mt-5 max-w-[42ch] text-[var(--ink-soft)]">{section.body}</p>
          )}
          <ol ref={stepsRef} className="tp-chat__steps">
            {items.map((item, idx) => (
              <li
                key={item.title}
                className="tp-chat__step"
                data-active={idx === shownStep || undefined}
                data-done={idx < shownStep || undefined}
              >
                <span className="tp-chat__num font-plush" aria-hidden="true">
                  {idx + 1}
                </span>
                <h3 className="font-plush tp-chat__title">{item.title}</h3>
                <p className="tp-chat__text">{item.text}</p>
              </li>
            ))}
          </ol>
          {section?.data?.ctaLabel && (
            <Link
              href={section.data.ctaHref ?? '/how-it-works'}
              className="btn btn-ghost tp-chat__cta"
            >
              {section.data.ctaLabel}
            </Link>
          )}
        </div>
        <div className="tp-chat__side">
          <div
            className="tp-phone"
            aria-label={`A WhatsApp conversation with ${business}`}
            role="group"
          >
            <div className="tp-phone__bar">
              <ResponsiveImage
                src="/brand/logo.png"
                alt=""
                width={40}
                height={40}
                className="tp-phone__avatar"
              />
              <span>
                <span className="tp-phone__name">{business}</span>
                <span className="tp-phone__status">{typing ? 'typing…' : 'online'}</span>
              </span>
            </div>
            <div ref={screenRef} className="tp-phone__screen">
              <p className="tp-msg tp-msg--me">{greeting}</p>
              {items.map((item, idx) => (
                <div
                  key={item.title}
                  className="tp-msg-group"
                  data-step={idx}
                  data-show={idx < shownStep || (idx === shownStep && !typing) ? 'true' : 'false'}
                >
                  {idx === 0 && breeds.length > 0 && (
                    <div className="tp-msg tp-msg--them">
                      <p>{item.text}</p>
                      <ul className="tp-chips" aria-label="Breeds we have now">
                        {breeds.slice(0, 6).map((b: any) => (
                          <li key={b.slug}>
                            <Link href={`/puppies?breed=${b.slug}`}>{b.name}</Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {idx === 1 && (
                    <>
                      {images.length > 0 && (
                        <div className="tp-msg tp-msg--them tp-msg--media">
                          <div className="tp-snaps">
                            {images.map((img: any) => (
                              <span key={img.id} className="tp-snaps__one">
                                <ResponsiveMedia media={img} sizes="9rem" />
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {video && <ChatVideoMessage media={video} />}
                      <p className="tp-msg tp-msg--them">{item.text}</p>
                    </>
                  )}
                  {idx === 2 && (
                    <div className="tp-msg tp-msg--them">
                      <p>{item.text}</p>
                      <svg viewBox="0 0 220 70" className="tp-route" aria-hidden="true">
                        <path d="M14 52 C 60 6, 120 70, 170 28" className="tp-route__line" />
                        <circle cx="14" cy="52" r="5" className="tp-route__dot" />
                        <path
                          d="M164 32 l12 -12 l12 12 v14 h-24 z"
                          className="tp-route__home"
                        />
                        <path
                          d="M176 42 c-2-3-7-2-6 2c1 3 6 5 6 5s5-2 6-5c1-4-4-5-6-2z"
                          className="tp-route__heart"
                        />
                        <path
                          d={PAW_PATH}
                          transform="translate(70 22) scale(.3) rotate(70 32 32)"
                          className="tp-route__paw"
                        />
                        <path
                          d={PAW_PATH}
                          transform="translate(104 38) scale(.3) rotate(100 32 32)"
                          className="tp-route__paw"
                        />
                      </svg>
                    </div>
                  )}
                  {idx > 2 && <p className="tp-msg tp-msg--them">{item.text}</p>}
                  {idx === 0 && breeds.length === 0 && (
                    <p className="tp-msg tp-msg--them">{item.text}</p>
                  )}
                </div>
              ))}
              <p className="tp-typing" data-show={typing ? 'true' : 'false'} aria-hidden="true">
                <span />
                <span />
                <span />
              </p>
            </div>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="tp-phone__compose"
            >
              <span>Say hello on WhatsApp</span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 20l18-8L3 4v6l12 2-12 2z" />
              </svg>
            </a>
          </div>
          <PupStop pose="sit" facing="right" className="tp-chat__teddy" />
        </div>
      </div>
    </Scene>
  );
}

const POLAROID_TILTS = [-2.2, 1.6, -0.9, 2.4, -1.5, 0.8, -2.6, 1.2];
const POLAROID_TAPES = ['center', 'left', 'right', 'corners', 'center', 'right', 'left', 'center'];
const POLAROID_COLORS = ['#f6d79a', '#f9cdbf', '#cfe5f6', '#f6d79a', '#e9dcc4'];

export function Polaroid({
  media,
  order,
  sizes,
  caption,
  priority = false,
}: {
  media: any;
  order: number;
  sizes: string;
  caption?: string;
  priority?: boolean;
}) {
  const tape = POLAROID_TAPES[order % POLAROID_TAPES.length];
  const tapeColor = POLAROID_COLORS[order % POLAROID_COLORS.length];
  return (
    <span
      className="tp-polaroid"
      style={
        {
          '--tilt': `${POLAROID_TILTS[order % POLAROID_TILTS.length]}deg`,
          '--tape': tapeColor,
          '--i': order,
        } as React.CSSProperties
      }
    >
      {tape === 'corners' ? (
        <>
          <span aria-hidden="true" className="tp-tape tp-tape--tl" />
          <span aria-hidden="true" className="tp-tape tp-tape--tr" />
        </>
      ) : (
        <span aria-hidden="true" className={`tp-tape tp-tape--${tape}`} />
      )}
      <span className="tp-polaroid__photo">
        <ResponsiveMedia media={media} layout="natural" sizes={sizes} preload={priority} />
      </span>
      <span className="tp-polaroid__caption font-scrawl">{caption ?? media.caption}</span>
    </span>
  );
}

const DUSK_SIZES = '(min-width: 1024px) 18vw, (min-width: 640px) 28vw, 42vw';

export function Dusk({
  section,
  photos = [],
  testimonial,
  tone,
}: {
  section: any;
  photos: any[];
  testimonial: any;
  tone: any;
}) {
  const wallPhotos = photos.slice(0, 8);
  const { open, viewer } = usePhotoViewer(photos, DUSK_SIZES);

  if (!photos.length) return null;

  return (
    <Scene tone={tone} aria-labelledby="dusk-title" className="tp-dusk">
      <div className="tp-dusk__sky gutter">
        <div className="tp-dusk__head">
          <h2 id="dusk-title" className="font-plush text-huge">
            {section?.heading}
          </h2>
          {section?.body && (
            <p className="text-lede mt-5 max-w-[50ch] text-[var(--ink-soft)]">{section.body}</p>
          )}
        </div>
        {testimonial && (
          <figure className="tp-dusk__note">
            <blockquote className="font-plush-text">“{testimonial.quote}”</blockquote>
            <figcaption className="font-scrawl">
              {testimonial.author}
              {testimonial.location ? `, ${testimonial.location}` : ''}
            </figcaption>
          </figure>
        )}
      </div>
      <div className="tp-photowall">
        <RevealScope className="tp-photowall__wall">
          <ul className="tp-photowall__prints" aria-label="Photos from TeddyPups families">
            {wallPhotos.map((photo, idx) => (
              <li
                key={photo.id}
                data-reveal=""
                data-pup-look={idx === 1 || idx === 4 ? '' : undefined}
                style={{ '--d': `${110 * [3, 0, 5, 1, 6, 2, 7, 4][idx]}ms` } as React.CSSProperties}
              >
                <button
                  type="button"
                  className="tp-photowall__print"
                  onClick={() => open(idx)}
                  aria-label={`Open photo ${idx + 1} of ${photos.length}${
                    photo.caption ? `: ${photo.caption}` : ''
                  }`}
                >
                  <Polaroid media={photo} order={idx} sizes={DUSK_SIZES} />
                </button>
              </li>
            ))}
          </ul>
          <div className="tp-facade__ground">
            <span aria-hidden="true" className="tp-facade__door" />
            <span aria-hidden="true" className="tp-lamp">
              <span className="tp-lamp__light" />
            </span>
            {section?.data?.ctaLabel && (
              <Link
                href={section.data.ctaHref ?? '/happy-families'}
                className="btn btn-primary tp-facade__cta"
              >
                {section.data.ctaLabel}
              </Link>
            )}
            <PupStop pose="sit" facing="right" className="tp-dusk__teddy" />
          </div>
        </RevealScope>
        <div aria-hidden="true" className="tp-street__pavement" />
      </div>
      {viewer}
    </Scene>
  );
}
