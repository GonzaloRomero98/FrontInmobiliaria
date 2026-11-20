'use client'

import { Check, Clock, FileText, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePanel } from "@/components/panel/PanelLayout";
import { Accion, DOS_DIAS_MS, Esqueleto, hace, Informativa, numero, ProximasVisitas, Tarjeta, ZONA } from "@/components/panel/Tablero";
import { enlaceWhatsApp } from "@/lib/formato";
import { avisar } from "@/components/Dialogos";
import { getSeguimiento, Seguimiento } from "@/services/metricas.service";
import { EVENTO_SOLICITUDES_ACTUALIZADAS, marcarContactado } from "@/services/solicitud.service";
import { PANEL_PAGINA, PANEL_PRIMARIO, PANEL_SECUNDARIO, PANEL_EXITO, NORMAL, COMPACTO, PILDORA, TONO } from "@/lib/estilos";

const BANDEJA = '/secretario/solicitudes';

function PorContactar({ solicitudes, ahora, alMarcar }: { solicitudes: Seguimiento['solicitudes']['porContactar']; ahora: number; alMarcar: (id: string) => Promise<void> }) {
    const [marcando, setMarcando] = useState<string | null>(null);
    if (solicitudes.length === 0) return <p className="text-sm text-gray-600">Todas las solicitudes están contactadas. ¡Bien!</p>;
    return (
        <ul className="divide-y divide-gray-100">
            {solicitudes.map((s) => {
                // Con más de 2 días sin respuesta se marca como atrasada, con ícono y texto además del color.
                const atrasada = ahora - new Date(s.creadoEn).getTime() > DOS_DIAS_MS;
                return (
                    <li key={s.id} className="flex flex-col sm:flex-row sm:items-center gap-3 py-3 first:pt-0 last:pb-0">
                        <div className="min-w-0 sm:flex-1">
                            <p className="font-semibold text-marca truncate">{s.nombre} {s.apellido}</p>
                            <p className="text-sm text-gray-600 truncate">{[s.modelo, s.proyecto].filter(Boolean).join(' · ')}</p>
                            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                                <span className={atrasada ? `${PILDORA} ${TONO.aviso}` : 'inline-flex items-center gap-1 whitespace-nowrap text-gray-600'}>
                                    <Clock className="w-3.5 h-3.5" aria-hidden />
                                    {atrasada ? 'Esperando ' : 'Llegó '}{hace(s.creadoEn)}
                                </span>
                                {s.visitaPreferida && <span className="text-gray-600">Pidió visita</span>}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <a href={enlaceWhatsApp(s)} target="_blank" rel="noreferrer"
                                className={`${PANEL_EXITO} ${COMPACTO}`}>
                                <MessageCircle className="w-4 h-4" aria-hidden />WhatsApp
                            </a>
                            <Link href={`/secretario/cotizacion/${s.id}`} target="_blank"
                                className={`${PANEL_SECUNDARIO} ${COMPACTO}`}>
                                <FileText className="w-4 h-4" aria-hidden />Cotizar
                            </Link>
                            <button type="button" disabled={marcando === s.id}
                                onClick={async () => { setMarcando(s.id); await alMarcar(s.id); setMarcando(null); }}
                                className={`${PANEL_PRIMARIO} ${COMPACTO}`}
                                aria-label={`Marcar como contactada la solicitud de ${s.nombre} ${s.apellido}`}>
                                <Check className="w-4 h-4" aria-hidden />Contactado
                            </button>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

function ReservasPorCerrar({ reservas }: { reservas: Seguimiento['reservas']['porCerrar'] }) {
    if (reservas.length === 0) return <p className="text-sm text-gray-600">No hay reservas pendientes de cerrar.</p>;
    return (
        <ul className="divide-y divide-gray-100">
            {reservas.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                        <p className="font-semibold text-marca truncate">{r.nombre} {r.apellido}</p>
                        <p className="text-sm text-gray-600 truncate">{[r.modelo, r.proyecto, r.lote].filter(Boolean).join(' · ')}</p>
                    </div>
                    <span className="text-xs text-gray-600 whitespace-nowrap">reservada {hace(r.creadoEn)}</span>
                </li>
            ))}
        </ul>
    );
}

export default function InicioSecretaria() {
    const { perfil } = usePanel();
    const [datos, setDatos] = useState<Seguimiento | null>(null);
    const [ahora, setAhora] = useState(0);
    const [error, setError] = useState(false);

    const cargar = useCallback(() => getSeguimiento()
        .then((d) => { setDatos(d); setAhora(Date.now()); })
        .catch(() => setError(true)), []);
    useEffect(() => { cargar(); }, [cargar]);

    async function alMarcar(id: string) {
        try {
            await marcarContactado(id);
            window.dispatchEvent(new Event(EVENTO_SOLICITUDES_ACTUALIZADAS));
            await cargar();
        } catch {
            avisar('No se pudo marcar como contactada', { error: true });
        }
    }

    const hoy = perfil ? new Date().toLocaleDateString('es-CL', { timeZone: ZONA, weekday: 'long', day: 'numeric', month: 'long' }) : null;

    return (
        <main className={PANEL_PAGINA}>
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Hola{perfil ? `, ${perfil.nombre}` : ''}</h1>
                    <p className="text-gray-600 mt-1 first-letter:uppercase">{hoy ? `${hoy} · tu seguimiento de ventas` : ' '}</p>
                </div>
                <Link href={BANDEJA} className={`${PANEL_PRIMARIO} ${NORMAL}`}>Ir a la bandeja</Link>
            </div>

            {error && <p role="alert" className="text-red-700 mb-6">No se pudo cargar el resumen.</p>}

            {!datos && !error && (
                <div className="flex flex-col gap-4" aria-busy="true" aria-label="Cargando el resumen">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"><Esqueleto className="h-36" /><Esqueleto className="h-36" /><Esqueleto className="h-36" /><Esqueleto className="h-36" /></div>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]"><Esqueleto className="h-72" /><Esqueleto className="h-72" /></div>
                </div>
            )}

            {datos && (
                <div className="flex flex-col gap-4">
                    <section aria-label="Resumen" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Accion cifra={datos.solicitudes.pendientes} texto={datos.solicitudes.pendientes === 1 ? 'solicitud sin contactar' : 'solicitudes sin contactar'} href={BANDEJA} enlace="Ir a la bandeja" />
                        <Accion cifra={datos.visitas.proximos7Dias} texto={datos.visitas.proximos7Dias === 1 ? 'visita a sala en 7 días' : 'visitas a sala en 7 días'} href="#agenda" enlace="Ver agenda" />
                        <Accion cifra={datos.reservas.enCurso} texto={datos.reservas.enCurso === 1 ? 'reserva por cerrar' : 'reservas por cerrar'} href="#reservas" enlace="Ver reservas" />
                        <div className="grid grid-rows-2 bg-white border rounded-2xl divide-y divide-gray-200">
                            <Informativa cifra={datos.solicitudes.nuevasHoy} texto={`nuevas hoy · ${numero(datos.solicitudes.nuevasSemana)} esta semana`} />
                            <Informativa cifra={datos.reservas.ventasMes} texto={datos.reservas.ventasMes === 1 ? 'venta este mes' : 'ventas este mes'} />
                        </div>
                    </section>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr] items-start">
                        <div className="flex flex-col gap-4">
                            <Tarjeta titulo="Por contactar primero" enlace={datos.solicitudes.pendientes > datos.solicitudes.porContactar.length ? { href: BANDEJA, texto: `Ver las ${numero(datos.solicitudes.pendientes)}` } : undefined}>
                                <PorContactar solicitudes={datos.solicitudes.porContactar} ahora={ahora} alMarcar={alMarcar} />
                            </Tarjeta>
                            <Tarjeta id="reservas" titulo="Reservas por cerrar" enlace={{ href: BANDEJA, texto: 'Gestionar' }}>
                                <ReservasPorCerrar reservas={datos.reservas.porCerrar} />
                            </Tarjeta>
                        </div>
                        <Tarjeta id="agenda" titulo="Agenda de visitas">
                            <ProximasVisitas visitas={datos.visitas.proximas} />
                            {datos.visitas.proximos7Dias > datos.visitas.proximas.length && (
                                <p className="text-sm text-gray-600 mt-3">y {numero(datos.visitas.proximos7Dias - datos.visitas.proximas.length)} más esta semana</p>
                            )}
                        </Tarjeta>
                    </div>
                </div>
            )}
        </main>
    );
}
