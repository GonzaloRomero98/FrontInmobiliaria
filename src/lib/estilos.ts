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

// ---- Panel del admin y la secretaria ----

// Mismo ancho en todas las pantallas del panel, para que el contenido no salte al navegar por el menú.
export const PANEL_PAGINA = "max-w-6xl mx-auto px-4 sm:px-8 py-8";

// Superficie blanca de listados, secciones y formularios, igual a las tarjetas del Inicio.
export const SUPERFICIE = "bg-white border border-gray-200 rounded-2xl";

const BASE_PANEL = `inline-flex items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap ${ESTADOS}`;
// Una sola acción principal por zona: guardar, crear, marcar contactado.
export const PANEL_PRIMARIO = `${BASE_PANEL} bg-marca text-white hover:bg-marca/90 disabled:hover:bg-marca`;
// Acciones de apoyo y reversibles: editar, fotos, despublicar, paginar.
export const PANEL_SECUNDARIO = `${BASE_PANEL} border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 disabled:hover:bg-white`;
// Solo lo que borra o corta algo: eliminar, desactivar, anular.
export const PANEL_PELIGRO = `${BASE_PANEL} border border-red-200 bg-white text-red-700 hover:bg-red-50 disabled:hover:bg-white`;
// Lo que vuelve a poner algo en línea: publicar, reactivar, escribir por WhatsApp.
export const PANEL_EXITO = `${BASE_PANEL} border border-green-300 bg-white text-green-800 hover:bg-green-50 disabled:hover:bg-white`;
export const NORMAL = "px-4 py-2.5 text-sm";
// En el celular el compacto también mide 44 px de alto, para tocarlo sin errar.
export const COMPACTO = "px-3 py-1.5 text-sm max-md:min-h-11";

// Etiquetas de estado: la forma es siempre la misma y el tono dice qué significa.
export const PILDORA = "inline-flex items-center gap-1 w-fit rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap";
export const TONO = {
    exito: "bg-green-50 text-green-800 border-green-200",
    aviso: "bg-amber-50 text-amber-800 border-amber-200",
    peligro: "bg-red-50 text-red-700 border-red-200",
    neutro: "bg-gray-100 text-gray-700 border-gray-200",
} as const;
