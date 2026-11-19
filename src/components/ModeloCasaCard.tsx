import { ETIQUETA_ESTADO, imagenesModelo, ModeloCasa } from "@/types/modeloCasa";
import Image from "next/image";
import { ArrowRight, House, Images } from "lucide-react";
import Link from "next/link";
import BotonComparar from "./BotonComparar";
import { equivalencia, formatearNumero, formatearPrecio, plural, textoQuedan } from "@/lib/formato";
import { BOTON_TARJETA, ETIQUETA_FOTO, TARJETA } from "@/lib/estilos";

export default function ModeloCasaCard({modelo, valorUF = null}:{modelo:ModeloCasa; valorUF?: number | null}){
    const cantidadFotos = imagenesModelo(modelo).length;
    const otraMoneda = equivalencia(Number(modelo.precio), modelo.moneda, valorUF);
    const foto = modelo.imgPrincipal ?? modelo.proyecto.imagenPortada;
    const idTitulo = `modelo-${modelo.id}-titulo`;
    return(
        // El anillo de foco va en la tarjeta: con overflow-hidden, el contorno del enlace quedaría recortado.
        <div className={`relative ${TARJETA} has-[>a:focus-visible]:ring-2 has-[>a:focus-visible]:ring-acento has-[>a:focus-visible]:ring-offset-2`}>
            <BotonComparar idModelo={modelo.id} />
            <Link href={`/modelosCasa/${modelo.id}`} aria-labelledby={idTitulo} className="flex flex-col flex-1 focus-visible:outline-none">
                <div className="relative w-full aspect-[16/10] bg-gray-100">
                    {foto ? (
                        <Image src={foto} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover"/>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                            <House className="w-10 h-10" aria-hidden="true" />
                        </div>
                    )}

                    <span className={`absolute top-3 left-3 ${ETIQUETA_FOTO} bg-white/95 text-marca`}>{modelo.tipoOperacion === 'VENTA' ? 'Venta' : 'Arriendo'}</span>
                    {modelo.estado && modelo.estado !== 'DISPONIBLE' && (
                        <span className={`absolute bottom-3 left-3 ${ETIQUETA_FOTO} ${modelo.estado === 'VENDIDO' ? 'bg-gray-700 text-white' : 'bg-amber-400 text-amber-950'}`}>
                            {ETIQUETA_ESTADO[modelo.estado]}
                        </span>
                    )}
                    {cantidadFotos > 1 && (
                        <span className={`absolute bottom-3 right-3 ${ETIQUETA_FOTO} bg-white/95 text-marca`}>
                            <Images className="w-3.5 h-3.5" aria-hidden="true" /> {cantidadFotos} fotos
                        </span>
                    )}
                </div>

                <div className="flex flex-col flex-1 gap-3 p-5">
                    <div>
                        <h3 id={idTitulo} className="font-semibold text-lg leading-snug line-clamp-2">{modelo.nombreModelo}</h3>
                        <p className="mt-1 text-sm text-gray-600">{modelo.proyecto.nombre} · {modelo.proyecto.ciudad.nombre}</p>
                    </div>

                    <p>
                        <span className="font-titulo text-xl font-bold text-acento">{formatearPrecio(modelo.precio, modelo.moneda)}</span>
                        {otraMoneda && <span className="block text-sm text-gray-600">≈ {otraMoneda}</span>}
                    </p>

                    <div>
                        <p className="flex flex-wrap gap-x-3 text-sm text-gray-700">
                            <span>{modelo.dormitorios} dorm.</span>
                            <span>{plural(modelo.banos, 'baño', 'baños')}</span>
                            <span>{formatearNumero(modelo.superficieConstruida)} m²</span>
                        </p>
                        {modelo.estado === 'DISPONIBLE' && <p className="text-sm text-gray-600 mt-1">{textoQuedan(modelo)}</p>}
                    </div>

                    <span className={BOTON_TARJETA}>
                        Ver modelo
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
                    </span>
                </div>
            </Link>
        </div>
    );
}
