import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  PAW_PATH,
  PawIcon,
  PUP_COLORS,
  PUP_H,
  PUP_JOINTS,
  PUP_LEGS,
  PUP_PARTS,
  PUP_W,
  PupBuddy,
  legToesPath,
} from './PupEngine';

interface RouterState {
  pathname: string;
  search: string;
  hash: string;
  push: (url: string, opts?: { scroll?: boolean }) => void;
  replace: (url: string, opts?: { scroll?: boolean }) => void;
  prefetch: (url: string) => void;
}

const RouterCtx = createContext<RouterState>({
  pathname: '/',
  search: '',
  hash: '',
  push: () => {},
  replace: () => {},
  prefetch: () => {},
});

export function useRouter() {
  return useContext(RouterCtx);
}

export function usePathname() {
  return useContext(RouterCtx).pathname;
}

export function useSearchParams() {
  const { search } = useContext(RouterCtx);
  return useMemo(() => new URLSearchParams(search), [search]);
}

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [loc, setLoc] = useState(() => ({
    pathname: window.location.pathname || '/',
    search: window.location.search || '',
    hash: window.location.hash || '',
  }));

  useEffect(() => {
    const onPop = () => {
      setLoc({
        pathname: window.location.pathname || '/',
        search: window.location.search || '',
        hash: window.location.hash || '',
      });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((url: string, replaceMode: boolean, opts?: { scroll?: boolean }) => {
    const parsed = new URL(url, window.location.origin);
    if (replaceMode) {
      window.history.replaceState({}, '', parsed.pathname + parsed.search + parsed.hash);
    } else {
      window.history.pushState({}, '', parsed.pathname + parsed.search + parsed.hash);
    }
    setLoc({
      pathname: parsed.pathname,
      search: parsed.search,
      hash: parsed.hash,
    });
    if (opts?.scroll !== false) {
      if (parsed.hash) {
        setTimeout(() => {
          const el = document.querySelector(parsed.hash);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 60);
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      }
    }
  }, []);

  const value = useMemo<RouterState>(
    () => ({
      pathname: loc.pathname,
      search: loc.search,
      hash: loc.hash,
      push: (url, opts) => navigate(url, false, opts),
      replace: (url, opts) => navigate(url, true, opts),
      prefetch: () => {},
    }),
    [loc, navigate]
  );

  return <RouterCtx.Provider value={value}>{children}</RouterCtx.Provider>;
}

export function Link({
  href,
  children,
  className,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  );
}

export function ResponsiveImage({
  src,
  alt = '',
  width,
  height,
  fill,
  className,
  style,
  sizes,
  loading = 'lazy',
  preload,
  fetchPriority,
  placeholder,
  quality,
  ...rest
}: any) {
  const resolvedSrc =
    typeof src === 'string' && src.startsWith('/media/')
      ? `https://puppy.instabizweb.com${src}`
      : src;

  const imgStyle: React.CSSProperties = fill
    ? {
        position: 'absolute',
        height: '100%',
        width: '100%',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        ...style,
      }
    : { ...style };

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={sizes}
      loading={preload ? 'eager' : loading}
      decoding="async"
      data-nimg={fill ? 'fill' : '1'}
      className={className}
      style={imgStyle}
      {...rest}
    />
  );
}

export function ResponsiveMedia({
  media,
  sizes,
  alt,
  className,
  preload,
  eager,
  quality,
  layout = 'fill',
  style,
}: {
  media: {
    url: string;
    alt?: string;
    width?: number;
    height?: number;
    color?: string;
    focalX?: number;
    focalY?: number;
    blurDataUrl?: string;
  };
  sizes?: string;
  alt?: string;
  className?: string;
  preload?: boolean;
  eager?: boolean;
  quality?: number;
  layout?: 'fill' | 'natural';
  style?: React.CSSProperties;
}) {
  if (!media) return null;
  const resolvedUrl =
    media.url && media.url.startsWith('/media/')
      ? `https://puppy.instabizweb.com${media.url}`
      : media.url;
  const fx = ((media.focalX ?? 0.5) * 100).toFixed(1);
  const fy = ((media.focalY ?? 0.5) * 100).toFixed(1);

  if (layout === 'natural') {
    return (
      <ResponsiveImage
        src={resolvedUrl}
        sizes={sizes}
        preload={preload}
        loading={preload || eager ? 'eager' : 'lazy'}
        className={className}
        alt={alt ?? media.alt ?? ''}
        width={media.width}
        height={media.height}
        style={{
          width: '100%',
          height: 'auto',
          backgroundColor: media.color,
          ...style,
        }}
      />
    );
  }

  return (
    <ResponsiveImage
      src={resolvedUrl}
      sizes={sizes}
      preload={preload}
      loading={preload || eager ? 'eager' : 'lazy'}
      className={className}
      alt={alt ?? media.alt ?? ''}
      fill
      style={{
        objectFit: 'cover',
        objectPosition: `${fx}% ${fy}%`,
        backgroundColor: media.color,
        ...style,
      }}
    />
  );
}

function getCurtainIntroTime(): number {
  const el = document.querySelector('.tp-curtain');
  if (!el || typeof el.getAnimations !== 'function') return Infinity;
  const anim = el.getAnimations().find((a: any) => a.animationName === 'tp-curtain-rest');
  if (anim && anim.playState !== 'finished' && typeof anim.currentTime === 'number') {
    return anim.currentTime;
  }
  return Infinity;
}

export function curtainDown(): boolean {
  const state = document.querySelector<HTMLElement>('.tp-curtain')?.dataset.state;
  return (
    (state === 'intro' && getCurtainIntroTime() < 560) ||
    state === 'covering' ||
    state === 'covered' ||
    state === 'snap'
  );
}

const RUNNER_STROKE = {
  stroke: PUP_COLORS.stroke,
  strokeWidth: 3.4,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
};

const RUNNER_NONE = {
  ...RUNNER_STROKE,
  fill: 'none',
};

function RunnerLeg({
  cls,
  at,
  d,
  len,
  fill,
}: {
  cls: string;
  at: [number, number];
  d: string;
  len: number;
  fill: string;
}) {
  return (
    <g
      className={`tp-runner__leg ${cls}`}
      style={{ transformOrigin: `${at[0]}px ${at[1]}px` }}
    >
      <g transform={`translate(${at[0]} ${at[1]})`}>
        <path d={`${d}Z`} fill={fill} />
        <path d={d} {...RUNNER_NONE} />
        <path d={legToesPath(len)} {...RUNNER_NONE} strokeWidth={2.4} />
      </g>
    </g>
  );
}

function RunnerSvg({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${PUP_W} ${PUP_H}`}
      className={`tp-runner ${className}`}
      aria-hidden="true"
      focusable="false"
      style={{ overflow: 'visible' }}
    >
      <ellipse
        cx={150}
        cy={PUP_COLORS.groundY + 2}
        rx={86}
        ry={7}
        fill={PUP_COLORS.stroke}
        opacity={0.12}
        className="tp-runner__shadow"
      />
      <g className="tp-runner__body">
        <RunnerLeg
          cls="tp-runner__leg--bf"
          at={PUP_JOINTS.hipF}
          d={PUP_LEGS.backFar}
          len={PUP_COLORS.groundY - 192}
          fill={PUP_COLORS.furDark}
        />
        <RunnerLeg
          cls="tp-runner__leg--ff"
          at={PUP_JOINTS.shoulderF}
          d={PUP_LEGS.frontFar}
          len={PUP_COLORS.groundY - 192}
          fill={PUP_COLORS.furDark}
        />
        <g
          className="tp-runner__tail"
          style={{ transformOrigin: `${PUP_JOINTS.tailBase[0]}px ${PUP_JOINTS.tailBase[1]}px` }}
        >
          <path d={PUP_PARTS.tailStem} {...RUNNER_NONE} strokeWidth={9} />
          <path
            d={PUP_PARTS.tailStem}
            stroke={PUP_COLORS.fur}
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
          />
          <path d={PUP_PARTS.tail} fill={PUP_COLORS.fur} {...RUNNER_STROKE} />
        </g>
        <RunnerLeg
          cls="tp-runner__leg--bn"
          at={PUP_JOINTS.hipN}
          d={PUP_LEGS.back}
          len={PUP_COLORS.groundY - 194}
          fill={PUP_COLORS.fur}
        />
        <path d={PUP_PARTS.body} fill={PUP_COLORS.fur} {...RUNNER_STROKE} />
        <path d={PUP_PARTS.chest} fill={PUP_COLORS.fur} {...RUNNER_STROKE} />
        <RunnerLeg
          cls="tp-runner__leg--fn"
          at={PUP_JOINTS.shoulderN}
          d={PUP_LEGS.front}
          len={PUP_COLORS.groundY - 194}
          fill={PUP_COLORS.fur}
        />
        <g className="tp-runner__head">
          <path d={PUP_PARTS.collar} fill={PUP_COLORS.collar} {...RUNNER_STROKE} strokeWidth={3} />
          <path d={PUP_PARTS.tag} fill={PUP_COLORS.cream} {...RUNNER_STROKE} strokeWidth={2.4} />
          <path
            d={PUP_PARTS.earL}
            fill={PUP_COLORS.furDark}
            {...RUNNER_STROKE}
            className="tp-runner__ear"
            style={{ transformOrigin: '174px 82px' }}
          />
          <path
            d={PUP_PARTS.earR}
            fill={PUP_COLORS.furDark}
            {...RUNNER_STROKE}
            className="tp-runner__ear tp-runner__ear--r"
            style={{ transformOrigin: '250px 82px' }}
          />
          <path d={PUP_PARTS.head} fill={PUP_COLORS.fur} {...RUNNER_STROKE} />
          <path d={PUP_PARTS.topknot} fill={PUP_COLORS.fur} {...RUNNER_STROKE} strokeWidth={3} />
          <path d={PUP_PARTS.muzzle} fill={PUP_COLORS.cream} />
          <circle cx={181} cy={116} r={7} fill={PUP_COLORS.blush} opacity={0.85} />
          <circle cx={243} cy={116} r={7} fill={PUP_COLORS.blush} opacity={0.85} />
          <path
            d="M186.5 101 Q194 91.5 201.5 101 M222.5 101 Q230 91.5 237.5 101"
            {...RUNNER_NONE}
          />
          <path d={PUP_PARTS.nose} fill={PUP_COLORS.stroke} />
          <path d={PUP_PARTS.mouth} {...RUNNER_NONE} strokeWidth={3} />
          <path
            d={PUP_PARTS.tongue}
            fill="#e98c8c"
            stroke={PUP_COLORS.stroke}
            strokeWidth={2.2}
            strokeLinejoin="round"
          />
        </g>
      </g>
    </svg>
  );
}

const CURTAIN_PRINTS: [number, number, number][] = [
  [18, 6, -76],
  [27, -4, -84],
  [36, 7, -72],
  [45, -3, -86],
  [54, 6, -74],
];

export function RouteCurtain() {
  const router = useRouter();
  const pathname = usePathname();
  const curtainRef = useRef<HTMLDivElement>(null);
  const pendingUrlRef = useRef<string | null>(null);
  const coveredAtRef = useRef(0);
  const timersRef = useRef<number[]>([]);
  const lastPathRef = useRef(pathname);
  const keyboardNavRef = useRef(false);
  const liftFnRef = useRef<() => void>(() => {});

  useEffect(() => {
    const el = curtainRef.current;
    if (!el) return;
    const docEl = document.documentElement;

    const setState = (s: string) => {
      el.dataset.state = s;
      if (s === 'idle') {
        delete docEl.dataset.curtain;
      } else {
        docEl.dataset.curtain = s;
      }
    };

    const clearTimers = () => {
      timersRef.current.forEach(window.clearTimeout);
      timersRef.current = [];
    };

    const schedule = (fn: () => void, ms: number) => {
      timersRef.current.push(window.setTimeout(fn, ms));
    };

    const lift = () => {
      if (el.dataset.state !== 'idle' && el.dataset.state !== 'lifting') {
        clearTimers();
        pendingUrlRef.current = null;
        setState('lifting');
        window.dispatchEvent(new Event('tp:arrived'));
        if (keyboardNavRef.current) {
          keyboardNavRef.current = false;
          document.getElementById('main')?.focus({ preventScroll: true });
        }
        schedule(() => setState('idle'), 460);
      }
    };

    const commitNavigate = (targetHref: string) => {
      const parsed = new URL(targetHref, window.location.href);
      if (
        parsed.pathname === window.location.pathname &&
        parsed.search === window.location.search
      ) {
        pendingUrlRef.current = null;
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        schedule(lift, 120);
        return;
      }
      router.push(parsed.pathname + parsed.search + parsed.hash);
      schedule(lift, 600);
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const anchor = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (
        !anchor ||
        (anchor.target && anchor.target !== '_self') ||
        anchor.hasAttribute('download') ||
        anchor.dataset.noCurtain !== undefined
      )
        return;

      const dest = new URL(anchor.href, window.location.href);
      if (
        dest.origin !== window.location.origin ||
        /^\/(admin|api|media|_next)(\/|$)/.test(dest.pathname)
      )
        return;

      // Same page hash link: scroll directly
      if (
        dest.pathname === window.location.pathname &&
        dest.search === window.location.search &&
        dest.hash
      ) {
        e.preventDefault();
        router.push(dest.pathname + dest.search + dest.hash);
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      keyboardNavRef.current = e.detail === 0;
      window.dispatchEvent(new Event('tp:navigate'));

      const targetHref = dest.href;
      const curState = el.dataset.state;
      pendingUrlRef.current = targetHref;

      if (curState === 'covered' || curState === 'snap') {
        commitNavigate(targetHref);
      } else if (curState !== 'covering') {
        clearTimers();
        if (curState === 'intro' && getCurtainIntroTime() < 1080) {
          setState('covered');
          coveredAtRef.current = performance.now();
          commitNavigate(targetHref);
        } else {
          setState('covering');
          schedule(() => {
            setState('covered');
            coveredAtRef.current = performance.now();
            if (pendingUrlRef.current) commitNavigate(pendingUrlRef.current);
          }, 300);
        }
      }
    };

    if (el.dataset.state === 'intro') {
      const t = getCurtainIntroTime();
      schedule(() => window.dispatchEvent(new Event('tp:arrived')), Math.max(0, 560 - (isFinite(t) ? t : 0)));
      schedule(
        () => {
          if (el.dataset.state === 'intro') setState('idle');
        },
        Math.max(0, 1080 - (isFinite(t) ? t : 0))
      );
    }

    window.addEventListener('click', onClick, true);
    liftFnRef.current = lift;

    return () => {
      clearTimers();
      delete docEl.dataset.curtain;
      window.removeEventListener('click', onClick, true);
    };
  }, [router]);

  useEffect(() => {
    if (pathname === lastPathRef.current) return;
    lastPathRef.current = pathname;
    const state = curtainRef.current?.dataset.state;
    if (state !== 'covered' && state !== 'snap' && state !== 'covering') return;
    const wait = Math.max(0, 140 - (performance.now() - coveredAtRef.current));
    const timer = window.setTimeout(
      () => requestAnimationFrame(() => liftFnRef.current()),
      state === 'covering' ? 340 : wait
    );
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <div ref={curtainRef} className="tp-curtain" data-state="intro" aria-hidden="true">
      <div className="tp-curtain__blanket">
        <svg
          className="tp-curtain__edge tp-curtain__edge--top"
          width="100%"
          height="40"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern
              id="tp-curtain-scallop"
              width="76"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path d="M0 40V27A38 25 0 0 1 76 27V40Z" fill="#fbe3b4" />
              <path d="M0 27A38 25 0 0 1 76 27" fill="none" stroke="#2a170e" strokeWidth="3" />
              <path
                d="M11 33A27 19 0 0 1 65 33"
                fill="none"
                stroke="#2a170e"
                strokeWidth="1.6"
                strokeDasharray="3.5 5.5"
                strokeLinecap="round"
                opacity=".42"
              />
            </pattern>
          </defs>
          <rect width="100%" height="40" fill="url(#tp-curtain-scallop)" />
        </svg>
        <div className="tp-curtain__stage">
          <div className="tp-curtain__prints">
            {CURTAIN_PRINTS.map(([left, top, rot], i) => (
              <svg
                key={i}
                viewBox="0 0 64 64"
                className="tp-curtain__print"
                style={{
                  left: `${left}%`,
                  top: `${top}px`,
                  rotate: `${rot + 90}deg`,
                  animationDelay: `${0.16 + 0.12 * i}s`,
                }}
              >
                <path d={PAW_PATH} />
              </svg>
            ))}
          </div>
          <div className="tp-curtain__runner">
            <RunnerSvg />
          </div>
          <p className="tp-curtain__note font-scrawl">every puppy is family</p>
        </div>
        <svg
          className="tp-curtain__edge tp-curtain__edge--bottom"
          width="100%"
          height="40"
          preserveAspectRatio="none"
        >
          <rect width="100%" height="40" fill="url(#tp-curtain-scallop)" />
        </svg>
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/puppies', label: 'Puppies' },
  { href: '/happy-families', label: 'Happy families' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Visit & contact' },
];

export function NavLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  const pathname = usePathname();
  const isActive = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      data-active={isActive ? 'true' : 'false'}
      className={className}
    >
      <span>{label}</span>
      <PawIcon className="tp-nav-link__paw" />
    </Link>
  );
}

export function MobileMenu({
  whatsappHref,
  phoneDisplay,
}: {
  whatsappHref: string;
  phoneDisplay: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const dlg = dialogRef.current;
    if (dlg?.open) dlg.close();
  }, [pathname]);

  useEffect(() => {
    const closeMenu = () => {
      const dlg = dialogRef.current;
      if (dlg?.open) dlg.close();
    };
    window.addEventListener('tp:navigate', closeMenu);
    return () => window.removeEventListener('tp:navigate', closeMenu);
  }, []);

  const openDialog = () => {
    const dlg = dialogRef.current;
    const btn = btnRef.current;
    if (!dlg || dlg.open) return;
    if (btn) {
      const r = btn.getBoundingClientRect();
      dlg.style.setProperty('--menu-x', `${Math.round(r.left + r.width / 2)}px`);
      dlg.style.setProperty('--menu-y', `${Math.round(r.top + r.height / 2)}px`);
    }
    dlg.showModal();
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={openDialog}
        className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-cocoa bg-milk px-4 text-[0.95rem] font-semibold lg:hidden"
        aria-haspopup="dialog"
      >
        <PawIcon className="size-4" />
        Menu
      </button>
      <dialog
        ref={dialogRef}
        aria-label="Site menu"
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="tp-menu m-0 h-dvh max-h-none w-screen max-w-none bg-honey p-0 text-cocoa backdrop:bg-cocoa/40"
      >
        <div className="flex h-full flex-col gutter pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5">
          <div className="flex items-center justify-between">
            <span className="font-scrawl text-lg">where to, friend?</span>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="h-11 rounded-full bg-cocoa px-5 font-semibold text-milk"
            >
              Close
            </button>
          </div>
          <nav aria-label="Mobile" className="mt-10 flex-1">
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <NavLink
                    href={item.href}
                    label={item.label}
                    className="tp-menu-link font-plush block py-2 text-[clamp(2.4rem,11vw,3.4rem)]"
                  />
                </li>
              ))}
            </ul>
          </nav>
          <div className="space-y-3">
            <a
              href={whatsappHref}
              className="btn btn-whatsapp w-full"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp us
            </a>
            <p className="text-center text-sm font-medium">{phoneDisplay}</p>
          </div>
        </div>
      </dialog>
    </>
  );
}

const WHATSAPP_URL =
  "https://wa.me/919898124987?text=Hi%20Insta%20Biz%20Web%2C%20I'd%20like%20to%20discuss%20a%20project.";

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === '/';

  useEffect(() => {
    const header = document.getElementById('site-header');
    if (!header) return;
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      header.dataset.scrolled = y > 24 ? 'true' : 'false';
      if (y > 140 && y - lastY > 6) {
        header.dataset.hidden = 'true';
      } else if (lastY - y > 6 || y <= 140) {
        header.dataset.hidden = 'false';
      }
      lastY = y;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const header = document.getElementById('site-header');
    if (header) {
      header.dataset.home = isHome ? 'true' : 'false';
      header.dataset.hidden = 'false';
      header.dataset.scrolled = window.scrollY > 24 ? 'true' : 'false';
    }
  }, [isHome, pathname]);

  return (
    <header
      id="site-header"
      data-scrolled="false"
      data-hidden="false"
      data-home={isHome ? 'true' : 'false'}
      className="tp-header fixed inset-x-0 top-0 z-50"
    >
      <div className="tp-header__bar gutter">
        <Link className="tp-header__brand" aria-label="TeddyPups U.A.E. — home" href="/">
          <img
            alt=""
            width={56}
            height={56}
            decoding="async"
            className="tp-header__logo"
            src="/brand/logo.png"
          />
          <span className="font-plush tp-header__name">TeddyPups</span>
        </Link>
        <nav aria-label="Main" className="tp-header__nav">
          <ul>
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href} label={item.label} className="tp-nav-link" />
              </li>
            ))}
          </ul>
        </nav>
        <div className="tp-header__end">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-whatsapp tp-header__wa"
          >
            WhatsApp us
          </a>
          <MobileMenu whatsappHref={WHATSAPP_URL} phoneDisplay="+971 50 000 0000" />
        </div>
      </div>
      <svg
        aria-hidden="true"
        className="tp-header__hem"
        width="100%"
        height="14"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id="tp-hem" width="44" height="14" patternUnits="userSpaceOnUse">
            <path d="M0 0H44V2A22 11 0 0 1 0 2Z" className="tp-header__hem-fill" />
            <path d="M0 2A22 11 0 0 0 44 2" className="tp-header__hem-line" />
          </pattern>
        </defs>
        <rect width="100%" height="14" fill="url(#tp-hem)" />
      </svg>
    </header>
  );
}

const FOOTER_STARS = [
  { left: '6%', top: '18%', width: '12.6px', delay: '0.00s' },
  { left: '14%', top: '42%', width: '8.4px', delay: '0.40s' },
  { left: '23%', top: '12%', width: '9.8px', delay: '0.80s' },
  { left: '31%', top: '30%', width: '7px', delay: '1.20s' },
  { left: '44%', top: '9%', width: '11.2px', delay: '1.60s' },
  { left: '52%', top: '36%', width: '7.7px', delay: '2.00s' },
  { left: '63%', top: '15%', width: '10.5px', delay: '2.40s' },
  { left: '71%', top: '40%', width: '7px', delay: '2.80s' },
  { left: '92%', top: '33%', width: '8.4px', delay: '3.20s' },
];

export function SiteFooter() {
  return (
    <footer className="tp-footer relative pb-[calc(var(--bar-h)+2rem)] text-milk md:pb-10">
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className="tp-footer__hill"
      >
        <path d="M0 80V44c120-30 240-44 360-30s240 46 360 34 240-58 360-46 240 40 360 26v52z" />
      </svg>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-6 h-64 overflow-hidden"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {FOOTER_STARS.map((s, i) => (
            <svg
              key={i}
              viewBox="0 0 40 40"
              className="tp-twinkle absolute text-honey"
              style={{ left: s.left, top: s.top, width: s.width, animationDelay: s.delay }}
              aria-hidden="true"
            >
              <path
                d="M20 3c1.6 9.4 7.6 15.4 17 17-9.4 1.6-15.4 7.6-17 17-1.6-9.4-7.6-15.4-17-17 9.4-1.6 15.4-7.6 17-17z"
                fill="currentColor"
              />
            </svg>
          ))}
        </div>
        <span className="tp-moon" />
      </div>
      <div className="gutter relative mx-auto grid max-w-[110rem] gap-12 pt-20 md:grid-cols-12 md:gap-x-12 md:gap-y-6 md:pt-28">
        <div className="md:col-span-5">
          <p className="font-plush text-big text-honey-soft">Home, at last.</p>
          <p className="mt-5 max-w-md text-milk/80">
            TeddyPups U.A.E. is a Dubai-based brand specializing in miniature puppies, offering
            premium services and worldwide shipping.
          </p>
        </div>
        <div className="order-last md:order-none md:col-span-5 md:col-start-1 md:row-start-2">
          <div className="tp-basket">
            <svg aria-hidden="true" viewBox="0 0 300 240" className="tp-basket__back">
              <ellipse cx="212" cy="145" rx="96" ry="12" className="tp-basket__hollow" />
              <path d="M116 145 A96 12 0 0 1 308 145" className="tp-basket__rim-line" />
              <path d="M116 145 A96 12 0 0 1 308 145" className="tp-basket__rim" />
            </svg>
            <div
              data-pup-stop="true"
              data-pose="snug"
              data-facing="right"
              data-act="basket"
              data-behind="true"
              data-lane="true"
              className="pup-stop tp-basket__pup"
            >
              <PupBuddy
                pose="snug"
                facing="right"
                label="Teddy, sitting snug in his basket"
                asStop
              />
            </div>
            <svg aria-hidden="true" viewBox="0 0 300 240" className="tp-basket__front">
              <path
                d="M116 145 C118 180 126 214 138 232 L286 232 C298 214 306 180 308 145 A96 12 0 0 1 116 145 Z"
                className="tp-basket__body"
              />
              <path
                d="M121 178 Q212 197 303 178 M127 206 Q212 223 297 206"
                className="tp-basket__weave"
              />
              <path
                d="M150 164 L158 230 M182 168 L185 232 M212 169 V232 M242 168 L239 232 M274 164 L266 230"
                className="tp-basket__weave tp-basket__weave--stakes"
              />
              <path d="M116 145 A96 12 0 0 0 308 145" className="tp-basket__rim-line" />
              <path d="M116 145 A96 12 0 0 0 308 145" className="tp-basket__rim" />
            </svg>
          </div>
        </div>
        <nav
          aria-label="Footer"
          className="md:col-span-3 md:col-start-7 md:row-span-2 md:row-start-1"
        >
          <h2 className="font-scrawl text-lg text-honey">Explore</h2>
          <ul className="mt-4 space-y-2.5">
            <li>
              <Link
                className="font-semibold text-milk/90 underline-offset-4 hover:text-honey hover:underline"
                href="/puppies"
              >
                Available puppies
              </Link>
            </li>
            <li>
              <Link
                className="font-semibold text-milk/90 underline-offset-4 hover:text-honey hover:underline"
                href="/gone-home"
              >
                Gone home
              </Link>
            </li>
            <li>
              <Link
                className="font-semibold text-milk/90 underline-offset-4 hover:text-honey hover:underline"
                href="/happy-families"
              >
                Happy families
              </Link>
            </li>
            <li>
              <Link
                className="font-semibold text-milk/90 underline-offset-4 hover:text-honey hover:underline"
                href="/how-it-works"
              >
                How it works
              </Link>
            </li>
            <li>
              <Link
                className="font-semibold text-milk/90 underline-offset-4 hover:text-honey hover:underline"
                href="/how-it-works#delivery"
              >
                Delivery &amp; collection
              </Link>
            </li>
            <li>
              <Link
                className="font-semibold text-milk/90 underline-offset-4 hover:text-honey hover:underline"
                href="/faq"
              >
                FAQ
              </Link>
            </li>
            <li>
              <Link
                className="font-semibold text-milk/90 underline-offset-4 hover:text-honey hover:underline"
                href="/contact"
              >
                Visit &amp; contact
              </Link>
            </li>
          </ul>
        </nav>
        <div className="md:col-span-3 md:row-span-2 md:row-start-1">
          <h2 className="font-scrawl text-lg text-honey">Say hello</h2>
          <ul className="mt-4 space-y-2.5 text-milk/90">
            <li>
              <a
                className="font-semibold hover:text-honey"
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp +971 50 000 0000
              </a>
            </li>
            <li>
              <a className="break-all hover:text-honey" href="mailto:info@instabizweb.com">
                info@instabizweb.com
              </a>
            </li>
            <li>Downtown Dubai, United Arab Emirates</li>
          </ul>
          <ul className="mt-6 flex flex-wrap gap-3" aria-label="Social media">
            {['Instagram', 'TikTok', 'Facebook'].map((platform) => (
              <li key={platform}>
                <a
                  href="https://www.instabizweb.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center rounded-full border-2 border-milk/30 px-4 text-sm font-semibold hover:border-honey hover:text-honey"
                >
                  {platform}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="gutter relative mx-auto mt-16 flex max-w-[110rem] flex-col items-start justify-between gap-4 border-t border-milk/15 pt-6 text-sm text-milk/60 md:flex-row md:items-center">
        <span className="flex items-center gap-3">
          <img
            alt=""
            loading="lazy"
            width={36}
            height={36}
            decoding="async"
            className="size-9"
            src="/brand/logo.png"
          />
          © 2026 TeddyPups U.A.E.
        </span>
        <span className="font-scrawl text-base text-honey/80">every puppy is family</span>
      </div>
    </footer>
  );
}

export function MobileWhatsAppBar() {
  return (
    <div
      data-whatsapp-bar="true"
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-cocoa bg-milk px-3 pb-[calc(0.6rem+env(safe-area-inset-bottom))] pt-2.5 md:hidden"
    >
      <div className="mx-auto flex max-w-md gap-2">
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-whatsapp !min-h-12 flex-1 !shadow-none"
        >
          WhatsApp us
        </a>
        <a href="tel:+971500000000" className="btn btn-ghost !min-h-12 !px-5">
          Call
        </a>
      </div>
    </div>
  );
}

export function PawTrailCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const path2d = new Path2D(PAW_PATH);
    let dpr = 1;
    const prints: { x: number; y: number; rot: number; t: number }[] = [];
    let lastX = -1000;
    let lastY = -1000;
    let side = 1;
    let rafId = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    resize();

    const draw = () => {
      rafId = 0;
      const now = performance.now();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#c2622b';

      for (let i = prints.length - 1; i >= 0; i--) {
        const p = prints[i];
        const age = now - p.t;
        if (age > 1100) {
          prints.splice(i, 1);
          continue;
        }
        const prog = age / 1100;
        const scale = (1 - 0.15 * prog) * (18 / 64);
        ctx.save();
        ctx.globalAlpha = (1 - prog) * (1 - prog) * 0.28;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(scale, scale);
        ctx.translate(-32, -32);
        ctx.fill(path2d);
        ctx.restore();
      }
      if (prints.length) {
        rafId = requestAnimationFrame(draw);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const dist = Math.hypot(dx, dy);
      if (dist < 46) return;
      const angle = Math.atan2(dy, dx);
      const nx = -Math.sin(angle) * 7 * side;
      const ny = Math.cos(angle) * 7 * side;
      side *= -1;
      lastX = e.clientX;
      lastY = e.clientY;
      prints.push({
        x: e.clientX + nx,
        y: e.clientY + ny,
        rot: angle + Math.PI / 2,
        t: performance.now(),
      });
      if (!rafId) {
        rafId = requestAnimationFrame(draw);
      }
    };

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[70] size-full"
    />
  );
}

export function RevealScope({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!targets.length) return;

    const pending = new Set<HTMLElement>();
    let ready = !curtainDown();
    const revealEl = (el: HTMLElement) => {
      el.dataset.in = 'true';
    };

    const onArrived = () => {
      if (ready) return;
      ready = true;
      pending.forEach(revealEl);
      pending.clear();
    };

    if (!ready) {
      window.addEventListener('tp:arrived', onArrived, { once: true });
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            if (ready) {
              revealEl(el);
            } else {
              pending.add(el);
            }
            io.unobserve(el);
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 }
    );

    targets.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      window.removeEventListener('tp:arrived', onArrived);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export interface ViewerPhotoItem {
  url: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  color?: string;
  focalX?: number;
  focalY?: number;
  blurDataUrl?: string;
}

export function usePhotoViewer(photos: ViewerPhotoItem[], _sizes?: string) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const activePhoto = activeIndex !== null ? photos[activeIndex] : null;

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (activeIndex !== null && !dlg.open) {
      dlg.showModal();
    } else if (activeIndex === null && dlg.open) {
      dlg.close();
    }
  }, [activeIndex]);

  useEffect(() => {
    if (activeIndex === null || photos.length === 0) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setActiveIndex((prev) => ((prev ?? 0) + 1) % photos.length);
      } else if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) => ((prev ?? 0) - 1 + photos.length) % photos.length);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, photos.length]);

  const viewer = (
    <dialog
      ref={dialogRef}
      onClose={() => setActiveIndex(null)}
      onClick={(e) => {
        if (e.target === dialogRef.current) setActiveIndex(null);
      }}
      aria-label="Photo viewer"
      className="tp-viewer m-auto max-h-[94dvh] max-w-[94vw] bg-transparent p-0 backdrop:bg-cocoa/80"
    >
      {activePhoto && (
        <div key={activeIndex} className="tp-viewer__card">
          <div className="tp-viewer__frame">
            <ResponsiveMedia
              media={activePhoto}
              layout="natural"
              sizes="90vw"
              quality={85}
              eager
              className="max-h-[72dvh] w-auto object-contain"
            />
          </div>
          {activePhoto.caption && (
            <p className="font-scrawl mt-3 text-center text-lg text-cocoa">{activePhoto.caption}</p>
          )}
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setActiveIndex(((activeIndex ?? 0) - 1 + photos.length) % photos.length)}
              className="btn btn-ghost !min-h-10 !px-4 text-sm"
            >
              ← Prev
            </button>
            <span className="font-scrawl text-sm text-cocoa-soft">
              {(activeIndex ?? 0) + 1} of {photos.length}
            </span>
            <button
              type="button"
              onClick={() => setActiveIndex(((activeIndex ?? 0) + 1) % photos.length)}
              className="btn btn-ghost !min-h-10 !px-4 text-sm"
            >
              Next →
            </button>
            <button
              type="button"
              onClick={() => setActiveIndex(null)}
              className="btn btn-primary !min-h-10 !px-5 text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </dialog>
  );

  return { open: setActiveIndex, viewer };
}
