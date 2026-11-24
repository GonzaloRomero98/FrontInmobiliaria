import { test } from "node:test";
import assert from "node:assert/strict";
import { fechaUF, obtenerValorUF } from "./uf.ts";

const hoy = new Date().toISOString().slice(0, 10);
const haceUnMes = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

// Reemplaza fetch: cada host responde con lo que indique el mapa; el resto da 500. Devuelve los hosts consultados.
function simular(respuestas: Record<string, () => Response>): string[] {
    const consultados: string[] = [];
    globalThis.fetch = (async (url: string) => {
        const host = new URL(url).hostname;
        consultados.push(host);
        return respuestas[host]?.() ?? new Response(null, { status: 500 });
    }) as typeof fetch;
    return consultados;
}

// Los tests van en orden: el módulo guarda el último valor conocido entre llamadas.
test('mindicador da 500 y se usa findic, con la fecha sin hora completada', async () => {
    const consultados = simular({ 'findic.cl': () => Response.json({ serie: [{ fecha: hoy, valor: 41398.57 }] }) });
    assert.deepEqual(await obtenerValorUF(), { valor: 41398.57, fecha: `${hoy}T12:00:00.000Z` });
    assert.deepEqual(consultados, ['mindicador.cl', 'findic.cl']);
});

test('mindicador agota el tiempo y findic trae datos inválidos: se usa Boostr', async () => {
    const consultados = simular({
        'mindicador.cl': () => { throw new DOMException('timeout', 'TimeoutError'); },
        'findic.cl': () => Response.json({ serie: [{ fecha: hoy, valor: 0 }] }),
        'api.boostr.cl': () => Response.json({ status: 'success', data: { date: hoy, value: 41400 } }),
    });
    assert.deepEqual(await obtenerValorUF(), { valor: 41400, fecha: `${hoy}T12:00:00.000Z` });
    assert.deepEqual(consultados, ['mindicador.cl', 'findic.cl', 'api.boostr.cl']);
});

test('mindicador sigue usándose primero con su formato de fecha', async () => {
    const fecha = `${hoy}T03:00:00.000Z`;
    const consultados = simular({ 'mindicador.cl': () => Response.json({ serie: [{ fecha, valor: 41401 }] }) });
    assert.deepEqual(await obtenerValorUF(), { valor: 41401, fecha });
    assert.deepEqual(consultados, ['mindicador.cl']);
});

test('datos viejos o respuestas raras se descartan y queda el último valor conocido', async () => {
    simular({
        'mindicador.cl': () => Response.json({ serie: [{ fecha: haceUnMes, valor: 40000 }] }),
        'findic.cl': () => new Response('no es json'),
        'api.boostr.cl': () => Response.json({ status: 'error' }),
    });
    assert.deepEqual(await obtenerValorUF(), { valor: 41401, fecha: `${hoy}T03:00:00.000Z` });
});

test('la fecha completada se muestra como el mismo día en Chile', () => {
    assert.match(fechaUF({ valor: 1, fecha: '2026-11-24T12:00:00.000Z' }), /^24/);
});
