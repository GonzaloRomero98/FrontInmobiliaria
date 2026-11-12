import Link from "next/link";
import ProyectoCard from "@/components/ProyectoCard";
import { MapaProyectos, PuntoProyecto, PuntoSala } from "@/components/mapas";
import { COLOR_NEUTRO, COLORES_PROYECTO, colorProyecto, htmlSimbolo, SIMBOLOS, TipoPunto } from "@/components/mapas/simbolos";
import { getProyectos } from "@/services/proyecto.service";
import { getModeloCasa } from "@/services/modeloCasa.service";
import { obtenerValorUF } from "@/lib/uf";
import { formatearUF, plural, precioDesdeUF } from "@/lib/formato";
import { ModeloCasa } from "@/types/modeloCasa";
import { Proyecto, urlComoLlegar } from "@/types/proyecto";

// Qué vende cada proyecto, según sus modelos publicados
function resumenProyecto(modelos: ModeloCasa[], valorUF: number | null) {
    const casas = modelos.filter((m) => m.tipoVivienda !== 'DEPARTAMENTO').length;
    const deptos = modelos.length - casas;
    const tipo = casas && deptos ? 'MIXTO' : casas ? 'CASA' : deptos ? 'DEPARTAMENTO' : null;
    const resumen = [
        casas ? plural(casas, 'modelo de casa', 'modelos de casa') : '',
        deptos ? plural(deptos, 'modelo de departamento', 'modelos de departamento') : '',
    ].filter(Boolean).join(' · ');
    const desde = precioDesdeUF(modelos, valorUF);
    return { tipo, resumen, desde: desde === null ? null : `Desde ${formatearUF(desde)}` } as const;
}

export const revalidate = 60;

export default async function Home() {
    // Si los modelos o la UF fallan, el mapa se muestra igual, solo sin el resumen
    const [proyectos, modelos, uf] = await Promise.all([getProyectos(), getModeloCasa().catch(() => []), obtenerValorUF()]);
    const tieneUbicacion = (p: Proyecto) => p.latitud !== null && p.longitud !== null;
    const tieneSala = (p: Proyecto) => !!p.salaDireccion && p.salaLatitud !== null && p.salaLongitud !== null;
    // Un color por proyecto, en orden de creación: uno nuevo no le cambia el color a los que ya estaban
    const enMapaPorProyecto = proyectos.filter((p) => tieneUbicacion(p) || tieneSala(p))
        .sort((a, b) => a.creadoEn.localeCompare(b.creadoEn));
    const colorDe = new Map(enMapaPorProyecto.map((p, i) => [p.id, colorProyecto(i)]));
    const puntos: PuntoProyecto[] = proyectos
        .filter(tieneUbicacion)
        .map((p) => ({
            id: p.id, nombre: p.nombre, comuna: p.ciudad.nombre, latitud: p.latitud!, longitud: p.longitud!, color: colorDe.get(p.id)!,
            ...resumenProyecto(modelos.filter((m) => m.proyecto.id === p.id), uf?.valor ?? null),
        }));
    const salas: PuntoSala[] = proyectos
        .filter(tieneSala)
        .map((p) => ({
            idProyecto: p.id, proyecto: p.nombre, direccion: p.salaDireccion!, horario: p.salaHorario, telefono: p.salaTelefono,
            comoLlegar: urlComoLlegar(p), latitud: p.salaLatitud!, longitud: p.salaLongitud!, color: colorDe.get(p.id)!,
        }));
    // La leyenda muestra solo los símbolos que aparecen en el mapa
    const enMapa = new Set<TipoPunto>([...puntos.flatMap((p) => p.tipo ? [p.tipo] : []), ...(salas.length ? ['SALA' as const] : [])]);

    return (
        <main className="max-w-6xl mx-auto px-4 py-10 flex flex-col gap-12">
            <section className="flex flex-col gap-4">
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
            </section>

            {puntos.length > 0 && (
                <section className="flex flex-col gap-4">
                    <h2 className="text-2xl font-bold">Dónde estamos</h2>
                    <MapaProyectos proyectos={puntos} salas={salas} />
                    <div className="flex flex-col gap-3 text-sm text-gray-700" aria-label="Leyenda del mapa">
                        {/* Color de cada proyecto (su sala de ventas usa el mismo) */}
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
                        {/* Qué es cada símbolo: letra y forma, en gris para no confundirse con un proyecto */}
                        {enMapa.size > 0 && (
                            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-gray-600" aria-label="Símbolos">
                                {(Object.keys(SIMBOLOS) as TipoPunto[]).filter((t) => enMapa.has(t)).map((t) => (
                                    <li key={t} className="flex items-center gap-2">
                                        {/* Mismo HTML que el pin del mapa; contenido fijo, sin datos del usuario */}
                                        <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: htmlSimbolo(t, 18) }} />
                                        {SIMBOLOS[t].etiqueta}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>
            )}

            <section className="flex flex-col gap-4">
                <h2 className="text-2xl font-bold">Proyectos</h2>
                {proyectos.length === 0 && (
                    <p className="text-gray-600 border rounded-xl p-6 text-center">
                        Nuestro catálogo está en actualización. Vuelve pronto para conocer los nuevos proyectos.
                    </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {proyectos.map((proyecto) => (
                        <ProyectoCard key={proyecto.id} proyecto={proyecto} />
                    ))}
                </div>
            </section>
        </main>
    );
}
