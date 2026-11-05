'use client'

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import SubidaGaleria from "@/components/SubidaGaleria";
import { agregarFotoModelo, eliminarFotoModelo, getModeloAdminById } from "@/services/modeloCasa.service";
import { obtenerUrlSubida, subirArchivo } from "@/services/s3.service";
import { ModeloCasa } from "@/types/modeloCasa";

export default function FotosModeloCasa(){
    const { id } = useParams<{ id: string }>();
    const [modelo, setModelo] = useState<ModeloCasa | null>(null);
    const [archivos, setArchivos] = useState<File[]>([]);
    const [subiendo, setSubiendo] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    // Cambiar la key vacía el selector de archivos tras subir
    const [versionSelector, setVersionSelector] = useState(0);

    const cargar = useCallback(()=>
        getModeloAdminById(id).then(setModelo).catch(()=> setError('No se pudo cargar el modelo')), [id]);

    useEffect(()=>{ cargar(); },[cargar]);

    async function subirFotos(){
        setError(null);
        try{
            for(const [i, archivo] of archivos.entries()){
                setSubiendo(`Subiendo ${i + 1} de ${archivos.length}...`);
                const {uploadUrl, publicUrl, contentType} = await obtenerUrlSubida(archivo, 'modelosImagenes');
                await subirArchivo(archivo, uploadUrl, contentType);
                await agregarFotoModelo(id, {urlImagen: publicUrl});
            }
            setArchivos([]);
            setVersionSelector((v) => v + 1);
        }catch{
            setError('No se pudieron subir todas las fotos');
        }finally{
            setSubiendo(null);
            cargar();
        }
    }

    async function eliminar(fotoId:string){
        if(!confirm('¿Eliminar esta foto de la galería?')) return;
        try{
            await eliminarFotoModelo(id, fotoId);
            setModelo((m) => m && {...m, fotos: m.fotos.filter((f) => f.id !== fotoId)});
        }catch{
            setError('No se pudo eliminar la foto');
        }
    }

    if (!modelo) return <main className="max-w-3xl mx-auto px-4 py-10">{error ?? 'Cargando...'}</main>;

    return(
        <main className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-6">
            <div>
                <Link href="/admin/modelosCasa" className="text-sm text-gray-500 hover:underline">← Modelos de casa</Link>
                <h1 className="text-2xl font-bold">Fotos de {modelo.nombreModelo}</h1>
            </div>

            {modelo.fotos.length === 0 ? (
                <p className="text-gray-500">Este modelo aún no tiene fotos en la galería.</p>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {modelo.fotos.map((foto) => (
                        <div key={foto.id} className="flex flex-col gap-1">
                            <img src={foto.urlImagen} alt={`Foto ${foto.orden + 1} de ${modelo.nombreModelo}`} className="w-full h-32 object-cover rounded-lg border" />
                            <button type="button" onClick={() => eliminar(foto.id)} className="text-sm text-red-600 hover:underline self-start">
                                Eliminar
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <section className="p-4 border rounded-xl flex flex-col gap-3">
                <h2 className="font-semibold">Agregar fotos</h2>
                <SubidaGaleria key={versionSelector} archivosSeleccionados={setArchivos} disabled={subiendo !== null} />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                    type="button"
                    onClick={subirFotos}
                    disabled={archivos.length === 0 || subiendo !== null}
                    className="bg-black text-white rounded-lg py-2 px-4 font-medium disabled:opacity-50 self-start"
                >
                    {subiendo ?? `Subir ${archivos.length || ''} foto${archivos.length === 1 ? '' : 's'}`}
                </button>
            </section>
        </main>
    )
}
