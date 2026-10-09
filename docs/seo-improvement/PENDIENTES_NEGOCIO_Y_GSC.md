# Pendientes que dependen de datos del negocio o de GSC

Ninguno de estos datos se inventó ni se publicó como hecho. Cada fila indica el dato exacto que falta y la tarea que desbloquea.

## Datos comerciales (ventas / operaciones)

| # | Dato que falta | Para qué | Tarea |
|---|---|---|---|
| N1 | Cantidad mínima de pedido por familia de producto, y mínimo de impresión si es distinto | Bloque de confianza en fichas y hubs. Hoy el sitio dice "se confirma al cotizar". | T08 |
| N2 | Tiempos reales: confirmación de stock, aprobación de prueba, producción y despacho | Fichas, hubs y contenido de fin de año | T08, T15 |
| N3 | Técnicas de marcación que KS ofrece por material (serigrafía, tampografía, láser, bordado, sublimación) | Ficha técnica y páginas `/personalizacion/*` (propuestas, no creadas) | T08, T18 |
| N4 | ¿KS publica rangos de precio "desde"? | Única vía honesta para Product/Offer y Merchant Center | T11 |
| N5 | Confirmar que Aldrich Sólido/Metalizado (10663/10664) son el SKU del proveedor ALDRICH-SO/ME, junto con los colores y la técnica que KS ofrece | Publicar técnica, área de marca y MOQ (hoy solo se publica material, mecanismo y largo) | T02 |
| N6 | SKU correcto de 6 pares con capacidades contradictorias: Curvy 500/525 ml, Titán 650/690, Mini Spring 550/590, Supra 600/610, Hélice 650/760 y Wonder 650/700 | Fusionar o diferenciar las variantes | T03 |
| N7 | Mapa de `referencia_proveedor` (VA-459, TE-564, SKIL…) a ID numérico del proveedor para las 89 landings con placeholder | Detectar duplicados con el catálogo (p. ej. "BOLA ANTIESTRES TRICOLOR" frente a `bola-antiestres-tricolor-5877` y "CORAZON ANTIESTRES" frente a `corazon-antiestres-3650`) y asignarles imagen | T03, T07 |
| N8 | Duplicados por nombre con IDs de proveedor distintos: Mug Metálico Star 350 ml (8986/13197) y Bolsa Metalizada Hologram (9154 frente a la landing manual) | Decidir fusión o diferenciación | T03 |
| N9 | Decidir qué hacer con 2 registros que son portadas de catálogos del proveedor ("Catálogo Mundial 2026", "Catálogo Novelties 2026") en Relojes | Retirar (404/410) o reconvertir | T03 |
| N10 | Autorización escrita del proveedor para reutilizar imágenes, como exige `IMAGE_MIGRATION_STRATEGY.md` | Migrar a imágenes propias WebP/AVIF. El helper ya acepta rutas locales; la descarga masiva no se ejecutó. | T12 |
| N11 | Ecología: 102 productos en la categoría; solo los que declaran material en el nombre (bambú, corcho, yute, algodón, RPET…) quedaron como asociación ecológica al consolidar | Verificar las afirmaciones "reciclado/sostenible" de cada ficha de Ecología con la ficha del proveedor | T02 |
| N12 | Logística real por ciudad (transportadoras, tiempos y costos de envío) y casos reales entregados | Hacer útiles las 6 páginas de ciudad que hoy son plantilla. No se inventó nada. | T13 |
| N13 | Razón social formal, NIT, año de fundación, personas del equipo con nombre, perfiles sociales y de GBP verificables | AboutPage completa, `legalName`, `sameAs` y autor del blog. "Claudia González" no tiene bio verificable. | T11 |
| N14 | Herramienta de analítica elegida y su endpoint | Medir clics de WhatsApp. La CSP `connect-src 'self'` debe ampliarse solo a ese endpoint. | T17 |
| N15 | Brief de fin de año: tiempos de corte de diciembre, presupuestos típicos, kits reales | Publicar `/regalos-corporativos/fin-de-ano/` o un post. No se publicó contenido hueco. | T15 |

## Datos de Google Search Console

| # | Exportación | Para qué |
|---|---|---|
| G1 | Ejemplos por URL de "Descubierta", "Google eligió otra canonical", "Rastreada sin indexar" y "Página con redirección" | Cruzar con las cohortes de `DIAGNOSTICO_GSC_POR_COHORTE.md` |
| G2 | Rendimiento filtrado por país = Colombia (consultas y páginas) | La carpeta `Rendimiento-resultados-de-busqueda-colombia/` llegó vacía |
| G3 | Informe de Enlaces (externos) | Backlinks: hoy desconocidos, no cero |
| G4 | CrUX / PageSpeed con datos de campo | Línea base real de LCP/INP/CLS |

## Externo (no automatizado, requiere al propietario)

- **Netlify:** configurar `www.kspromocionales.co` como dominio principal para que `http://kspromocionales.co` llegue a www en un solo salto (hoy son 2). No se cambió ninguna cuenta.
- **GBP, reseñas, citas y backlinks:** ver `GOOGLE_BUSINESS_PROFILE_CHECKLIST.md`. No se crearon perfiles ni se enviaron mensajes.
