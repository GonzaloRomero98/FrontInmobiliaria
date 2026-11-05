'use client';

import { useEffect, useState } from "react";

const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024; // 5MB

interface SubidaImagenProps {
    archivoSeleccionado: (archivo: File | null) => void;
    progreso?: number;
    subiendo?: boolean;
}

export default function SubidaImagen({ archivoSeleccionado, progreso = 0, subiendo = false }: SubidaImagenProps) {
    const [urlPreview, setUrlPreview] = useState<string | null>(null);
    const [errorLocal, setErrorLocal] = useState<string | null>(null);

    useEffect(() => {
        return () => {
            if (urlPreview) URL.revokeObjectURL(urlPreview);
        };
    }, [urlPreview]);

    const manejarCambio = (e: React.ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0] ?? null;
        setErrorLocal(null);

        if (urlPreview) {
            URL.revokeObjectURL(urlPreview);
            setUrlPreview(null);
        }

        if (!archivo) {
            archivoSeleccionado(null);
            return;
        }

        if (!archivo.type.startsWith('image/')) {
            setErrorLocal('El archivo debe ser una imagen');
            archivoSeleccionado(null);
            e.target.value = '';
            return;
        }

        if (archivo.size > TAMANO_MAXIMO_BYTES) {
            setErrorLocal('La imagen no puede superar los 5MB');
            archivoSeleccionado(null);
            e.target.value = '';
            return;
        }

        setUrlPreview(URL.createObjectURL(archivo));
        archivoSeleccionado(archivo);
    };

    return (
        <div className="flex flex-col gap-2">
            {urlPreview && (
                <img src={urlPreview} alt="Vista previa" className="w-full h-40 object-cover rounded-lg border" />
            )}
            <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={manejarCambio}
                disabled={subiendo}
                className="text-sm"
            />
            {errorLocal && <p className="text-red-500 text-sm">{errorLocal}</p>}
            {subiendo && (
                <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-black h-2 rounded-full transition-all" style={{ width: `${progreso}%` }} />
                </div>
            )}
        </div>
    );
}