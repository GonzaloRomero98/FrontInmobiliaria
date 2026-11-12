// Símbolos del mapa de la portada. Sin Leaflet: lo usa también la leyenda, que se renderiza en el servidor.
// El color identifica al proyecto (y a su sala de ventas); la letra y la forma dicen qué es, sin depender del color.
export type TipoPunto = 'CASA' | 'DEPARTAMENTO' | 'MIXTO' | 'SALA';

export const SIMBOLOS: Record<TipoPunto, { letra: string; etiqueta: string }> = {
    CASA: { letra: 'C', etiqueta: 'Casas' },
    DEPARTAMENTO: { letra: 'D', etiqueta: 'Departamentos' },
    MIXTO: { letra: 'M', etiqueta: 'Casas y departamentos' },
    SALA: { letra: 'S', etiqueta: 'Sala de ventas' },
};

export interface ColorPunto { fondo: string; texto: string }

// Un color por proyecto. Validados con validate_palette.js --pairs all (en un mapa todos los puntos se comparan con
// todos): estos 4 pasan todos los chequeos, incluido daltonismo; con un quinto ya hay pares que no se distinguen.
// `texto` es el color de la letra con mejor contraste sobre ese fondo.
export const COLORES_PROYECTO: readonly ColorPunto[] = [
    { fondo: '#2a78d6', texto: '#ffffff' },
    { fondo: '#e2622b', texto: '#0b0b0b' },
    { fondo: '#17a673', texto: '#0b0b0b' },
    { fondo: '#a3367a', texto: '#ffffff' },
];
// Desde el quinto proyecto (y en la clave de símbolos de la leyenda): gris neutro
export const COLOR_NEUTRO: ColorPunto = { fondo: '#64748b', texto: '#ffffff' };

export const colorProyecto = (indice: number): ColorPunto => COLORES_PROYECTO[indice] ?? COLOR_NEUTRO;

// Proyectos: gota; sala de ventas: cuadrado redondeado
export function htmlSimbolo(tipo: TipoPunto | null, tamano = 26, color: ColorPunto = COLOR_NEUTRO): string {
    const letra = tipo ? SIMBOLOS[tipo].letra : '';
    const forma = tipo === 'SALA' ? 'border-radius:6px' : 'border-radius:50% 50% 50% 0;transform:rotate(-45deg)';
    const giro = tipo === 'SALA' ? '' : 'transform:rotate(45deg);';
    return `<div style="width:${tamano}px;height:${tamano}px;background:${color.fondo};border:3px solid #fff;${forma};box-shadow:0 1px 4px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center">`
        + `<span style="${giro}color:${color.texto};font:700 ${Math.round(tamano * 0.5)}px/1 system-ui,sans-serif">${letra}</span></div>`;
}
