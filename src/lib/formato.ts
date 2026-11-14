import { ModeloCasa, Moneda } from "@/types/modeloCasa";

const numero = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 });
const pesos = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

export function formatearUF(valor: number): string {
    return `${numero.format(valor)} UF`;
}

export function formatearCLP(valor: number): string {
    return pesos.format(valor);
}

export function formatearPrecio(precio: number, moneda: Moneda): string {
    return moneda === 'UF' ? formatearUF(Number(precio)) : formatearCLP(Number(precio));
}

export function formatearNumero(valor: number, decimales = 2): string {
    return new Intl.NumberFormat('es-CL', { maximumFractionDigits: decimales }).format(valor);
}

export function formatearDistancia(metros: number): string {
    return metros < 1000 ? `${Math.round(metros / 10) * 10} m` : `${formatearNumero(metros / 1000, 1)} km`;
}

export function equivalencia(precio: number, moneda: Moneda, valorUF: number | null): string | null {
    if (!valorUF) return null;
    return moneda === 'UF' ? formatearCLP(precio * valorUF) : formatearUF(precio / valorUF);
}

// Precio desde en UF: el menor de los modelos en venta que no están vendidos.
// Los precios en pesos se convierten con la UF del día; sin ese valor se omiten.
export function precioDesdeUF(modelos: Pick<ModeloCasa, 'tipoOperacion' | 'estado' | 'precio' | 'moneda'>[], valorUF: number | null): number | null {
    const precios = modelos
        .filter((m) => m.tipoOperacion === 'VENTA' && m.estado !== 'VENDIDO')
        .map((m) => m.moneda === 'UF' ? Number(m.precio) : valorUF ? Number(m.precio) / valorUF : null)
        .filter((p): p is number => p !== null);
    return precios.length ? Math.min(...precios) : null;
}

export function formatearFechaHora(iso: string): string {
    return new Date(iso).toLocaleString('es-CL', { timeZone: 'America/Santiago', dateStyle: 'medium', timeStyle: 'short', hourCycle: 'h23' });
}

export function plural(cantidad: number, singular: string, plural: string): string {
    return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}

// Misma regla que el backend: celular chileno guardado como +569XXXXXXXX.
export const CELULAR_VALIDO = /^\+569\d{8}$/;
export function normalizarCelular(valor: string): string {
    const digitos = valor.replace(/\D/g, '');
    if (/^569\d{8}$/.test(digitos)) return '+' + digitos;
    if (/^9\d{8}$/.test(digitos)) return '+56' + digitos;
    return valor.trim();
}

// Misma regla que el backend (modules/reserva/rut.ts).
export function normalizarRut(valor: string): string {
    const limpio = valor.replace(/[.\s-]/g, '').toUpperCase();
    return limpio.length < 2 ? limpio : `${limpio.slice(0, -1)}-${limpio.slice(-1)}`;
}

// Valida el dígito verificador con módulo 11.
export function rutValido(rut: string): boolean {
    const partes = /^(\d{7,8})-([\dK])$/.exec(rut);
    if (!partes) return false;
    let suma = 0;
    let factor = 2;
    for (const digito of [...partes[1]].reverse()) {
        suma += Number(digito) * factor;
        factor = factor === 7 ? 2 : factor + 1;
    }
    const resto = 11 - (suma % 11);
    return (resto === 11 ? '0' : resto === 10 ? 'K' : String(resto)) === partes[2];
}

type Unidades = Pick<ModeloCasa, 'unidades' | 'unidadesReservadas' | 'unidadesVendidas'>;

export function unidadesDisponibles(m: Unidades): number {
    return m.unidades - m.unidadesReservadas - m.unidadesVendidas;
}

export function textoQuedan(m: Unidades & Pick<ModeloCasa, 'tipoVivienda'>): string {
    const n = unidadesDisponibles(m);
    const texto = m.tipoVivienda === 'DEPARTAMENTO' ? plural(n, 'departamento', 'departamentos') : plural(n, 'casa', 'casas');
    return `${n === 1 ? 'Queda' : 'Quedan'} ${texto}`;
}

export function numeroWhatsApp(celular: string): string {
    const digitos = celular.replace(/\D/g, '');
    return /^9\d{8}$/.test(digitos) ? `56${digitos}` : digitos;
}

export function enlaceWhatsApp(c: { nombre: string; celular: string; modelo?: string | null; proyecto?: string | null; visitaPreferida?: string | null }): string {
    const modelo = c.modelo ? ` por el modelo ${c.modelo} del proyecto ${c.proyecto}` : '';
    const visita = c.visitaPreferida ? ` Pediste visitar la sala de ventas el ${formatearFechaHora(c.visitaPreferida)}.` : '';
    return `https://wa.me/${numeroWhatsApp(c.celular)}?text=${encodeURIComponent(`Hola ${c.nombre}, te escribimos por tu consulta${modelo}.${visita}`)}`;
}
