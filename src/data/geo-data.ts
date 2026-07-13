export interface Ciudad {
  slug: string;
  nombre: string;
  h1: string;
  intro: string;
  seoTitle: string;
  seoDescription: string;
  caracteristicas: string[];
}

// Bucaramanga primero: prioridad de posicionamiento explícita para este sitio.
export const colombia: { ciudades: Ciudad[] } = {
  ciudades: [
    {
      slug: 'bucaramanga',
      nombre: 'Bucaramanga',
      h1: 'Productos Promocionales en Bucaramanga con Tu Logo',
      intro: 'Artículos publicitarios personalizados para empresas de Bucaramanga y el área metropolitana (Floridablanca, Girón, Piedecuesta). Cotiza por WhatsApp y recibe atención directa.',
      seoTitle: 'Productos Promocionales Bucaramanga | Regalos Corporativos con Logo',
      seoDescription: 'Artículos publicitarios y regalos corporativos personalizados en Bucaramanga. Cotiza por WhatsApp, sin cantidad mínima en varias líneas. Envíos al área metropolitana.',
      caracteristicas: [
        'Cotización directa por WhatsApp, respuesta rápida',
        'Personalización con logo de tu empresa',
        'Envíos a Bucaramanga y su área metropolitana',
        'Catálogo con cientos de referencias por categoría',
      ],
    },
    {
      slug: 'bogota',
      nombre: 'Bogotá',
      h1: 'Productos Promocionales en Bogotá con Tu Logo',
      intro: 'Artículos publicitarios y regalos corporativos personalizados para empresas en Bogotá. Cotiza por WhatsApp y recibe una propuesta a la medida de tu marca.',
      seoTitle: 'Productos Promocionales Bogotá | Regalos Corporativos con Logo',
      seoDescription: 'Artículos publicitarios personalizados con tu logo en Bogotá. Catálogo amplio, cotización por WhatsApp, envíos a toda la ciudad.',
      caracteristicas: [
        'Catálogo amplio para eventos corporativos y ferias',
        'Personalización con logo y colores de marca',
        'Cotización directa por WhatsApp',
        'Envíos a Bogotá y sabana',
      ],
    },
    {
      slug: 'medellin',
      nombre: 'Medellín',
      h1: 'Productos Promocionales en Medellín con Tu Logo',
      intro: 'Regalos corporativos y merchandising personalizado para empresas en Medellín y el Valle de Aburrá. Solicita tu cotización por WhatsApp.',
      seoTitle: 'Productos Promocionales Medellín | Regalos Corporativos con Logo',
      seoDescription: 'Merchandising y artículos publicitarios personalizados en Medellín. Cotiza por WhatsApp, catálogo por categorías, sin cantidad mínima en varias líneas.',
      caracteristicas: [
        'Merchandising para lanzamientos y ferias empresariales',
        'Personalización con logo de tu empresa',
        'Cotización directa por WhatsApp',
        'Envíos a Medellín y el Valle de Aburrá',
      ],
    },
    {
      slug: 'cali',
      nombre: 'Cali',
      h1: 'Productos Promocionales en Cali con Tu Logo',
      intro: 'Artículos publicitarios personalizados para empresas en Cali. Cotiza por WhatsApp y refuerza la imagen de tu marca en cada entrega.',
      seoTitle: 'Productos Promocionales Cali | Regalos Corporativos con Logo',
      seoDescription: 'Productos promocionales personalizados con logo en Cali. Cotización rápida por WhatsApp, catálogo por categorías.',
      caracteristicas: [
        'Catálogo amplio por categoría de producto',
        'Personalización con logo de tu empresa',
        'Cotización directa por WhatsApp',
        'Envíos a Cali y municipios cercanos',
      ],
    },
    {
      slug: 'barranquilla',
      nombre: 'Barranquilla',
      h1: 'Productos Promocionales en Barranquilla con Tu Logo',
      intro: 'Regalos corporativos y artículos publicitarios personalizados para empresas en Barranquilla. Cotiza por WhatsApp.',
      seoTitle: 'Productos Promocionales Barranquilla | Regalos Corporativos con Logo',
      seoDescription: 'Artículos publicitarios personalizados con tu logo en Barranquilla. Cotización directa por WhatsApp, envíos a toda la ciudad.',
      caracteristicas: [
        'Ideal para eventos, ferias y activaciones de marca',
        'Personalización con logo de tu empresa',
        'Cotización directa por WhatsApp',
        'Envíos a Barranquilla y el Atlántico',
      ],
    },
    {
      slug: 'cartagena',
      nombre: 'Cartagena',
      h1: 'Productos Promocionales en Cartagena con Tu Logo',
      intro: 'Artículos publicitarios y regalos corporativos personalizados para empresas en Cartagena. Cotiza por WhatsApp.',
      seoTitle: 'Productos Promocionales Cartagena | Regalos Corporativos con Logo',
      seoDescription: 'Productos promocionales personalizados con logo en Cartagena. Cotización directa por WhatsApp, catálogo por categorías.',
      caracteristicas: [
        'Catálogo con opciones para turismo, eventos y hotelería',
        'Personalización con logo de tu empresa',
        'Cotización directa por WhatsApp',
        'Envíos a Cartagena y Bolívar',
      ],
    },
    {
      slug: 'cucuta',
      nombre: 'Cúcuta',
      h1: 'Productos Promocionales en Cúcuta con Tu Logo',
      intro: 'Artículos publicitarios personalizados para empresas en Cúcuta. Cotiza por WhatsApp y recibe atención directa.',
      seoTitle: 'Productos Promocionales Cúcuta | Regalos Corporativos con Logo',
      seoDescription: 'Productos promocionales personalizados con logo en Cúcuta. Cotización directa por WhatsApp, envíos a toda la ciudad.',
      caracteristicas: [
        'Catálogo por categoría de producto',
        'Personalización con logo de tu empresa',
        'Cotización directa por WhatsApp',
        'Envíos a Cúcuta y Norte de Santander',
      ],
    },
  ],
};

export function getCiudadBySlug(slug: string): Ciudad | undefined {
  return colombia.ciudades.find((c) => c.slug === slug);
}
