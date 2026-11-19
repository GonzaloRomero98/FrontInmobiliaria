import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Receipt, Rotate3d, Store, type LucideIcon } from "lucide-react";
import BuscadorInicio from "@/components/BuscadorInicio";
import GrillaProyectos from "@/components/GrillaProyectos";
import { ResumenPrecio } from "@/components/ProyectoCard";
import { MapaProyectos, PuntoProyecto, PuntoSala } from "@/components/mapas";
import { colorProyecto, htmlSimbolo, SIMBOLOS, TipoPunto } from "@/components/mapas/simbolos";
import { getProyectos } from "@/services/proyecto.service";
import { getModeloCasa } from "@/services/modeloCasa.service";
import { obtenerValorUF } from "@/lib/uf";
import { BOTON_PRIMARIO } from "@/lib/estilos";
import { equivalencia, formatearUF, plural, precioDesdeUF } from "@/lib/formato";
import { ModeloCasa } from "@/types/modeloCasa";
import { Proyecto, urlComoLlegar } from "@/types/proyecto";
import { Ciudad } from "@/types/ubicacion";

// Con esta cantidad de unidades disponibles o menos, la tarjeta muestra "Últimas unidades".
const LIMITE_ULTIMAS_UNIDADES = 5;

// Resume lo que vende cada proyecto según sus modelos publicados.
function resumenProyecto(modelos: ModeloCasa[], valorUF: number | null) {
    const casas = modelos.filter((m) => m.tipoVivienda !== 'DEPARTAMENTO').length;
    const deptos = modelos.length - casas;
    const tipo = casas && deptos ? 'MIXTO' : casas ? 'CASA' : deptos ? 'DEPARTAMENTO' : null;
    const resumen = [
        casas ? plural(casas, 'modelo de casa', 'modelos de casa') : '',
        deptos ? plural(deptos, 'modelo de departamento', 'modelos de departamento') : '',
    ].filter(Boolean).join(' · ');
    const desde = precioDesdeUF(modelos, valorUF);
    const disponibles = modelos.reduce((total, m) => total + Math.max(0, m.unidades - m.unidadesReservadas - m.unidadesVendidas), 0);
    return {
        tipo, resumen, casas, deptos,
        desde: desde === null ? null : `Desde ${formatearUF(desde)}`,
        equivalente: desde === null ? null : equivalencia(desde, 'UF', valorUF),
        con3d: modelos.some((m) => m.modelo3dUrl),
        ultimasUnidades: disponibles > 0 && disponibles <= LIMITE_ULTIMAS_UNIDADES,
    } satisfies ResumenPrecio & { tipo: PuntoProyecto['tipo'] };
}

const BENEFICIOS: { icono: LucideIcon; titulo: string; texto: string }[] = [
    {
        icono: Rotate3d,
        titulo: 'Recorrido virtual 360°',
        texto: 'Recorre cada modelo en 3D desde tu casa y míralo en realidad aumentada antes de visitarlo.',
    },
    {
        icono: Receipt,
        titulo: 'Precios claros en UF y asesoría',
        texto: 'Cada modelo muestra su valor en UF y su equivalente en pesos al día. Simula tu dividendo y pide una cotización.',
    },
    {
        icono: Store,
        titulo: 'Salas de venta en terreno',
        texto: 'Agenda tu visita a la sala de ventas del proyecto. Te mostramos la dirección, el horario y cómo llegar.',
    },
];

function TituloSeccion({ antetitulo, titulo, children }: { antetitulo: string; titulo: string; children?: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-2 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-acento">{antetitulo}</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">{titulo}</h2>
            {children && <p className="text-gray-600 text-lg">{children}</p>}
        </div>
    );
}

export const revalidate = 60;

export default async function Home() {
    // Si los modelos o la UF fallan, el mapa se muestra igual pero sin el resumen.
    const [proyectos, modelos, uf] = await Promise.all([getProyectos(), getModeloCasa().catch(() => []), obtenerValorUF()]);
    const tieneUbicacion = (p: Proyecto) => p.latitud !== null && p.longitud !== null;
    const tieneSala = (p: Proyecto) => !!p.salaDireccion && p.salaLatitud !== null && p.salaLongitud !== null;
    // Los colores se asignan por orden de creación, así un proyecto nuevo no le cambia el color a los anteriores.
    const enMapaPorProyecto = proyectos.filter((p) => tieneUbicacion(p) || tieneSala(p))
        .sort((a, b) => a.creadoEn.localeCompare(b.creadoEn));
    const colorDe = new Map(enMapaPorProyecto.map((p, i) => [p.id, colorProyecto(i)]));
    const resumenDe = new Map(proyectos.map((p) => [p.id, resumenProyecto(modelos.filter((m) => m.proyecto.id === p.id), uf?.valor ?? null)]));
    const puntos: PuntoProyecto[] = proyectos
        .filter(tieneUbicacion)
        .map((p) => {
            const { tipo, resumen, desde } = resumenDe.get(p.id)!;
            return { id: p.id, nombre: p.nombre, comuna: p.ciudad.nombre, latitud: p.latitud!, longitud: p.longitud!, color: colorDe.get(p.id)!, tipo, resumen, desde };
        });
    // El destacado es el proyecto publicado más reciente que tenga foto de portada.
    const destacado = proyectos.filter((p) => p.imagenPortada).sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))[0];
    const resumenDestacado = destacado && resumenDe.get(destacado.id);
    const salas: PuntoSala[] = proyectos
        .filter(tieneSala)
        .map((p) => ({
            idProyecto: p.id, proyecto: p.nombre, direccion: p.salaDireccion!, horario: p.salaHorario, telefono: p.salaTelefono,
            comoLlegar: urlComoLlegar(p), latitud: p.salaLatitud!, longitud: p.salaLongitud!, color: colorDe.get(p.id)!,
        }));
    const enMapa = new Set<TipoPunto>([...puntos.flatMap((p) => p.tipo ? [p.tipo] : []), ...(salas.length ? ['SALA' as const] : [])]);
    const comunas: Ciudad[] = [...new Map(proyectos.map((p) => [p.ciudad.id, p.ciudad])).values()]
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

    return (
        <main className="flex flex-col gap-20 sm:gap-24">
            <section className="bg-gradient-to-b from-acento-suave to-white">
                <div className="max-w-6xl mx-auto px-4 pt-12 sm:pt-16 flex flex-col gap-10 lg:gap-12">
                    <div className={`grid grid-cols-1 gap-10 lg:gap-12 items-center ${destacado ? 'lg:grid-cols-[1.1fr_1fr]' : ''}`}>
                        <div className="flex flex-col gap-6 min-w-0">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
                                Encuentra tu nueva casa o departamento
                            </h1>
                            <p className="text-lg text-gray-600 max-w-xl">
                                Recorre cada proyecto en 3D, revisa precios transparentes en UF y agenda tu visita
                                a la sala de ventas cuando te acomode.
                            </p>
                        </div>
    
                        {destacado && (
                            <Link href={`/proyectos/${destacado.id}`}
                                className="group block rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-xl shadow-gray-900/10">
                                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                                    <Image src={destacado.imagenPortada!} alt={destacado.nombre} fill priority
                                        sizes="(min-width: 1024px) 520px, 100vw"
                                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none" />
                                    <span className="absolute top-4 left-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-marca shadow-sm">
                                        Proyecto destacado
                                    </span>
                                    <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-marca/85 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                                        <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                                        {destacado.ciudad.nombre}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 p-5">
                                    <div className="min-w-0">
                                        <p className="font-titulo text-xl font-bold text-marca group-hover:underline">{destacado.nombre}</p>
                                        {resumenDestacado?.resumen && <p className="text-sm text-gray-600">{resumenDestacado.resumen}</p>}
                                    </div>
                                    {resumenDestacado?.desde && (
                                        <p className="font-titulo text-2xl font-bold text-acento">{resumenDestacado.desde}</p>
                                    )}
                                </div>
                            </Link>
                        )}
                    </div>
                    <BuscadorInicio comunas={comunas} />
                </div>
            </section>

            <section id="proyectos" className="max-w-6xl w-full mx-auto px-4 flex flex-col gap-8 scroll-mt-6">
                <TituloSeccion antetitulo="Proyectos" titulo="Proyectos destacados">
                    Casas y departamentos con recorrido 3D, precios en UF y sala de ventas para visitar.
                </TituloSeccion>
                {proyectos.length === 0 ? (
                    <p className="text-gray-600 border rounded-2xl bg-white p-8 text-center">
                        Nuestro catálogo está en actualización. Vuelve pronto para conocer los nuevos proyectos.
                    </p>
                ) : (
                    <GrillaProyectos proyectos={proyectos.map((proyecto) => ({ proyecto, precio: resumenDe.get(proyecto.id) }))} />
                )}
            </section>

            <section id="beneficios" className="bg-gray-50 border-y py-20">
                <div className="max-w-6xl mx-auto px-4 flex flex-col gap-10">
                    <TituloSeccion antetitulo="Experiencia" titulo="Tu próxima inversión respaldada por transparencia y tecnología" />
                    <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {BENEFICIOS.map(({ icono: Icono, titulo, texto }) => (
                            <li key={titulo} className="flex flex-col gap-4 rounded-2xl bg-white border border-gray-200 p-6 shadow-sm">
                                <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-acento-suave text-acento">
                                    <Icono className="w-6 h-6" aria-hidden="true" />
                                </span>
                                <h3 className="text-lg font-semibold">{titulo}</h3>
                                <p className="text-gray-600">{texto}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {puntos.length + salas.length > 0 && (
                <section id="ubicacion" className="max-w-6xl w-full mx-auto px-4 flex flex-col gap-8 scroll-mt-6">
                    <TituloSeccion antetitulo="Ubicación" titulo="Dónde estamos">
                        Revisa dónde está cada proyecto y su sala de ventas.
                    </TituloSeccion>
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6 items-start">
                        <ul className="order-2 lg:order-1 flex flex-col gap-3 lg:max-h-[420px] lg:overflow-y-auto lg:pr-1" aria-label="Proyectos en el mapa">
                            {enMapaPorProyecto.map((p) => {
                                const resumen = resumenDe.get(p.id);
                                return (
                                    <li key={p.id}>
                                        <Link href={`/proyectos/${p.id}`}
                                            className="group flex gap-3 rounded-2xl bg-white border border-gray-200 p-4 shadow-sm hover:shadow-md hover:border-acento/40 transition">
                                            <span aria-hidden="true" className="mt-1.5 w-3.5 h-3.5 rounded-full shrink-0" style={{ background: colorDe.get(p.id)!.fondo }} />
                                            <span className="flex flex-col gap-0.5 min-w-0 flex-1">
                                                <span className="font-titulo font-semibold text-marca">{p.nombre}</span>
                                                <span className="text-sm text-gray-600">
                                                    {p.ciudad.nombre}{p.salaDireccion && ` · Sala: ${p.salaDireccion}`}
                                                </span>
                                                {resumen?.desde && <span className="text-sm font-semibold text-acento">{resumen.desde}</span>}
                                            </span>
                                            <ArrowRight className="w-4 h-4 mt-1 shrink-0 text-gray-400 group-hover:text-acento transition-colors" aria-hidden="true" />
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                        <div className="order-1 lg:order-2 flex flex-col gap-3">
                            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                                <MapaProyectos proyectos={puntos} salas={salas} />
                            </div>
                            {enMapa.size > 0 && (
                                <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600" aria-label="Símbolos del mapa">
                                    {(Object.keys(SIMBOLOS) as TipoPunto[]).filter((t) => enMapa.has(t)).map((t) => (
                                        <li key={t} className="flex items-center gap-2">
                                            {/* Es el mismo HTML del pin del mapa. El contenido es fijo y no viene del usuario. */}
                                            <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: htmlSimbolo(t, 18) }} />
                                            {SIMBOLOS[t].etiqueta}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </section>
            )}

            <section className="max-w-6xl w-full mx-auto px-4">
                <div className="relative overflow-hidden rounded-3xl bg-marca px-6 py-12 sm:px-12 sm:py-14 shadow-xl shadow-gray-900/20">
                    <div aria-hidden="true" className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-acento/40 blur-3xl" />
                    <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="flex flex-col gap-3 max-w-xl">
                            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white text-balance">
                                ¿Listo para dar el siguiente paso hacia tu nuevo hogar?
                            </h2>
                            <p className="text-lg text-gray-300">
                                Elige un proyecto, recórrelo en 3D y agenda tu visita a la sala de ventas.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                            <Link href="#proyectos"
                                className={`${BOTON_PRIMARIO} min-h-12 px-6`}>
                                Agendar visita ahora
                            </Link>
                            <Link href="/buscar"
                                className="inline-flex items-center justify-center min-h-12 px-6 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10 transition-colors">
                                Explorar proyectos
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
