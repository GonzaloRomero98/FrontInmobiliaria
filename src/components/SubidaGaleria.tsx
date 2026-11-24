'use client'

import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import ZonaSubida, { MensajeError } from "./ZonaSubida";

const TamañoMaximo = 5*1024*1024;

// Contador en vez de crypto.randomUUID, que no existe en páginas servidas por http.
let siguienteId = 0;

interface ArchivoPreview{
    id: number;
    archivo: File;
    preview:string;
}

interface SubidaGaleriaProps{
    archivosSeleccionados:(archivos: File[]) => void;
    disabled?: boolean;
}

export default function SubidaGaleria
({ archivosSeleccionados, disabled = false }: SubidaGaleriaProps){
    const [items, setItems] = useState<ArchivoPreview[]>([]);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // El ref guarda los items vigentes: la limpieza de abajo solo corre al desmontar y vería la lista vacía inicial.
    const itemsRef = useRef(items);
    useEffect(()=>{ itemsRef.current = items; },[items]);

    useEffect(()=>{
        return () =>{
            itemsRef.current.forEach((item)=> URL.revokeObjectURL(item.preview));
        };
    },[]);

    // Sirve tanto para los archivos elegidos con el selector como para los soltados en la zona.
    const agregar = (archivos: File[]) =>{
        setError(null);

        const archivoValidos: ArchivoPreview[] = [];
        for(const archivo of archivos){
            if(!archivo.type.startsWith('image/')){
                setError(`"${archivo.name}" No es una imagen`);
                continue;
            }
            if(archivo.size > TamañoMaximo){
                setError(`"${archivo.name}" Este supera los 5mb`);
                continue;
            }

            archivoValidos.push({id: siguienteId++, archivo, preview: URL.createObjectURL(archivo)});
        }

        const nuevos = [...items, ...archivoValidos];
        setItems(nuevos);
        archivosSeleccionados(nuevos.map((u)=> u.archivo));
    };

    function quitarImagen(index:number){
        URL.revokeObjectURL(items[index].preview);
        const nuevos = items.filter((_,i)=> i !== index);
        setItems(nuevos);
        archivosSeleccionados(nuevos.map((i) => i.archivo));
    }

    return(
        <div className="flex flex-col gap-3">
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg, image/png, image/webp"
                multiple
                onChange={(e) => {
                    const archivos = Array.from(e.target.files ?? []);
                    // Se limpia para que volver a elegir el mismo archivo dispare onChange.
                    e.target.value = '';
                    agregar(archivos);
                }}
                disabled={disabled}
                className="hidden"
            />
            <ZonaSubida
                icono={ImagePlus}
                queSubir="tus fotos"
                ayuda="JPG, PNG o WEBP · hasta 5 MB cada una"
                error={!!error}
                deshabilitado={disabled}
                onElegir={() => inputRef.current?.click()}
                onSoltarVarios={agregar}
            />
            {error && <MensajeError>{error}</MensajeError>}
            {items.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                    {items.map((item, i) => (
                        <div key={item.id} className="relative">
                            <img src={item.preview} alt="" className="w-full h-24 object-cover rounded-lg border" />
                            <button
                                type="button"
                                onClick={() => quitarImagen(i)}
                                disabled={disabled}
                                aria-label={`Quitar imagen ${i + 1}`}
                                className="absolute top-1 right-1 size-8 flex items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors motion-reduce:transition-none disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <X className="size-4" aria-hidden />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
