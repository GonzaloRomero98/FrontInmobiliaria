import { ArrowRight, Building2, House, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { plural } from "@/lib/formato";
import { ETIQUETA_ETAPA, Proyecto } from "@/types/proyecto";
import { BOTON_TARJETA, ETIQUETA_FOTO, TARJETA } from "@/lib/estilos";

export interface ResumenPrecio {
    desde: string | null;
    equivalente: string | null;
    resumen: string;
    casas: number;
    deptos: number;
    con3d: boolean;
    ultimasUnidades: boolean;
}

export default function ProyectoCard({ proyecto, precio }: { proyecto: Proyecto; precio?: ResumenPrecio }) {
    const idTitulo = `proyecto-${proyecto.id}-titulo`;
    return (
        <Link href={`/proyectos/${proyecto.id}`} aria-labelledby={idTitulo} className={TARJETA}>
            <div className="relative w-full aspect-[16/10] bg-gray-100">
                {proyecto.imagenPortada ? (
                    <Image
                        src={proyecto.imagenPortada}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <Building2 className="w-10 h-10" aria-hidden="true" />
                    </div>
                )}
                {(proyecto.etapa || precio?.ultimasUnidades) && (
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                        {proyecto.etapa && (
                            <span className={`${ETIQUETA_FOTO} ${proyecto.etapa === 'ENTREGA_INMEDIATA' ? 'bg-acento text-white' : 'bg-white/95 text-marca'}`}>
                                {ETIQUETA_ETAPA[proyecto.etapa]}
                            </span>
                        )}
                        {precio?.ultimasUnidades && <span className={`${ETIQUETA_FOTO} bg-amber-400 text-amber-950`}>Últimas unidades</span>}
                    </div>
                )}
            </div>

            <div className="flex flex-col flex-1 gap-3 p-5">
                <div>
                    <h3 id={idTitulo} className="font-semibold text-lg leading-snug">{proyecto.nombre}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 shrink-0 text-acento" aria-hidden="true" />
                        {proyecto.ciudad.nombre}, {proyecto.ciudad.region.nombre}
                    </p>
                </div>

                {precio?.desde && (
                    <p>
                        <span className="font-titulo text-xl font-bold text-acento">{precio.desde}</span>
                        {precio.equivalente && <span className="block text-sm text-gray-600">≈ {precio.equivalente}</span>}
                    </p>
                )}

                {(precio?.casas || precio?.deptos) ? (
                    <ul className="flex flex-wrap gap-2 text-sm text-gray-700">
                        {precio.casas > 0 && (
                            <li className="inline-flex items-center gap-1.5 rounded-lg bg-acento-suave px-2.5 py-1">
                                <House className="w-4 h-4 text-acento" aria-hidden="true" />
                                {plural(precio.casas, 'modelo de casa', 'modelos de casa')}
                            </li>
                        )}
                        {precio.deptos > 0 && (
                            <li className="inline-flex items-center gap-1.5 rounded-lg bg-acento-suave px-2.5 py-1">
                                <Building2 className="w-4 h-4 text-acento" aria-hidden="true" />
                                {plural(precio.deptos, 'modelo de departamento', 'modelos de departamento')}
                            </li>
                        )}
                    </ul>
                ) : null}

                {proyecto.descripcion && <p className="text-gray-600 text-sm line-clamp-2">{proyecto.descripcion}</p>}

                <span className={BOTON_TARJETA}>
                    {precio?.con3d ? 'Ver proyecto y Tour 3D' : 'Ver proyecto'}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
                </span>
            </div>
        </Link>
    );
}
