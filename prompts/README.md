# AI Prompts & Reverse-Engineering Workflow

This folder documents the structured prompt engineering methodology used to reverse-engineer and reconstruct **TeddyPups U.A.E.** (`https://puppy.instabizweb.com/`).

## Files

- [`master-reverse-engineering-prompt.md`](./master-reverse-engineering-prompt.md) — The complete multi-phase prompt covering live browser discovery, visual & design-system forensics, pointer/scroll choreography, clean React + TypeScript architecture, unit-testable pure logic extraction, and production deployment verification.

## Why This Approach Works

Instead of asking an AI tool to *"make a clone of this site"* in a single vague prompt, the master prompt enforces:
1. **Evidence-first discovery** before writing code (inspecting every route and viewport).
2. **Exact token & motion fidelity** (preserving custom CSS variables, SVG geometry, scroll-linked timelines, and pointer reactions).
3. **Clean engineering separation** (isolating pure filtering, validation, search highlighting, and math into `src/utils/puppyLogic.ts` with unit tests in `src/utils/puppyLogic.test.ts`).
4. **Deployment & QA readiness** (TypeScript checks, unit tests, production build, and SPA routing fallbacks).
