import { Moneda } from "@/types/modeloCasa";

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

export function plural(cantidad: number, singular: string, plural: string): string {
    return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}

// Número para wa.me: solo dígitos y con código de Chile si el celular viene sin él (9XXXXXXXX)
export function numeroWhatsApp(celular: string): string {
    const digitos = celular.replace(/\D/g, '');
    return /^9\d{8}$/.test(digitos) ? `56${digitos}` : digitos;
}
