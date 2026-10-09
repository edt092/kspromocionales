/**
 * Selección comercial EXPLÍCITA para navegación y hubs (T10). Sustituye los `.slice(0, N)` sobre
 * el orden de importación del JSON, que daba prioridad accidental a Precio Bomba, Antimicrobianos,
 * Reflectivos, etc.
 *
 * Criterio documentado (docs/seo-improvement/PLAN_EJECUCION.md, T10):
 *  - tipos de producto de alta intención de compra B2B (bolígrafos, mugs, termos, botilitos,
 *    maletines, tecnología);
 *  - categorías con señal real en Search Console del periodo 13/07–06/10/2026 (antiestrés y
 *    EcoNature con clic; consultas de bolígrafos y llaveros con impresiones).
 * NO hay datos de ventas en el repositorio: ningún producto se presenta como "más vendido".
 * Ids de data/categories.json (`category.id`).
 */

/** Menú "Catálogo" del header y bloque de categorías de las páginas de ciudad. */
export const NAV_CATEGORY_IDS = ['escritura', 'mugs', 'termos-personalizados', 'tomatodos-botilitos', 'maletines', 'tecnologia', 'llaveros', 'antiestres'];

/** Footer: las de navegación + oficina y EcoNature (señal GSC). */
export const FOOTER_CATEGORY_IDS = [...NAV_CATEGORY_IDS, 'oficina', 'econature'];

/** Rejilla de categorías de la home (12). */
export const HOME_GRID_CATEGORY_IDS = [...FOOTER_CATEGORY_IDS, 'hogar', 'paraguas'];

/** Ownership de intención por hub (T14) y categorías de las que se toman sus productos de muestra. */
export const HUBS = {
  /** Distribución en volumen: ferias, activaciones, campañas. */
  articulos: ['escritura', 'llaveros', 'antiestres', 'mugs', 'maletines', 'tecnologia'],
  /** Regalos para personas concretas: clientes, empleados, ocasiones. */
  regalos: ['tecnologia', 'termos-personalizados', 'bar-y-vino', 'master-line', 'oficina', 'maletines'],
  /** Programas de marca para el equipo: uniformes, accesorios, kits. */
  merchandising: ['confeccion', 'gorras', 'maletines', 'tomatodos-botilitos', 'oficina', 'escritura'],
  /** Muestra del catálogo en la home. */
  home: ['escritura', 'mugs', 'tecnologia', 'antiestres', 'econature', 'llaveros', 'maletines', 'termos-personalizados'],
} as const;
