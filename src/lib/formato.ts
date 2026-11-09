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

// Equivalencia del precio en la otra moneda, si se conoce el valor de la UF
export function equivalencia(precio: number, moneda: Moneda, valorUF: number | null): string | null {
    if (!valorUF) return null;
    return moneda === 'UF' ? formatearCLP(precio * valorUF) : formatearUF(precio / valorUF);
}

// Precio "desde" de un proyecto, en UF: el menor de sus modelos en venta que no estén vendidos.
// Los modelos en CLP se convierten con la UF del día; sin ese valor se omiten.
export function precioDesdeUF(modelos: Pick<ModeloCasa, 'tipoOperacion' | 'estado' | 'precio' | 'moneda'>[], valorUF: number | null): number | null {
    const precios = modelos
        .filter((m) => m.tipoOperacion === 'VENTA' && m.estado !== 'VENDIDO')
        .map((m) => m.moneda === 'UF' ? Number(m.precio) : valorUF ? Number(m.precio) / valorUF : null)
        .filter((p): p is number => p !== null);
    return precios.length ? Math.min(...precios) : null;
}

// Fecha y hora de Chile en formato 24 h, p. ej. "10-11-2026, 15:30"
export function formatearFechaHora(iso: string): string {
    return new Date(iso).toLocaleString('es-CL', { timeZone: 'America/Santiago', dateStyle: 'medium', timeStyle: 'short', hourCycle: 'h23' });
}

export function plural(cantidad: number, singular: string, plural: string): string {
    return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}

// Misma regla que el backend (CrearSolicitudDto): móvil chileno, guardado como +569XXXXXXXX
export const CELULAR_VALIDO = /^\+569\d{8}$/;
export function normalizarCelular(valor: string): string {
    const digitos = valor.replace(/\D/g, '');
    if (/^569\d{8}$/.test(digitos)) return '+' + digitos;
    if (/^9\d{8}$/.test(digitos)) return '+56' + digitos;
    return valor.trim();
}

// Misma regla que el backend (modules/reserva/rut.ts): "12.345.678-k" -> "12345678-K"
export function normalizarRut(valor: string): string {
    const limpio = valor.replace(/[.\s-]/g, '').toUpperCase();
    return limpio.length < 2 ? limpio : `${limpio.slice(0, -1)}-${limpio.slice(-1)}`;
}

// Recibe un RUT normalizado; valida el dígito verificador (módulo 11)
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

// "Queda 1 casa", "Quedan 12 departamentos"
export function textoQuedan(m: Unidades & Pick<ModeloCasa, 'tipoVivienda'>): string {
    const n = unidadesDisponibles(m);
    const texto = m.tipoVivienda === 'DEPARTAMENTO' ? plural(n, 'departamento', 'departamentos') : plural(n, 'casa', 'casas');
    return `${n === 1 ? 'Queda' : 'Quedan'} ${texto}`;
}

// Número para wa.me: solo dígitos y con código de Chile si el celular viene sin él (9XXXXXXXX)
export function numeroWhatsApp(celular: string): string {
    const digitos = celular.replace(/\D/g, '');
    return /^9\d{8}$/.test(digitos) ? `56${digitos}` : digitos;
}
