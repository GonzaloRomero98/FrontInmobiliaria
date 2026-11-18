'use client'

import { useState } from "react";
import { diasDeVisita, HorariosSala } from "@/lib/horarioSala";

interface SelectorVisitaProps {
    horarios: HorariosSala | null;
    // Texto del horario para mostrarlo bajo las listas.
    horario?: string | null;
    // '' sin elegir, "AAAA-MM-DD" con solo el día o "AAAA-MM-DDTHH:MM" completo (hora local del navegador).
    valor: string;
    onCambio: (valor: string) => void;
    // Solo el panel: permite una fecha u hora fuera del horario de la sala.
    otraHora?: boolean;
    claseEtiqueta: string;
    claseCampo: string;
}

export const visitaCompleta = (valor: string) => valor.length === 16;

// Día y hora dentro del horario de la sala. Se monta tras una acción del usuario (marcar casilla, "Reagendar"),
// así que los días se calculan en el navegador y no en el render del servidor, cuya hora no es la del cliente.
export default function SelectorVisita({ horarios, horario, valor, onCambio, otraHora = false, claseEtiqueta, claseCampo }: SelectorVisitaProps) {
    const [dias] = useState(() => diasDeVisita(horarios, new Date()));
    const [libre, setLibre] = useState(otraHora && dias.length === 0);
    const dia = valor.slice(0, 10);
    const horas = dias.find((d) => d.valor === dia)?.horas ?? [];
    const cambiarModo = (modo: boolean) => { setLibre(modo); onCambio(''); };
    const enlace = "self-start text-xs text-gray-600 underline hover:text-gray-900";

    if (libre) {
        return (
            <div className="flex flex-col gap-2">
                <label className={claseEtiqueta}>
                    Fecha y hora
                    <input type="datetime-local" value={valor} onChange={(e) => onCambio(e.target.value)} required className={claseCampo} />
                </label>
                {horario && <p className="text-xs text-gray-500">Horario de la sala: {horario}</p>}
                {dias.length > 0 && <button type="button" onClick={() => cambiarModo(false)} className={enlace}>Elegir dentro del horario de la sala</button>}
            </div>
        );
    }

    if (!dias.length) {
        return <p className="text-sm text-gray-600">La sala no tiene horas disponibles en los próximos días. Cuéntanos en el mensaje cuándo te acomoda.</p>;
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[1fr_6.5rem] gap-3">
                <label className={claseEtiqueta}>
                    Día
                    <select value={dia} onChange={(e) => onCambio(e.target.value)} required className={claseCampo}>
                        <option value="" disabled>Elige un día</option>
                        {dias.map((d) => <option key={d.valor} value={d.valor}>{d.etiqueta}</option>)}
                    </select>
                </label>
                <label className={claseEtiqueta}>
                    Hora
                    <select value={valor.slice(11, 16)} onChange={(e) => onCambio(`${dia}T${e.target.value}`)} disabled={!dia} required className={claseCampo}>
                        <option value="" disabled>--:--</option>
                        {horas.map((h) => <option key={h}>{h}</option>)}
                    </select>
                </label>
            </div>
            {horario && <p className="text-xs text-gray-500">Horario de la sala: {horario}</p>}
            {otraHora && <button type="button" onClick={() => cambiarModo(true)} className={enlace}>Otra fecha u hora (fuera de horario)</button>}
        </div>
    );
}
