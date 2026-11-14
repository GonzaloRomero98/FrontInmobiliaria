'use client'

import { enlaceWhatsApp, formatearFechaHora } from "@/lib/formato";
import { descargarSolicitudesCsv, EVENTO_SOLICITUDES_ACTUALIZADAS, FiltroSolicitud, getSolicitudes, marcarContactado, Solicitud } from "@/services/solicitud.service";
import { Reserva } from "@/types/reserva";
import { CLAVE_ULTIMA_BANDEJA, ETIQUETA_ORIGEN, ETIQUETA_VISITA } from "@/types/solicitud";
import { avisar } from "@/components/Dialogos";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type Filtro = FiltroSolicitud;

const POR_PAGINA = 20;

const FILTROS: { valor: Filtro; etiqueta: string }[] = [
    { valor: 'pendientes', etiqueta: 'Pendientes' },
    { valor: 'contactados', etiqueta: 'Contactados' },
    { valor: 'visita', etiqueta: 'Con visita' },
    { valor: 'todas', etiqueta: 'Todas' },
];

const ETIQUETA_RESERVA: Record<'RESERVADA' | 'VENDIDA', string> = { RESERVADA: 'Reservada', VENDIDA: 'Vendida' };

function reservaActiva(soli: Solicitud): Reserva | undefined {
    return soli.reservas?.find((r) => r.estado !== 'ANULADA');
}

// useSearchParams necesita un Suspense por encima (documentación de Next 16).
export default function PaginaSolicitudes() {
    return (
        <Suspense fallback={<main className="max-w-6xl mx-auto px-4 py-10 text-gray-500">Cargando...</main>}>
            <BandejaSolicitudes />
        </Suspense>
    );
}

function BandejaSolicitudes() {
    const router = useRouter();
    const ruta = usePathname();
    const params = useSearchParams();
    // El filtro, la página y la búsqueda se guardan en la URL para que la bandeja quede igual al volver de una ficha.
    const filtroUrl = params.get('filtro') as Filtro | null;
    const [filtro, setFiltro] = useState<Filtro>(FILTROS.some((f) => f.valor === filtroUrl) ? filtroUrl! : 'pendientes');
    const [pagina, setPagina] = useState(() => Math.max(1, Number(params.get('pagina')) || 1));
    // texto es lo que se escribe y buscar lo que se consulta. La API se llama 300 ms después de la última tecla.
    const [texto, setTexto] = useState(() => params.get('q') ?? '');
    const [buscar, setBuscar] = useState(() => (params.get('q') ?? '').trim());

    const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [exportando, setExportando] = useState(false);
    const [total, setTotal] = useState(0);
    const [pendientes, setPendientes] = useState(0);
    const [recarga, setRecarga] = useState(0);

    useEffect(() => {
        const temporizador = setTimeout(() => {
            const nuevo = texto.trim();
            if (nuevo !== buscar) {
                setBuscar(nuevo);
                setPagina(1);
            }
        }, 300);
        return () => clearTimeout(temporizador);
    }, [texto, buscar]);

    useEffect(() => {
        const siguiente = new URLSearchParams();
        if (filtro !== 'pendientes') siguiente.set('filtro', filtro);
        if (pagina > 1) siguiente.set('pagina', String(pagina));
        if (buscar) siguiente.set('q', buscar);
        const url = siguiente.size ? `${ruta}?${siguiente}` : ruta;
        // Se usa replace para que cambiar de filtro no llene el historial del botón atrás.
        router.replace(url, { scroll: false });
        try { sessionStorage.setItem(CLAVE_ULTIMA_BANDEJA, url); } catch { /* Sin almacenamiento, la ficha vuelve a la bandeja por defecto. */ }
    }, [filtro, pagina, buscar, ruta, router]);

    useEffect(() => {
        let cancelado = false;
        async function cargar() {
            setCargando(true);
            setError(null);
            try {
                const data = await getSolicitudes(pagina, POR_PAGINA, filtro, buscar);
                if (cancelado) return;
                // Si la última fila de la última página ya no calza con el filtro, se retrocede una página.
                if (data.solicitudes.length === 0 && pagina > 1) {
                    setPagina(pagina - 1);
                    return;
                }
                setSolicitudes(data.solicitudes);
                setTotal(data.total);
                setPendientes(data.pendientes);
            } catch {
                if (!cancelado) setError('No se pudo cargar la lista de solicitudes');
            } finally {
                if (!cancelado) setCargando(false);
            }
        }
        cargar();
        return () => { cancelado = true; };
    }, [pagina, filtro, recarga, buscar]);

    function cambiarFiltro(valor: Filtro) {
        setFiltro(valor);
        setPagina(1);
    }

    async function handleMarcarContactado(id: string) {
        try {
            await marcarContactado(id);
            setRecarga((n) => n + 1);
            window.dispatchEvent(new Event(EVENTO_SOLICITUDES_ACTUALIZADAS));
        } catch {
            avisar('No se pudo actualizar el estado', { error: true });
        }
    }

    async function handleExportar() {
        setExportando(true);
        try {
            await descargarSolicitudesCsv();
        } catch {
            avisar('No se pudieron exportar las solicitudes', { error: true });
        } finally {
            setExportando(false);
        }
    }

    const visibles = solicitudes;
    const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));

    return (
        <main className="max-w-6xl mx-auto px-4 py-10">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <h1 className="text-2xl font-bold">Solicitudes de contacto</h1>
                <Link href="/secretario/solicitudes/nueva" className="bg-marca text-white text-sm rounded-lg px-4 py-2 font-medium hover:bg-marca/90">
                    Nueva solicitud
                </Link>
            </div>

            <input type="search" value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={100}
                placeholder="Buscar por nombre, correo o celular" aria-label="Buscar solicitudes"
                className="w-full sm:max-w-sm border rounded-lg px-3 py-2 mb-3" />

            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar solicitudes">
                    {FILTROS.map(({ valor, etiqueta }) => (
                        <button
                            key={valor}
                            type="button"
                            aria-pressed={filtro === valor}
                            onClick={() => cambiarFiltro(valor)}
                            className={`text-sm px-3 py-1.5 rounded-full border ${filtro === valor ? 'bg-marca text-white border-marca' : 'hover:bg-gray-50'}`}
                        >
                            {etiqueta}{valor === 'pendientes' && ` (${pendientes})`}
                        </button>
                    ))}
                </div>
                <button type="button" onClick={handleExportar} disabled={exportando}
                    className="text-sm border rounded-lg px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50">
                    {exportando ? 'Exportando…' : 'Descargar CSV para Excel (todas)'}
                </button>
            </div>

            {cargando && visibles.length === 0 && <p className="text-gray-500">Cargando...</p>}
            {error && <p className="text-red-700">{error}</p>}

            {!cargando && !error && visibles.length === 0 && (
                <p className="text-gray-500">
                    {buscar ? `Ninguna solicitud de esta vista coincide con «${buscar}».`
                        : filtro === 'todas' ? 'Todavía no hay solicitudes.' : filtro === 'pendientes' ? 'No hay solicitudes pendientes.' : 'No hay solicitudes en esta vista.'}
                </p>
            )}

            {visibles.length > 0 && (
                <div className={`overflow-x-auto ${cargando ? 'opacity-60' : ''}`} aria-busy={cargando}>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="text-left border-b text-sm text-gray-500">
                                <th className="py-2 pr-4">Fecha</th>
                                <th className="py-2 pr-4">Cliente</th>
                                <th className="py-2 pr-4">Modelo</th>
                                <th className="py-2 pr-4">Visita</th>
                                <th className="py-2 pr-4">Estado</th>
                                <th className="py-2 pr-4"><span className="sr-only">Acción</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibles.map((soli) => {
                                const reserva = reservaActiva(soli);
                                return (
                                <tr key={soli.id} className="border-b text-sm align-top">
                                    <td className="py-3 pr-4 whitespace-nowrap text-gray-500">{new Date(soli.creadoEn).toLocaleDateString('es-CL')}</td>
                                    <td className="py-3 pr-4">
                                        <Link href={`/secretario/solicitudes/${soli.id}`} className="font-medium text-marca underline underline-offset-2 hover:no-underline">
                                            {soli.nombre} {soli.apellido}
                                        </Link>
                                        {soli.origen !== 'WEB' && <span className="text-xs text-gray-500"> · {ETIQUETA_ORIGEN[soli.origen]}</span>}
                                        <div className="flex flex-col gap-0.5 mt-1">
                                            <a href={`mailto:${soli.correo}`} className="text-gray-700 underline break-all">{soli.correo}</a>
                                            <a
                                                href={enlaceWhatsApp({ ...soli, modelo: soli.modeloCasa?.nombreModelo, proyecto: soli.modeloCasa?.proyecto.nombre })}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-green-700 underline"
                                            >
                                                WhatsApp {soli.celular}
                                            </a>
                                        </div>
                                    </td>
                                    <td className="py-3 pr-4">
                                        {soli.modeloCasa ? <>{soli.modeloCasa.nombreModelo}<span className="block text-xs text-gray-500">{soli.modeloCasa.proyecto.nombre}</span></> : '-'}
                                    </td>
                                    <td className="py-3 pr-4 whitespace-nowrap">
                                        {soli.visitaPreferida ? formatearFechaHora(soli.visitaPreferida) : '-'}
                                        {soli.visitaEstado && <span className="block text-xs text-gray-500">{ETIQUETA_VISITA[soli.visitaEstado]}</span>}
                                    </td>
                                    <td className="py-3 pr-4 font-medium">
                                        {soli.contactado ? (
                                            <span className="text-green-700">Contactado</span>
                                        ) : (
                                            <span className="text-amber-800">Pendiente</span>
                                        )}
                                        {reserva && (
                                            <span className={`block mt-1 text-xs font-semibold ${reserva.estado === 'VENDIDA' ? 'text-gray-600' : 'text-amber-700'}`}>
                                                {ETIQUETA_RESERVA[reserva.estado as 'RESERVADA' | 'VENDIDA']}{reserva.lote && ` · ${reserva.lote}`}
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 pr-4">
                                        {soli.contactado ? (
                                            <Link href={`/secretario/solicitudes/${soli.id}`}
                                                className="inline-block text-sm border px-3 py-1.5 rounded-lg whitespace-nowrap hover:bg-gray-50">
                                                Abrir ficha
                                            </Link>
                                        ) : (
                                            <button type="button" onClick={() => handleMarcarContactado(soli.id)}
                                                className="text-sm bg-marca text-white px-3 py-1.5 rounded-lg whitespace-nowrap hover:bg-marca/90">
                                                Marcar contactado
                                            </button>
                                        )}
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {total > POR_PAGINA && (
                <nav aria-label="Páginas de solicitudes" className="flex items-center justify-between gap-2 mt-4 text-sm">
                    <button type="button" onClick={() => setPagina((p) => p - 1)} disabled={pagina <= 1 || cargando}
                        className="border rounded-lg px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50">
                        ← Anterior
                    </button>
                    <span className="text-gray-500">
                        {(pagina - 1) * POR_PAGINA + 1}–{Math.min(pagina * POR_PAGINA, total)} de {total} · página {pagina} de {paginas}
                    </span>
                    <button type="button" onClick={() => setPagina((p) => p + 1)} disabled={pagina >= paginas || cargando}
                        className="border rounded-lg px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50">
                        Siguiente →
                    </button>
                </nav>
            )}
        </main>
    );
}
