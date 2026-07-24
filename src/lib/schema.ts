import { SITE } from '@/lib/site';

type JsonLd = Record<string, unknown>;

/**
 * Helpers tipados y reutilizables para JSON-LD (Schema.org). Cada uno solo declara
 * propiedades verificables por el contenido visible de la página — ver SEO_AUDIT.md
 * y SEO_AUDIT_1.md para las reglas de qué NO se debe declarar (precios/stock sin
 * respaldo, LocalBusiness sin dirección real, brand no verificado, etc).
 */

/**
 * No hay helper `productSchema` / `@type: 'Product'`: Google exige `offers`, `review` o
 * `aggregateRating` para que un Product sea válido para rich results, y ninguno de los tres
 * es verificable aquí (precio por cotización, sin reseñas reales) — ver P0-1 en SEO_AUDIT.md.
 * Declarar Product sin esos campos genera el error "Debe especificarse offers, review o
 * aggregateRating" en Search Console. Las fichas de producto usan solo BreadcrumbList.
 */

export interface BreadcrumbItem {
  name: string;
  item: string;
}

export function breadcrumbListSchema(items: BreadcrumbItem[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.item,
    })),
  };
}

/**
 * Organization para la home / entidad del sitio. No incluye foundingDate, sameAs, NIT
 * ni dirección: no hay evidencia verificable de esos datos en el repositorio.
 */
export function organizationSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.legalName,
    url: SITE.url,
    logo: `${SITE.url}/logo-header.png`,
    areaServed: { '@type': 'Country', name: 'Colombia' },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      telephone: `+${SITE.whatsappNumber}`,
      areaServed: 'CO',
      availableLanguage: 'Spanish',
    },
  };
}

/** WebSite para la home. Sin SearchAction: el sitio no tiene búsqueda interna real. */
export function websiteSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: SITE.url,
  };
}

export interface CollectionPageInput {
  name: string;
  description?: string;
  url: string;
}

export function collectionPageSchema(input: CollectionPageInput): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: input.name,
    description: input.description,
    url: input.url,
  };
}

export interface ServiceSchemaInput {
  name: string;
  description?: string;
  url: string;
  serviceType: string;
  areaServedCity: string;
}

/**
 * Service para páginas de cobertura geográfica. Nunca LocalBusiness: no hay dirección
 * física verificable para ninguna ciudad en el repositorio (ver P0-2 en SEO_AUDIT.md).
 */
export function serviceSchema(input: ServiceSchemaInput): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    description: input.description,
    url: input.url,
    serviceType: input.serviceType,
    areaServed: {
      '@type': 'City',
      name: input.areaServedCity,
      containedInPlace: { '@type': 'Country', name: 'Colombia' },
    },
    provider: { '@type': 'Organization', name: SITE.legalName, url: SITE.url },
  };
}

export interface BlogPostingInput {
  headline: string;
  description?: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
  url: string;
}

export function blogPostingSchema(input: BlogPostingInput): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.headline,
    description: input.description,
    image: input.image,
    datePublished: input.datePublished,
    dateModified: input.dateModified || input.datePublished,
    author: { '@type': 'Person', name: input.authorName },
    publisher: {
      '@type': 'Organization',
      name: SITE.legalName,
      logo: { '@type': 'ImageObject', url: `${SITE.url}/logo-header.png` },
    },
    mainEntityOfPage: input.url,
  };
}

export interface FaqItemInput {
  question: string;
  answer: string;
}

/** Solo usar con preguntas/respuestas realmente visibles en la página (regla obligatoria del brief). */
export function faqPageSchema(items: FaqItemInput[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}
