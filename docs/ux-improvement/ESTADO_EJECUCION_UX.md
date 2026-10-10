# Auditoría UX/UI — implementación y estado (2026-10-09)

Fuente: `auditoria_uxui_kspromocionales.md` (UX-UI-ANALISI-GENERAL/UX-UI-KSPROMOCIONALES.CO).
Rama: `ux/auditoria-uxui-2026-10` (desde `main` f46c07a). **Sin commit.**

## Verificación local
| Comando | Resultado |
|---|---|
| `pnpm build` | Exit 0: guard de datos ✓, `astro check` con 0 errores / 0 warnings / 0 hints, 2.181 páginas (+`/buscar/` y `/mi-cotizacion/`) |
| `pnpm run seo:audit:urls` | Sin hallazgos estructurales. Sitemap: 2.174 URLs (las 2 páginas nuevas son noindex y quedan fuera). |
| `pnpm run test:seo` | 33/33 (8 nuevos de búsqueda) |
| `python scripts/seo-improvement/ux-qa.py` | **31/31** comprobaciones con navegador real (`qa-ux.json`) |
| `python scripts/seo-improvement/mobile-qa.py` | Sin overflow en 12 combinaciones; textos de menos de 12 px: 0 (antes hasta 28) (`qa-movil/metricas.json`) |

El formulario se probó con **respuestas del servidor simuladas** (200 y 500). No se envió ninguna solicitud real.

## Implementado por ticket
| Ticket | Estado | Qué cambió |
|---|---|---|
| UX-01 Promesas y CTAs | ✅ | H1 "para que tu marca se haga notar"; "Sin cantidad mínima" → "Cantidades según el producto"; "Sube tu logo" → "Envíanos tu logo"; se retira "Filtra por uso o presupuesto" y "las de mejor rotación"; FAQ de mínimos; "Correo electrónico"; "Enviar solicitud de cotización"; /gracias/ dice "solicitud"; la tarjeta tiene nombre accesible "Cotizar {producto} por WhatsApp" |
| UX-02 Contraste y foco | ✅ | Navy sobre naranja (6,82:1), CTA del header 4,93:1, WhatsApp `#0F7A3D` (5,42:1), etiquetas `#9A5A00` (5,47:1), foco de 3 px navy o blanco, bordes de campos `gray-500`, botones de 44 px como mínimo |
| UX-03 Menús | ✅ | "Saltar al contenido"; desplegables con `aria-expanded`/`aria-controls`, Enter, Escape y foco; drawer `dialog` + `inert`, foco atrapado y restituido; iconos `aria-hidden` |
| UX-04 WhatsApp contextual | ✅ | Mensaje con producto, referencia, URL, cantidad, ciudad y fecha ("por definir" si faltan). Las CTAs genéricas ya no suponen "Bucaramanga". Aviso de que abrir WhatsApp no equivale a enviar. |
| UX-05 Formulario | ✅ local | Validación con mensajes propios, `aria-invalid`/`aria-describedby`, resumen de errores enfocable, envío AJAX a Netlify Forms, datos conservados ante un fallo, sin doble envío, éxito solo con 200, `autocomplete`, fecha mínima hoy. Sin JS sigue el envío nativo. **Se corrigió un fallo detectado en el QA:** el mensaje de error que se retiraba al perder el foco desplazaba el botón y el clic de envío se perdía. |
| UX-06 Embudo | 🟡 | `src/scripts/track.ts`: eventos `whatsapp_click`, `quote_item_added`, `catalog_search`, `quote_submitted` en `dataLayer`, sin datos personales y sin terceros. Falta elegir la herramienta (A3). |
| UX-08 Búsqueda | ✅ | `/buscar/` (noindex) con índice estático (`/buscar/indice.json`, 275 KB sin comprimir) cargado solo en esa página. Sinónimos locales, búsqueda por referencia, filtro de categoría, estado en la URL, `aria-live` y estado vacío recuperable. Buscador también en `/categorias/` y en el header. |
| UX-09 Mi cotización | ✅ | Botón en la ficha, contador en el header, `/mi-cotizacion/` (noindex): cantidades, quitar con deshacer, ciudad y fecha, envío por WhatsApp o formulario (prerrellenado), copiar resumen y aviso si el mensaje es demasiado largo. Solo datos de catálogo en `localStorage`, con caducidad de 30 días. |
| UX-12 Movimiento | ✅ | Contenido `.reveal` visible sin JS; tilt y efecto magnético solo con ratón y sin movimiento reducido; `scroll-behavior` y animaciones desactivadas con `prefers-reduced-motion`. |
| Estado vacío de categoría | ✅ | Enlaces a catálogo y asesor |
| Header móvil | ✅ | El logo se reduce en menos de 400 px para que quepan buscar, cotización y menú (sin solapamiento a 360 px) |

## Pendiente (requiere datos o decisiones del negocio)
| # | Pendiente | Ticket |
|---|---|---|
| A1 | Mínimos, técnicas, materiales, medidas y plazos verificados por referencia (empezar por 30 con demanda real) | UX-07 |
| A2 | Condiciones comerciales: precios/IVA, pagos, entregas, posventa, horario y plazo de respuesta | UX-10 |
| A3 | Herramienta de analítica y su dominio para la CSP; definición de lead calificado y CRM | UX-06 |
| A4 | Prueba controlada de recepción de Netlify Forms en producción (una solicitud de prueba acordada con ventas) | UX-05 |
| A5 | Facetas por material o técnica: solo cuando A1 exista | UX-08 |
| A6 | Pruebas con usuarios (5–6 participantes), SUS y línea base; recálculo de la madurez | §3.2 |
| A7 | Comparador de 3 productos (P2) y checkout (condicionado) | UX-11, UX-13 |

## Riesgos y notas
- Los aliases y productos que dejen de existir siguen en "Mi cotización" de quien los guardó; sus enlaces redirigen con 301 al primario.
- El verde de WhatsApp es más oscuro que el de la marca de WhatsApp, a cambio de cumplir el contraste AA. Revertir: `--wa-bg` en `global.css`.
- En la ficha a 360×740, el CTA queda parcialmente visible (la línea "Referencia" añadió unos 24 px); a 390×844 queda completo.
