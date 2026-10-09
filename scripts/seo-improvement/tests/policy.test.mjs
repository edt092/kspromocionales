import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluateProductIndexability as evaluate } from '../../../src/lib/product-indexability.mjs';
import { classifyGroup, primaryScore, choosePrimaryCategory, chooseSecondaryCategories, normalizeName, measuresOf } from '../lib/identity.mjs';

const img = (id) => [`https://catalogospromocionales.com/images/productos/${id}.jpg`];

// ---------------------------------------------------------------- indexabilidad
test('description vacía con contenido visible útil → indexable', () => {
  const r = evaluate({ description: '', shortDescription: 'Mug de cerámica de 11 oz', features: ['Cerámica'], story: 'x'.repeat(600) });
  assert.equal(r.indexable, true);
});

test('features vacías pero story factual → indexable', () => {
  assert.equal(evaluate({ story: 'Un texto propio y suficiente sobre el producto. '.repeat(20) }).indexable, true);
});

test('campos llenos de relleno → enriquecer, nunca noindex', () => {
  const r = evaluate({ shortDescription: 'Promociona tu marca con Abanico. Cotiza ahora.', features: ['Diseño moderno y funcional', 'Personalización con tu logo'], story: 'corta pero con más de cincuenta caracteres para contar.' });
  assert.equal(r.indexable, true);
  assert.equal(r.status, 'enriquecer');
  assert.ok(r.reasons.includes('features_genericas'));
});

test('imagen placeholder con información útil → indexable (la imagen no decide)', () => {
  assert.equal(evaluate({ images: ['/images/products/_placeholder-ksp-co.jpg'], shortDescription: 'Bolígrafo plástico con mecanismo twist' }).indexable, true);
});

test('hechos verificados bastan como contenido visible', () => {
  assert.equal(evaluate({ facts: { material: 'Plástico' } }).indexable, true);
});

test('sin ningún contenido visible → noindex (description no cuenta)', () => {
  const r = evaluate({ description: 'Producto promocional para empresas en Colombia.', images: img(1) });
  assert.equal(r.indexable, false);
  assert.equal(r.status, 'noindex_sin_contenido');
});

test('productos con clics en GSC siguen indexables', () => {
  const products = JSON.parse(readFileSync(new URL('../../../data/products.json', import.meta.url), 'utf8'));
  for (const slug of ['cojin-terapeutico-produccion-nacional-2394', 'llavero-silicone-silicona-2226', 'bolsa-en-algodon-vera-140gr-13614']) {
    const p = products.find((x) => x.slug === slug);
    assert.ok(p, `${slug} debe seguir existiendo`);
    assert.equal(evaluate(p).indexable, true, `${slug} debe seguir indexable`);
  }
});

// ---------------------------------------------------------------- identidad
test('nivel A: misma imagen y nombre sin etiquetas → mismo producto', () => {
  const r = classifyGroup([
    { slug: 'boligrafo-aldrich-solido-10663', name: 'Bolígrafo Aldrich Sólido', categoryId: 'escritura', images: img(10663) },
    { slug: 'boligrafo-aldrich-solidomas-10663', name: 'Bolígrafo Aldrich Sólido[más]', categoryId: 'ecologia', images: img(10663) },
  ]);
  assert.deepEqual([r.decision, r.tier], ['mismo_producto', 'A']);
});

test('capacidades distintas → variante, no se fusiona', () => {
  const r = classifyGroup([
    { slug: 'a-6322', name: 'Botilito en Pvc Curvy 500ml - Producción Nacional', images: img(6322) },
    { slug: 'b-6322', name: 'Botilito en Pvc Curvy 525ml - Producción Nacional', images: img(6322) },
  ]);
  assert.equal(r.decision, 'variante');
});

test('imágenes distintas → insuficiente', () => {
  assert.equal(classifyGroup([{ name: 'Mug', images: img(1) }, { name: 'Mug', images: img(2) }]).decision, 'insuficiente');
});

test('nivel B: título comercial generado frente a nombre descriptivo', () => {
  const recs = [
    { slug: 'agarre-total-flexi-tu-copiloto-ideal-7518', name: 'Agarre Total Flexi: Tu copiloto ideal', categoryId: 'automovil', images: img(7518) },
    { slug: 'soporte-para-movil-flexi-7518', name: 'Soporte Para Movil Flexi', categoryId: 'automovil', images: img(7518) },
  ];
  assert.deepEqual([classifyGroup(recs).decision, classifyGroup(recs).tier], ['mismo_producto', 'B']);
  assert.ok(primaryScore(recs[1]) > primaryScore(recs[0]), 'el nombre descriptivo gana');
});

test('la URL primaria evita etiquetas comerciales en el slug y respeta clics de GSC', () => {
  const clean = { slug: 'mug-lume-350-ml-13559', name: 'Mug Lume 350 ml', categoryId: 'mugs' };
  const badge = { slug: 'mug-lume-350-ml-nuevo-13559', name: 'Mug Lume 350 ml Nuevo', categoryId: 'novedades' };
  assert.ok(primaryScore(clean) > primaryScore(badge));
  assert.ok(primaryScore(badge, { clicks: 1, impressions: 3 }) > primaryScore(clean), 'una URL con clics se protege');
});

test('categorías: base como primaria, promocional como secundaria, ecología solo con material', () => {
  const recs = [
    { slug: 'x-7991', name: 'Set de Destornilladores Everest', categoryId: 'precio-bomba' },
    { slug: 'y-7991', name: 'Set de Destornilladores Everest - Precio Bomba', categoryId: 'herramientas' },
  ];
  assert.equal(choosePrimaryCategory(recs[0], recs), 'herramientas');
  assert.deepEqual(chooseSecondaryCategories('herramientas', recs[0].name, recs), ['precio-bomba']);
  const pens = [{ categoryId: 'escritura' }, { categoryId: 'ecologia' }];
  assert.deepEqual(chooseSecondaryCategories('escritura', 'Bolígrafo Aldrich Sólido', pens), []);
  assert.deepEqual(chooseSecondaryCategories('escritura', 'Bolígrafo Baniri Bamboo', pens), ['ecologia']);
});

test('normalizeName y measuresOf', () => {
  assert.equal(normalizeName('Mug Metálico Arrow 600 ml Nuevo[más]'), normalizeName('Mug Metálico Arrow 600 ml'));
  assert.deepEqual(measuresOf('Paraguas 23" Roma'), ['23"']);
  assert.deepEqual(measuresOf('Bolsa Holt Eco (120gr)'), ['120g']);
});

// ---------------------------------------------------------------- aliases persistidos
test('aliases: destino existente, sin cadenas, el alias ya no es producto', () => {
  const products = JSON.parse(readFileSync(new URL('../../../data/products.json', import.meta.url), 'utf8'));
  const aliases = JSON.parse(readFileSync(new URL('../../../data/product-aliases.json', import.meta.url), 'utf8'));
  const slugs = new Set(products.map((p) => p.slug));
  const slugOf = (u) => u.replace(/^\/productos\/|\/$/g, '');
  for (const a of aliases) {
    assert.ok(slugs.has(slugOf(a.to)), `destino ${a.to}`);
    assert.ok(!slugs.has(slugOf(a.from)), `alias ${a.from} no debe generarse como página`);
    assert.ok(!aliases.some((b) => b.from === a.to), `cadena ${a.from}`);
  }
});
