import { SITE } from './site';

/**
 * Enlaces a WhatsApp con mensaje preparado (auditoría UX/UI, UX-04).
 *
 * El mensaje de producto incluye nombre, referencia y URL de la ficha para que el asesor no
 * tenga que reconstruir la solicitud. Cantidad, ciudad y fecha quedan "por definir" salvo que
 * el usuario las indique en "Mi cotización". Abrir el enlace NO equivale a enviar: el usuario
 * revisa y envía el mensaje en WhatsApp. Módulo puro: lo usan el servidor y los scripts del cliente.
 */

/** Longitud máxima del texto: los enlaces muy largos fallan en algunos clientes de WhatsApp. */
export const WHATSAPP_MAX_CHARS = 1800;

export interface QuoteLine {
  name: string;
  slug: string;
  ref?: string | null;
  qty?: number | null;
}

export interface QuoteContext {
  city?: string | null;
  date?: string | null;
}

export function buildWhatsappUrl(message: string): string {
  return `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function productPageUrl(slug: string): string {
  return new URL(`/productos/${encodeURIComponent(slug)}/`, SITE.url).href;
}

const orPending = (v: string | number | null | undefined) =>
  v === null || v === undefined || String(v).trim() === '' ? 'por definir' : String(v).trim();

/** Mensaje de una o varias referencias. Nunca trunca en silencio: devuelve también si cabe. */
export function quoteMessage(lines: QuoteLine[], ctx: QuoteContext = {}): { text: string; fits: boolean } {
  const head = lines.length === 1 ? 'Hola, quiero solicitar una cotización.' : `Hola, quiero solicitar una cotización de ${lines.length} referencias.`;
  const body = lines.map((l, i) =>
    [
      `${lines.length > 1 ? `${i + 1}. ` : ''}Producto: ${l.name}`,
      l.ref ? `Referencia: ${l.ref}` : null,
      productPageUrl(l.slug),
      `Cantidad: ${orPending(l.qty)}`,
    ]
      .filter(Boolean)
      .join('\n')
  );
  const text = [
    head,
    '',
    body.join('\n\n'),
    '',
    `Ciudad de entrega: ${orPending(ctx.city)}`,
    `Fecha requerida: ${orPending(ctx.date)}`,
    'Por favor confirmen cantidad mínima, personalización, total y entrega.',
  ].join('\n');
  return { text, fits: text.length <= WHATSAPP_MAX_CHARS };
}

export function productWhatsappUrl(product: { name: string; slug: string; sourceProductId?: string | null }): string {
  return buildWhatsappUrl(quoteMessage([{ name: product.name, slug: product.slug, ref: product.sourceProductId ?? null }]).text);
}

export function cityWhatsappUrl(cityName: string): string {
  return buildWhatsappUrl(`Hola, me interesa cotizar productos promocionales con entrega en ${cityName}.`);
}

/** CTA general del sitio: sin ciudad, para no suponer la ubicación del visitante. */
export function generalWhatsappUrl(): string {
  return buildWhatsappUrl('Hola, me interesa cotizar productos promocionales personalizados.');
}
