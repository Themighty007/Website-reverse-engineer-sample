# Autonomous Website Reverse-Engineering & High-Fidelity Reconstruction Prompt

## 0. Role & Prime Directive

You are a coordinated team of Principal Frontend Architects, Creative Technologists, Web Animation Engineers, Design-System Specialists, and QA Automation Engineers.

**Objective:** Independently reverse-engineer and reconstruct the target reference website (`https://puppy.instabizweb.com/`) with the highest technically feasible visual, structural, behavioral, and interaction fidelity.

**Non-Negotiable Rules:**
- Treat the live reference website as the single source of truth.
- Never jump straight from a URL to coding a generic homepage. Complete discovery and measurement first.
- Never replace bespoke animations, scroll-scrubbed timelines, or custom SVG rigs with generic CSS fade-ins or template libraries.
- Never invent alternative layouts, colors, or copy when exact values can be measured from the live DOM/CSS.
- Keep pure business logic (filtering, search highlighting, deterministic SVG geometry, form validation, curve math) decoupled from UI components so it can be unit-tested independently.

---

## Phase 1: Complete Website & Route Discovery

Inspect the live target URL in a real browser across desktop and mobile viewports before writing application code:

1. **Domain & Route Inventory:**
   - Crawl all internal navigation links, cards, footer links, and dynamic detail routes (`/`, `/puppies`, `/puppies/:slug`, `/happy-families`, `/how-it-works`, `/faq`, `/contact`, `/gone-home`, and custom `404`).
   - Record for every route: URL pattern, document title, section order, shared shell elements, unique interactive widgets, and media assets.
2. **Responsive Breakpoints:**
   - Inspect at `1920x1080`, `1440x900`, `1366x768`, `1024x768`, `768x1024`, and `390x844`.
   - Document navigation transformations (desktop nav -> mobile `<dialog>` drawer + sticky bottom action bar), grid column collapses, and typography fluid `clamp()` ranges.
3. **Asset & Media Mapping:**
   - Catalog custom SVG illustrations, bespoke cursors (`/cursor/paw.svg`, `/cursor/paw-press.svg`), brand icons, photos, and videos with exact `object-position` focal points and placeholder background colors.

---

## Phase 2: Visual & Design-System Forensics

Reconstruct the complete token system into CSS custom properties and Tailwind v4 utilities:

1. **Color & Surface Architecture:**
   - Extract exact HEX, RGB/RGBA, OKLab `color-mix()` expressions, and multi-stop sky/time-of-day gradients (`dawn` -> `day` -> `golden hour` -> `dusk` -> `night`).
   - Preserve surface textures: quilted hero blanket patterns, lined paper dots, corkboard grain, striped shopfront awnings, Polaroid tape, and scalloped divider seams.
2. **Typography Hierarchy:**
   - Match exact Google variable font families and axes: `Fraunces` (`SOFT`, `WONK`, `opsz`), `Figtree`, and `Shantell Sans` (`BNCE`, `INFM`).
   - Reproduce responsive `clamp()` sizing, negative tracking on display headings, and handwritten scrawl accents.
3. **Organic Geometry & Masks:**
   - Implement deterministic seeded Catmull-Rom spline generation for hand-drawn sketchbook card outlines, retrace strokes, watercolor wash blobs, and SVG clip masks so each item has a unique yet consistent organic shape.

---

## Phase 3: Pointer, Mascot & Scroll Choreography Forensics

1. **Interactive Mascot Rig (`PupEngine`):**
   - Build a multi-pose SVG mascot rig (`peek`, `walk`, `sit`, `bow`, `snug`, `sniff`, `treadmill`) with articulated ears, head tilt, eye tracking, happy closed-eye state, and tongue toggle.
   - Support pointer-reactive head/eye following and click/tap petting interactions that spawn floating hearts and cycle conversational speech bubbles (`"I like you!"`, `"treat, please?"`, `"woof woof!"`, `"achoo!"`, `"hm?"`).
   - Implement scroll-linked mascot choreography across `[data-pup-stop]` anchors using `requestAnimationFrame`, spawning fading SVG paw-print tracks along the travel path.
2. **Scroll-Driven Scenes & Pinned Sections:**
   - Reproduce pinned horizontal scrolling for the puppy doorway showcase (`Meet`), calculating track travel dynamically against viewport width and height.
   - Sync the step-by-step WhatsApp phone mockup (`Chat`) with scroll progress, including typing indicators and playable video clips.
   - Animate the Korea-to-Dubai flight path along a cubic Bezier curve (`evalCubicBezier`) synchronized to scroll position.
   - Respect `prefers-reduced-motion: reduce` across all animations and transitions.

---

## Phase 4: Interactive Features & State Integrity

Implement every interactive workflow cleanly without external backend dependencies:

1. **Catalog Filtering (`/puppies`):** Filter by origin (`local` / `imported`), collection (`korean-teacup`), breed chips, and gender (`boy` / `girl`, matching `pair` listings appropriately) with URL query synchronization.
2. **Puppy Storybook (`/puppies/:slug`):** Scroll-progress ribbon tracker, photo/video switcher, full-screen keyboard-accessible lightbox dialog, import timeline, validated enquiry form, and circular previous/next navigation.
3. **Searchable Corkboard (`/faq`):** Live search with regex-escaped term highlighting (`tokenizeHighlight`), live result counts, and animated note unfolding.
4. **Postbox Letter Form (`/contact`):** Multi-phase form submission (`writing` -> `sealing` -> `posting` -> `sent`) with client-side validation (`validateEnquiry`) and honest confirmation messaging.
5. **Custom Transitions & 404:** Scalloped quilt route-transition curtain with running mascot + 3 paw prints, and a tear-off `"Lost"` poster 404 page.

---

## Phase 5: Architecture, Testing & Deployment Readiness

1. **Modular Codebase Structure:**
   - `src/components/GlobalShell.tsx` — Client router, header, mobile menu dialog, footer, curtain, paw canvas.
   - `src/components/HomeComponents.tsx` — Homepage scene modules.
   - `src/components/PageComponents.tsx` — Subpage interactive modules.
   - `src/components/PupEngine.tsx` — Mascot SVG rig & scroll choreography engine.
   - `src/utils/puppyLogic.ts` — Pure functions for sketch geometry, filtering, FAQ search, validation, and Bezier math.
2. **Automated Verification:**
   - Write unit tests in `src/utils/puppyLogic.test.ts` covering all pure utilities.
   - Run `tsc --noEmit`, `npm test`, and `npm run build` with zero errors.
3. **Production Deployment Configs:**
   - Include `.npmrc` (`legacy-peer-deps=true`), `vercel.json`, and `public/_redirects` so SPA routes work cleanly on Vercel/Netlify without 404s on refresh.
4. **Live Multi-Viewport QA:**
   - Verify rendered pages, images, interactive controls, mobile drawer, and zero console errors in a headless browser before delivery.
