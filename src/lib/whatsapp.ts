import { SITE } from './site';

export function buildWhatsappUrl(message: string): string {
  return `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function productWhatsappUrl(productName: string, customMessage?: string): string {
  const message = customMessage || `Hola, me interesa cotizar ${productName} personalizado con el logo de mi empresa.`;
  return buildWhatsappUrl(message);
}

export function cityWhatsappUrl(cityName: string): string {
  return buildWhatsappUrl(`Hola, me interesa cotizar productos promocionales en ${cityName}.`);
}
