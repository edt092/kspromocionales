/** Tamaño de página para categorías grandes (Fase 8, SEO_AUDIT_1.md). */
export const CATEGORY_PAGE_SIZE = 60;

export function totalPagesFor(itemCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(itemCount / pageSize));
}

export function pageSlice<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
