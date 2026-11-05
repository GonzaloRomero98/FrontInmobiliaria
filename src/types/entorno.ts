export type CategoriaEntorno = 'transporte' | 'educacion' | 'salud' | 'comercio' | 'areasVerdes';

export interface LugarCercano {
    id: string;
    nombre: string | null;
    categoria: CategoriaEntorno;
    latitud: number;
    longitud: number;
    distancia: number;
}

export interface EntornoProyecto {
    entorno: {
        radio: number;
        lugares: LugarCercano[];
        resumen: Record<CategoriaEntorno, number>;
    };
    actualizadoEn: string;
}

export const CATEGORIAS_ENTORNO: Record<CategoriaEntorno, { etiqueta: string; color: string; sinNombre: string }> = {
    transporte: { etiqueta: 'Transporte', color: '#2563eb', sinNombre: 'Estación' },
    educacion: { etiqueta: 'Educación', color: '#d97706', sinNombre: 'Establecimiento educacional' },
    salud: { etiqueta: 'Salud', color: '#dc2626', sinNombre: 'Centro de salud' },
    comercio: { etiqueta: 'Comercio', color: '#7c3aed', sinNombre: 'Comercio' },
    areasVerdes: { etiqueta: 'Áreas verdes', color: '#16a34a', sinNombre: 'Parque' },
};
