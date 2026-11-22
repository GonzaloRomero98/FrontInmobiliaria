'use client'

import { useState } from "react";
import FormularioContacto from "@/components/FormularioContacto";
import SalaVentas from "@/components/SalaVentas";
import { Proyecto } from "@/types/proyecto";

export interface OpcionProyecto {
    id: string;
    nombre: string;
    sala: Pick<Proyecto, 'salaDireccion' | 'salaHorario' | 'salaHorarios' | 'salaTelefono' | 'salaLatitud' | 'salaLongitud'>;
    modelos: { id: string; nombre: string }[];
}

const ETIQUETA = "flex flex-col gap-1 text-sm font-medium text-gray-700";
// text-base porque con letra menor a 16 px el iPhone hace zoom al tocar el campo.
const CAMPO = "w-full min-h-11 border rounded-lg px-3 py-2 text-base font-normal text-gray-900 bg-white";

export default function AgendarVisita({ proyectos }: { proyectos: OpcionProyecto[] }) {
    const [idProyecto, setIdProyecto] = useState('');
    const [idModelo, setIdModelo] = useState('');
    const proyecto = proyectos.find((p) => p.id === idProyecto);

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className={ETIQUETA}>
                    Proyecto
                    <select value={idProyecto} className={CAMPO}
                        onChange={(e) => { setIdProyecto(e.target.value); setIdModelo(''); }}>
                        <option value="">Elige un proyecto</option>
                        {proyectos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                </label>
                <label className={ETIQUETA}>
                    Modelo
                    <select value={idModelo} onChange={(e) => setIdModelo(e.target.value)} disabled={!proyecto} className={`${CAMPO} disabled:bg-gray-100`}>
                        <option value="">{proyecto ? 'Elige un modelo' : 'Primero elige un proyecto'}</option>
                        {proyecto?.modelos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                    </select>
                </label>
            </div>

            {proyecto && <SalaVentas proyecto={proyecto.sala} />}

            {proyecto && idModelo && (
                <section className="border rounded-2xl p-5" aria-label="Tus datos y la fecha de la visita">
                    {/* La key reinicia el formulario al cambiar de modelo. */}
                    <FormularioContacto key={idModelo} idModeloCasa={idModelo} conVisita visitaInicial
                        sala={{ direccion: proyecto.sala.salaDireccion!, horario: proyecto.sala.salaHorario, horarios: proyecto.sala.salaHorarios }} />
                </section>
            )}
        </div>
    );
}
