import { test } from 'node:test';
import assert from 'node:assert/strict';
import { repairText, repairBlogSeedText, dedupeKeywordList, repairProduct, detect, NATIONWIDE } from '../lib/text-repair.mjs';

test('cierra listas de ciudades rotas sin inventar la ciudad perdida', () => {
  assert.equal(repairText('en aeropuertos de Bucaramanga, Bogotá, Bogotá o. Cada vez'), 'en aeropuertos de Bucaramanga o Bogotá. Cada vez');
  assert.equal(repairText('ya sea en Bucaramanga, Bogotá, Bogotá o, demuestre'), 'ya sea en Bucaramanga o Bogotá, demuestre');
  assert.equal(repairText('marca en Bucaramanga, Bogotá, Medellín, Bogotá o.'), 'marca en Bucaramanga, Bogotá o Medellín.');
  assert.equal(repairText('ciudades como Bucaramanga, Bogotá, Bogotá y.'), 'ciudades como Bucaramanga y Bogotá.');
  assert.equal(repairText('empresas en Bucaramanga, Bogotá y, desde startups'), 'empresas en Bucaramanga y Bogotá, desde startups');
});

test('elimina preposiciones sin complemento', () => {
  assert.equal(repairText('los espacios de coworking en.  Lo estratégico'), 'los espacios de coworking. Lo estratégico');
  assert.equal(repairText('nuevos talentos en, hasta un detalle'), 'nuevos talentos, hasta un detalle');
  assert.equal(repairText('evento corporativo en; su marca'), 'evento corporativo; su marca');
  assert.equal(repairText('audiencia en, Medellín y más allá.'), 'audiencia en Medellín y más allá.');
});

test('rangos sin destino usan cobertura nacional real', () => {
  assert.equal(repairText('desde Bucaramanga hasta, su logo brillará'), `desde Bucaramanga hasta ${NATIONWIDE}, su logo brillará`);
  assert.equal(repairText('Desde Bucaramanga hasta.'), `Desde Bucaramanga hasta ${NATIONWIDE}.`);
  assert.equal(repairText('desde Bucaramanga hasta Bogotá y de Bogotá a.'), 'desde Bucaramanga hasta Bogotá.');
  assert.equal(repairText('Desde Bucaramanga a Bogotá o de Bogotá a, este reloj'), 'Desde Bucaramanga a Bogotá, este reloj');
  assert.equal(repairText('su marca viajando de Bucaramanga a,, acompañando'), `su marca viajando desde Bucaramanga hasta ${NATIONWIDE}, acompañando`);
  assert.equal(
    repairText('en ciudades clave como Bucaramanga, Bogotá, Bogotá y y la certeza'),
    'en ciudades clave como Bucaramanga y Bogotá, y la certeza'
  );
  assert.equal(repairText('sus equipos en Bucaramanga o o a sus socios'), 'sus equipos en Bucaramanga o a sus socios');
  assert.equal(
    repairText('desde la oficina en Bogotá hasta el coworking en Bogotá.'),
    `desde la oficina en Bogotá hasta el coworking en ${NATIONWIDE}.`
  );
});

test('gentilicios ecuatorianos', () => {
  assert.equal(repairText('empleados de empresas quiteñas y guayaquileñas'), 'empleados de empresas colombianas');
  assert.equal(repairText('ferias comerciales quiteñas y guayaquilenas'), 'ferias comerciales colombianas');
  assert.equal(repairText('una agencia quiteña hasta'), 'una agencia colombiana hasta');
});

test('quita la etiqueta de UI [más]', () => {
  assert.equal(repairText('Bolígrafo Aldrich Sólido[más]'), 'Bolígrafo Aldrich Sólido');
  assert.equal(repairText('cotizar: Mug Metálico Arrow 600 ml Nuevo[más]. ¿Podrían'), 'cotizar: Mug Metálico Arrow 600 ml Nuevo. ¿Podrían');
});

test('protege palabras y textos legítimos', () => {
  for (const ok of [
    'Calidad premium y tecnología de punta.',
    'Manta polar Calientito para el frío.',
    'Una cuenca hidrográfica y una manta de lana.',
    'Disponible en Bogotá y Medellín.',
    'Envíos desde Girón a toda Colombia.',
    'Capacidad de 1.5 litros, medida en 2.5 cm.',
    'La calificación de Cali es excelente.',
  ]) {
    assert.equal(repairText(ok), ok);
  }
});

test('es idempotente', () => {
  const samples = [
    'en Bucaramanga, Bogotá, Medellín, Bogotá y, eligen',
    'desde Bucaramanga hasta. Y coworking en. Nuevo[más]',
    'empresas quiteñas y cuencanas en Bucaramanga, Bogotá, Bogotá o.',
  ];
  for (const s of samples) {
    const once = repairText(s);
    assert.equal(repairText(once), once);
    assert.deepEqual(detect(once), {});
  }
});

test('keywords: deduplica segmentos', () => {
  assert.equal(dedupeKeywordList('termo, Bucaramanga, Bogotá, Bogotá, regalos'), 'termo, Bucaramanga, Bogotá, regalos');
});

test('blog: Medellíndad → Calidad solo como token completo', () => {
  assert.equal(repairBlogSeedText('<h3>⭐ Medellíndad Estándar</h3> en Medellín'), '<h3>⭐ Calidad Estándar</h3> en Medellín');
});

test('repairProduct no toca id, slug, categoryId ni imágenes', () => {
  const p = {
    id: 'ecologia-10663',
    slug: 'boligrafo-aldrich-solidomas-10663',
    categoryId: 'ecologia',
    images: ['https://x/10663.jpg'],
    name: 'Bolígrafo Aldrich Sólido[más]',
    useCases: ['Ferias en Bucaramanga, Bogotá, Bogotá y.'],
    keywords: 'a, Bogotá, Bogotá',
  };
  const { record, changes } = repairProduct(p);
  assert.equal(record.slug, p.slug);
  assert.equal(record.id, p.id);
  assert.equal(record.name, 'Bolígrafo Aldrich Sólido');
  assert.deepEqual(record.useCases, ['Ferias en Bucaramanga y Bogotá.']);
  assert.equal(record.keywords, 'a, Bogotá');
  assert.equal(changes.length, 3);
  assert.equal(p.name, 'Bolígrafo Aldrich Sólido[más]', 'no muta la entrada');
});
