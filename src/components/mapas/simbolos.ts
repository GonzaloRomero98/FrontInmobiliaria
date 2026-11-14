// Símbolos del mapa de la portada. El color identifica al proyecto y la letra y la forma dicen qué es,
// para no depender solo del color. No usa Leaflet porque también lo usa la leyenda, que se arma en el servidor.
export type TipoPunto = 'CASA' | 'DEPARTAMENTO' | 'MIXTO' | 'SALA';

export const SIMBOLOS: Record<TipoPunto, { letra: string; etiqueta: string }> = {
    CASA: { letra: 'C', etiqueta: 'Casas' },
    DEPARTAMENTO: { letra: 'D', etiqueta: 'Departamentos' },
    MIXTO: { letra: 'M', etiqueta: 'Casas y departamentos' },
    SALA: { letra: 'S', etiqueta: 'Sala de ventas' },
};

export interface ColorPunto { fondo: string; texto: string }

// Colores revisados para que se distingan entre sí, también con daltonismo. Con un quinto color ya había pares parecidos.
export const COLORES_PROYECTO: readonly ColorPunto[] = [
    { fondo: '#2a78d6', texto: '#ffffff' },
    { fondo: '#e2622b', texto: '#0b0b0b' },
    { fondo: '#17a673', texto: '#0b0b0b' },
    { fondo: '#a3367a', texto: '#ffffff' },
];
export const COLOR_NEUTRO: ColorPunto = { fondo: '#64748b', texto: '#ffffff' };

export const colorProyecto = (indice: number): ColorPunto => COLORES_PROYECTO[indice] ?? COLOR_NEUTRO;

export function htmlSimbolo(tipo: TipoPunto | null, tamano = 26, color: ColorPunto = COLOR_NEUTRO): string {
    const letra = tipo ? SIMBOLOS[tipo].letra : '';
    const forma = tipo === 'SALA' ? 'border-radius:6px' : 'border-radius:50% 50% 50% 0;transform:rotate(-45deg)';
    const giro = tipo === 'SALA' ? '' : 'transform:rotate(45deg);';
    return `<div style="width:${tamano}px;height:${tamano}px;background:${color.fondo};border:3px solid #fff;${forma};box-shadow:0 1px 4px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center">`
        + `<span style="${giro}color:${color.texto};font:700 ${Math.round(tamano * 0.5)}px/1 system-ui,sans-serif">${letra}</span></div>`;
}
