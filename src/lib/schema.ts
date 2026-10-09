import { SITE } from '@/lib/site';

type JsonLd = Record<string, unknown>;

/**
 * Helpers tipados y reutilizables para JSON-LD (Schema.org). Cada uno solo declara
 * propiedades verificables por el contenido visible de la página — ver SEO_AUDIT.md
 * y SEO_AUDIT_1.md para las reglas de qué NO se debe declarar (precios/stock sin
 * respaldo, LocalBusiness sin dirección real, brand no verificado, etc).
 *
 * Grafo de entidad (T11): Organization y WebSite tienen `@id` estables y el resto de
 * bloques los referencian en vez de redeclarar la organización por nombre.
 */

/**
 * No hay helper `productSchema` / `@type: 'Product'`: Google exige `offers`, `review` o
 * `aggregateRating` para que un Product sea válido para rich results, y ninguno de los tres
 * es verificable aquí (precio por cotización, sin reseñas reales) — ver P0-1 en SEO_AUDIT.md.
 * Declarar Product sin esos campos genera el error "Debe especificarse offers, review o
 * aggregateRating" en Search Console. Las fichas de producto usan solo BreadcrumbList.
 */

export const ORGANIZATION_ID = `${SITE.url}/#organization`;
export const WEBSITE_ID = `${SITE.url}/#website`;
const ROOT_URL = `${SITE.url}/`;

const orgRef = { '@id': ORGANIZATION_ID };

/** La raíz del sitio siempre con barra final, igual que su canonical. */
function normalizeUrl(url: string): string {
  return url === SITE.url ? ROOT_URL : url;
}

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
      item: normalizeUrl(it.item),
    })),
  };
}

/**
 * Organization: entidad del sitio. `name` es el nombre comercial visible ("KS Promocionales");
 * no se declara `legalName` porque no hay evidencia de la razón social formal en el repositorio
 * ("KS Promocionales Colombia" es una denominación de marca, no una razón social verificada).
 * Tampoco foundingDate, sameAs, NIT ni dirección postal: no hay datos verificados.
 * `address` solo con localidad/región/país de la base operativa real (sin calle, sin atención
 * al público), coherente con el texto visible del sitio.
 */
export function organizationSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: SITE.name,
    alternateName: SITE.legalName,
    url: ROOT_URL,
    logo: { '@type': 'ImageObject', url: `${SITE.url}/logo-header.png` },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Girón',
      addressRegion: 'Santander',
      addressCountry: 'CO',
    },
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

/** WebSite. Sin SearchAction: el sitio no tiene búsqueda interna real. */
export function websiteSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE.name,
    url: ROOT_URL,
    inLanguage: SITE.hreflang,
    publisher: orgRef,
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
    '@id': `${input.url}#webpage`,
    name: input.name,
    description: input.description,
    url: input.url,
    isPartOf: { '@id': WEBSITE_ID },
  };
}

export interface WebPageInput {
  name: string;
  description?: string;
  url: string;
}

/** AboutPage / ContactPage: describen la página visible y apuntan a la organización. */
export function aboutPageSchema(input: WebPageInput): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': `${input.url}#webpage`,
    name: input.name,
    description: input.description,
    url: input.url,
    isPartOf: { '@id': WEBSITE_ID },
    about: orgRef,
  };
}

export function contactPageSchema(input: WebPageInput): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': `${input.url}#webpage`,
    name: input.name,
    description: input.description,
    url: input.url,
    isPartOf: { '@id': WEBSITE_ID },
    about: orgRef,
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
 * El `name` describe el servicio ("Productos promocionales para empresas en Bogotá"),
 * no una supuesta sucursal ("KS Promocionales Bogotá").
 */
export function serviceSchema(input: ServiceSchemaInput): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${input.url}#service`,
    name: input.name,
    description: input.description,
    url: input.url,
    serviceType: input.serviceType,
    areaServed: {
      '@type': 'City',
      name: input.areaServedCity,
      containedInPlace: { '@type': 'Country', name: 'Colombia' },
    },
    provider: orgRef,
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
    publisher: orgRef,
    isPartOf: { '@id': WEBSITE_ID },
    mainEntityOfPage: { '@type': 'WebPage', '@id': input.url },
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
