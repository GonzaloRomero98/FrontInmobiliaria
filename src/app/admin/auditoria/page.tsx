'use client'

import { FiltrosAuditoria, getAuditoria, MODULOS_AUDITORIA, ProblemaCadena, RegistroAuditoria, VerificacionAuditoria, verificarAuditoria } from "@/services/auditoria.service";
import { FormEvent, useEffect, useState } from "react";

const LIMITE = 50;

const TEXTO_PROBLEMA: Record<ProblemaCadena, string> = {
    alterado: 'su contenido fue modificado',
    enlace_roto: 'no calza con el registro anterior (el anterior fue modificado)',
    faltan_anteriores: 'faltan registros justo antes (fueron borrados)',
    sin_encadenar: 'no tiene hash (se insertó sin pasar por la cadena)',
};

interface Borrador {
    correo: string;
    modulo: string;
    soloRechazados: boolean;
    desde: string;
    hasta: string;
}

const SIN_FILTROS: Borrador = { correo: '', modulo: '', soloRechazados: false, desde: '', hasta: '' };

// Fechas del formulario (AAAA-MM-DD, hora local) -> instantes ISO; "hasta" incluye el día completo
function aFiltros(b: Borrador): FiltrosAuditoria {
    const medianoche = (dia: string, sumarDias = 0) => {
        const d = new Date(`${dia}T00:00:00`);
        d.setDate(d.getDate() + sumarDias);
        return d.toISOString();
    };
    return {
        ...(b.correo.trim() && { correo: b.correo.trim() }),
        ...(b.modulo && { modulo: b.modulo }),
        ...(b.soloRechazados && { soloRechazados: true }),
        ...(b.desde && { desde: medianoche(b.desde) }),
        ...(b.hasta && { hasta: medianoche(b.hasta, 1) }),
    };
}

export default function Auditoria() {
    const [registros, setRegistros] = useState<RegistroAuditoria[]>([]);
    const [total, setTotal] = useState(0);
    const [pagina, setPagina] = useState(1);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [borrador, setBorrador] = useState<Borrador>(SIN_FILTROS);
    const [filtros, setFiltros] = useState<FiltrosAuditoria>({});
    const [verificacion, setVerificacion] = useState<VerificacionAuditoria | null>(null);
    const [verificando, setVerificando] = useState(false);

    useEffect(() => {
        let cancelado = false;
        getAuditoria(pagina, filtros, LIMITE)
            .then((data) => { if (!cancelado) { setRegistros(data.registros); setTotal(data.total); } })
            .catch(() => { if (!cancelado) setError('No se pudo cargar la auditoría'); })
            .finally(() => { if (!cancelado) setCargando(false); });
        return () => { cancelado = true; };
    }, [pagina, filtros]);

    const paginas = Math.max(1, Math.ceil(total / LIMITE));
    const hayFiltros = Object.keys(filtros).length > 0;

    function irA(nueva: number) {
        setCargando(true);
        setError(null);
        setPagina(nueva);
    }

    function aplicar(nuevos: FiltrosAuditoria) {
        setCargando(true);
        setError(null);
        setPagina(1);
        setFiltros(nuevos);
    }

    function filtrar(e: FormEvent) {
        e.preventDefault();
        if (borrador.desde && borrador.hasta && borrador.desde > borrador.hasta) {
            setError('La fecha "desde" no puede ser posterior a "hasta"');
            return;
        }
        aplicar(aFiltros(borrador));
    }

    function limpiar() {
        setBorrador(SIN_FILTROS);
        aplicar({});
    }

    async function verificar() {
        setVerificando(true);
        try {
            setVerificacion(await verificarAuditoria());
        } catch {
            setError('No se pudo verificar la integridad');
        } finally {
            setVerificando(false);
        }
    }

    const campo = "border rounded-lg px-2 py-1.5 text-sm";
    const cambiar = <K extends keyof Borrador>(clave: K, valor: Borrador[K]) => setBorrador((b) => ({ ...b, [clave]: valor }));

    return (
        <main className="max-w-6xl mx-auto px-4 py-10">
            <h1 className="text-2xl font-bold mb-1">Auditoría</h1>
            <p className="text-sm text-gray-500 mb-6">Cambios de datos, accesos rechazados, inicios de sesión, lecturas de datos personales y exportaciones. Más recientes primero.</p>

            <section className="border rounded-xl p-4 mb-6" aria-labelledby="titulo-integridad">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 id="titulo-integridad" className="font-semibold">Integridad del registro</h2>
                        <p className="text-sm text-gray-500">Cada registro guarda el hash del anterior: si alguien edita o borra uno directo en la base de datos, la cadena se rompe.</p>
                    </div>
                    <button type="button" onClick={verificar} disabled={verificando}
                        className="text-sm border rounded-lg px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50">
                        {verificando ? 'Verificando...' : 'Verificar integridad'}
                    </button>
                </div>
                {verificacion && (
                    <div role="status" className={`mt-3 rounded-lg px-3 py-2 text-sm ${verificacion.integra ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                        {verificacion.integra ? (
                            <p className="font-medium">✓ Cadena íntegra: {verificacion.total} registros verificados.</p>
                        ) : (
                            <>
                                <p className="font-medium">✗ La cadena está rota. Primer problema en el registro #{verificacion.problemas[0].secuencia ?? '?'}:</p>
                                <ul className="list-disc ml-5 mt-1">
                                    {verificacion.problemas.map((p, i) => (
                                        <li key={i}>#{p.secuencia ?? '?'}: {TEXTO_PROBLEMA[p.problema]}</li>
                                    ))}
                                </ul>
                            </>
                        )}
                        {verificacion.ultimo && (
                            <p className="mt-1 text-xs opacity-80 break-all">
                                Último registro #{verificacion.ultimo.secuencia} · hash <span className="font-mono">{verificacion.ultimo.hash}</span>.
                                Compáralo con el ancla diaria del log del servidor (&quot;ANCLA auditoria&quot;).
                            </p>
                        )}
                    </div>
                )}
            </section>

            <form onSubmit={filtrar} className="flex flex-wrap items-end gap-3 mb-4" aria-label="Filtrar auditoría">
                <label className="flex flex-col gap-1 text-sm">
                    Usuario (correo)
                    <input value={borrador.correo} onChange={(e) => cambiar('correo', e.target.value)} placeholder="ej: ana@" maxLength={100} className={campo} />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Módulo
                    <select value={borrador.modulo} onChange={(e) => cambiar('modulo', e.target.value)} className={campo}>
                        <option value="">Todos</option>
                        {MODULOS_AUDITORIA.map((m) => <option key={m.valor} value={m.valor}>{m.etiqueta}</option>)}
                    </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Desde
                    <input type="date" value={borrador.desde} onChange={(e) => cambiar('desde', e.target.value)} className={campo} />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Hasta
                    <input type="date" value={borrador.hasta} onChange={(e) => cambiar('hasta', e.target.value)} className={campo} />
                </label>
                <label className="flex items-center gap-2 text-sm py-1.5">
                    <input type="checkbox" checked={borrador.soloRechazados} onChange={(e) => cambiar('soloRechazados', e.target.checked)} />
                    Solo rechazados
                </label>
                <button type="submit" className="text-sm bg-marca text-white rounded-lg px-3 py-1.5">Filtrar</button>
                {hayFiltros && (
                    <button type="button" onClick={limpiar} className="text-sm border rounded-lg px-3 py-1.5 hover:bg-gray-50">Limpiar</button>
                )}
            </form>

            {error && <p className="text-red-500">{error}</p>}
            {cargando && <p className="text-gray-500">Cargando...</p>}
            {!cargando && !error && registros.length === 0 && (
                <p className="text-gray-500">{hayFiltros ? 'Ningún registro coincide con los filtros.' : 'Todavía no hay registros.'}</p>
            )}

            {!cargando && registros.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="text-left border-b text-gray-500">
                                <th className="py-2 pr-4">Fecha</th>
                                <th className="py-2 pr-4">Acción</th>
                                <th className="py-2 pr-4">Resultado</th>
                                <th className="py-2 pr-4">Usuario</th>
                                <th className="py-2 pr-4">IP</th>
                                <th className="py-2 pr-4">Detalle</th>
                            </tr>
                        </thead>
                        <tbody>
                            {registros.map((r) => (
                                <tr key={r.id} className="border-b align-top">
                                    <td className="py-2 pr-4 whitespace-nowrap text-gray-500">
                                        {new Date(r.fecha).toLocaleString('es-CL')}
                                        <span className="block text-xs text-gray-400">#{r.secuencia}</span>
                                    </td>
                                    <td className="py-2 pr-4 min-w-60">
                                        {r.descripcion && <span className="block">{r.descripcion}</span>}
                                        {/* La acción técnica se mantiene: es la que identifica la ruta exacta */}
                                        <span className={`block font-mono break-all ${r.descripcion ? 'text-xs text-gray-400' : 'text-xs'}`}>{r.accion}</span>
                                    </td>
                                    <td className="py-2 pr-4 whitespace-nowrap">
                                        <span className={r.exito ? 'text-green-700' : 'text-red-600 font-medium'}>
                                            {r.exito ? 'OK' : 'Rechazado'}{r.estado !== null && ` (${r.estado})`}
                                        </span>
                                    </td>
                                    <td className="py-2 pr-4">{r.correo ?? '-'}{r.rol && <span className="text-gray-500"> · {r.rol}</span>}</td>
                                    <td className="py-2 pr-4 whitespace-nowrap text-gray-500">{r.ip ?? '-'}</td>
                                    <td className="py-2 pr-4 font-mono text-xs text-gray-600">{r.detalle ? JSON.stringify(r.detalle) : ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <nav aria-label="Páginas" className="flex items-center justify-between mt-4 text-sm">
                <button type="button" disabled={pagina <= 1 || cargando} onClick={() => irA(pagina - 1)}
                    className="border rounded-lg px-3 py-1.5 disabled:opacity-40 hover:bg-gray-50">
                    ← Más recientes
                </button>
                <span className="text-gray-500">Página {pagina} de {paginas} · {total} registros</span>
                <button type="button" disabled={pagina >= paginas || cargando} onClick={() => irA(pagina + 1)}
                    className="border rounded-lg px-3 py-1.5 disabled:opacity-40 hover:bg-gray-50">
                    Más antiguos →
                </button>
            </nav>
        </main>
    );
}
