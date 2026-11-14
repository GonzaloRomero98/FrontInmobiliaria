export interface ValorUF {
    valor: number;
    fecha: string;
}

// Si mindicador.cl falla se usa el último valor obtenido, ya que la UF cambia una vez al día.
let ultimoConocido: ValorUF | null = null;

async function consultar(): Promise<ValorUF | null> {
    const respuesta = await fetch('https://mindicador.cl/api/uf', {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(6000),
    });
    if (!respuesta.ok) return null;
    const datos = await respuesta.json() as { serie?: { fecha: string; valor: number }[] };
    const ultimo = datos.serie?.[0];
    return ultimo && ultimo.valor > 0 ? { valor: ultimo.valor, fecha: ultimo.fecha } : null;
}

// UF desde mindicador.cl, con caché de 1 hora y un reintento. Devuelve null solo si nunca se pudo obtener.
export async function obtenerValorUF(): Promise<ValorUF | null> {
    for (let intento = 0; intento < 2; intento++) {
        try {
            const valor = await consultar();
            if (valor) {
                ultimoConocido = valor;
                return valor;
            }
        } catch {
            // Si se agota el tiempo o falla la red se reintenta una vez y luego se usa el último valor conocido.
        }
    }
    return ultimoConocido;
}

export function fechaUF(uf: ValorUF): string {
    return new Date(uf.fecha).toLocaleDateString('es-CL', { timeZone: 'America/Santiago', day: 'numeric', month: 'short' });
}
