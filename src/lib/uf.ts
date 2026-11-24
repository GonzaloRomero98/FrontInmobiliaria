export interface ValorUF {
    valor: number;
    fecha: string;
}

// Si todos los proveedores fallan se usa el último valor obtenido, ya que la UF cambia una vez al día.
let ultimoConocido: ValorUF | null = null;

// Cubre las dos formas de respuesta: serie[] (mindicador y findic) y data{} (Boostr).
type Respuesta = { serie?: { fecha?: unknown; valor?: unknown }[]; data?: { date?: unknown; value?: unknown } };

// En orden de preferencia: si uno falla, se agota el tiempo o trae datos inválidos, se pasa al siguiente.
const PROVEEDORES: { url: string; leer: (r: Respuesta) => { fecha?: unknown; valor?: unknown } | undefined }[] = [
    { url: 'https://mindicador.cl/api/uf', leer: (r) => r.serie?.[0] },
    { url: 'https://findic.cl/api/uf', leer: (r) => r.serie?.[0] },
    { url: 'https://api.boostr.cl/economy/indicator/uf.json', leer: (r) => r.data && { fecha: r.data.date, valor: r.data.value } },
];

// La UF se publica todos los días; un dato más viejo indica una serie estancada.
const MAX_ANTIGUEDAD_MS = 5 * 24 * 60 * 60 * 1000;

function validar(dato: { fecha?: unknown; valor?: unknown } | undefined): ValorUF | null {
    if (!dato || typeof dato.valor !== 'number' || !Number.isFinite(dato.valor) || dato.valor <= 0 || typeof dato.fecha !== 'string') return null;
    // findic y Boostr entregan solo el día; sin hora se leería como medianoche UTC y en Chile mostraría el día anterior.
    const fecha = /^\d{4}-\d{2}-\d{2}$/.test(dato.fecha) ? `${dato.fecha}T12:00:00.000Z` : dato.fecha;
    const ms = Date.parse(fecha);
    if (Number.isNaN(ms) || Date.now() - ms > MAX_ANTIGUEDAD_MS) return null;
    return { valor: dato.valor, fecha };
}

// UF desde mindicador.cl, con findic.cl y Boostr de respaldo y caché de 1 hora. Devuelve null solo si nunca se pudo obtener.
export async function obtenerValorUF(): Promise<ValorUF | null> {
    for (const { url, leer } of PROVEEDORES) {
        try {
            const respuesta = await fetch(url, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(3000) });
            if (!respuesta.ok) continue;
            const valor = validar(leer(await respuesta.json() as Respuesta));
            if (valor) {
                ultimoConocido = valor;
                return valor;
            }
        } catch {
            // Tiempo agotado, red caída o JSON inválido: se prueba el siguiente proveedor.
        }
    }
    return ultimoConocido;
}

export function fechaUF(uf: ValorUF): string {
    return new Date(uf.fecha).toLocaleDateString('es-CL', { timeZone: 'America/Santiago', day: 'numeric', month: 'short' });
}
