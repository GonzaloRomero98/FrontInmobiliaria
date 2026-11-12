'use client';

import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Visor3D from "./Visor3D";

interface GaleriaModeloProps {
    idModelo: string;
    titulo: string;
    modelo3dUrl: string | null;
    imagenes: string[];
}

// Recorrido 3D y fotos van en pestañas separadas: dentro de un carrusel, arrastrar para girar
// el modelo chocaría con deslizar para cambiar de foto.
export default function GaleriaModelo({ idModelo, titulo, modelo3dUrl, imagenes }: GaleriaModeloProps) {
    const [vista, setVista] = useState<'3d' | 'fotos'>(modelo3dUrl ? '3d' : 'fotos');
    const [actual, setActual] = useState(0);
    const pista = useRef<HTMLDivElement>(null);
    const total = imagenes.length;

    if (!modelo3dUrl && total === 0) return null;

    function ir(i: number) {
        const el = pista.current;
        if (!el) return;
        const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        el.scrollTo({ left: Math.max(0, Math.min(total - 1, i)) * el.clientWidth, behavior: suave ? 'smooth' : 'auto' });
    }

    // La foto actual sale del scroll, así cubre flechas, miniaturas, teclado y deslizar con el dedo
    function alDesplazar() {
        const el = pista.current;
        if (el) setActual(Math.round(el.scrollLeft / el.clientWidth));
    }

    const pestana = (valor: '3d' | 'fotos', texto: string) => (
        <button type="button" onClick={() => setVista(valor)} aria-pressed={vista === valor}
            className={`text-sm font-medium px-4 py-2 rounded-lg border ${vista === valor ? 'bg-marca text-white border-marca' : 'hover:bg-gray-50'}`}>
            {texto}
        </button>
    );
    const flecha = 'absolute top-1/2 -translate-y-1/2 bg-white/90 text-marca rounded-full p-2 shadow hover:bg-white';

    return (
        <div className="flex flex-col gap-3">
            {modelo3dUrl && total > 0 && (
                <div className="flex gap-2">
                    {pestana('3d', 'Recorrido 3D')}
                    {pestana('fotos', `Fotos (${total})`)}
                </div>
            )}

            {vista === '3d' && modelo3dUrl ? (
                <Visor3D idModelo={idModelo} modeloUrl={modelo3dUrl} titulo={titulo} />
            ) : (
                <>
                    <div className="relative">
                        <div ref={pista} onScroll={alDesplazar} tabIndex={0}
                            role="region" aria-roledescription="carrusel" aria-label={`Fotos de ${titulo}`}
                            onKeyDown={(e) => {
                                if (e.key === 'ArrowRight') { e.preventDefault(); ir(actual + 1); }
                                if (e.key === 'ArrowLeft') { e.preventDefault(); ir(actual - 1); }
                            }}
                            className="flex overflow-x-auto snap-x snap-mandatory rounded-xl bg-gray-100 [scrollbar-width:none]">
                            {imagenes.map((url, i) => (
                                <div key={url} className="relative w-full h-[500px] shrink-0 snap-center">
                                    <Image src={url} alt={`${titulo}, foto ${i + 1} de ${total}`} fill priority={i === 0}
                                        sizes="(min-width: 1024px) 66vw, 100vw" className="object-cover" />
                                </div>
                            ))}
                        </div>
                        {total > 1 && (
                            <>
                                {actual > 0 && (
                                    <button type="button" onClick={() => ir(actual - 1)} aria-label="Foto anterior" className={`${flecha} left-3`}>
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                )}
                                {actual < total - 1 && (
                                    <button type="button" onClick={() => ir(actual + 1)} aria-label="Foto siguiente" className={`${flecha} right-3`}>
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                )}
                                <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded" aria-live="polite">
                                    {actual + 1} / {total}
                                </span>
                            </>
                        )}
                    </div>

                    {total > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {imagenes.map((url, i) => (
                                <button key={url} type="button" onClick={() => ir(i)} aria-label={`Ver foto ${i + 1}`} aria-current={i === actual}
                                    className={`relative w-24 h-16 shrink-0 rounded-lg overflow-hidden border-2 ${i === actual ? 'border-acento' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                                    <Image src={url} alt="" fill sizes="96px" className="object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
