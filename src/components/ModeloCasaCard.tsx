import { ETIQUETA_ESTADO, ModeloCasa } from "@/types/modeloCasa";
import Image from "next/image";
import Link from "next/link";
import BotonComparar from "./BotonComparar";
import { formatearNumero, formatearPrecio, plural } from "@/lib/formato";

export default function ModeloCasaCard({modelo}:{modelo:ModeloCasa}){
    return(
        <div className="relative rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
            <BotonComparar idModelo={modelo.id} />
            <Link href={`/modelosCasa/${modelo.id}`} className="block">
                <div className="relative w-full h-48">
                    <Image src={modelo.imgPrincipal ?? modelo.proyecto.imagenPortada ?? '/placeholder.jpg'} alt={modelo.nombreModelo} fill className="object-cover"/>

                    <span className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded">{modelo.tipoOperacion}</span>
                    {modelo.estado && modelo.estado !== 'DISPONIBLE' && (
                        <span className={`absolute bottom-3 left-3 text-white text-xs font-semibold px-2 py-1 rounded ${modelo.estado === 'VENDIDO' ? 'bg-red-600' : 'bg-amber-600'}`}>
                            {ETIQUETA_ESTADO[modelo.estado]}
                        </span>
                    )}
                </div>

                <div className="p-4">
                    <h2 className="font-semibold text-lg truncate">{modelo.nombreModelo}</h2>
                    <p className="text-gray-500 text-sm">{modelo.proyecto.nombre} · {modelo.proyecto.ciudad.nombre}</p>
                    <p className="text-xl font-bold mt-2">{formatearPrecio(modelo.precio, modelo.moneda)}</p>
                    <div className="flex gap-3 text-sm text-gray-600 mt-1">
                        <span>{modelo.dormitorios} dorm.</span>
                        <span>{plural(modelo.banos, 'baño', 'baños')}</span>
                        <span>{formatearNumero(modelo.superficieConstruida)} m²</span>
                    </div>
                </div>
            </Link>
        </div>
    );
}
