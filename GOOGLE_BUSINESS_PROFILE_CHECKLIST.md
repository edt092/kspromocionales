# GOOGLE_BUSINESS_PROFILE_CHECKLIST.md — Google Business Profile de KS Promocionales

Fase 13 de `SEO_AUDIT_1.md`. Documento de referencia interna — **no se gestiona ni se modifica
nada dentro de Google Business Profile desde aquí**; el trabajo sobre GBP se hace fuera del código,
en la consola de Google. Este archivo existe para que quien lo administre tenga un checklist
consistente con lo que ya se implementó en el sitio (Fase 6/7 de `SEO_AUDIT_1.md`).

## Estado actual

- **Solicitud en revisión.** No está aprobada. Tiempo estimado de respuesta informado por el
  propietario: ~5 días desde la solicitud (referencia interna, no un SLA de Google).
- **No afirmar en ningún canal que el perfil está aprobado o activo hasta tener confirmación real**
  de Google (ni en el sitio, ni en redes, ni en comunicación comercial).
- El negocio **no tiene local de atención al público** en ninguna ciudad. La operación es 100%
  online, con cotización por WhatsApp o formulario — esto ya está reflejado en el sitio
  (`SITE.operatingBase`, footer, Nosotros, Contacto, páginas de ciudad; ver `SEO_AUDIT.md` Fase 6/7).
- **Dirección usada para la solicitud de verificación:** [dirección exacta — no se registra en este
  repositorio público; consultar con el propietario/administrador del perfil de GBP]. Es una
  dirección administrativa en Girón, Santander, no un punto de atención al público. Este
  repositorio es público en GitHub, por lo que la dirección exacta se mantiene fuera del control
  de versiones a propósito (ver nota de la sección siguiente).

## Reglas mientras la revisión esté en curso

- [ ] **No mostrar la dirección exacta públicamente** en ningún canal (sitio web, redes, Google
      Maps si el perfil lo permite ocultar) mientras el negocio no reciba clientes en persona. El
      sitio web ya cumple esto: no hay ninguna dirección postal en el código (`src/`), solo
      "Girón, Santander" como ciudad/departamento (sin calle) — confirmado, no requiere cambios.
- [ ] **No llamar a esa dirección "tienda", "local", "showroom" ni "sede de atención"** en la
      descripción del perfil, en publicaciones de GBP ni en respuestas a reseñas.
- [ ] **No crear perfiles de Google Business separados por ciudad.** Un solo perfil, la base real
      en Girón. No añadir Bogotá, Medellín, Cali, Barranquilla, Cartagena ni Cúcuta como
      ubicaciones adicionales — ninguna de esas ciudades tiene sede real (ver `SEO_AUDIT.md` P0-2).
- [ ] **No editar repetidamente nombre, categoría o dirección durante la revisión.** Cambios
      frecuentes en esos tres campos son una señal común de rechazo/suspensión en el proceso de
      verificación de Google. Si algo se registró mal, corregirlo una sola vez y documentar el
      cambio aquí, no seguir ajustando.

## Nombre y categoría

- [ ] **Nombre del perfil:** "KS Promocionales" (el nombre real de la marca, igual que
      `SITE.name`). No añadir palabras clave al nombre (p. ej. nada de "KS Promocionales | Regalos
      Corporativos Bucaramanga Bogotá Medellín...") — es una práctica que Google penaliza y que
      contradice el resto de esta auditoría (evitar keyword stuffing).
- [ ] **Categoría principal:** elegir **una sola** categoría de las que ofrece Google que describa
      el negocio con exactitud — p. ej. "Proveedor de productos promocionales" si existe esa opción
      exacta en el selector de Google (verificar en el momento, las categorías disponibles cambian).
      Si no existe una categoría idéntica, elegir la más cercana a "artículos publicitarios /
      merchandising corporativo", no una categoría genérica solo porque tiene más volumen de búsqueda.
- [ ] **No usar "Agencia de marketing" ni categorías relacionadas con servicios que el negocio no
      presta** (diseño web, redes sociales, publicidad digital). KS Promocionales vende y
      personaliza productos promocionales, no servicios de marketing.

## Servicios y área de servicio

- [ ] Listar únicamente **servicios reales**: venta y personalización de productos promocionales,
      regalos corporativos, merchandising corporativo. No añadir "SEO", "diseño web", "gestión de
      redes sociales" ni ningún servicio que el negocio no ofrezca.
- [ ] **Área de servicio:** configurar honestamente como negocio que atiende por entrega/envío
      (service-area business) en vez de negocio con visitas en el local, ya que no hay atención
      presencial. Declarar Colombia / los departamentos que realmente cubre el envío — no inventar
      cobertura no verificada.

## Evidencia que Google puede pedir durante la verificación

Preparar (fuera del código, es responsabilidad operativa) evidencia **real**, nunca fabricada:

- [ ] Fotos de empaques y productos reales entregados a clientes.
- [ ] Material de marca (catálogos, tarjetas, papelería con el logo real de KS Promocionales).
- [ ] Documentos empresariales que respalden la operación (RUT, cámara de comercio, o el
      documento que Google solicite específicamente).
- [ ] Acceso real a la ubicación de Girón si Google lo requiere para verificación (llamada,
      video, o visita según el método que ofrezca Google en ese momento).
- [ ] Fotos de herramientas/inventario reales si aplica.
- [ ] **Consistencia de NAP** (nombre/dirección/teléfono) entre el sitio, el perfil de GBP y
      cualquier otro directorio donde aparezca el negocio — el teléfono ya es consistente con
      `SITE.whatsappNumber` (+57 310 662 9590) en todo el sitio.
- [ ] **No fabricar letreros, fotos de oficina o cualquier "prueba" de un local que no existe.**
      Presentar el negocio tal como es: operación online con base administrativa real en Girón.

## Si Google rechaza la verificación

- [ ] Si Google determina que el negocio es exclusivamente online y no elegible para un perfil de
      Business Profile con ubicación física, **documentar el resultado en este archivo** (fecha,
      motivo indicado por Google si lo da) y decidir con el propietario el siguiente paso.
- [ ] **No crear perfiles duplicados** ni intentar evadir la decisión de Google abriendo una nueva
      solicitud con datos ligeramente distintos. Si hay una vía legítima alternativa (p. ej. perfil
      sin Maps, o el formato que Google ofrezca para negocios de solo-envío), evaluarla
      explícitamente aquí antes de actuar.

## Registro de cambios

_(Completar manualmente cada vez que se tome una acción real sobre el perfil, para mantener
trazabilidad y evitar el problema de "ediciones repetidas" mencionado arriba)._

| Fecha | Acción | Resultado |
|---|---|---|
| — | Solicitud de verificación enviada (dirección administrativa en Girón — ver nota arriba) | En revisión |
