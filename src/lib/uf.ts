export interface ValorUF {
    valor: number;
    fecha: string;
}

// Último valor obtenido en este servidor: si mindicador.cl falla se usa este (la UF cambia una vez al día)
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

// Valor de la UF desde mindicador.cl (datos del Banco Central), cacheado 1 hora y con un reintento.
// Devuelve null solo si nunca se ha podido obtener: la página se muestra igual, sin la equivalencia.
export async function obtenerValorUF(): Promise<ValorUF | null> {
    for (let intento = 0; intento < 2; intento++) {
        try {
            const valor = await consultar();
            if (valor) {
                ultimoConocido = valor;
                return valor;
            }
        } catch {
            // timeout o red: se reintenta una vez y luego se usa el último valor conocido
        }
    }
    return ultimoConocido;
}

export function fechaUF(uf: ValorUF): string {
    return new Date(uf.fecha).toLocaleDateString('es-CL', { timeZone: 'America/Santiago', day: 'numeric', month: 'short' });
}
