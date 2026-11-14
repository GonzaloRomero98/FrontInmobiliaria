import { ETIQUETA_ESTADO, imagenesModelo, ModeloCasa } from "@/types/modeloCasa";
import Image from "next/image";
import { Images } from "lucide-react";
import Link from "next/link";
import BotonComparar from "./BotonComparar";
import { equivalencia, formatearNumero, formatearPrecio, plural, textoQuedan } from "@/lib/formato";

export default function ModeloCasaCard({modelo, valorUF = null}:{modelo:ModeloCasa; valorUF?: number | null}){
    const cantidadFotos = imagenesModelo(modelo).length;
    const otraMoneda = equivalencia(Number(modelo.precio), modelo.moneda, valorUF);
    return(
        <div className="relative rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
            <BotonComparar idModelo={modelo.id} />
            <Link href={`/modelosCasa/${modelo.id}`} className="block">
                <div className="relative w-full h-48">
                    <Image src={modelo.imgPrincipal ?? modelo.proyecto.imagenPortada ?? '/placeholder.jpg'} alt={modelo.nombreModelo} fill className="object-cover"/>

                    <span className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded">{modelo.tipoOperacion === 'VENTA' ? 'Venta' : 'Arriendo'}</span>
                    {modelo.estado && modelo.estado !== 'DISPONIBLE' && (
                        <span className={`absolute bottom-3 left-3 text-white text-xs font-semibold px-2 py-1 rounded ${modelo.estado === 'VENDIDO' ? 'bg-gray-500' : 'bg-amber-700'}`}>
                            {ETIQUETA_ESTADO[modelo.estado]}
                        </span>
                    )}
                    {cantidadFotos > 1 && (
                        <span className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            <Images className="w-3.5 h-3.5" aria-hidden /> {cantidadFotos} fotos
                        </span>
                    )}
                </div>

                <div className="p-4">
                    <h3 className="font-semibold text-lg truncate">{modelo.nombreModelo}</h3>
                    <p className="text-gray-500 text-sm">{modelo.proyecto.nombre} · {modelo.proyecto.ciudad.nombre}</p>
                    <p className="font-titulo text-xl font-bold mt-2 text-acento">{formatearPrecio(modelo.precio, modelo.moneda)}</p>
                    {otraMoneda && <p className="text-sm text-gray-600">≈ {otraMoneda}</p>}
                    <div className="flex gap-3 text-sm text-gray-600 mt-1">
                        <span>{modelo.dormitorios} dorm.</span>
                        <span>{plural(modelo.banos, 'baño', 'baños')}</span>
                        <span>{formatearNumero(modelo.superficieConstruida)} m²</span>
                    </div>
                    {modelo.estado === 'DISPONIBLE' && modelo.unidades != null && <p className="text-sm text-gray-600 mt-1">{textoQuedan(modelo)}</p>}
                </div>
            </Link>
        </div>
    );
}
