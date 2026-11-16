'use client';

import { useEffect, useRef, useState } from "react";
import { ImageIcon } from "lucide-react";
import ZonaSubida, { FilaArchivo, MensajeError, formatoPeso } from "./ZonaSubida";

const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;
// Los mismos tipos que acepta el backend (s3.archivos.ts); arrastrando se salta el accept del input.
const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];

interface SubidaImagenProps {
    archivoSeleccionado: (archivo: File | null) => void;
    progreso?: number;
    subiendo?: boolean;
}

export default function SubidaImagen({ archivoSeleccionado, progreso = 0, subiendo = false }: SubidaImagenProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [archivo, setArchivo] = useState<File | null>(null);
    const [urlPreview, setUrlPreview] = useState<string | null>(null);
    const [errorLocal, setErrorLocal] = useState<string | null>(null);

    useEffect(() => {
        return () => {
            if (urlPreview) URL.revokeObjectURL(urlPreview);
        };
    }, [urlPreview]);

    const quitar = () => {
        setArchivo(null);
        setUrlPreview(null);
        archivoSeleccionado(null);
    };

    const elegir = (nuevo: File) => {
        setErrorLocal(null);

        if (!TIPOS.includes(nuevo.type)) {
            setErrorLocal('La imagen debe ser JPG, PNG o WEBP');
            quitar();
            return;
        }

        if (nuevo.size > TAMANO_MAXIMO_BYTES) {
            setErrorLocal(`La imagen pesa ${formatoPeso(nuevo.size)} y el máximo es 5 MB`);
            quitar();
            return;
        }

        setArchivo(nuevo);
        setUrlPreview(URL.createObjectURL(nuevo));
        archivoSeleccionado(nuevo);
    };

    return (
        <div className="flex flex-col gap-2">
            <input
                ref={inputRef}
                type="file"
                accept={TIPOS.join(',')}
                onChange={(e) => {
                    const nuevo = e.target.files?.[0];
                    // Se limpia para que volver a elegir el mismo archivo dispare onChange.
                    e.target.value = '';
                    if (nuevo) elegir(nuevo);
                }}
                disabled={subiendo}
                className="hidden"
            />
            {archivo && urlPreview ? (
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                    <div className="relative">
                        <img src={urlPreview} alt="Vista previa" className="w-full h-40 object-cover" />
                        {subiendo && (
                            <div className="absolute inset-0 bg-marca/70 flex flex-col items-center justify-center gap-3 text-white">
                                <span className="text-sm font-semibold">Subiendo imagen… {Math.round(progreso)} %</span>
                                <div className="w-2/3 h-1.5 rounded-full bg-white/30">
                                    <div className="h-1.5 rounded-full bg-white transition-all" style={{ width: `${progreso}%` }} />
                                </div>
                            </div>
                        )}
                    </div>
                    <FilaArchivo archivo={archivo} deshabilitado={subiendo} onCambiar={() => inputRef.current?.click()} onQuitar={quitar} />
                </div>
            ) : (
                <ZonaSubida
                    icono={ImageIcon}
                    queSubir="una imagen"
                    ayuda="JPG, PNG o WEBP · máx. 5 MB"
                    error={errorLocal !== null}
                    deshabilitado={subiendo}
                    onElegir={() => inputRef.current?.click()}
                    onSoltar={elegir}
                />
            )}
            {errorLocal && <MensajeError>{errorLocal}</MensajeError>}
        </div>
    );
}
