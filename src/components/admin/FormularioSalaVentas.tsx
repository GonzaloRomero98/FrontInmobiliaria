'use client'

import { useState } from "react";
import { SelectorUbicacion } from "@/components/mapas";
import { actualizarProyecto } from "@/services/proyecto.service";
import { ActualizarProyectoInput, Proyecto } from "@/types/proyecto";
import { DiaSemana, HorariosSala, horasEntre, SEMANA, textoHorario } from "@/lib/horarioSala";
import { SUPERFICIE, PANEL_PRIMARIO, PANEL_SECUNDARIO, NORMAL, CAMPO_PANEL } from "@/lib/estilos";

const HORAS = horasEntre('06:00', '23:30');
const HORARIO_INICIAL: HorariosSala = Object.fromEntries(
    (['lun', 'mar', 'mie', 'jue', 'vie'] as const).map((dia) => [dia, [['10:00', '18:00']]]),
);

export default function FormularioSalaVentas({ proyecto, onGuardado }: { proyecto: Proyecto; onGuardado: (p: Proyecto) => void }) {
    const [direccion, setDireccion] = useState(proyecto.salaDireccion ?? '');
    // Una sala nueva, o una guardada antes del horario por día, parte con lunes a viernes de 10:00 a 18:00.
    const [horarios, setHorarios] = useState<HorariosSala>(proyecto.salaHorarios ?? HORARIO_INICIAL);
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
        const malo = SEMANA.find(({ dia }) => { const t = horarios[dia]?.[0]; return t && t[0] >= t[1]; });
        if (malo) {
            setMensaje({ tipo: 'error', texto: `El ${malo.nombre.toLowerCase()} la hora de cierre debe ser después de la apertura` });
            return;
        }
        const conDias = Object.keys(horarios).length > 0;
        void guardar({
            salaDireccion: direccion.trim(),
            salaHorario: textoHorario(horarios),
            salaHorarios: conDias ? horarios : null,
            salaTelefono: telefono.trim() || null,
            salaLatitud: latitud,
            salaLongitud: longitud,
        }, 'Sala de ventas guardada');
    }

    function quitarSala() {
        setDireccion(''); setHorarios({}); setTelefono(''); setLatitud(null); setLongitud(null);
        void guardar({ salaDireccion: null, salaHorario: null, salaHorarios: null, salaTelefono: null, salaLatitud: null, salaLongitud: null }, 'Sala de ventas quitada');
    }

    function cambiarDia(dia: DiaSemana, tramo: [string, string] | null) {
        setHorarios((h) => {
            const nuevo = { ...h };
            if (tramo) nuevo[dia] = [tramo]; else delete nuevo[dia];
            return nuevo;
        });
    }

    function copiarLunes() {
        setHorarios((h) => Object.fromEntries(Object.keys(h).map((dia) => [dia, h.lun!])));
    }

    return (
        <section className={`${SUPERFICIE} flex flex-col gap-4 p-5`}>
            <div>
                <h2 className="text-xl font-semibold">Sala de ventas</h2>
                <p className="text-sm text-gray-500">Opcional. Con sala, el formulario de contacto permite pedir una visita y la sala aparece en el mapa.</p>
            </div>

            <label className="flex flex-col gap-1 text-sm">
                Dirección
                <input value={direccion} onChange={(e) => setDireccion(e.target.value)} maxLength={200}
                    placeholder="Ej.: 1 Sur 1234, Talca" className={CAMPO_PANEL} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
                Teléfono
                <input value={telefono} onChange={(e) => setTelefono(e.target.value)} maxLength={20} type="tel"
                    placeholder="+56712345678" className={CAMPO_PANEL} />
            </label>

            <fieldset className="flex flex-col gap-2">
                <legend className="text-sm mb-1">Horario de atención</legend>
                {proyecto.salaHorario && !proyecto.salaHorarios && (
                    <p className="text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
                        Horario anterior: «{proyecto.salaHorario}». Ajústalo abajo y guarda para que el formulario de contacto ofrezca solo esas horas.
                    </p>
                )}
                {SEMANA.map(({ dia, nombre }) => {
                    const tramo = horarios[dia]?.[0];
                    return (
                        <div key={dia} className="flex flex-wrap items-center gap-2 text-sm">
                            <label className="flex items-center gap-2 w-32">
                                <input type="checkbox" checked={!!tramo} className="w-4 h-4"
                                    onChange={(e) => cambiarDia(dia, e.target.checked ? horarios.lun?.[0] ?? ['10:00', '18:00'] : null)} />
                                {nombre}
                            </label>
                            {tramo ? (
                                <>
                                    <select aria-label={`${nombre}: abre`} value={tramo[0]} onChange={(e) => cambiarDia(dia, [e.target.value, tramo[1]])}
                                        className="border border-borde-campo rounded-lg px-2 py-1.5">
                                        {HORAS.map((h) => <option key={h}>{h}</option>)}
                                    </select>
                                    a
                                    <select aria-label={`${nombre}: cierra`} value={tramo[1]} onChange={(e) => cambiarDia(dia, [tramo[0], e.target.value])}
                                        className="border border-borde-campo rounded-lg px-2 py-1.5">
                                        {HORAS.map((h) => <option key={h}>{h}</option>)}
                                    </select>
                                </>
                            ) : <span className="text-gray-500">Cerrado</span>}
                        </div>
                    );
                })}
                {horarios.lun && (
                    <button type="button" onClick={copiarLunes} className="self-start text-sm text-marca underline">
                        Copiar el horario del lunes a los demás días abiertos
                    </button>
                )}
            </fieldset>

            <p className="text-sm text-gray-500">Ubicación en el mapa (opcional): haz clic donde está la sala.</p>
            <SelectorUbicacion latitud={latitud} longitud={longitud} onCambio={(lat, lng) => { setLatitud(lat); setLongitud(lng); }} />

            <div className="flex gap-2">
                <button type="button" onClick={guardarSala} disabled={guardando}
                    className={`flex-1 ${PANEL_PRIMARIO} ${NORMAL}`}>
                    {guardando ? 'Guardando...' : 'Guardar sala de ventas'}
                </button>
                {proyecto.salaDireccion && (
                    <button type="button" onClick={quitarSala} disabled={guardando}
                        className={`${PANEL_SECUNDARIO} ${NORMAL}`}>
                        Quitar sala
                    </button>
                )}
            </div>

            {mensaje && <p role={mensaje.tipo === 'ok' ? 'status' : 'alert'} className={`text-sm ${mensaje.tipo === 'ok' ? 'text-green-700' : 'text-red-600'}`}>{mensaje.texto}</p>}
        </section>
    );
}
