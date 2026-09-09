import Link from "next/link";
import Image from "next/image";
import { Propiedad } from "@/types/propiedad";

function formatearPrecio(precio:number):string{
    return new Intl.NumberFormat('es-CL',{
        style:'currency',
        currency:'CLP',
        maximumFractionDigits:0,
    }).format(precio);
}

export default function PropiedadCard({propiedad}: {propiedad: Propiedad}){
    return (
    <Link
      href={`/propiedad/${propiedad.id}`}
      className="block rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
    >
      <div className="relative w-full h-48">
        <Image
          src={propiedad.portadaimgUrl}
          alt={propiedad.titulo}
          fill
          className="object-cover"
        />
        <span className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {propiedad.estadoPropiedad}
        </span>
      </div>

      <div className="p-4">
        <h2 className="font-semibold text-lg truncate">{propiedad.titulo}</h2>
        <p className="text-gray-500 text-sm">
          {propiedad.comuna}, {propiedad.ciudad}
        </p>
        <p className="text-xl font-bold mt-2">{formatearPrecio(propiedad.precio)}</p>

        <div className="flex gap-4 mt-3 text-sm text-gray-600">
          <span>🛏️ {propiedad.dormitorios} dorm.</span>
          <span>🛁 {propiedad.banos} baños</span>
          {propiedad.totalMetrosCuadrados && (
            <span>📐 {propiedad.totalMetrosCuadrados} m²</span>
          )}
        </div>
      </div>
    </Link>
  );
}