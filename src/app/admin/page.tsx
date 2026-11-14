'use client'

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePanel } from "@/components/panel/PanelLayout";
import { Accion, Esqueleto, hace, Informativa, numero, ProximasVisitas, Tarjeta, ZONA } from "@/components/panel/Tablero";
import { getMetricas, Metricas } from "@/services/metricas.service";
import { getAuditoria, RegistroAuditoria, VerificacionAuditoria, verificarAuditoria } from "@/services/auditoria.service";

// Colores revisados para contraste y daltonismo.
const COLOR_INVENTARIO = { disponibles: '#008c9e', reservados: '#c4842a', vendidos: '#5b67c0' } as const;
const COLOR_SEMANA = '#7d93ab';

const porcentaje = (parte: number, total: number) => total ? Math.round((parte / total) * 100) : 0;

function Tendencia({ actual, anterior }: { actual: number; anterior: number }) {
    if (anterior === 0) return null;
    const cambio = Math.round(((actual - anterior) / anterior) * 100);
    if (cambio === 0) return <span> · igual que el mes anterior</span>;
    const sube = cambio > 0;
    return (
        <span className={`font-semibold whitespace-nowrap ${sube ? 'text-green-700' : 'text-red-700'}`}>
            {' · '}{sube ? '▲' : '▼'}&nbsp;{Math.abs(cambio)}%<span className="sr-only"> respecto de los 30 días anteriores</span>
        </span>
    );
}

function Inventario({ m }: { m: Metricas['modelos'] }) {
    const partes = [
        { clave: 'disponibles', etiqueta: 'Disponibles', valor: m.disponibles },
        { clave: 'reservados', etiqueta: 'Reservadas', valor: m.reservados },
        { clave: 'vendidos', etiqueta: 'Vendidas', valor: m.vendidos },
    ] as const;
    if (m.unidades === 0) return <p className="text-sm text-slate-600">Todavía no hay unidades en modelos publicados.</p>;
    return (
        <>
            <div className="flex gap-0.5 h-5 mb-4" role="img"
                aria-label={partes.map((p) => `${p.valor} ${p.etiqueta.toLowerCase()}`).join(', ') + ` de ${m.unidades}`}>
                {partes.filter((p) => p.valor > 0).map((p) => (
                    <span key={p.clave} className="rounded" style={{ flexGrow: p.valor, background: COLOR_INVENTARIO[p.clave] }}
                        title={`${p.etiqueta}: ${p.valor} (${porcentaje(p.valor, m.unidades)}%)`} />
                ))}
            </div>
            <dl className="flex flex-wrap gap-x-8 gap-y-3">
                {partes.map((p) => (
                    <div key={p.clave}>
                        <dt className="text-sm text-slate-600 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_INVENTARIO[p.clave] }} aria-hidden />{p.etiqueta}
                        </dt>
                        <dd className="font-titulo text-2xl font-bold text-marca tabular-nums">
                            {numero(p.valor)} <span className="text-sm font-semibold text-slate-600">{porcentaje(p.valor, m.unidades)}%</span>
                        </dd>
                    </div>
                ))}
            </dl>
            <p className="text-sm text-slate-600 mt-3">{numero(m.unidades)} unidades en {numero(m.publicados)} modelos publicados</p>
        </>
    );
}

function SolicitudesPorSemana({ semanas }: { semanas: Metricas['solicitudes']['porSemana'] }) {
    const maximo = Math.max(1, ...semanas.map((s) => s.solicitudes));
    const etiqueta = (s: string) => new Date(`${s}T12:00:00`).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
    return (
        <figure>
            <div className="flex items-end gap-2 h-32 border-b border-slate-200" aria-hidden>
                {semanas.map((s, i) => {
                    const actual = i === semanas.length - 1;
                    return (
                        <div key={s.semana} className="flex-1 h-full flex flex-col justify-end items-center group" title={`Semana del ${etiqueta(s.semana)}: ${s.solicitudes}`}>
                            <span className={`text-xs font-semibold text-marca tabular-nums mb-1 ${actual ? '' : 'opacity-0 group-hover:opacity-100'}`}>{s.solicitudes}</span>
                            <span className="w-full rounded-t" style={{ height: `${(s.solicitudes / maximo) * 100}%`, minHeight: s.solicitudes ? 4 : 0, background: actual ? 'var(--color-marca)' : COLOR_SEMANA }} />
                        </div>
                    );
                })}
            </div>
            <div className="flex gap-2 mt-1.5" aria-hidden>
                {semanas.map((s, i) => (
                    <span key={s.semana} className="flex-1 text-center text-[11px] text-slate-600 whitespace-nowrap">
                        {i === semanas.length - 1 ? 'Esta' : i % 2 === 0 ? etiqueta(s.semana) : ''}
                    </span>
                ))}
            </div>
            <figcaption className="sr-only">
                Solicitudes por semana: {semanas.map((s) => `semana del ${etiqueta(s.semana)}, ${s.solicitudes}`).join('; ')}.
            </figcaption>
        </figure>
    );
}

function ActividadReciente({ registros }: { registros: RegistroAuditoria[] }) {
    if (registros.length === 0) return <p className="text-sm text-slate-600">Todavía no hay actividad registrada.</p>;
    return (
        <ul className="divide-y divide-slate-100">
            {registros.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                        <p className={`text-sm ${r.descripcion ? '' : 'font-mono text-xs break-all'}`}>
                            {r.descripcion ?? r.accion}
                            {!r.exito && <span className="ml-1.5 text-xs font-semibold text-red-700">(rechazado)</span>}
                        </p>
                        <p className="text-xs text-slate-600 truncate">{r.correo ?? 'Sistema'}</p>
                    </div>
                    <time dateTime={r.fecha} className="text-xs text-slate-600 whitespace-nowrap">{hace(r.fecha)}</time>
                </li>
            ))}
        </ul>
    );
}

function MasConsultados({ modelos }: { modelos: Metricas['masSolicitados'] }) {
    if (modelos.length === 0) return <p className="text-sm text-slate-600">Aún no hay solicitudes.</p>;
    const maximo = Math.max(...modelos.map((m) => m.solicitudes));
    return (
        <ol className="flex flex-col gap-3">
            {modelos.map((m) => (
                <li key={m.id}>
                    <Link href={`/admin/modelosCasa/${m.id}`} className="block group">
                        <span className="flex justify-between gap-3 text-sm">
                            <span className="truncate group-hover:underline">{m.nombreModelo} <span className="text-slate-600">· {m.proyecto}</span></span>
                            <span className="font-semibold text-marca tabular-nums">{numero(m.solicitudes)}</span>
                        </span>
                        <span className="block h-2 mt-1">
                            <span className="block h-full bg-marca rounded-r" style={{ width: `${(m.solicitudes / maximo) * 100}%` }} />
                        </span>
                    </Link>
                </li>
            ))}
        </ol>
    );
}

export default function AdminDashboard() {
    const { perfil } = usePanel();
    const [metricas, setMetricas] = useState<Metricas | null>(null);
    const [actividad, setActividad] = useState<RegistroAuditoria[] | null>(null);
    const [verificacion, setVerificacion] = useState<VerificacionAuditoria | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        getMetricas().then(setMetricas).catch(() => setError(true));
        getAuditoria(1, {}, 5).then((r) => setActividad(r.registros)).catch(() => setActividad([]));
        // Mejora pendiente: se revisa toda la cadena de auditoría en cada visita al inicio.
        // Con muchos registros convendría guardar el resultado o hacerlo en el cron diario.
        verificarAuditoria().then(setVerificacion).catch(() => {});
    }, []);

    const hoy = perfil ? new Date().toLocaleDateString('es-CL', { timeZone: ZONA, weekday: 'long', day: 'numeric', month: 'long' }) : null;

    return (
        <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Hola{perfil ? `, ${perfil.nombre}` : ''}</h1>
                    <p className="text-slate-600 mt-1 first-letter:uppercase">{hoy ? `${hoy} · esto es lo que necesita atención hoy` : ' '}</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/proyectos/nuevo" className="text-sm font-semibold bg-marca text-white rounded-lg px-4 py-2.5 hover:bg-marca/90">+ Proyecto</Link>
                    <Link href="/admin/modelosCasa/nuevo" className="text-sm font-semibold bg-white text-marca border border-slate-300 rounded-lg px-4 py-2.5 hover:bg-slate-50">+ Modelo</Link>
                </div>
            </div>

            {error && <p className="text-red-700 mb-6">No se pudieron cargar las métricas.</p>}

            {!metricas && !error && (
                <div className="flex flex-col gap-4" aria-busy="true" aria-label="Cargando el resumen">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_1.6fr]"><Esqueleto className="h-40" /><Esqueleto className="h-40" /><Esqueleto className="h-40" /></div>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]"><Esqueleto className="h-56" /><Esqueleto className="h-56" /></div>
                </div>
            )}

            {metricas && (
                <div className="flex flex-col gap-4">
                    <section aria-label="Resumen" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.6fr]">
                        <Accion cifra={metricas.solicitudes.pendientes} texto={metricas.solicitudes.pendientes === 1 ? 'solicitud sin contactar' : 'solicitudes sin contactar'} href="/secretario/solicitudes" enlace="Ir a la bandeja" />
                        <Accion cifra={metricas.visitas.proximos7Dias} texto={metricas.visitas.proximos7Dias === 1 ? 'visita a sala en 7 días' : 'visitas a sala en 7 días'} href="#proximas-visitas" enlace="Ver detalle" />
                        <div className="sm:col-span-2 lg:col-span-1 grid grid-cols-2 bg-white border rounded-2xl divide-x divide-slate-200 [&>*:nth-child(-n+2)]:border-b [&>*:nth-child(-n+2)]:border-slate-200">
                            <Informativa cifra={metricas.solicitudes.ultimos30Dias} texto="solicitudes en 30 días">
                                <Tendencia actual={metricas.solicitudes.ultimos30Dias} anterior={metricas.solicitudes.previos30Dias} />
                            </Informativa>
                            <Informativa cifra={metricas.reservas.ventasMes} texto={`ventas este mes · ${numero(metricas.reservas.reservasMes)} reservas`} />
                            <Informativa cifra={metricas.modelos.publicados} texto={`modelos publicados · ${numero(metricas.modelos.borradores)} borradores`} />
                            <Informativa cifra={metricas.proyectosActivos} texto="proyectos activos" />
                        </div>
                    </section>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
                        <Tarjeta titulo="Inventario de unidades" enlace={{ href: '/admin/modelosCasa', texto: 'Ver modelos' }}>
                            <Inventario m={metricas.modelos} />
                        </Tarjeta>
                        <Tarjeta titulo="Solicitudes por semana">
                            <SolicitudesPorSemana semanas={metricas.solicitudes.porSemana} />
                        </Tarjeta>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <Tarjeta id="proximas-visitas" titulo="Próximas visitas" enlace={{ href: '/secretario/solicitudes', texto: 'Bandeja' }}>
                            <ProximasVisitas visitas={metricas.visitas.proximas} />
                        </Tarjeta>
                        <Tarjeta titulo="Actividad reciente" extra={verificacion && (
                            <Link href="/admin/auditoria" className={`text-xs font-semibold rounded-full px-2.5 py-1 border ${verificacion.integra ? 'text-green-800 bg-green-50 border-green-200' : 'text-red-800 bg-red-50 border-red-200'}`}>
                                {verificacion.integra ? '✓ Cadena íntegra' : '✗ Cadena rota'}
                            </Link>
                        )}>
                            {actividad ? <ActividadReciente registros={actividad} /> : <Esqueleto className="h-40" />}
                        </Tarjeta>
                        <Tarjeta titulo="Modelos más consultados">
                            <MasConsultados modelos={metricas.masSolicitados} />
                            {metricas.experiencia3d && (
                                <p className="text-sm text-slate-600 border-t border-slate-200 pt-3 mt-4">
                                    Últimos 30 días: <strong className="text-slate-900">{numero(metricas.experiencia3d.escaneosQr)}</strong> escaneos de QR
                                    · <strong className="text-slate-900">{numero(metricas.experiencia3d.sesionesAr)}</strong> visitas en RA
                                </p>
                            )}
                        </Tarjeta>
                    </div>
                </div>
            )}
        </main>
    );
}
