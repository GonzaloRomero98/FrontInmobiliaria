'use client'

import { formatearFechaHora, normalizarRut, numeroWhatsApp, rutValido } from "@/lib/formato";
import { descargarSolicitudesCsv, getSolicitudes, marcarContactado, Solicitud } from "@/services/solicitud.service";
import { cambiarEstadoReserva, crearReserva } from "@/services/reserva.service";
import { Reserva } from "@/types/reserva";
import { isAxiosError } from "axios";
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

const ETIQUETA_RESERVA: Record<'RESERVADA' | 'VENDIDA', string> = { RESERVADA: 'Reservada', VENDIDA: 'Vendida' };

function reservaActiva(soli: Solicitud): Reserva | undefined {
    return soli.reservas?.find((r) => r.estado !== 'ANULADA');
}

function mensajeError(err: unknown, porDefecto: string): string {
    const mensaje = isAxiosError(err) ? err.response?.data?.message : null;
    return Array.isArray(mensaje) ? mensaje.join('. ') : mensaje ?? porDefecto;
}

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
        </main>
    );
}
