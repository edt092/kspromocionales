// Micro-interacciones compartidas por todo el sitio: tilt 3D en tarjetas,
// botones magnéticos y stagger-reveal de líneas SVG (grid "blueprint").
// Se re-inicializa en cada navegación de Astro (astro:page-load) porque las
// transiciones de vistas de Astro no vuelven a ejecutar <script> por defecto.

function initTiltCards() {
  const cards = document.querySelectorAll<HTMLElement>('[data-tilt]');
  cards.forEach((card) => {
    if (card.dataset.tiltBound) return;
    card.dataset.tiltBound = 'true';

    const maxDeg = Number(card.dataset.tiltMax ?? 8);

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      // Posición del cursor relativa al centro de la tarjeta, normalizada a
      // -1..1 en cada eje. rotateX depende del offset vertical (invertido:
      // mouse arriba -> tarjeta se inclina hacia el usuario) y rotateY del
      // offset horizontal — esto es lo que da la sensación de "placa" que
      // sigue al cursor, como si tuviera una bisagra en su propio centro.
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${(-py * maxDeg).toFixed(2)}deg) rotateY(${(px * maxDeg).toFixed(2)}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

function initMagneticButtons() {
  const buttons = document.querySelectorAll<HTMLElement>('[data-magnetic]');
  buttons.forEach((btn) => {
    if (btn.dataset.magneticBound) return;
    btn.dataset.magneticBound = 'true';

    const pull = Number(btn.dataset.magneticPull ?? 0.35);

    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      // El botón se desplaza una FRACCIÓN (pull) de la distancia al cursor,
      // nunca el 100%: eso es lo que se lee como "atracción magnética" en
      // vez de que el botón quede pegado al puntero.
      btn.style.transform = `translate(${relX * pull}px, ${relY * pull}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0, 0)';
    });
  });
}

function initBlueprintLines() {
  const lines = document.querySelectorAll<SVGPathElement>('[data-draw-line]');
  if (!lines.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const path = entry.target as SVGPathElement;
        const length = path.getTotalLength();
        path.style.strokeDasharray = `${length}`;
        path.style.strokeDashoffset = `${length}`;
        path.getBoundingClientRect(); // fuerza reflow antes de animar
        path.style.transition = 'stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)';
        path.style.strokeDashoffset = '0';
        observer.unobserve(path);
      });
    },
    { threshold: 0.2 }
  );
  lines.forEach((line) => observer.observe(line));
}

function initAll() {
  initTiltCards();
  initMagneticButtons();
  initBlueprintLines();
}

initAll();
document.addEventListener('astro:page-load', initAll);
