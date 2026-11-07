'use client'

import { formatearFechaHora, numeroWhatsApp } from "@/lib/formato";
import { descargarSolicitudesCsv, getSolicitudes, marcarContactado, Solicitud } from "@/services/solicitud.service";
import Cookies from "js-cookie";
import Link from "next/link";
import { useEffect, useState } from "react";

type Filtro = 'pendientes' | 'contactados' | 'visita' | 'todas';

const FILTROS: { valor: Filtro; etiqueta: string }[] = [
    { valor: 'pendientes', etiqueta: 'Pendientes' },
    { valor: 'contactados', etiqueta: 'Contactados' },
    { valor: 'visita', etiqueta: 'Con visita' },
    { valor: 'todas', etiqueta: 'Todas' },
];

function mensajeWhatsApp(soli: Solicitud): string {
    const modelo = soli.modeloCasa ? ` por el modelo ${soli.modeloCasa.nombreModelo} del proyecto ${soli.modeloCasa.proyecto.nombre}` : '';
    const visita = soli.visitaPreferida ? ` Pediste visitar la sala de ventas el ${formatearFechaHora(soli.visitaPreferida)}.` : '';
    return `Hola ${soli.nombre}, te escribimos por tu consulta${modelo}.${visita}`;
}

export default function SecretarioDashboard() {
    const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filtro, setFiltro] = useState<Filtro>('pendientes');
    const [esAdmin, setEsAdmin] = useState(false);
    const [exportando, setExportando] = useState(false);

    useEffect(() => {
        let cancelado = false;
        async function cargar() {
            setCargando(true);
            setError(null);
            try {
                const data = await getSolicitudes();
                if (!cancelado) setSolicitudes(data);
            } catch {
                if (!cancelado) setError('No se pudo cargar la lista de solicitudes');
            } finally {
                if (!cancelado) {
                    setCargando(false);
                    // La cookie solo existe en el navegador: se lee aquí para no desajustar la hidratación
                    setEsAdmin(Cookies.get('rol_usuario') === 'ADMIN');
                }
            }
        }
        cargar();
        return () => { cancelado = true; };
    }, []);

    async function handleMarcarContactado(id: string) {
        try {
            await marcarContactado(id);
            setSolicitudes((soli) =>
                soli.map((s) => (s.id === id ? { ...s, contactado: true } : s)),
            );
        } catch {
            alert('No se pudo actualizar el estado');
        }
    }

    async function handleExportar() {
        setExportando(true);
        try {
            await descargarSolicitudesCsv();
        } catch {
            alert('No se pudo exportar las solicitudes');
        } finally {
            setExportando(false);
        }
    }

    const pendientes = solicitudes.filter((s) => !s.contactado).length;
    const visibles = solicitudes.filter((s) =>
        filtro === 'todas' || (filtro === 'visita' ? !!s.visitaPreferida : filtro === 'pendientes' ? !s.contactado : s.contactado));

    return (
        <main className="max-w-6xl mx-auto px-4 py-10">
            {/* Perfil y cierre de sesión están en el menú del usuario del encabezado */}
            <div className="mb-6">
                {esAdmin && <Link href="/admin" className="text-sm text-gray-500 hover:underline">← Panel</Link>}
                <h1 className="text-2xl font-bold">Solicitudes de contacto</h1>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex gap-2" role="tablist" aria-label="Filtrar solicitudes">
                {FILTROS.map(({ valor, etiqueta }) => (
                    <button
                        key={valor}
                        type="button"
                        role="tab"
                        aria-selected={filtro === valor}
                        onClick={() => setFiltro(valor)}
                        className={`text-sm px-3 py-1.5 rounded-full border ${filtro === valor ? 'bg-marca text-white border-marca' : 'hover:bg-gray-50'}`}
                    >
                        {etiqueta}{valor === 'pendientes' && ` (${pendientes})`}
                    </button>
                ))}
            </div>
                {solicitudes.length > 0 && (
                    <button type="button" onClick={handleExportar} disabled={exportando}
                        className="text-sm border rounded-lg px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50">
                        {exportando ? 'Exportando...' : 'Exportar a Excel (todas)'}
                    </button>
                )}
            </div>

            {cargando && <p className="text-gray-500">Cargando...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {!cargando && !error && visibles.length === 0 && (
                <p className="text-gray-500">
                    {solicitudes.length === 0 ? 'Todavía no hay solicitudes.' : filtro === 'pendientes' ? 'No hay solicitudes pendientes.' : 'No hay solicitudes en esta vista.'}
                </p>
            )}

            {!cargando && visibles.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="text-left border-b text-sm text-gray-500">
                                <th className="py-2 pr-4">Fecha</th>
                                <th className="py-2 pr-4">Nombre</th>
                                <th className="py-2 pr-4">Contacto</th>
                                <th className="py-2 pr-4">Modelo</th>
                                <th className="py-2 pr-4">Mensaje</th>
                                <th className="py-2 pr-4">Visita</th>
                                <th className="py-2 pr-4">Estado</th>
                                <th className="py-2 pr-4">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibles.map((soli) => (
                                <tr key={soli.id} className="border-b text-sm align-top">
                                    <td className="py-3 pr-4 whitespace-nowrap text-gray-500">{new Date(soli.creadoEn).toLocaleDateString('es-CL')}</td>
                                    <td className="py-3 pr-4 font-medium">{soli.nombre} {soli.apellido}</td>
                                    <td className="py-3 pr-4">
                                        <div className="flex flex-col gap-1">
                                            <a href={`mailto:${soli.correo}`} className="underline">{soli.correo}</a>
                                            <a
                                                href={`https://wa.me/${numeroWhatsApp(soli.celular)}?text=${encodeURIComponent(mensajeWhatsApp(soli))}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-green-700 underline"
                                            >
                                                WhatsApp {soli.celular}
                                            </a>
                                        </div>
                                    </td>
                                    <td className="py-3 pr-4">
                                        {soli.modeloCasa ? `${soli.modeloCasa.proyecto.nombre} — ${soli.modeloCasa.nombreModelo}` : '-'}
                                    </td>
                                    <td className="py-3 pr-4 max-w-xs">{soli.mensaje ?? '-'}</td>
                                    <td className="py-3 pr-4 whitespace-nowrap">{soli.visitaPreferida ? formatearFechaHora(soli.visitaPreferida) : '-'}</td>
                                    <td className="py-3 pr-4 font-medium">
                                        {soli.contactado ? (
                                            <span className="text-green-600 font-medium">Contactado</span>
                                        ) : (
                                            <span className="text-yellow-600 font-medium">Pendiente</span>
                                        )}
                                    </td>
                                    <td className="py-3 pr-4">
                                        <div className="flex flex-col items-start gap-2">
                                            {!soli.contactado && (
                                                <button
                                                    onClick={() => handleMarcarContactado(soli.id)}
                                                    className="text-sm bg-marca text-white px-3 py-1 rounded-lg whitespace-nowrap"
                                                >
                                                    Marcar contactado
                                                </button>
                                            )}
                                            <Link href={`/secretario/cotizacion/${soli.id}`} target="_blank"
                                                className="text-sm border px-3 py-1 rounded-lg whitespace-nowrap hover:bg-gray-50">
                                                Generar cotización
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}
