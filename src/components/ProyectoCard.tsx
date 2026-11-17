import { ArrowRight, Building2, House, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { plural } from "@/lib/formato";
import { ETIQUETA_ETAPA, Proyecto } from "@/types/proyecto";

export interface ResumenPrecio {
    desde: string | null;
    equivalente: string | null;
    resumen: string;
    casas: number;
    deptos: number;
    con3d: boolean;
    ultimasUnidades: boolean;
}

const ETIQUETA = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shadow-sm";

export default function ProyectoCard({ proyecto, precio }: { proyecto: Proyecto; precio?: ResumenPrecio }) {
    return (
        <Link href={`/proyectos/${proyecto.id}`}
            className="group flex flex-col h-full rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition motion-reduce:transition-none motion-reduce:hover:translate-y-0">
            <div className="relative w-full aspect-[16/10] bg-gray-100">
                <Image
                    src={proyecto.imagenPortada ?? '/placeholder.jpg'}
                    alt={proyecto.nombre}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                />
                {(proyecto.etapa || precio?.ultimasUnidades) && (
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                        {proyecto.etapa && (
                            <span className={`${ETIQUETA} ${proyecto.etapa === 'ENTREGA_INMEDIATA' ? 'bg-acento text-white' : 'bg-white/95 text-marca'}`}>
                                {ETIQUETA_ETAPA[proyecto.etapa]}
                            </span>
                        )}
                        {precio?.ultimasUnidades && <span className={`${ETIQUETA} bg-amber-400 text-amber-950`}>Últimas unidades</span>}
                    </div>
                )}
            </div>

            <div className="flex flex-col flex-1 gap-3 p-5">
                <div>
                    <h3 className="font-semibold text-lg leading-snug">{proyecto.nombre}</h3>
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

                <span className="mt-auto flex items-center justify-center gap-2 min-h-11 rounded-xl bg-marca text-white text-sm font-semibold group-hover:bg-acento transition-colors">
                    {precio?.con3d ? 'Ver proyecto y Tour 3D' : 'Ver proyecto'}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
                </span>
            </div>
        </Link>
    );
}
