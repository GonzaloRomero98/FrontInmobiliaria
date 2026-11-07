// Símbolos del mapa de la portada. Sin Leaflet: lo usa también la leyenda, que se renderiza en el servidor.
// Cada símbolo se distingue por letra y forma, no solo por color (accesibilidad).
export type TipoPunto = 'CASA' | 'DEPARTAMENTO' | 'MIXTO' | 'SALA';

export const SIMBOLOS: Record<TipoPunto, { letra: string; color: string; etiqueta: string }> = {
    CASA: { letra: 'C', color: '#16304b', etiqueta: 'Proyecto de casas' },
    DEPARTAMENTO: { letra: 'D', color: '#1e727d', etiqueta: 'Proyecto de departamentos' },
    MIXTO: { letra: 'M', color: '#6b21a8', etiqueta: 'Proyecto mixto' },
    SALA: { letra: 'S', color: '#b45309', etiqueta: 'Sala de ventas' },
};

// Proyectos: gota; sala de ventas: cuadrado redondeado
export function htmlSimbolo(tipo: TipoPunto | null, tamano = 26): string {
    const { letra, color } = tipo ? SIMBOLOS[tipo] : { letra: '', color: '#4b5563' };
    const forma = tipo === 'SALA' ? 'border-radius:6px' : 'border-radius:50% 50% 50% 0;transform:rotate(-45deg)';
    const giro = tipo === 'SALA' ? '' : 'transform:rotate(45deg);';
    return `<div style="width:${tamano}px;height:${tamano}px;background:${color};border:3px solid #fff;${forma};box-shadow:0 1px 4px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center">`
        + `<span style="${giro}color:#fff;font:700 ${Math.round(tamano * 0.5)}px/1 system-ui,sans-serif">${letra}</span></div>`;
}
