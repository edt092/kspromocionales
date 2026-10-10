import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildIndex, search, normalizeWord, tokenize } from '../../../src/lib/search-core.mjs';

// Índice con el mismo formato que /buscar/indice.json, construido desde los datos reales.
const products = JSON.parse(readFileSync(new URL('../../../data/products.json', import.meta.url), 'utf8'));
const categories = JSON.parse(readFileSync(new URL('../../../data/categories.json', import.meta.url), 'utf8'));
const catIdx = new Map(categories.map((c, i) => [c.id, i]));
const index = buildIndex({
  c: categories.map((c) => [c.id, c.slug, c.name]),
  p: products.map((p) => [p.slug, p.name, catIdx.get(p.categoryId) ?? -1, p.sourceProductId ?? '', '', (p.secondaryCategoryIds ?? []).map((id) => catIdx.get(id))]),
});
const names = (rs) => rs.map((r) => r.name);

test('normaliza tildes, mayúsculas y plurales simples', () => {
  assert.equal(normalizeWord('Bolígrafos'), 'boligrafo');
  assert.equal(normalizeWord('MUGS'), 'mug');
  assert.equal(normalizeWord('Termos'), 'termo');
  assert.deepEqual(tokenize('Mug Metálico 350ml'), ['mug', 'metalico', '350ml']);
});

test('referencia exacta encuentra el producto', () => {
  const r = search(index, '10663');
  assert.equal(r[0].slug, 'boligrafo-aldrich-solido-10663');
});

test('sinónimos locales: lapicero y esfero encuentran bolígrafos', () => {
  for (const q of ['lapicero', 'esfero', 'lapiceros']) {
    const r = search(index, q);
    assert.ok(r.length > 20, `${q}: ${r.length}`);
    assert.ok(r.some((p) => /bol[ií]grafo/i.test(p.name)), `${q} debe incluir bolígrafos`);
  }
});

test('sinónimos: taza encuentra mugs', () => {
  assert.ok(search(index, 'taza').some((p) => /^mug/i.test(p.name)));
});

test('todas las palabras deben coincidir (AND) y sin tildes', () => {
  const r = search(index, 'boligrafo aldrich');
  assert.ok(r.length >= 2);
  assert.ok(names(r).every((n) => /aldrich/i.test(n)));
});

test('filtro de categoría (incluye asociaciones secundarias)', () => {
  const termos = categories.find((c) => c.slug === 'termos-personalizados');
  const r = search(index, 'termo', { categoryId: termos.id });
  assert.ok(r.length > 0);
  assert.ok(r.every((p) => p.categoryIds.includes(termos.id)));
});

test('solo categoría sin texto lista la categoría completa', () => {
  const llaveros = categories.find((c) => c.id === 'llaveros');
  assert.equal(search(index, '', { categoryId: llaveros.id }).length, products.filter((p) => [p.categoryId, ...(p.secondaryCategoryIds ?? [])].includes('llaveros')).length);
});

test('consulta sin coincidencias devuelve vacío, y vacío sin filtros no lista nada', () => {
  assert.deepEqual(search(index, 'zzzqqq'), []);
  assert.deepEqual(search(index, '   '), []);
});
