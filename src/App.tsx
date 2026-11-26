import React, { useEffect } from 'react';
import pageTreesRaw from './data/pageTrees.json';
import {
  Link,
  MobileWhatsAppBar,
  PawTrailCanvas,
  ResponsiveImage,
  RevealScope,
  RouteCurtain,
  RouterProvider,
  SiteFooter,
  SiteHeader,
  usePathname,
} from './components/GlobalShell';
import { PupBuddy, PupJourney } from './components/PupEngine';
import { Chat, Dusk, Flight, HeroLineup, Meet } from './components/HomeComponents';
import {
  EnquiryForm,
  Journeys,
  LetterForm,
  MemoryWall,
  NoticeBoard,
  PuppyBrowser,
  PuppyGallery,
  StoryRibbon,
} from './components/PageComponents';

const pageTrees = pageTreesRaw as {
  pages: Record<string, any>;
  puppies: Record<string, any>;
};

const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  Link,
  Image: ResponsiveImage,
  PupBuddy,
  RevealScope,
  HeroLineup,
  Meet,
  Flight,
  Chat,
  Dusk,
  PuppyBrowser,
  MemoryWall,
  Journeys,
  NoticeBoard,
  LetterForm,
  StoryRibbon,
  PuppyGallery,
  EnquiryForm,
};

function renderVNode(node: any, idx?: number): React.ReactNode {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return null;
  }
  if (typeof node === 'string' || typeof node === 'number') {
    return node;
  }
  if (Array.isArray(node)) {
    return node.map((child, i) => renderVNode(child, i));
  }
  if (node.__vnode) {
    const { type, key, props = {} } = node;
    const reactKey = key ?? idx;
    const { children, ...restProps } = props;
    const renderedChildren =
      children !== undefined ? renderVNode(children) : undefined;

    if (type === 'Fragment' || type === '$Sreact.fragment' || type === '$Sreact.suspense') {
      return <React.Fragment key={reactKey}>{renderedChildren}</React.Fragment>;
    }

    const CustomComp = COMPONENT_MAP[type];
    if (CustomComp) {
      return (
        <CustomComp key={reactKey} {...restProps}>
          {renderedChildren}
        </CustomComp>
      );
    }

    if (typeof type === 'string') {
      return React.createElement(
        type,
        { key: reactKey, ...restProps },
        renderedChildren
      );
    }
  }
  return null;
}

function NotFoundPoster() {
  return (
    <div className="gutter mx-auto grid min-h-[78vh] max-w-[110rem] place-items-center py-14">
      <div className="tp-poster">
        <span aria-hidden="true" className="tp-tape tp-tape--left" />
        <span aria-hidden="true" className="tp-tape tp-tape--right" />
        <p className="font-scrawl tp-poster__kicker">have you seen this page?</p>
        <h1 className="font-plush tp-poster__title">
          Lost<span className="sr-only">: this page has wandered off</span>
        </h1>
        <div className="tp-poster__photo">
          <PupBuddy
            pose="sniff"
            facing="right"
            label="Teddy, sniffing out the missing page"
          />
        </div>
        <p className="tp-poster__desc">
          One page, last seen wandering off. It answers to the address you typed, but it isn&apos;t
          here any more. Teddy is on the case.
        </p>
        <p className="font-scrawl tp-poster__reward">if found, take a tab:</p>
        <ul className="tp-poster__tabs" aria-label="Pages that are here">
          {[
            { href: '/', label: 'Home' },
            { href: '/puppies', label: 'Puppies' },
            { href: '/how-it-works', label: 'How it works' },
            { href: '/faq', label: 'Questions' },
            { href: '/contact', label: 'Contact' },
          ].map((t) => (
            <li key={t.href}>
              <Link href={t.href} className="tp-poster__tab">
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const PAGE_TITLES: Record<string, string> = {
  '/': 'TeddyPups U.A.E. | Premium Teacup Puppies in Dubai',
  '/puppies': 'Available Puppies | TeddyPups U.A.E.',
  '/happy-families': 'Happy Families | TeddyPups U.A.E.',
  '/how-it-works': 'How it works | TeddyPups U.A.E.',
  '/faq': 'Questions & answers | TeddyPups U.A.E.',
  '/contact': 'Visit & contact | TeddyPups U.A.E.',
  '/gone-home': 'Gone home | TeddyPups U.A.E.',
};

function RouteSwitch() {
  const pathname = usePathname();
  const cleanPath = pathname.replace(/\/+$/, '') || '/';

  useEffect(() => {
    if (PAGE_TITLES[cleanPath]) {
      document.title = PAGE_TITLES[cleanPath];
    } else if (cleanPath.startsWith('/puppies/')) {
      const slug = cleanPath.slice('/puppies/'.length);
      const formatted = slug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      document.title = `${formatted} | TeddyPups U.A.E.`;
    }
  }, [cleanPath]);

  let tree: any = null;
  if (cleanPath === '/') tree = pageTrees.pages['index'];
  else if (cleanPath === '/puppies') tree = pageTrees.pages['puppies'];
  else if (cleanPath === '/happy-families') tree = pageTrees.pages['happy-families'];
  else if (cleanPath === '/how-it-works') tree = pageTrees.pages['how-it-works'];
  else if (cleanPath === '/faq') tree = pageTrees.pages['faq'];
  else if (cleanPath === '/contact') tree = pageTrees.pages['contact'];
  else if (cleanPath === '/gone-home') tree = pageTrees.pages['gone-home'];
  else if (cleanPath.startsWith('/puppies/')) {
    const slug = decodeURIComponent(cleanPath.slice('/puppies/'.length));
    tree = pageTrees.puppies[slug] ?? null;
  }

  if (!tree) {
    return <NotFoundPoster />;
  }

  return (
    <React.Fragment key={cleanPath}>
      {renderVNode(tree)}
      {cleanPath === '/' && <PupJourney />}
    </React.Fragment>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <RouteCurtain />
      <a
        href="#main"
        className="sr-only-focusable fixed left-4 top-4 z-[100] rounded-full bg-cocoa px-5 py-3 font-semibold text-milk"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="relative pt-[var(--header-h)] outline-none">
        <RouteSwitch />
      </main>
      <SiteFooter />
      <MobileWhatsAppBar />
      <PawTrailCanvas />
    </RouterProvider>
  );
}
