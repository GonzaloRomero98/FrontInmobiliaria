'use client'

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, ReactNode, useCallback, useEffect, useState } from "react";
import { avisar, confirmar } from "@/components/Dialogos";
import { usePanel } from "@/components/panel/PanelLayout";
import { enlaceWhatsApp, formatearFechaHora, formatearPrecio, normalizarRut, rutValido } from "@/lib/formato";
import { cambiarEstadoReserva, crearReserva } from "@/services/reserva.service";
import { Reserva } from "@/types/reserva";
import { mensajeError } from "@/lib/errores";
import {
    actualizarVisita, agregarNota, corregirDatosSolicitud, DatosContacto, eliminarDatosPersona, EVENTO_SOLICITUDES_ACTUALIZADAS,
    FichaSolicitud, getSolicitud, marcarContactado,
} from "@/services/solicitud.service";
import { CLAVE_ULTIMA_BANDEJA, ETIQUETA_ORIGEN, ETIQUETA_VISITA, EstadoVisita, folioCotizacion } from "@/types/solicitud";

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

const CAMPOS_CONTACTO: [keyof DatosContacto, string, string][] = [
    ['nombre', 'Nombre', 'text'], ['apellido', 'Apellido', 'text'], ['correo', 'Correo', 'email'], ['celular', 'Celular', 'tel'],
];

export default function FichaCliente() {
    const { id } = useParams<{ id: string }>();
    const [ficha, setFicha] = useState<FichaSolicitud | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [ocupado, setOcupado] = useState(false);
    const [nota, setNota] = useState('');
    const [nuevaFecha, setNuevaFecha] = useState<string | null>(null);
    // null mientras no se están corrigiendo los datos de contacto.
    const [datos, setDatos] = useState<DatosContacto | null>(null);
    const router = useRouter();
    const esAdmin = usePanel().perfil?.rol.nombre === 'ADMIN';

    const [ahora, setAhora] = useState(0);
    // Para volver a la misma vista de la bandeja. Se lee después de montar para evitar errores de hidratación.
    const [volver, setVolver] = useState('/secretario/solicitudes');
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage solo existe en el navegador, por eso se lee después de montar
        try { setVolver(sessionStorage.getItem(CLAVE_ULTIMA_BANDEJA) ?? '/secretario/solicitudes'); } catch { /* Sin almacenamiento se usa la bandeja por defecto. */ }
    }, []);

    const cargar = useCallback(() =>
        getSolicitud(id).then((f) => { setFicha(f); setAhora(Date.now()); }).catch(() => setError('No se pudo cargar la solicitud')), [id]);
    useEffect(() => { cargar(); }, [cargar]);

    // Ejecuta la acción, recarga la ficha y avisa al menú, porque el contador de pendientes puede cambiar.
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
        await hacer(async () => {
            await agregarNota(id, texto);
            setNota((actual) => actual.trim() === texto ? '' : actual);
        }, 'No se pudo guardar la nota');
    }

    async function guardarFecha(e: FormEvent) {
        e.preventDefault();
        // datetime-local entrega la hora local del navegador y la API la recibe en UTC.
        if (nuevaFecha && await hacer(() => actualizarVisita(id, { fecha: new Date(nuevaFecha).toISOString() }), 'No se pudo guardar la visita')) {
            setNuevaFecha(null);
        }
    }

    // Solo se envían los campos que cambiaron; la API normaliza el celular y deja la nota.
    async function guardarDatos(e: FormEvent) {
        e.preventDefault();
        if (!ficha || !datos) return;
        const cambios = Object.fromEntries(CAMPOS_CONTACTO
            .map(([campo]) => [campo, datos[campo].trim()])
            .filter(([campo, valor]) => valor !== ficha[campo as keyof DatosContacto]));
        if (Object.keys(cambios).length === 0 || await hacer(() => corregirDatosSolicitud(id, cambios), 'No se pudieron corregir los datos')) {
            setDatos(null);
        }
    }

    // Derecho de supresión: borra todas las solicitudes de la persona, no solo esta.
    async function eliminarPersona() {
        if (!ficha) return;
        const { correo } = ficha;
        await confirmar({
            titulo: 'Eliminar los datos de esta persona',
            mensaje: `Se eliminarán todas las solicitudes de ${correo}, con sus notas y cotizaciones. No se puede deshacer.`,
            boton: 'Eliminar datos',
            peligroso: true,
            accion: async () => {
                try {
                    const eliminadas = await eliminarDatosPersona(correo);
                    window.dispatchEvent(new Event(EVENTO_SOLICITUDES_ACTUALIZADAS));
                    avisar(eliminadas === 1 ? `Se eliminó la solicitud de ${correo}.` : `Se eliminaron ${eliminadas} solicitudes de ${correo}.`);
                    router.push(volver);
                } catch (err) {
                    return mensajeError(err, 'No se pudieron eliminar los datos');
                }
            },
        });
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
                <Link href={volver} className="text-sm text-gray-500 hover:underline">← Solicitudes</Link>
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
                <Seccion titulo="Contacto" accion={datos === null && (
                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setDatos({ nombre: ficha.nombre, apellido: ficha.apellido, correo: ficha.correo, celular: ficha.celular })}
                            className={boton}>
                            Editar datos
                        </button>
                        {!ficha.contactado && (
                            <button type="button" disabled={ocupado} onClick={() => hacer(() => marcarContactado(id), 'No se pudo marcar como contactada')} className={boton}>
                                Marcar contactado
                            </button>
                        )}
                    </div>
                )}>
                    {datos === null ? (
                        <>
                            <a href={`mailto:${ficha.correo}`} className="underline">{ficha.correo}</a>
                            <a href={enlaceWhatsApp({ ...ficha, modelo: modelo.nombreModelo, proyecto: modelo.proyecto.nombre })} target="_blank" rel="noreferrer"
                                className="text-green-700 underline">WhatsApp {ficha.celular}</a>
                        </>
                    ) : (
                        <form onSubmit={guardarDatos} className="flex flex-col gap-2">
                            {CAMPOS_CONTACTO.map(([campo, etiqueta, tipo], i) => (
                                <label key={campo} className="flex flex-col gap-1 text-sm">
                                    {etiqueta}
                                    <input type={tipo} value={datos[campo]} onChange={(e) => setDatos({ ...datos, [campo]: e.target.value })}
                                        required maxLength={200} autoFocus={i === 0} className="border rounded-lg px-3 py-1.5" />
                                </label>
                            ))}
                            <p className="text-xs text-gray-500">Queda una nota en el seguimiento con los campos corregidos, sin el valor anterior.</p>
                            <div className="flex gap-2 self-end">
                                <button type="submit" disabled={ocupado} className="text-sm bg-marca text-white rounded-lg px-3 py-1.5 disabled:opacity-50">
                                    {ocupado ? 'Guardando…' : 'Guardar'}
                                </button>
                                <button type="button" onClick={() => setDatos(null)} className={boton}>Cancelar</button>
                            </div>
                        </form>
                    )}
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

            <SeccionReserva idSolicitud={id} reserva={reserva} alCambiar={() => { cargar(); window.dispatchEvent(new Event(EVENTO_SOLICITUDES_ACTUALIZADAS)); }} />

            {esAdmin && (
                <Seccion titulo="Datos personales">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-gray-600 max-w-prose">
                            Si la persona pide borrar sus datos, se eliminan todas sus solicitudes ({ficha.correo}) con sus notas y cotizaciones.
                            Si alguna tiene una reserva o una venta, no se borra nada.
                        </p>
                        <button type="button" onClick={eliminarPersona}
                            className="text-sm text-red-700 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50">
                            Eliminar datos de esta persona
                        </button>
                    </div>
                </Seccion>
            )}
        </main>
    );
}

function SeccionReserva({ idSolicitud, reserva, alCambiar }: { idSolicitud: string; reserva?: Reserva; alCambiar: () => void }) {
    const [abierto, setAbierto] = useState(false);
    const [rut, setRut] = useState('');
    const [lote, setLote] = useState('');
    const [errorRut, setErrorRut] = useState<string | null>(null);
    const [errorReserva, setErrorReserva] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);

    async function reservar(e: FormEvent) {
        e.preventDefault();
        const rutNormalizado = normalizarRut(rut);
        if (!rutValido(rutNormalizado)) {
            setErrorRut('RUT inválido, ej: 12.345.678-5');
            return;
        }
        setGuardando(true);
        setErrorReserva(null);
        try {
            await crearReserva({ id_solicitud: idSolicitud, rut: rutNormalizado, lote: lote.trim() || undefined });
            setAbierto(false);
            alCambiar();
        } catch (err) {
            setErrorReserva(mensajeError(err, 'No se pudo registrar la reserva'));
        } finally {
            setGuardando(false);
        }
    }

    async function cambiar(actual: Reserva, estado: 'VENDIDA' | 'ANULADA') {
        const vender = estado === 'VENDIDA';
        // Ninguna de las dos se puede deshacer: una venta no se anula desde aquí y anular libera la unidad para otro cliente.
        await confirmar({
            titulo: vender ? 'Marcar la reserva como vendida' : 'Anular la reserva',
            mensaje: vender ? 'Ya no se podrá anular desde aquí.' : 'La unidad vuelve a quedar disponible para otro cliente.',
            boton: vender ? 'Marcar vendida' : 'Anular reserva',
            peligroso: !vender,
            accion: async () => {
                try {
                    await cambiarEstadoReserva(actual.id, estado);
                    alCambiar();
                } catch (err) {
                    return mensajeError(err, 'No se pudo actualizar la reserva');
                }
            },
        });
    }

    return (
        <Seccion titulo="Reserva" accion={!reserva && !abierto && (
            <button type="button" onClick={() => { setAbierto(true); setRut(''); setLote(''); setErrorRut(null); setErrorReserva(null); }} className={boton}>
                Reservar
            </button>
        )}>
            {reserva ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm">
                        <span className="font-semibold">{reserva.estado === 'VENDIDA' ? 'Vendida' : 'Reservada'}</span>
                        {reserva.lote && ` · Lote ${reserva.lote}`}
                    </p>
                    {reserva.estado === 'RESERVADA' && (
                        <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => cambiar(reserva, 'VENDIDA')} className={boton}>Marcar vendida</button>
                            <button type="button" onClick={() => cambiar(reserva, 'ANULADA')}
                                className="text-sm text-red-700 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50">
                                Anular reserva
                            </button>
                        </div>
                    )}
                </div>
            ) : abierto ? (
                <form onSubmit={reservar} className="flex flex-wrap items-start gap-3">
                    <label className="flex flex-col gap-1 text-sm">
                        RUT del comprador
                        <input value={rut} onChange={(e) => { setRut(e.target.value); setErrorRut(null); }} required maxLength={12} autoFocus
                            placeholder="12.345.678-5" aria-invalid={!!errorRut || undefined} className="border rounded-lg px-3 py-1.5" />
                        {errorRut && <span role="alert" className="text-red-700 text-xs">{errorRut}</span>}
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                        Lote (opcional)
                        <input value={lote} onChange={(e) => setLote(e.target.value)} maxLength={50} className="border rounded-lg px-3 py-1.5" />
                    </label>
                    <div className="flex gap-2 self-end">
                        <button type="submit" disabled={guardando} className="text-sm bg-marca text-white rounded-lg px-3 py-1.5 disabled:opacity-50">
                            {guardando ? 'Guardando…' : 'Guardar reserva'}
                        </button>
                        <button type="button" onClick={() => setAbierto(false)} className={boton}>Cancelar</button>
                    </div>
                    {errorReserva && <p role="alert" className="basis-full text-red-700 text-sm">{errorReserva}</p>}
                </form>
            ) : (
                <p className="text-sm text-gray-600">Sin reserva. Al reservar se descuenta una unidad del modelo.</p>
            )}
        </Seccion>
    );
}
