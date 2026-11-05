'use client'

import { getAuditoria, RegistroAuditoria } from "@/services/auditoria.service";
import Link from "next/link";
import { useEffect, useState } from "react";

const LIMITE = 50;

export default function Auditoria() {
    const [registros, setRegistros] = useState<RegistroAuditoria[]>([]);
    const [total, setTotal] = useState(0);
    const [pagina, setPagina] = useState(1);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelado = false;
        getAuditoria(pagina, LIMITE)
            .then((data) => { if (!cancelado) { setRegistros(data.registros); setTotal(data.total); } })
            .catch(() => { if (!cancelado) setError('No se pudo cargar la auditoría'); })
            .finally(() => { if (!cancelado) setCargando(false); });
        return () => { cancelado = true; };
    }, [pagina]);

    const paginas = Math.max(1, Math.ceil(total / LIMITE));

    function irA(nueva: number) {
        setCargando(true);
        setError(null);
        setPagina(nueva);
    }

    return (
        <main className="max-w-6xl mx-auto px-4 py-10">
            <Link href="/admin" className="text-sm text-gray-500 hover:underline">← Panel</Link>
            <h1 className="text-2xl font-bold mb-1">Auditoría</h1>
            <p className="text-sm text-gray-500 mb-6">Cambios de datos, accesos rechazados, inicios de sesión y exportaciones. Más recientes primero.</p>

            {error && <p className="text-red-500">{error}</p>}
            {cargando && <p className="text-gray-500">Cargando...</p>}
            {!cargando && !error && registros.length === 0 && <p className="text-gray-500">Todavía no hay registros.</p>}

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
                                    <td className="py-2 pr-4 whitespace-nowrap text-gray-500">{new Date(r.fecha).toLocaleString('es-CL')}</td>
                                    <td className="py-2 pr-4 font-mono text-xs break-all min-w-60">{r.accion}</td>
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
