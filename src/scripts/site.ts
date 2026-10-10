// Scripts globales de UX: eventos del embudo y contador de "Mi cotización" en el header.
import './track';
import { renderHeaderCount } from './quote-store';

renderHeaderCount();
window.addEventListener('ks:quote-change', renderHeaderCount);
// Otra pestaña modificó la lista.
window.addEventListener('storage', (e) => {
  if (e.key === 'ks-cotizacion') renderHeaderCount();
});
