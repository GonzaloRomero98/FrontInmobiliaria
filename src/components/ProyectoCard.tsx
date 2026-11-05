import { Proyecto } from "@/types/proyecto";
import Image from "next/image";
import Link from "next/link";

export default function ProyectoCard({proyecto}:{proyecto: Proyecto}){
    return(
        <Link href={`/proyectos/${proyecto.id}`} className="block rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="relative w-full h-48">
                <Image
                    src={proyecto.imagenPortada ?? '/placeholder.jpg'}
                    alt={proyecto.nombre}
                    fill
                    className="object-cover"
                />
            </div>
            <div className="p-4">
                <h2 className="font-semibold text-lg truncate">{proyecto.nombre}</h2>
                <p className="text-gray-500 text-sm">{proyecto.ciudad.nombre}, {proyecto.ciudad.region.nombre}</p>
                {proyecto.descripcion && (
                    <p className="text-gray-600 text-sm mt-2 line-clamp-2">{proyecto.descripcion}</p>
                )}
            </div>
        </Link>
    )
}