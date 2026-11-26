import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateSketchGeometry,
  filterPuppies,
  filterFaqs,
  tokenizeHighlight,
  validateEnquiry,
  evalCubicBezier,
  clamp01,
  smoothstep,
} from './puppyLogic.ts';

test('generateSketchGeometry produces deterministic organic SVG paths per slug', () => {
  const g1 = generateSketchGeometry('maltipoo-max-male');
  const g2 = generateSketchGeometry('maltipoo-max-male');
  const g3 = generateSketchGeometry('korean-teacup-poodle-female');

  assert.equal(g1.mask, g2.mask);
  assert.equal(g1.outline, g2.outline);
  assert.equal(g1.tilt, g2.tilt);
  assert.notEqual(g1.mask, g3.mask);
  assert.ok(g1.mask.startsWith('M '));
  assert.ok(g1.mask.endsWith(' Z'));
  assert.ok(g1.doodles.length >= 2 && g1.doodles.length <= 3);
});

test('filterPuppies matches origin, collection, breed, and gender including pair', () => {
  const sample = [
    { slug: 'p1', origin: 'local', collection: 'standard', breedSlug: 'maltipoo', gender: 'male' },
    { slug: 'p2', origin: 'imported', collection: 'korean-teacup', breedSlug: 'poodle', gender: 'female' },
    { slug: 'p3', origin: 'local', collection: 'standard', breedSlug: 'poodle', gender: 'pair' },
  ];

  assert.equal(filterPuppies(sample, {}).length, 3);
  assert.deepEqual(
    filterPuppies(sample, { origin: 'local' }).map((p) => p.slug),
    ['p1', 'p3']
  );
  assert.deepEqual(
    filterPuppies(sample, { collection: 'korean-teacup' }).map((p) => p.slug),
    ['p2']
  );
  // Gender filter should include 'pair' puppies alongside exact gender matches
  assert.deepEqual(
    filterPuppies(sample, { gender: 'male' }).map((p) => p.slug),
    ['p1', 'p3']
  );
  assert.deepEqual(
    filterPuppies(sample, { breed: 'nonexistent' }),
    []
  );
});

test('filterFaqs and tokenizeHighlight handle empty, case-insensitive, and special regex chars', () => {
  const faqs = [
    { question: 'Are your puppies vaccinated?', answer: 'Yes, every puppy is health checked.' },
    { question: 'How does delivery work?', answer: 'Hand-delivered across the U.A.E.' },
  ];

  assert.equal(filterFaqs(faqs, '   ').length, 2);
  assert.equal(filterFaqs(faqs, 'VACCINATED').length, 1);
  assert.equal(filterFaqs(faqs, 'u.a.e.').length, 1);

  const tokens = tokenizeHighlight('Across the U.A.E. today', 'u.a.e.');
  assert.deepEqual(tokens, [
    { text: 'Across the ', highlight: false },
    { text: 'U.A.E.', highlight: true },
    { text: ' today', highlight: false },
  ]);
});

test('validateEnquiry rejects missing name or phone and accepts valid inputs', () => {
  assert.equal(validateEnquiry({ name: '   ', phone: '+971500000000' }).valid, false);
  assert.equal(validateEnquiry({ name: 'Sara', phone: '' }).valid, false);
  assert.equal(validateEnquiry({ name: 'Sara', phone: '+971 50 123 4567' }).valid, true);
});

test('evalCubicBezier, clamp01, and smoothstep compute exact boundary and midpoint values', () => {
  assert.equal(clamp01(-0.5), 0);
  assert.equal(clamp01(1.5), 1);
  assert.equal(smoothstep(0), 0);
  assert.equal(smoothstep(0.5), 0.5);
  assert.equal(smoothstep(1), 1);

  const p0 = { x: 0, y: 0 };
  const p3 = { x: 100, y: 200 };
  assert.deepEqual(evalCubicBezier(p0, p0, p3, p3, 0), p0);
  assert.deepEqual(evalCubicBezier(p0, p0, p3, p3, 1), p3);
});
