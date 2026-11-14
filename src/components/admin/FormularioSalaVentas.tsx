'use client'

import { useState } from "react";
import { SelectorUbicacion } from "@/components/mapas";
import { actualizarProyecto } from "@/services/proyecto.service";
import { ActualizarProyectoInput, Proyecto } from "@/types/proyecto";

export default function FormularioSalaVentas({ proyecto, onGuardado }: { proyecto: Proyecto; onGuardado: (p: Proyecto) => void }) {
    const [direccion, setDireccion] = useState(proyecto.salaDireccion ?? '');
    const [horario, setHorario] = useState(proyecto.salaHorario ?? '');
    const [telefono, setTelefono] = useState(proyecto.salaTelefono ?? '');
    const [latitud, setLatitud] = useState<number | null>(proyecto.salaLatitud);
    const [longitud, setLongitud] = useState<number | null>(proyecto.salaLongitud);
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

    async function guardar(datos: ActualizarProyectoInput, texto: string) {
        setMensaje(null);
        setGuardando(true);
        try {
            const actualizado = await actualizarProyecto(proyecto.id, datos);
            onGuardado({ ...proyecto, ...actualizado });
            setMensaje({ tipo: 'ok', texto });
        } catch {
            setMensaje({ tipo: 'error', texto: 'No se pudo guardar la sala de ventas' });
        } finally {
            setGuardando(false);
        }
    }

    function guardarSala() {
        // Sin dirección no hay sala, y el formulario público deja de ofrecer agendar visita.
        if (!direccion.trim()) {
            setMensaje({ tipo: 'error', texto: 'La dirección es obligatoria' });
            return;
        }
        void guardar({
            salaDireccion: direccion.trim(),
            salaHorario: horario.trim() || null,
            salaTelefono: telefono.trim() || null,
            salaLatitud: latitud,
            salaLongitud: longitud,
        }, 'Sala de ventas guardada');
    }

    function quitarSala() {
        setDireccion(''); setHorario(''); setTelefono(''); setLatitud(null); setLongitud(null);
        void guardar({ salaDireccion: null, salaHorario: null, salaTelefono: null, salaLatitud: null, salaLongitud: null }, 'Sala de ventas quitada');
    }

    return (
        <section className="flex flex-col gap-4 p-5 border rounded-xl">
            <div>
                <h2 className="text-xl font-semibold">Sala de ventas</h2>
                <p className="text-sm text-gray-500">Opcional. Con sala, el formulario de contacto permite pedir una visita y la sala aparece en el mapa.</p>
            </div>

            <label className="flex flex-col gap-1 text-sm">
                Dirección
                <input value={direccion} onChange={(e) => setDireccion(e.target.value)} maxLength={200}
                    placeholder="Ej.: 1 Sur 1234, Talca" className="border rounded-lg px-3 py-2" />
            </label>
            <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                    Horario
                    <input value={horario} onChange={(e) => setHorario(e.target.value)} maxLength={150}
                        placeholder="Lun a sáb 10:00 a 18:00" className="border rounded-lg px-3 py-2" />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Teléfono
                    <input value={telefono} onChange={(e) => setTelefono(e.target.value)} maxLength={20} type="tel"
                        placeholder="+56712345678" className="border rounded-lg px-3 py-2" />
                </label>
            </div>

            <p className="text-sm text-gray-500">Ubicación en el mapa (opcional): haz clic donde está la sala.</p>
            <SelectorUbicacion latitud={latitud} longitud={longitud} onCambio={(lat, lng) => { setLatitud(lat); setLongitud(lng); }} />

            <div className="flex gap-2">
                <button type="button" onClick={guardarSala} disabled={guardando}
                    className="flex-1 bg-marca text-white rounded-lg py-2.5 font-medium disabled:opacity-50">
                    {guardando ? 'Guardando...' : 'Guardar sala de ventas'}
                </button>
                {proyecto.salaDireccion && (
                    <button type="button" onClick={quitarSala} disabled={guardando}
                        className="border rounded-lg px-4 py-2.5 text-sm hover:bg-gray-50 disabled:opacity-50">
                        Quitar sala
                    </button>
                )}
            </div>

            {mensaje && <p className={`text-sm ${mensaje.tipo === 'ok' ? 'text-green-700' : 'text-red-600'}`}>{mensaje.texto}</p>}
        </section>
    );
}
