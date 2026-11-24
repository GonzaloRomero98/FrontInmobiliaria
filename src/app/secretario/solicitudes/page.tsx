'use client'

import { enlaceWhatsApp, formatearFechaHora } from "@/lib/formato";
import { descargarSolicitudesCsv, EVENTO_SOLICITUDES_ACTUALIZADAS, FiltroSolicitud, getSolicitudes, marcarContactado, Solicitud } from "@/services/solicitud.service";
import { Reserva } from "@/types/reserva";
import { CLAVE_ULTIMA_BANDEJA, COLOR_VISITA, ETIQUETA_ORIGEN, ETIQUETA_VISITA, PILDORA, visitaAbierta } from "@/types/solicitud";
import { avisar } from "@/components/Dialogos";
import { CargandoLista, DOS_DIAS_MS, hace, Vacio } from "@/components/panel/Tablero";
import { fechaVisitaCorta } from "@/lib/horarioSala";
import { Clock, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { COMPACTO, NORMAL, PANEL_EXITO, PANEL_PAGINA, PANEL_PRIMARIO, PANEL_SECUNDARIO, SUPERFICIE, TONO, CAMPO_PANEL } from "@/lib/estilos";

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
        <Suspense fallback={<main className={PANEL_PAGINA}><h1 className="text-2xl font-bold mb-6">Solicitudes de contacto</h1><CargandoLista filas={5} etiqueta="Cargando solicitudes" /></main>}>
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
    // Se toma al cargar (no al renderizar) para calcular atrasos y visitas pasadas.
    const [ahora, setAhora] = useState(0);

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
                    setPagina((p) => p - 1);
                    return;
                }
                setSolicitudes(data.solicitudes);
                setAhora(Date.now());
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


    const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
    // Lo que se calcula por fila sirve igual para la tabla (escritorio) y para las tarjetas (celular).
    const filas = solicitudes.map((soli) => ({
        soli,
        reserva: reservaActiva(soli),
        atrasada: !soli.contactado && ahora - new Date(soli.creadoEn).getTime() > DOS_DIAS_MS,
        sinAsistencia: !!soli.visitaPreferida && visitaAbierta(soli.visitaEstado) && new Date(soli.visitaPreferida).getTime() <= ahora,
    }));
    type Fila = (typeof filas)[number];

    // Igual que en el inicio: ícono y texto además del color.
    const llegada = ({ soli, atrasada }: Fila) => !soli.contactado && (
        <span className={atrasada ? `${PILDORA} ${TONO.aviso}` : 'inline-flex items-center gap-1 text-xs text-gray-600'}>
            <Clock className="w-3.5 h-3.5" aria-hidden />
            {atrasada ? 'Esperando ' : 'Llegó '}{hace(soli.creadoEn)}
        </span>
    );

    const estadoVisita = ({ soli, sinAsistencia }: Fila) => soli.visitaEstado && (sinAsistencia ? (
        <span className={`${PILDORA} ${TONO.peligro}`}>
            <TriangleAlert className="w-3.5 h-3.5" aria-hidden />Marcar asistencia
        </span>
    ) : (
        <span className={`${PILDORA} ${COLOR_VISITA[soli.visitaEstado]}`}>{ETIQUETA_VISITA[soli.visitaEstado]}</span>
    ));

    const estado = ({ soli, reserva }: Fila) => (
        <>
            <span className={`${PILDORA} ${soli.contactado ? TONO.exito : TONO.aviso}`}>
                {soli.contactado ? 'Contactado' : 'Pendiente'}
            </span>
            {reserva && (
                <span className={`${PILDORA} ${TONO.neutro}`}>
                    {ETIQUETA_RESERVA[reserva.estado as 'RESERVADA' | 'VENDIDA']}{reserva.lote && ` · ${reserva.lote}`}
                </span>
            )}
        </>
    );

    const accion = ({ soli }: Fila) => soli.contactado ? (
        <Link href={`/secretario/solicitudes/${soli.id}`} className={`${PANEL_SECUNDARIO} ${COMPACTO}`}>
            Abrir ficha<span className="sr-only"> de {soli.nombre} {soli.apellido}</span>
        </Link>
    ) : (
        <button type="button" onClick={() => handleMarcarContactado(soli.id)} className={`${PANEL_PRIMARIO} ${COMPACTO}`}
            aria-label={`Marcar como contactada la solicitud de ${soli.nombre} ${soli.apellido}`}>
            Marcar contactado
        </button>
    );

    const whatsapp = (soli: Solicitud) => enlaceWhatsApp({ ...soli, modelo: soli.modeloCasa?.nombreModelo, proyecto: soli.modeloCasa?.proyecto.nombre });

    const textoVacio = buscar ? `Ninguna solicitud de esta vista coincide con «${buscar}».`
        : filtro === 'todas' ? 'Todavía no hay solicitudes.' : filtro === 'pendientes' ? 'No hay solicitudes pendientes.' : 'No hay solicitudes en esta vista.';

    return (
        <main className={PANEL_PAGINA}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <h1 className="text-2xl font-bold">Solicitudes de contacto</h1>
                <Link href="/secretario/solicitudes/nueva" className={`${PANEL_PRIMARIO} ${NORMAL}`}>
                    Nueva solicitud
                </Link>
            </div>

            <label className="flex flex-col gap-1 w-full sm:max-w-sm mb-3 text-sm font-medium text-gray-800">
                Buscar solicitud
                <input type="search" value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={100}
                    placeholder="Nombre, correo o celular"
                    className={CAMPO_PANEL} />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar solicitudes">
                    {FILTROS.map(({ valor, etiqueta }) => (
                        <button
                            key={valor}
                            type="button"
                            aria-pressed={filtro === valor}
                            onClick={() => cambiarFiltro(valor)}
                            className={`inline-flex items-center max-md:min-h-11 text-sm px-3 py-1.5 rounded-full border ${filtro === valor ? 'bg-marca text-white border-marca' : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-50'}`}
                        >
                            {etiqueta}{valor === 'pendientes' && ` (${pendientes})`}
                        </button>
                    ))}
                </div>
                <button type="button" onClick={handleExportar} disabled={exportando}
                    className={`${PANEL_SECUNDARIO} ${COMPACTO}`}>
                    {exportando ? 'Exportando…' : 'Descargar CSV para Excel (todas)'}
                </button>
            </div>

            {error && <p role="alert" className="text-red-700 mb-4">{error}</p>}

            {cargando && filas.length === 0 && <CargandoLista filas={5} etiqueta="Cargando solicitudes" />}

            {!cargando && !error && filas.length === 0 && (
                <Vacio texto={textoVacio}>
                    {filtro === 'todas' && !buscar && (
                        <Link href="/secretario/solicitudes/nueva" className={`${PANEL_PRIMARIO} ${NORMAL}`}>Registrar la primera solicitud</Link>
                    )}
                </Vacio>
            )}

            {filas.length > 0 && (
                <div className={cargando ? 'opacity-60' : ''} aria-busy={cargando}>
                    {/* Celular: una tarjeta por solicitud con lo necesario para decidir y actuar. */}
                    <ul className="md:hidden flex flex-col gap-3">
                        {filas.map((fila) => {
                            const { soli } = fila;
                            return (
                                <li key={soli.id} className={`${SUPERFICIE} p-4 flex flex-col gap-3`}>
                                    <div className="min-w-0">
                                        <Link href={`/secretario/solicitudes/${soli.id}`} className="font-semibold text-marca underline underline-offset-2 hover:no-underline">
                                            {soli.nombre} {soli.apellido}
                                        </Link>
                                        <p className="text-sm text-gray-600">
                                            {soli.modeloCasa ? `${soli.modeloCasa.nombreModelo} · ${soli.modeloCasa.proyecto.nombre}` : 'Sin modelo'}
                                            {soli.origen !== 'WEB' && ` · ${ETIQUETA_ORIGEN[soli.origen]}`}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {estado(fila)}
                                        {estadoVisita(fila)}
                                        {llegada(fila)}
                                    </div>
                                    {soli.visitaPreferida && (
                                        <p className="text-sm text-gray-700">Visita: <span className="font-medium">{fechaVisitaCorta(soli.visitaPreferida, ahora)}</span></p>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                        {accion(fila)}
                                        <a href={whatsapp(soli)} target="_blank" rel="noreferrer" className={`${PANEL_EXITO} ${COMPACTO}`}>
                                            WhatsApp<span className="sr-only"> a {soli.nombre} {soli.apellido}</span>
                                        </a>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>

                    {/* Escritorio: la tabla completa. */}
                    <div className={`${SUPERFICIE} overflow-x-auto px-4 max-md:hidden`}>
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="text-left border-b text-sm text-gray-600">
                                    <th scope="col" className="py-2 pr-4">Fecha</th>
                                    <th scope="col" className="py-2 pr-4">Cliente</th>
                                    <th scope="col" className="py-2 pr-4">Modelo</th>
                                    <th scope="col" className="py-2 pr-4">Visita</th>
                                    <th scope="col" className="py-2 pr-4">Estado</th>
                                    <th scope="col" className="py-2 pr-4"><span className="sr-only">Acción</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filas.map((fila) => {
                                    const { soli } = fila;
                                    return (
                                        <tr key={soli.id} className="border-b last:border-b-0 text-sm align-top">
                                            <td className="py-3 pr-4 whitespace-nowrap">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-gray-600">{new Date(soli.creadoEn).toLocaleDateString('es-CL')}</span>
                                                    {llegada(fila)}
                                                </div>
                                            </td>
                                            <td className="py-3 pr-4">
                                                <Link href={`/secretario/solicitudes/${soli.id}`} className="font-medium text-marca underline underline-offset-2 hover:no-underline">
                                                    {soli.nombre} {soli.apellido}
                                                </Link>
                                                {soli.origen !== 'WEB' && <span className="text-xs text-gray-600"> · {ETIQUETA_ORIGEN[soli.origen]}</span>}
                                                <div className="flex flex-col gap-0.5 mt-1">
                                                    <a href={`mailto:${soli.correo}`} className="text-gray-700 underline break-all">{soli.correo}</a>
                                                    <a href={whatsapp(soli)} target="_blank" rel="noreferrer" className="text-green-700 underline">
                                                        WhatsApp {soli.celular}
                                                    </a>
                                                </div>
                                            </td>
                                            <td className="py-3 pr-4">
                                                {soli.modeloCasa ? <>{soli.modeloCasa.nombreModelo}<span className="block text-xs text-gray-600">{soli.modeloCasa.proyecto.nombre}</span></> : '-'}
                                            </td>
                                            <td className="py-3 pr-4 whitespace-nowrap">
                                                {soli.visitaPreferida && soli.visitaEstado ? (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-medium" title={formatearFechaHora(soli.visitaPreferida)}>{fechaVisitaCorta(soli.visitaPreferida, ahora)}</span>
                                                        {estadoVisita(fila)}
                                                    </div>
                                                ) : <span className="text-gray-500">—</span>}
                                            </td>
                                            <td className="py-3 pr-4">
                                                <div className="flex flex-col gap-1">{estado(fila)}</div>
                                            </td>
                                            <td className="py-3 pr-4">{accion(fila)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {total > POR_PAGINA && (
                <nav aria-label="Páginas de solicitudes" className="flex items-center justify-between gap-2 mt-4 text-sm">
                    <button type="button" onClick={() => setPagina((p) => p - 1)} disabled={pagina <= 1 || cargando}
                        className={`${PANEL_SECUNDARIO} ${COMPACTO}`}>
                        ← Anterior
                    </button>
                    <span className="text-gray-600 text-center">
                        {(pagina - 1) * POR_PAGINA + 1}–{Math.min(pagina * POR_PAGINA, total)} de {total}<span className="max-sm:hidden"> · página {pagina} de {paginas}</span>
                    </span>
                    <button type="button" onClick={() => setPagina((p) => p + 1)} disabled={pagina >= paginas || cargando}
                        className={`${PANEL_SECUNDARIO} ${COMPACTO}`}>
                        Siguiente →
                    </button>
                </nav>
            )}
        </main>
    );
}
