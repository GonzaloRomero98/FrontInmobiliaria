import Image from "next/image";
import Link from "next/link";
import ProyectoCard from "@/components/ProyectoCard";
import { MapaProyectos, PuntoProyecto, PuntoSala } from "@/components/mapas";
import { COLOR_NEUTRO, COLORES_PROYECTO, colorProyecto, htmlSimbolo, SIMBOLOS, TipoPunto } from "@/components/mapas/simbolos";
import { getProyectos } from "@/services/proyecto.service";
import { getModeloCasa } from "@/services/modeloCasa.service";
import { obtenerValorUF } from "@/lib/uf";
import { equivalencia, formatearUF, plural, precioDesdeUF } from "@/lib/formato";
import { ModeloCasa } from "@/types/modeloCasa";
import { Proyecto, urlComoLlegar } from "@/types/proyecto";

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
    return {
        tipo, resumen,
        desde: desde === null ? null : `Desde ${formatearUF(desde)}`,
        equivalente: desde === null ? null : equivalencia(desde, 'UF', valorUF),
    } as const;
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
    const salas: PuntoSala[] = proyectos
        .filter(tieneSala)
        .map((p) => ({
            idProyecto: p.id, proyecto: p.nombre, direccion: p.salaDireccion!, horario: p.salaHorario, telefono: p.salaTelefono,
            comoLlegar: urlComoLlegar(p), latitud: p.salaLatitud!, longitud: p.salaLongitud!, color: colorDe.get(p.id)!,
        }));
    const enMapa = new Set<TipoPunto>([...puntos.flatMap((p) => p.tipo ? [p.tipo] : []), ...(salas.length ? ['SALA' as const] : [])]);

    return (
        <main className="max-w-6xl mx-auto px-4 py-10 flex flex-col gap-12">
            <section className={`grid grid-cols-1 gap-8 items-center ${destacado ? 'lg:grid-cols-2' : ''}`}>
                <div className="flex flex-col gap-4">
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight max-w-2xl">
                        Encuentra tu nueva casa o departamento
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl">
                        Proyectos en venta y arriendo. Recórrelos en 3D, revisa el precio en UF y agenda tu visita
                        a la sala de ventas.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <Link href="/buscar?tipoOperacion=VENTA" className="bg-marca text-white rounded-lg px-5 py-3 font-medium">Comprar</Link>
                        <Link href="/buscar?tipoOperacion=ARRIENDO" className="border rounded-lg px-5 py-3 font-medium">Arrendar</Link>
                        <Link href="/buscar" className="px-5 py-3 font-medium text-acento underline">Ver todas las propiedades</Link>
                    </div>
                </div>

                {destacado && (
                    <Link href={`/proyectos/${destacado.id}`} className="group block">
                        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100">
                            <Image src={destacado.imagenPortada!} alt={destacado.nombre} fill priority
                                sizes="(min-width: 1024px) 576px, 100vw"
                                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02] motion-reduce:transition-none" />
                        </div>
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mt-3">
                            <p>
                                <span className="font-titulo text-lg font-semibold text-marca group-hover:underline">{destacado.nombre}</span>
                                <span className="text-gray-600"> · {destacado.ciudad.nombre}</span>
                            </p>
                            {resumenDe.get(destacado.id)?.desde && (
                                <p className="font-titulo text-lg font-bold text-acento">{resumenDe.get(destacado.id)!.desde}</p>
                            )}
                        </div>
                    </Link>
                )}
            </section>

            <section className="flex flex-col gap-4">
                <h2 className="text-2xl font-bold">Proyectos</h2>
                {proyectos.length === 0 && (
                    <p className="text-gray-600 border rounded-xl p-6 text-center">
                        Nuestro catálogo está en actualización. Vuelve pronto para conocer los nuevos proyectos.
                    </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {proyectos.map((proyecto) => (
                        <ProyectoCard key={proyecto.id} proyecto={proyecto} precio={resumenDe.get(proyecto.id)} />
                    ))}
                </div>
            </section>

            {puntos.length > 0 && (
                <section className="flex flex-col gap-4">
                    <h2 className="text-2xl font-bold">Dónde estamos</h2>
                    <MapaProyectos proyectos={puntos} salas={salas} />
                    <div className="flex flex-col gap-3 text-sm text-gray-700" aria-label="Leyenda del mapa">
                        <ul className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Proyectos">
                            {enMapaPorProyecto.slice(0, COLORES_PROYECTO.length).map((p) => (
                                <li key={p.id} className="flex items-center gap-2">
                                    <span aria-hidden="true" className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: colorDe.get(p.id)!.fondo }} />
                                    <Link href={`/proyectos/${p.id}`} className="font-medium hover:underline">{p.nombre}</Link>
                                </li>
                            ))}
                            {enMapaPorProyecto.length > COLORES_PROYECTO.length && (
                                <li className="flex items-center gap-2">
                                    <span aria-hidden="true" className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: COLOR_NEUTRO.fondo }} />
                                    Otros proyectos
                                </li>
                            )}
                        </ul>
                        {enMapa.size > 0 && (
                            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-gray-600" aria-label="Símbolos">
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
                </section>
            )}
        </main>
    );
}
