"""
QA funcional de la auditoría UX/UI (local). Requiere `pnpm astro preview` y Playwright para Python.

Uso: python scripts/seo-improvement/ux-qa.py [base_url] [salida.json]

Comprueba con un navegador real: enlace "Saltar al contenido", desplegables por teclado,
drawer móvil (inert, foco, Escape), búsqueda, "Mi cotización", mensaje de WhatsApp, formulario
(respuestas del servidor SIMULADAS con route(): no se envía ninguna solicitud real), contenido
visible sin JavaScript y contraste calculado de los botones principales.
"""
import json
import sys
from urllib.parse import unquote

from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4329"
OUT = sys.argv[2] if len(sys.argv) > 2 else "docs/ux-improvement/qa-ux.json"
PDP = "/productos/boligrafo-aldrich-solido-10663/"
results = []


def check(name, ok, detail=""):
    results.append({"check": name, "ok": bool(ok), "detail": detail})
    print(f"{'PASS' if ok else 'FAIL'}  {name}  {detail}")


CONTRAST_JS = """(sel) => {
  const el = document.querySelector(sel); if (!el) return null;
  const s = getComputedStyle(el);
  const rgb = (c) => c.match(/\\d+(\\.\\d+)?/g).slice(0,3).map(Number);
  const L = ([r,g,b]) => { const f = v => { v/=255; return v<=0.03928? v/12.92 : ((v+0.055)/1.055)**2.4; }; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
  // Fondo en degradado: se mide contra el color más oscuro del degradado (peor caso).
  let bg = s.backgroundColor;
  const stops = (s.backgroundImage.match(/rgba?\([^)]+\)/g) || []);
  if (/rgba\(0, 0, 0, 0\)/.test(bg) && stops.length) bg = stops.sort((x, y) => L(rgb(x)) - L(rgb(y)))[0];
  const a = L(rgb(s.color)), b = L(rgb(bg));
  return +(((Math.max(a,b)+0.05)/(Math.min(a,b)+0.05)).toFixed(2));
}"""

with sync_playwright() as p:
    browser = p.chromium.launch()

    # --- Escritorio: skip link, desplegables, contraste --------------------------------
    page = browser.new_page(viewport={"width": 1366, "height": 800})
    page.goto(BASE + "/", wait_until="networkidle")
    page.keyboard.press("Tab")
    focused = page.evaluate("() => document.activeElement.className + '|' + document.activeElement.textContent.trim()")
    check("Primer Tab enfoca 'Saltar al contenido'", "skip-link" in focused, focused)
    page.keyboard.press("Enter")
    check("Saltar al contenido mueve el foco a <main>", page.evaluate("() => document.activeElement.id") == "contenido")

    toggle = page.locator('[data-dropdown-toggle][aria-controls="menu-catalogo"]')
    toggle.focus()
    page.keyboard.press("Enter")
    page.wait_for_timeout(300)  # transición de 200 ms del panel
    check("Enter abre el desplegable (aria-expanded=true)", toggle.get_attribute("aria-expanded") == "true")
    check("Panel visible al abrir", page.locator("#menu-catalogo").is_visible())
    page.keyboard.press("Tab")
    page.keyboard.press("Escape")
    check("Escape cierra y devuelve el foco al botón",
          toggle.get_attribute("aria-expanded") == "false" and page.evaluate("() => document.activeElement.getAttribute('aria-controls')") == "menu-catalogo")

    for sel, label in ((".btn-hero-primary", "CTA naranja (hero)"), (".btn-whatsapp", "Botón WhatsApp"), (".btn-header-cta", "CTA del header")):
        ratio = page.evaluate(CONTRAST_JS, sel)
        check(f"Contraste {label} ≥ 4.5", ratio is not None and ratio >= 4.5, str(ratio))

    # --- Móvil: drawer --------------------------------------------------------------------
    m = browser.new_page(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    m.goto(BASE + "/", wait_until="networkidle")
    check("Drawer cerrado es inert", m.evaluate("() => document.getElementById('mobile-drawer').hasAttribute('inert')"))
    m.click("#mobile-menu-btn")
    m.wait_for_timeout(350)
    check("Al abrir, foco en 'Cerrar menú' y aria-expanded=true",
          m.evaluate("() => document.activeElement.id") == "mobile-menu-close" and m.get_attribute("#mobile-menu-btn", "aria-expanded") == "true")
    for _ in range(15):
        m.keyboard.press("Tab")
    check("Tab queda atrapado dentro del drawer", m.evaluate("() => document.getElementById('mobile-drawer').contains(document.activeElement)"))
    m.keyboard.press("Escape")
    m.wait_for_timeout(350)
    check("Escape cierra y devuelve el foco al botón de menú",
          m.evaluate("() => document.activeElement.id") == "mobile-menu-btn" and m.evaluate("() => document.getElementById('mobile-drawer').hasAttribute('inert')"))

    # --- Búsqueda ------------------------------------------------------------------------
    m.goto(BASE + "/buscar/?q=lapicero", wait_until="networkidle")
    m.wait_for_selector("[data-search-results] article", timeout=10000)
    status = m.inner_text("[data-search-status]")
    count = m.locator("[data-search-results] article").count()
    check("Búsqueda 'lapicero' (sinónimo) devuelve resultados", count > 0, f"{status} ({count} visibles)")
    m.goto(BASE + "/buscar/?q=10663", wait_until="networkidle")
    m.wait_for_selector("[data-search-results] article", timeout=10000)
    check("Búsqueda por referencia 10663 → Aldrich primero", "Aldrich" in m.inner_text("[data-search-results] article >> nth=0"))
    m.goto(BASE + "/buscar/?q=zzzqqq", wait_until="networkidle")
    m.wait_for_timeout(800)
    check("Cero resultados muestra estado vacío con alternativas", m.locator("[data-search-empty]").is_visible())
    m.goto(BASE + "/buscar/?q=termo&categoria=termos-personalizados", wait_until="networkidle")
    m.wait_for_timeout(800)
    check("Filtro de categoría conservado desde la URL", m.input_value("#categoria") == "termos-personalizados", m.inner_text("[data-search-status]"))

    # --- Mi cotización ------------------------------------------------------------------
    m.goto(BASE + PDP, wait_until="networkidle")
    m.evaluate("() => localStorage.clear()")
    m.reload(wait_until="networkidle")
    wa = m.get_attribute("[data-primary-cta]", "href")
    text = unquote(wa.split("text=")[1])
    check("WhatsApp de ficha incluye referencia y URL", "Referencia: 10663" in text and "/productos/boligrafo-aldrich-solido-10663/" in text, text.replace("\n", " | ")[:160])
    m.click("[data-add-to-quote]")
    check("Añadir anuncia confirmación", "Añadiste" in m.inner_text("[data-quote-status]"))
    check("Contador del header = 1", m.inner_text("[data-quote-count]").strip() == "1")
    m.click("[data-add-to-quote]")
    check("Añadir de nuevo no duplica", "ya está" in m.inner_text("[data-quote-status]"))
    m.goto(BASE + "/mi-cotizacion/", wait_until="networkidle")
    check("Mi cotización lista la referencia", m.locator("[data-list] li").count() == 1)
    m.fill("[data-qty]", "150")
    m.dispatch_event("[data-qty]", "change")
    m.fill("#ciudad", "Cali")
    m.dispatch_event("#ciudad", "change")
    text = unquote(m.get_attribute("[data-send-whatsapp]", "href").split("text=")[1])
    check("Mensaje de la lista incluye cantidad y ciudad", "Cantidad: 150" in text and "Ciudad de entrega: Cali" in text)
    m.click("[data-remove]")
    check("Quitar muestra 'Deshacer'", "Deshacer" in m.inner_text("[data-status]"))
    m.click("[data-status] button")
    check("Deshacer recupera la referencia", m.locator("[data-list] li").count() == 1)

    # --- Formulario (servidor simulado) -----------------------------------------------
    m.goto(BASE + "/contacto/?desde=cotizacion", wait_until="networkidle")
    # El sitio usa scroll suave; Playwright hace clic durante la animación. Solo en la prueba.
    m.add_style_tag(content="html{scroll-behavior:auto !important}")
    check("Formulario prerrellenado desde la cotización", "Aldrich" in m.input_value("#mensaje"))
    m.fill("#nombre", "")
    m.fill("#correo", "correo-invalido")
    m.click("[data-submit]")
    check("Errores: resumen visible y enfocado",
          m.locator("[data-error-summary]").is_visible() and m.evaluate("() => document.activeElement.hasAttribute('data-error-summary')"))
    check("Campo inválido marcado aria-invalid", m.get_attribute("#correo", "aria-invalid") == "true")
    m.fill("#nombre", "Prueba QA")
    m.fill("#correo", "qa@example.com")
    m.check("#privacidad")
    m.route("**/*", lambda route: route.fulfill(status=500, body="error") if route.request.method == "POST" else route.continue_())
    m.click("[data-submit]")
    m.wait_for_timeout(500)
    check("Fallo de red: mensaje y datos conservados",
          "No pudimos enviar" in m.inner_text("[data-form-status]") and m.input_value("#nombre") == "Prueba QA")
    m.unroute("**/*")
    posted = {}
    def ok_route(route):
        if route.request.method == "POST":
            posted["body"] = route.request.post_data
            route.fulfill(status=200, body="ok")
        else:
            route.continue_()
    m.route("**/*", ok_route)
    m.click("[data-submit]")
    m.wait_for_timeout(500)
    check("Éxito solo tras respuesta 200; incluye form-name", m.locator("[data-form-success]").is_visible() and "form-name=briefing-contacto" in posted.get("body", ""))
    events = m.evaluate("() => (window.dataLayer||[]).map(e => e.event)")
    check("Evento quote_submitted emitido sin datos personales",
          "quote_submitted" in events and "qa@example.com" not in json.dumps(m.evaluate("() => window.dataLayer")))

    # --- Sin JavaScript -----------------------------------------------------------------
    nojs = browser.new_context(java_script_enabled=False, viewport={"width": 390, "height": 844}).new_page()
    nojs.goto(BASE + "/", wait_until="load")
    opacity = nojs.evaluate("() => { const el = document.querySelector('.reveal'); return el ? getComputedStyle(el).opacity : 'sin .reveal'; }")
    check("Sin JS el contenido .reveal es visible", opacity in ("1", "sin .reveal"), str(opacity))

    browser.close()

json.dump(results, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
failed = [r for r in results if not r["ok"]]
print(f"\n{len(results) - len(failed)}/{len(results)} comprobaciones OK")
sys.exit(1 if failed else 0)
