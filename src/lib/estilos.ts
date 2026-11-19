// Clases compartidas del sitio público, para que botones, tarjetas y etiquetas se vean iguales en todas las páginas.
// El tamaño (alto y padding) se agrega donde se usan, porque Tailwind no resuelve bien dos clases de alto en la misma lista.

const ESTADOS = "transition-colors motion-reduce:transition-none disabled:opacity-50 disabled:cursor-not-allowed";

// Acción principal de la página: buscar, agendar visita.
export const BOTON_PRIMARIO = `inline-flex items-center justify-center gap-2 rounded-xl bg-acento text-white font-semibold shadow-sm hover:bg-acento-oscuro disabled:hover:bg-acento ${ESTADOS}`;

// Acción de apoyo junto a una principal: limpiar, más filtros.
export const BOTON_SECUNDARIO = `inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white text-marca font-medium hover:border-acento hover:bg-acento-suave disabled:hover:border-gray-300 disabled:hover:bg-white ${ESTADOS}`;

// Tarjetas de proyecto y de modelo en las grillas.
export const TARJETA = "group flex flex-col h-full rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition motion-reduce:transition-none motion-reduce:hover:translate-y-0";

// Botón falso al pie de la tarjeta: toda la tarjeta es el enlace, este solo lo hace evidente.
export const BOTON_TARJETA = "mt-auto flex items-center justify-center gap-2 min-h-11 rounded-xl bg-marca text-white text-sm font-semibold group-hover:bg-acento transition-colors motion-reduce:transition-none";

// Etiquetas sobre la foto de una tarjeta.
export const ETIQUETA_FOTO = "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold shadow-sm";
