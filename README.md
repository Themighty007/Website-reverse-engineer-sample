# TeddyPups U.A.E. — Website Reconstruction

A high-fidelity React + TypeScript + Tailwind CSS v4 reconstruction of **TeddyPups U.A.E.** (`https://puppy.instabizweb.com/`), preserving its visual design system, interactive SVG mascot choreography, custom paw cursors, multi-page navigation, filters, corkboard FAQ, and responsive mobile experience.

## Tech Stack

- **Framework:** React 19 + TypeScript + Vite 8
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`) + custom CSS tokens, keyframes, and hand-drawn SVG masks
- **Animation & Motion:** `motion` (Framer Motion), `requestAnimationFrame` scroll choreography (`PupEngine.tsx`), and CSS scroll-driven / intersection reveals
- **Icons:** `lucide-react` + bespoke SVG illustrations
- **Testing:** Node built-in test runner (`node:test`) via `tsx`

## Project Structure

```text
├── public/
│   ├── brand/logo.png
│   ├── cursor/paw.svg & paw-press.svg
│   └── _redirects                  # SPA fallback for Netlify / Cloudflare Pages
├── src/
│   ├── App.tsx                     # Client-side router & VNode page renderer
│   ├── index.css                   # Complete design tokens, typography, and animations
│   ├── data/pageTrees.json         # Structured multi-page & puppy profile content
│   ├── components/
│   │   ├── GlobalShell.tsx         # Header, mobile menu dialog, footer, page transition curtain, paw canvas
│   │   ├── HomeComponents.tsx      # Hero lineup, pinned horizontal doors, flight path, WhatsApp chat, dusk wall
│   │   ├── PageComponents.tsx      # Puppy filter browser, gallery/lightbox, FAQ corkboard, contact postbox, enquiry forms
│   │   └── PupEngine.tsx           # Interactive Teddy mascot, petting hearts/phrases, scroll-linked walking stops
│   └── utils/
│       ├── puppyLogic.ts           # Deterministic sketch geometry, filters, search highlight, validation, Bezier math
│       └── puppyLogic.test.ts      # Unit tests for core pure logic
├── vercel.json                     # SPA rewrite config for Vercel
└── package.json
```

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification & Build

```bash
npm run lint    # TypeScript typecheck (tsc --noEmit)
npm test        # Run unit tests (src/utils/puppyLogic.test.ts)
npm run build   # Production Vite build into dist/
```
