"""
QA visual/móvil local (T08). Requiere `pnpm astro preview` sirviendo dist/ y Playwright para Python.

Uso: python scripts/seo-improvement/mobile-qa.py [base_url] [out_dir]

Mide por viewport: overflow horizontal, posición del H1 y del CTA de WhatsApp de la ficha,
solapamiento del botón flotante con H1/CTA, tap targets < 44 px y textos < 12 px.
Guarda capturas del primer pliegue y un JSON con las métricas. No modifica el sitio.
"""
import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4329"
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else "docs/seo-improvement/after/qa-movil")
OUT.mkdir(parents=True, exist_ok=True)

PAGES = {
    "home": "/",
    "categoria": "/categorias/antiestres/",
    "ficha": "/productos/paraguas-kahlo-23-nuevo-13532/",
    "ficha-aldrich": "/productos/boligrafo-aldrich-solido-10663/",
    "blog": "/blog/boligrafos-personalizados-la-mejor-inversion-publicitaria-en-colombia/",
    "contacto": "/contacto/",
}
VIEWPORTS = {"390x844": (390, 844), "360x740": (360, 740)}

MEASURE = """
() => {
  const vw = innerWidth, vh = innerHeight;
  const box = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return {x: r.x, y: r.y + scrollY, w: r.width, h: r.height, bottom: r.bottom + scrollY}; };
  const h1 = document.querySelector('main h1, h1');
  const cta = document.querySelector('main a.btn-whatsapp');
  const flo = document.querySelector('a.fixed.btn-whatsapp');
  const overlap = (a, b) => a && b && !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
  const floBox = flo && getComputedStyle(flo).opacity !== '0' ? (() => { const r = flo.getBoundingClientRect(); return {x: r.x, y: r.y, w: r.width, h: r.height}; })() : null;
  const inView = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return {x: r.x, y: r.y, w: r.width, h: r.height}; };
  const small = [...document.querySelectorAll('a, button')].filter(el => {
    const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && (r.height < 44 && r.width < 44 || r.height < 24);
  }).length;
  const tinyText = [...document.querySelectorAll('body *')].filter(el => el.childNodes.length && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(el).fontSize) < 12).length;
  return {
    overflowX: document.documentElement.scrollWidth > vw,
    h1: box(h1), h1AboveFold: h1 ? box(h1).bottom <= vh : null,
    cta: box(cta), ctaAboveFold: cta ? box(cta).bottom <= vh : null,
    floatingOverlapsH1AtLoad: overlap(inView(h1), floBox),
    floatingOverlapsCtaAtLoad: overlap(inView(cta), floBox),
    tapTargetsUnder44: small,
    textNodesUnder12px: tinyText,
  };
}
"""

results = {}
with sync_playwright() as p:
    browser = p.chromium.launch()
    for vname, (w, h) in VIEWPORTS.items():
        ctx = browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=2, is_mobile=True, has_touch=True)
        page = ctx.new_page()
        for name, path in PAGES.items():
            page.goto(BASE + path, wait_until="networkidle")
            page.wait_for_timeout(400)
            m = page.evaluate(MEASURE)
            results[f"{name}@{vname}"] = m
            page.screenshot(path=str(OUT / f"{name}-{vname}.png"))
        ctx.close()
    browser.close()

(OUT / "metricas.json").write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")
for k, m in results.items():
    print(
        f"{k:32} overflow={m['overflowX']!s:5} H1_y={m['h1']['y'] if m['h1'] else None!s:>6} "
        f"H1_fold={m['h1AboveFold']!s:5} CTA_y={round(m['cta']['y']) if m['cta'] else '-':>5} CTA_fold={m['ctaAboveFold']!s:5} "
        f"flotante∩H1={m['floatingOverlapsH1AtLoad']!s:5} flotante∩CTA={m['floatingOverlapsCtaAtLoad']!s:5} tap<44={m['tapTargetsUnder44']:3} txt<12={m['textNodesUnder12px']}"
    )
