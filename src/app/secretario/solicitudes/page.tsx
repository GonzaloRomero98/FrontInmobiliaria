'use client'

import { enlaceWhatsApp, formatearFechaHora, normalizarRut, rutValido } from "@/lib/formato";
import { descargarSolicitudesCsv, EVENTO_SOLICITUDES_ACTUALIZADAS, FiltroSolicitud, getSolicitudes, marcarContactado, Solicitud } from "@/services/solicitud.service";
import { cambiarEstadoReserva, crearReserva } from "@/services/reserva.service";
import { Reserva } from "@/types/reserva";
import { isAxiosError } from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";

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

function mensajeError(err: unknown, porDefecto: string): string {
    const mensaje = isAxiosError(err) ? err.response?.data?.message : null;
    return Array.isArray(mensaje) ? mensaje.join('. ') : mensaje ?? porDefecto;
}

export default function BandejaSolicitudes() {
    const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filtro, setFiltro] = useState<Filtro>('pendientes');
    const [exportando, setExportando] = useState(false);
    const [pagina, setPagina] = useState(1);
    const [total, setTotal] = useState(0);
    const [pendientes, setPendientes] = useState(0);
    // Se incrementa para volver a pedir la página actual (p. ej. tras marcar contactado)
    const [recarga, setRecarga] = useState(0);

    useEffect(() => {
        let cancelado = false;
        async function cargar() {
            setCargando(true);
            setError(null);
            try {
                const data = await getSolicitudes(pagina, POR_PAGINA, filtro);
                if (cancelado) return;
                // La última fila de la última página dejó de calzar con el filtro: se retrocede una página
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
    }, [pagina, filtro, recarga]);

    function cambiarFiltro(valor: Filtro) {
        setFiltro(valor);
        setPagina(1);
    }

    async function handleMarcarContactado(id: string) {
        try {
            await marcarContactado(id);
            // Se pide de nuevo la página: la fila puede salir del filtro y el contador de pendientes cambia
            setRecarga((n) => n + 1);
            window.dispatchEvent(new Event(EVENTO_SOLICITUDES_ACTUALIZADAS));
        } catch {
            alert('No se pudo actualizar el estado');
        }
    }

    // Formulario de reserva abierto en una sola fila a la vez
    const [reservandoId, setReservandoId] = useState<string | null>(null);
    const [rut, setRut] = useState('');
    const [lote, setLote] = useState('');
    const [errorRut, setErrorRut] = useState<string | null>(null);
    const [guardandoReserva, setGuardandoReserva] = useState(false);
    // Evita un segundo clic mientras la petición de vender o anular sigue en curso
    const [cambiandoId, setCambiandoId] = useState<string | null>(null);

    function abrirReserva(id: string) {
        setReservandoId(id);
        setRut('');
        setLote('');
        setErrorRut(null);
    }

    function reemplazarReserva(idSolicitud: string, reserva: Reserva) {
        setSolicitudes((lista) => lista.map((s) => s.id !== idSolicitud ? s : {
            ...s, reservas: [...(s.reservas ?? []).filter((r) => r.id !== reserva.id), reserva],
        }));
    }

    async function handleReservar(e: React.FormEvent, idSolicitud: string) {
        e.preventDefault();
        const rutNormalizado = normalizarRut(rut);
        if (!rutValido(rutNormalizado)) {
            setErrorRut('RUT inválido, ej: 12.345.678-5');
            return;
        }
        setGuardandoReserva(true);
        try {
            const reserva = await crearReserva({ id_solicitud: idSolicitud, rut: rutNormalizado, lote: lote.trim() || undefined });
            reemplazarReserva(idSolicitud, reserva);
            setReservandoId(null);
        } catch (err) {
            alert(mensajeError(err, 'No se pudo registrar la reserva'));
        } finally {
            setGuardandoReserva(false);
        }
    }

    async function handleCambiarReserva(idSolicitud: string, reserva: Reserva, estado: 'VENDIDA' | 'ANULADA') {
        const pregunta = estado === 'VENDIDA'
            ? '¿Marcar esta reserva como vendida? Ya no se podrá anular desde aquí.'
            : '¿Anular esta reserva? La unidad vuelve a quedar disponible.';
        if (!confirm(pregunta)) return;
        setCambiandoId(reserva.id);
        try {
            reemplazarReserva(idSolicitud, await cambiarEstadoReserva(reserva.id, estado));
        } catch (err) {
            alert(mensajeError(err, 'No se pudo actualizar la reserva'));
        } finally {
            setCambiandoId(null);
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

    // El filtro ya viene aplicado desde la API
    const visibles = solicitudes;
    const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));

    return (
        <main className="max-w-6xl mx-auto px-4 py-10">
            {/* Navegación, perfil y cierre de sesión están en el menú lateral del panel */}
            <div className="mb-6">
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
                        onClick={() => cambiarFiltro(valor)}
                        className={`text-sm px-3 py-1.5 rounded-full border ${filtro === valor ? 'bg-marca text-white border-marca' : 'hover:bg-gray-50'}`}
                    >
                        {etiqueta}{valor === 'pendientes' && ` (${pendientes})`}
                    </button>
                ))}
            </div>
                <button type="button" onClick={handleExportar} disabled={exportando}
                    className="text-sm border rounded-lg px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50">
                    {exportando ? 'Exportando...' : 'Exportar a Excel (todas)'}
                </button>
            </div>

            {/* Al cambiar de página se mantiene la tabla anterior (atenuada) en vez de un salto a "Cargando..." */}
            {cargando && visibles.length === 0 && <p className="text-gray-500">Cargando...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {!cargando && !error && visibles.length === 0 && (
                <p className="text-gray-500">
                    {filtro === 'todas' ? 'Todavía no hay solicitudes.' : filtro === 'pendientes' ? 'No hay solicitudes pendientes.' : 'No hay solicitudes en esta vista.'}
                </p>
            )}

            {visibles.length > 0 && (
                <div className={`overflow-x-auto ${cargando ? 'opacity-60' : ''}`} aria-busy={cargando}>
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
                            {visibles.map((soli) => {
                                const reserva = reservaActiva(soli);
                                return (
                                <tr key={soli.id} className="border-b text-sm align-top">
                                    <td className="py-3 pr-4 whitespace-nowrap text-gray-500">{new Date(soli.creadoEn).toLocaleDateString('es-CL')}</td>
                                    <td className="py-3 pr-4 font-medium">{soli.nombre} {soli.apellido}</td>
                                    <td className="py-3 pr-4">
                                        <div className="flex flex-col gap-1">
                                            <a href={`mailto:${soli.correo}`} className="underline">{soli.correo}</a>
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
                                        {reserva && (
                                            <span className={`block mt-1 text-xs font-semibold ${reserva.estado === 'VENDIDA' ? 'text-gray-600' : 'text-amber-700'}`}>
                                                {ETIQUETA_RESERVA[reserva.estado as 'RESERVADA' | 'VENDIDA']}{reserva.lote && ` · ${reserva.lote}`}
                                            </span>
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
                                            {!reserva && reservandoId !== soli.id && (
                                                <button type="button" onClick={() => abrirReserva(soli.id)}
                                                    className="text-sm border px-3 py-1 rounded-lg whitespace-nowrap hover:bg-gray-50">
                                                    Reservar
                                                </button>
                                            )}
                                            {!reserva && reservandoId === soli.id && (
                                                <form onSubmit={(e) => handleReservar(e, soli.id)} className="flex flex-col gap-1 w-44">
                                                    <input value={rut} onChange={(e) => { setRut(e.target.value); setErrorRut(null); }}
                                                        placeholder="RUT 12.345.678-5" aria-label="RUT del comprador" required maxLength={12}
                                                        className="border rounded-lg px-2 py-1" />
                                                    {errorRut && <span className="text-red-500 text-xs">{errorRut}</span>}
                                                    <input value={lote} onChange={(e) => setLote(e.target.value)}
                                                        placeholder="Lote (opcional)" aria-label="Lote" maxLength={50}
                                                        className="border rounded-lg px-2 py-1" />
                                                    <div className="flex gap-1">
                                                        <button type="submit" disabled={guardandoReserva}
                                                            className="text-sm bg-marca text-white px-3 py-1 rounded-lg disabled:opacity-50">
                                                            {guardandoReserva ? 'Guardando...' : 'Guardar'}
                                                        </button>
                                                        <button type="button" onClick={() => setReservandoId(null)}
                                                            className="text-sm border px-3 py-1 rounded-lg hover:bg-gray-50">
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                </form>
                                            )}
                                            {reserva?.estado === 'RESERVADA' && (
                                                <>
                                                    <button type="button" onClick={() => handleCambiarReserva(soli.id, reserva, 'VENDIDA')}
                                                        disabled={cambiandoId === reserva.id}
                                                        className="text-sm border px-3 py-1 rounded-lg whitespace-nowrap hover:bg-gray-50 disabled:opacity-50">
                                                        Marcar vendida
                                                    </button>
                                                    <button type="button" onClick={() => handleCambiarReserva(soli.id, reserva, 'ANULADA')}
                                                        disabled={cambiandoId === reserva.id}
                                                        className="text-sm text-red-700 border border-red-200 px-3 py-1 rounded-lg whitespace-nowrap hover:bg-red-50 disabled:opacity-50">
                                                        Anular reserva
                                                    </button>
                                                </>
                                            )}
                                        </div>
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
