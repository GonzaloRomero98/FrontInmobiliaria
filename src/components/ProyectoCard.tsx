import { Proyecto } from "@/types/proyecto";
import Image from "next/image";
import Link from "next/link";

export interface ResumenPrecio {
    desde: string | null;
    equivalente: string | null;
    resumen: string;
}

export default function ProyectoCard({proyecto, precio}:{proyecto: Proyecto; precio?: ResumenPrecio}){
    return(
        <Link href={`/proyectos/${proyecto.id}`} className="block rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="relative w-full h-48">
                <Image
                    src={proyecto.imagenPortada ?? '/placeholder.jpg'}
                    alt={proyecto.nombre}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                />
            </div>
            <div className="p-4">
                <h3 className="font-semibold text-lg truncate">{proyecto.nombre}</h3>
                <p className="text-gray-500 text-sm">{proyecto.ciudad.nombre}, {proyecto.ciudad.region.nombre}</p>
                {precio?.desde && (
                    <p className="mt-2">
                        <span className="font-titulo text-xl font-bold text-acento">{precio.desde}</span>
                        {precio.equivalente && <span className="block text-sm text-gray-600">≈ {precio.equivalente}</span>}
                    </p>
                )}
                {precio?.resumen && <p className="text-sm text-gray-600 mt-1">{precio.resumen}</p>}
                {proyecto.descripcion && (
                    <p className="text-gray-600 text-sm mt-2 line-clamp-2">{proyecto.descripcion}</p>
                )}
            </div>
        </Link>
    )
}
