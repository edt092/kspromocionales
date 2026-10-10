/**
 * Capa de eventos del embudo (auditoría UX/UI, UX-06), neutral respecto al proveedor.
 *
 * Solo empuja eventos a `window.dataLayer` y emite `ks:track`; NO carga scripts de terceros
 * ni envía nada fuera del sitio. Cuando el negocio elija una herramienta de analítica, esta
 * se conecta a `dataLayer` y la CSP se amplía solo con su dominio (PENDIENTES_UX, A3).
 *
 * Reglas: nunca incluir nombre, correo, teléfono, empresa, mensaje, logo ni la URL de WhatsApp
 * (lleva texto). Un clic en WhatsApp mide intención, no una conversación ni un lead.
 */

type Params = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function track(event: string, params: Params = {}): void {
  const payload = { event, ...params };
  (window.dataLayer = window.dataLayer || []).push(payload);
  window.dispatchEvent(new CustomEvent('ks:track', { detail: payload }));
}

/** Clics en enlaces de WhatsApp marcados con data-track-whatsapp="<ubicación>". */
function bindWhatsappClicks(): void {
  document.addEventListener('click', (e) => {
    const link = (e.target as Element | null)?.closest<HTMLElement>('[data-track-whatsapp]');
    if (!link) return;
    track('whatsapp_click', {
      placement: link.dataset.trackWhatsapp,
      product_id: link.dataset.productId,
      page_type: document.body.dataset.pageType,
    });
  });
}

bindWhatsappClicks();
