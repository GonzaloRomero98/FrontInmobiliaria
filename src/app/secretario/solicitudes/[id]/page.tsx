'use client'

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, ReactNode, useCallback, useEffect, useState } from "react";
import { avisar } from "@/components/Dialogos";
import { enlaceWhatsApp, formatearFechaHora, formatearPrecio } from "@/lib/formato";
import { mensajeError } from "@/lib/errores";
import {
    actualizarVisita, agregarNota, EVENTO_SOLICITUDES_ACTUALIZADAS, FichaSolicitud, getSolicitud, marcarContactado,
} from "@/services/solicitud.service";
import { ETIQUETA_ORIGEN, ETIQUETA_VISITA, EstadoVisita, folioCotizacion } from "@/types/solicitud";

const COLOR_VISITA: Record<EstadoVisita, string> = {
    POR_CONFIRMAR: 'bg-amber-50 text-amber-800', CONFIRMADA: 'bg-green-50 text-green-700',
    ASISTIO: 'bg-gray-100 text-gray-700', NO_ASISTIO: 'bg-red-50 text-red-700',
};

function Seccion({ titulo, accion, children }: { titulo: string; accion?: ReactNode; children: ReactNode }) {
    return (
        <section className="border rounded-xl p-5 flex flex-col gap-3" aria-label={titulo}>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">{titulo}</h2>
                {accion}
            </div>
            {children}
        </section>
    );
}

const boton = "text-sm border rounded-lg px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50";

// Ficha del cliente: datos, visita, notas de seguimiento, cotizaciones y reserva
export default function FichaCliente() {
    const { id } = useParams<{ id: string }>();
    const [ficha, setFicha] = useState<FichaSolicitud | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [ocupado, setOcupado] = useState(false);
    const [nota, setNota] = useState('');
    // Fecha del formulario de agendar/reagendar; null = formulario cerrado
    const [nuevaFecha, setNuevaFecha] = useState<string | null>(null);

    // Hora de la última carga: decide si la visita ya pasó (y se puede marcar la asistencia)
    const [ahora, setAhora] = useState(0);

    const cargar = useCallback(() =>
        getSolicitud(id).then((f) => { setFicha(f); setAhora(Date.now()); }).catch(() => setError('No se pudo cargar la solicitud')), [id]);
    useEffect(() => { cargar(); }, [cargar]);

    // Ejecuta una acción, recarga la ficha y avisa al menú (el contador de pendientes puede cambiar)
    async function hacer(accion: () => Promise<unknown>, porDefecto: string) {
        setOcupado(true);
        try {
            await accion();
            await cargar();
            window.dispatchEvent(new Event(EVENTO_SOLICITUDES_ACTUALIZADAS));
            return true;
        } catch (err) {
            avisar(mensajeError(err, porDefecto), { error: true });
            return false;
        } finally {
            setOcupado(false);
        }
    }

    async function guardarNota(e: FormEvent) {
        e.preventDefault();
        const texto = nota.trim();
        // Se vacía al guardar (antes de recargar), y solo si no se empezó a escribir otra nota mientras tanto
        await hacer(async () => {
            await agregarNota(id, texto);
            setNota((actual) => actual.trim() === texto ? '' : actual);
        }, 'No se pudo guardar la nota');
    }

    async function guardarFecha(e: FormEvent) {
        e.preventDefault();
        // datetime-local viene en la hora del navegador; la API la recibe en UTC
        if (nuevaFecha && await hacer(() => actualizarVisita(id, { fecha: new Date(nuevaFecha).toISOString() }), 'No se pudo guardar la visita')) {
            setNuevaFecha(null);
        }
    }

    if (error) return <main className="max-w-4xl mx-auto px-4 py-10 text-red-600">{error}</main>;
    if (!ficha) return <main className="max-w-4xl mx-auto px-4 py-10">Cargando...</main>;

    const { modeloCasa: modelo } = ficha;
    const reserva = ficha.reservas?.find((r) => r.estado !== 'ANULADA');
    const visitaPasada = ficha.visitaPreferida !== null && new Date(ficha.visitaPreferida).getTime() <= ahora;
    const visitaAbierta = ficha.visitaEstado === 'POR_CONFIRMAR' || ficha.visitaEstado === 'CONFIRMADA';
    const conSala = !!modelo.proyecto.salaDireccion;

    return (
        <main className="max-w-4xl mx-auto px-4 py-10 flex flex-col gap-5">
            <div>
                <Link href="/secretario/solicitudes" className="text-sm text-gray-500 hover:underline">← Solicitudes</Link>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                    <h1 className="text-2xl font-bold">{ficha.nombre} {ficha.apellido}</h1>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ficha.contactado ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-800'}`}>
                        {ficha.contactado ? 'Contactado' : 'Pendiente'}
                    </span>
                    {reserva && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        {reserva.estado === 'VENDIDA' ? 'Vendida' : 'Reservada'}{reserva.lote && ` · ${reserva.lote}`}
                    </span>}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                    {modelo.proyecto.nombre} — {modelo.nombreModelo} · Llegó por {ETIQUETA_ORIGEN[ficha.origen].toLowerCase()} el {formatearFechaHora(ficha.creadoEn)}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Seccion titulo="Contacto" accion={!ficha.contactado && (
                    <button type="button" disabled={ocupado} onClick={() => hacer(() => marcarContactado(id), 'No se pudo marcar como contactada')} className={boton}>
                        Marcar contactado
                    </button>
                )}>
                    <a href={`mailto:${ficha.correo}`} className="underline">{ficha.correo}</a>
                    <a href={enlaceWhatsApp({ ...ficha, modelo: modelo.nombreModelo, proyecto: modelo.proyecto.nombre })} target="_blank" rel="noreferrer"
                        className="text-green-700 underline">WhatsApp {ficha.celular}</a>
                    {ficha.mensaje && <p className="text-sm text-gray-700 border-l-4 border-gray-200 pl-3 whitespace-pre-line">{ficha.mensaje}</p>}
                </Seccion>

                <Seccion titulo="Visita a la sala de ventas">
                    {ficha.visitaPreferida && ficha.visitaEstado ? (
                        <>
                            <p className="flex flex-wrap items-center gap-2">
                                <span className="font-medium">{formatearFechaHora(ficha.visitaPreferida)}</span>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${COLOR_VISITA[ficha.visitaEstado]}`}>{ETIQUETA_VISITA[ficha.visitaEstado]}</span>
                            </p>
                            {nuevaFecha === null && (
                                <div className="flex flex-wrap gap-2">
                                    {ficha.visitaEstado === 'POR_CONFIRMAR' && !visitaPasada && (
                                        <button type="button" disabled={ocupado} className={boton}
                                            onClick={() => hacer(() => actualizarVisita(id, { estado: 'CONFIRMADA' }), 'No se pudo confirmar la visita')}>
                                            Confirmar visita
                                        </button>
                                    )}
                                    {/* La asistencia se marca cuando ya pasó la hora */}
                                    {visitaPasada && visitaAbierta && (
                                        <>
                                            <button type="button" disabled={ocupado} className={boton}
                                                onClick={() => hacer(() => actualizarVisita(id, { estado: 'ASISTIO' }), 'No se pudo guardar la asistencia')}>
                                                Asistió
                                            </button>
                                            <button type="button" disabled={ocupado} className={boton}
                                                onClick={() => hacer(() => actualizarVisita(id, { estado: 'NO_ASISTIO' }), 'No se pudo guardar la asistencia')}>
                                                No asistió
                                            </button>
                                        </>
                                    )}
                                    {ficha.visitaEstado !== 'ASISTIO' && (
                                        <button type="button" onClick={() => setNuevaFecha('')} className={boton}>Reagendar</button>
                                    )}
                                </div>
                            )}
                        </>
                    ) : conSala ? (
                        nuevaFecha === null && (
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm text-gray-600">Sin visita agendada.</p>
                                <button type="button" onClick={() => setNuevaFecha('')} className={boton}>Agendar visita</button>
                            </div>
                        )
                    ) : (
                        <p className="text-sm text-gray-600">El proyecto no tiene sala de ventas.</p>
                    )}
                    {nuevaFecha !== null && (
                        <form onSubmit={guardarFecha} className="flex flex-wrap items-end gap-2">
                            <label className="flex flex-col gap-1 text-sm">
                                Nueva fecha y hora (queda confirmada)
                                <input type="datetime-local" value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)} required autoFocus
                                    className="border rounded-lg px-3 py-1.5" />
                            </label>
                            <button type="submit" disabled={ocupado} className="text-sm bg-marca text-white rounded-lg px-3 py-1.5 disabled:opacity-50">Guardar</button>
                            <button type="button" onClick={() => setNuevaFecha(null)} className={boton}>Cancelar</button>
                        </form>
                    )}
                </Seccion>
            </div>

            <Seccion titulo="Seguimiento">
                <form onSubmit={guardarNota} className="flex flex-col gap-2">
                    <label htmlFor="nota" className="sr-only">Nueva nota</label>
                    <textarea id="nota" value={nota} onChange={(e) => setNota(e.target.value)} rows={2} maxLength={2000} required
                        placeholder="Ej.: llamé y no contestó; pidió cotización con 20 % de pie" className="border rounded-lg px-3 py-2 text-sm" />
                    <button type="submit" disabled={ocupado || !nota.trim()} className="self-end text-sm bg-marca text-white rounded-lg px-3 py-1.5 disabled:opacity-50">
                        Agregar nota
                    </button>
                </form>
                {ficha.notas.length === 0 ? (
                    <p className="text-sm text-gray-500">Todavía no hay notas. Las notas no se editan: para corregir, agrega otra.</p>
                ) : (
                    <ol className="flex flex-col gap-3">
                        {ficha.notas.map((n) => (
                            <li key={n.id} className="text-sm border-l-4 border-marca/30 pl-3">
                                <p className="whitespace-pre-line">{n.texto}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{n.usuario?.nombre ?? 'Usuario eliminado'} · {formatearFechaHora(n.creadoEn)}</p>
                            </li>
                        ))}
                    </ol>
                )}
            </Seccion>

            <Seccion titulo="Cotizaciones" accion={
                <Link href={`/secretario/cotizacion/${id}`} className={boton}>Nueva cotización</Link>
            }>
                {ficha.cotizaciones.length === 0 ? (
                    <p className="text-sm text-gray-500">Aún no se le ha enviado ninguna cotización.</p>
                ) : (
                    <ul className="divide-y">
                        {ficha.cotizaciones.map((c) => (
                            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                                <span>
                                    <span className="font-semibold">{folioCotizacion(c.folio)}</span>
                                    {' · '}{c.datos.nombreModelo} · {formatearPrecio(c.datos.precio, c.datos.moneda)}
                                    <span className="block text-xs text-gray-500">{c.usuario?.nombre ?? 'Usuario eliminado'} · {formatearFechaHora(c.creadoEn)}</span>
                                </span>
                                <Link href={`/secretario/cotizacion/${id}?folio=${c.id}`} className={boton}>Ver o reimprimir</Link>
                            </li>
                        ))}
                    </ul>
                )}
            </Seccion>
        </main>
    );
}
