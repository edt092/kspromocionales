#!/usr/bin/env node
/**
 * Inventario de fuentes de evidencia SEO + baseline reproducible de Search Console.
 * Solo lee la carpeta de evidencia; escribe únicamente en docs/seo-improvement/.
 *
 * Uso:
 *   node scripts/seo-improvement/evidence-baseline.mjs "<carpeta ANALISI-09-10-2026>"
 *
 * Salidas:
 *   docs/seo-improvement/INVENTARIO_FUENTES.json
 *   docs/seo-improvement/BASELINE_GSC.json
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv, parseCsvObjects, toNumber } from './lib/csv.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT_DIR = path.join(ROOT, 'docs', 'seo-improvement');
const DEFAULT_EVIDENCE =
  'C:/Users/Dagon/Desktop/MIS PROYECTOS PERSONALES/SITIOS_WEB/SEO-ANALISI-GENERAL/SEO-KSPROMOCIONALES.CO/ANALISI-09-10-2026';
const EVIDENCE = path.resolve(process.argv[2] || DEFAULT_EVIDENCE);

function walk(dir) {
  const files = [];
  const emptyDirs = [];
  const entries = readdirSync(dir);
  if (entries.length === 0) emptyDirs.push(dir);
  for (const entry of entries) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      const sub = walk(full);
      files.push(...sub.files);
      emptyDirs.push(...sub.emptyDirs);
    } else files.push(full);
  }
  return { files, emptyDirs };
}

const rel = (p) => path.relative(EVIDENCE, p).split(path.sep).join('/');
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

// ---------------------------------------------------------------- inventario
function inventory() {
  const { files, emptyDirs } = walk(EVIDENCE);
  const byHash = new Map();
  const items = files.sort().map((file) => {
    const buf = readFileSync(file);
    const hash = sha256(buf);
    const ext = path.extname(file).toLowerCase();
    const item = { path: rel(file), bytes: buf.length, sha256: hash, type: ext.slice(1) || 'sin-extension' };
    const text = buf.toString('utf8');
    item.utf8Bom = buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
    if (ext === '.csv') {
      const rows = parseCsv(text).filter((r) => !(r.length === 1 && r[0] === ''));
      item.columns = rows[0] ?? [];
      item.dataRows = Math.max(0, rows.length - 1);
    } else if (ext === '.md' || ext === '.txt') {
      item.lines = text.split(/\r?\n/).length;
      if (ext === '.md') item.words = text.split(/\s+/).filter(Boolean).length;
    } else if (ext === '.json') {
      try {
        const parsed = JSON.parse(text);
        item.topLevelKeys = Array.isArray(parsed) ? `array(${parsed.length})` : Object.keys(parsed);
      } catch (err) {
        item.readError = `JSON no parseable: ${err.message}`;
      }
    }
    if (!byHash.has(hash)) byHash.set(hash, []);
    byHash.get(hash).push(item.path);
    return item;
  });
  for (const item of items) {
    const same = byHash.get(item.sha256).filter((p) => p !== item.path);
    if (same.length) item.identicalTo = same;
  }
  return {
    evidenceRoot: EVIDENCE,
    generatedAt: new Date().toISOString(),
    fileCount: items.length,
    uniqueContentCount: byHash.size,
    duplicateGroups: [...byHash.values()].filter((g) => g.length > 1),
    emptyDirectories: emptyDirs.map(rel),
    files: items,
  };
}

// ---------------------------------------------------------------- GSC
function readCsv(relPath) {
  return parseCsvObjects(readFileSync(path.join(EVIDENCE, relPath), 'utf8'));
}

function sumRows(records, clickKey = 'Clics', imprKey = 'Impresiones') {
  let clicks = 0;
  let impressions = 0;
  let weighted = 0;
  let weightedImpr = 0;
  for (const r of records) {
    const c = toNumber(r[clickKey]) ?? 0;
    const i = toNumber(r[imprKey]) ?? 0;
    const pos = toNumber(r['Posición']);
    clicks += c;
    impressions += i;
    if (pos !== null && i > 0) {
      weighted += pos * i;
      weightedImpr += i;
    }
  }
  return {
    clicks,
    impressions,
    ctrPercent: impressions ? round((clicks / impressions) * 100, 2) : null,
    impressionWeightedPosition: weightedImpr ? round(weighted / weightedImpr, 2) : null,
  };
}

const round = (n, d) => Math.round(n * 10 ** d) / 10 ** d;

function gscBaseline() {
  const PERF = 'Rendimiento-resultados-de-busqueda-todos-los-paises';
  const IDX = 'Paginas-no-index-gsc-problems';

  const chart = readCsv(`${PERF}/Gráfico.csv`).records.sort((a, b) => (a.Fecha < b.Fecha ? -1 : 1));
  const monthly = {};
  for (const r of chart) {
    const m = r.Fecha.slice(0, 7);
    (monthly[m] ||= []).push(r);
  }
  const last28 = chart.slice(-28);
  const prev28 = chart.slice(-56, -28);

  const pages = readCsv(`${PERF}/Páginas.csv`).records;
  const pageKey = Object.keys(pages[0] ?? {})[0];
  const hosts = {};
  const byPath = new Map();
  for (const r of pages) {
    const u = new URL(r[pageKey]);
    (hosts[u.host] ||= []).push(r);
    if (!byPath.has(u.pathname)) byPath.set(u.pathname, { hosts: new Set(), rows: [] });
    const entry = byPath.get(u.pathname);
    entry.hosts.add(u.host);
    entry.rows.push(r);
  }
  const normalizedPages = [...byPath.entries()]
    .map(([p, e]) => ({ path: p, hosts: [...e.hosts].sort(), ...sumRows(e.rows) }))
    .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);

  const queries = readCsv(`${PERF}/Consultas.csv`).records;
  const queryKey = Object.keys(queries[0] ?? {})[0];
  const operatorQueries = queries.filter((q) => /(^|\s)-?site:/i.test(q[queryKey]));

  const idxChart = readCsv(`${IDX}/Gráfico.csv`).records.sort((a, b) => (a.Fecha < b.Fecha ? -1 : 1));
  const withCounts = idxChart.filter((r) => toNumber(r.Indexadas) !== null);
  const latest = withCounts.at(-1);
  const issues = readCsv(`${IDX}/Problemas críticos.csv`).records.map((r) => ({
    reason: r.Motivo,
    source: r.Fuente,
    validation: r['Validación'],
    pages: toNumber(r['Páginas']),
  }));
  const issuesTotal = issues.reduce((s, r) => s + (r.pages ?? 0), 0);
  const indexChanges = [];
  for (let i = 1; i < withCounts.length; i++) {
    const a = toNumber(withCounts[i - 1].Indexadas);
    const b = toNumber(withCounts[i].Indexadas);
    if (a !== b) indexChanges.push({ from: withCounts[i - 1].Fecha, to: withCounts[i].Fecha, indexed: [a, b] });
  }

  return {
    generatedAt: new Date().toISOString(),
    formulas: {
      ctr: 'clics / impresiones × 100 (nunca media de CTR)',
      position: 'Σ(posición × impresiones) / Σ(impresiones de filas con posición); usa valores exportados ya redondeados, es una reconstrucción aproximada',
      blanks: 'celda vacía = sin dato, nunca cero',
    },
    filters: readCsv(`${PERF}/Filtros.csv`).records,
    performance: {
      scope: 'Todos los países, tipo de búsqueda Web. La carpeta de Colombia está vacía: consultas y páginas NO están filtradas por país.',
      chartRange: { from: chart[0]?.Fecha, to: chart.at(-1)?.Fecha, days: chart.length },
      totals: sumRows(chart),
      monthly: Object.fromEntries(
        Object.entries(monthly).map(([m, rows]) => [m, { days: rows.length, ...sumRows(rows) }])
      ),
      last28: { from: last28[0]?.Fecha, to: last28.at(-1)?.Fecha, ...sumRows(last28) },
      previous28: { from: prev28[0]?.Fecha, to: prev28.at(-1)?.Fecha, ...sumRows(prev28) },
      countries: readCsv(`${PERF}/Países.csv`).records,
      countriesTotal: sumRows(readCsv(`${PERF}/Países.csv`).records),
      devices: readCsv(`${PERF}/Dispositivos.csv`).records,
      devicesTotal: sumRows(readCsv(`${PERF}/Dispositivos.csv`).records),
      pages: {
        note: 'Agregación por página: el total no coincide con el de propiedad y no se suma a él.',
        rows: pages.length,
        ...sumRows(pages),
        byHost: Object.fromEntries(Object.entries(hosts).map(([h, rows]) => [h, { rows: rows.length, ...sumRows(rows) }])),
        distinctPaths: byPath.size,
        pathsOnBothHosts: normalizedPages.filter((p) => p.hosts.length > 1).map((p) => p.path),
        normalizedByPath: normalizedPages,
      },
      queries: {
        note: 'Desglose parcial por privacidad/umbral; no representa todo el tráfico. No se une con páginas.',
        rows: queries.length,
        ...sumRows(queries),
        operatorQueries: { rows: operatorQueries.length, ...sumRows(operatorQueries), list: operatorQueries.map((q) => q[queryKey]) },
        all: queries,
      },
      searchAppearanceRows: readCsv(`${PERF}/Aparición en búsquedas.csv`).records.length,
    },
    indexing: {
      scope: readCsv(`${IDX}/Metadatos.csv`).records,
      chartRange: { from: idxChart[0]?.Fecha, to: idxChart.at(-1)?.Fecha, days: idxChart.length },
      daysWithCounts: withCounts.length,
      daysWithoutCounts: idxChart.length - withCounts.length,
      latest: latest && {
        date: latest.Fecha,
        indexed: toNumber(latest.Indexadas),
        notIndexed: toNumber(latest['Sin indexar']),
        known: toNumber(latest.Indexadas) + toNumber(latest['Sin indexar']),
      },
      indexChanges,
      criticalIssues: issues,
      criticalIssuesTotal: issuesTotal,
      nonCriticalIssueRows: readCsv(`${IDX}/Problemas no críticos.csv`).records.length,
    },
  };
}

mkdirSync(OUT_DIR, { recursive: true });
const inv = inventory();
const gsc = gscBaseline();
writeFileSync(path.join(OUT_DIR, 'INVENTARIO_FUENTES.json'), JSON.stringify(inv, null, 2) + '\n');
writeFileSync(path.join(OUT_DIR, 'BASELINE_GSC.json'), JSON.stringify(gsc, null, 2) + '\n');

const t = gsc.performance.totals;
const l = gsc.indexing.latest;
console.log(`Fuentes: ${inv.fileCount} archivos, ${inv.uniqueContentCount} contenidos únicos, ${inv.duplicateGroups.length} grupos duplicados, carpetas vacías: ${inv.emptyDirectories.join(', ') || 'ninguna'}`);
console.log(`Rendimiento ${gsc.performance.chartRange.from}→${gsc.performance.chartRange.to}: ${t.clicks} clics / ${t.impressions} impresiones / CTR ${t.ctrPercent}% / pos. ponderada ${t.impressionWeightedPosition}`);
console.log(`Indexación al ${l.date}: ${l.indexed} indexadas / ${l.notIndexed} sin indexar / ${l.known} conocidas; motivos suman ${gsc.indexing.criticalIssuesTotal}`);
