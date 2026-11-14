'use client'

import { useState } from "react";
import SubidaImagen from "@/components/SubidaImagen";
import { actualizarProyecto } from "@/services/proyecto.service";
import { obtenerUrlSubida, subirArchivo } from "@/services/s3.service";
import { ETIQUETA_ETAPA, EtapaProyecto, Proyecto } from "@/types/proyecto";

export default function FormularioDatosProyecto({ proyecto, onGuardado }: { proyecto: Proyecto; onGuardado: (p: Proyecto) => void }) {
    const [nombre, setNombre] = useState(proyecto.nombre);
    const [descripcion, setDescripcion] = useState(proyecto.descripcion ?? '');
    const [etapa, setEtapa] = useState<string>(proyecto.etapa ?? '');
    const [fechaEntrega, setFechaEntrega] = useState(proyecto.fechaEntrega ?? '');
    const [portada, setPortada] = useState<File | null>(null);
    const [progreso, setProgreso] = useState(0);
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

    async function guardar() {
        if (!nombre.trim()) {
            setMensaje({ tipo: 'error', texto: 'El nombre es obligatorio' });
            return;
        }
        setMensaje(null);
        setGuardando(true);
        try {
            let imagenPortada: string | undefined;
            if (portada) {
                const { uploadUrl, publicUrl, contentType } = await obtenerUrlSubida(portada, 'proyectos');
                await subirArchivo(portada, uploadUrl, contentType, setProgreso);
                imagenPortada = publicUrl;
            }
            const actualizado = await actualizarProyecto(proyecto.id, {
                nombre: nombre.trim(),
                descripcion: descripcion.trim(),
                etapa: (etapa || null) as EtapaProyecto | null,
                fechaEntrega: fechaEntrega || null,
                ...(imagenPortada && { imagenPortada }),
            });
            onGuardado({ ...proyecto, ...actualizado });
            setMensaje({ tipo: 'ok', texto: 'Datos guardados' });
        } catch {
            setMensaje({ tipo: 'error', texto: 'No se pudieron guardar los datos' });
        } finally {
            setGuardando(false);
        }
    }

    return (
        <section className="flex flex-col gap-4 p-5 border rounded-xl">
            <h2 className="text-xl font-semibold">Datos del proyecto</h2>

            <label className="flex flex-col gap-1 text-sm">
                Nombre
                <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={150} className="border rounded-lg px-3 py-2" />
            </label>

            <label className="flex flex-col gap-1 text-sm">
                Descripción
                <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={4} className="border rounded-lg px-3 py-2" />
            </label>

            <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1 text-sm">
                    Etapa
                    <select value={etapa} onChange={(e) => setEtapa(e.target.value)} className="w-full border rounded-lg px-3 py-2">
                        <option value="">Sin informar</option>
                        {Object.entries(ETIQUETA_ETAPA).map(([valor, etiqueta]) => (
                            <option key={valor} value={valor}>{etiqueta}</option>
                        ))}
                    </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Fecha de entrega (opcional)
                    <input type="date" value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
                </label>
            </div>

            <div className="flex flex-col gap-2 text-sm">
                Imagen de portada (elige una solo si quieres reemplazarla)
                {proyecto.imagenPortada && !portada && (
                    <img src={proyecto.imagenPortada} alt="Portada actual" className="w-40 h-24 object-cover rounded-lg border" />
                )}
                <SubidaImagen archivoSeleccionado={setPortada} progreso={progreso} subiendo={guardando && portada !== null} />
            </div>

            <button type="button" onClick={guardar} disabled={guardando}
                className="bg-marca text-white rounded-lg py-2.5 font-medium disabled:opacity-50">
                {guardando ? 'Guardando...' : 'Guardar datos'}
            </button>

            {mensaje && <p className={`text-sm ${mensaje.tipo === 'ok' ? 'text-green-700' : 'text-red-600'}`}>{mensaje.texto}</p>}
        </section>
    );
}
