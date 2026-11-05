'use client'

import { useEffect, useState } from "react";

const TamañoMaximo = 5*1024*1024;

interface ArchivoPreview{
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

    useEffect(()=>{
        return () =>{
            items.forEach((items)=> URL.revokeObjectURL(items.preview));
        };
    },[]);

    const manejoCambios = (e: React.ChangeEvent<HTMLInputElement>) =>{
        const archivos =  Array.from(e.target.files  ?? []);
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

            archivoValidos.push({archivo, preview: URL.createObjectURL(archivo)});
        }

        const nuevos = [...items, ...archivoValidos];
        setItems(nuevos);
        archivosSeleccionados(nuevos.map((u)=> u.archivo));
        e.target.value = '';
    };

    function quitarImagen(index:number){
        URL.revokeObjectURL(items[index].preview);
        const nuevos = items.filter((_,i)=> i !== index);
        setItems(nuevos);
        archivosSeleccionados(nuevos.map((i) => i.archivo));
    }

    return(
        <div className="flex flex-col gap-2">
            <input type="file" accept="image/jpeg, image/png, image/webp"  multiple onChange={manejoCambios} disabled={disabled} className="text-sm"/>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {items.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                    {items.map((item, i) => (
                        <div key={i} className="relative">
                            <img src={item.preview} alt="" className="w-full h-24 object-cover rounded-lg border" />
                            <button
                                type="button"
                                onClick={() => quitarImagen(i)}
                                disabled={disabled}
                                className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 text-xs leading-5"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}