'use client'

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { getModeloCasa } from "@/services/modeloCasa.service";
import { crearSolicitudPanel } from "@/services/solicitud.service";
import { ModeloCasa } from "@/types/modeloCasa";
import { CrearSolicitudPanelInput, ETIQUETA_ORIGEN } from "@/types/solicitud";
import { mensajeError } from "@/lib/errores";
import SelectorVisita from "@/components/SelectorVisita";
import { PANEL_PAGINA, SUPERFICIE, PANEL_PRIMARIO, NORMAL } from "@/lib/estilos";

const ORIGENES = ['SALA_VENTAS', 'TELEFONO', 'WHATSAPP'] as const;
// Mismo tope que el backend (CrearSolicitudDto).
const MAX_MENSAJE = 2000;
const VACIO ={ nombre: '', apellido: '', correo: '', celular: '', mensaje: '', id_modelo_casa: '' };

// Para clientes que llegan a la sala, llaman o escriben. Queda como contactado y, si se agenda visita, confirmada.
export default function NuevaSolicitud() {
    const router = useRouter();
    const [modelos, setModelos] = useState<ModeloCasa[]>([]);
    const [datos, setDatos] = useState(VACIO);
    const [origen, setOrigen] = useState<CrearSolicitudPanelInput['origen']>('SALA_VENTAS');
    const [informado, setInformado] = useState(false);
    // null = sin visita; si no, el valor de SelectorVisita.
    const [visita, setVisita] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        getModeloCasa().then(setModelos).catch(() => setError('No se pudieron cargar los modelos'));
    }, []);

    const modelo = modelos.find((m) => m.id === datos.id_modelo_casa);
    const conSala = !!modelo?.proyecto?.salaDireccion;
    const proyectos = [...new Set(modelos.map((m) => m.proyecto.nombre))].sort();
    const campo = (nombre: keyof typeof VACIO) => ({
        value: datos[nombre],
        onChange: (e: { target: { value: string } }) => setDatos((d) => ({ ...d, [nombre]: e.target.value })),
    });

    async function enviar(e: FormEvent) {
        e.preventDefault();
        setGuardando(true);
        setError(null);
        try {
            const solicitud = await crearSolicitudPanel({
                nombre: datos.nombre.trim(), apellido: datos.apellido.trim(), correo: datos.correo.trim(), celular: datos.celular,
                id_modelo_casa: datos.id_modelo_casa, origen, clienteInformado: informado,
                ...(datos.mensaje.trim() && { mensaje: datos.mensaje.trim() }),
                // El valor viene en hora local del navegador y la API la recibe en UTC.
                ...(conSala && visita && { visitaPreferida: new Date(visita).toISOString() }),
            });
            router.push(`/secretario/solicitudes/${solicitud.id}`);
        } catch (err) {
            setError(mensajeError(err, 'No se pudo registrar la solicitud'));
            setGuardando(false);
        }
    }

    const entrada = "border border-borde-campo rounded-lg px-3 py-2 font-normal";
    return (
        <main className={`${PANEL_PAGINA} flex flex-col gap-6`}>
            <div>
                <Link href="/secretario/solicitudes" className="text-sm text-gray-500 hover:underline">← Solicitudes</Link>
                <h1 className="text-2xl font-bold">Nueva solicitud</h1>
                <p className="text-sm text-gray-600 mt-1">Para clientes que llegan a la sala, llaman o escriben. Queda como contactada.</p>
            </div>

            <form onSubmit={enviar} className={`${SUPERFICIE} p-5 sm:p-6 max-w-2xl flex flex-col gap-4`}>
                <fieldset className="flex flex-wrap gap-2">
                    <legend className="text-sm font-medium mb-1">¿Cómo llegó el cliente?</legend>
                    {ORIGENES.map((o) => (
                        <label key={o} className={`text-sm px-3 py-1.5 rounded-full border cursor-pointer has-focus-visible:ring-2 has-focus-visible:ring-marca ${origen === o ? 'bg-marca text-white border-marca' : 'hover:bg-gray-50'}`}>
                            <input type="radio" name="origen" value={o} checked={origen === o} onChange={() => setOrigen(o)} className="sr-only" />
                            {ETIQUETA_ORIGEN[o]}
                        </label>
                    ))}
                </fieldset>

                <label className="flex flex-col gap-1 text-sm font-medium">
                    Modelo de interés
                    <select {...campo('id_modelo_casa')} onChange={(e) => { campo('id_modelo_casa').onChange(e); setVisita((v) => v === null ? null : ''); }}
                        required className={entrada}>
                        <option value="">Elige un modelo</option>
                        {proyectos.map((p) => (
                            <optgroup key={p} label={p}>
                                {modelos.filter((m) => m.proyecto.nombre === p).map((m) => <option key={m.id} value={m.id}>{m.nombreModelo}</option>)}
                            </optgroup>
                        ))}
                    </select>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1 text-sm font-medium">Nombre<input {...campo('nombre')} required maxLength={200} className={entrada} /></label>
                    <label className="flex flex-col gap-1 text-sm font-medium">Apellido<input {...campo('apellido')} required maxLength={200} className={entrada} /></label>
                    <label className="flex flex-col gap-1 text-sm font-medium">Correo<input type="email" {...campo('correo')} required className={entrada} /></label>
                    <label className="flex flex-col gap-1 text-sm font-medium">
                        Celular
                        <input type="tel" {...campo('celular')} required placeholder="+56 9 1234 5678" className={entrada} />
                    </label>
                </div>

                <label className="flex flex-col gap-1 text-sm font-medium">
                    Comentario (opcional)
                    <textarea {...campo('mensaje')} rows={3} maxLength={MAX_MENSAJE} className={entrada} />
                    <span className="self-end text-xs font-normal text-gray-500">{datos.mensaje.length}/{MAX_MENSAJE}</span>
                </label>

                {conSala && (
                    <div className="flex flex-col gap-3">
                        <label className="flex items-center gap-2 text-sm font-medium">
                            <input type="checkbox" checked={visita !== null} onChange={(e) => setVisita(e.target.checked ? '' : null)} className="w-4 h-4" />
                            Agendar visita a la sala de ventas (queda confirmada)
                        </label>
                        {visita !== null && (
                            // key: al cambiar de modelo puede cambiar la sala, y con ella el horario.
                            <div className="pl-6 sm:max-w-md">
                                <SelectorVisita key={modelo.id} horarios={modelo.proyecto.salaHorarios} horario={modelo.proyecto.salaHorario}
                                    valor={visita} onCambio={setVisita} otraHora claseEtiqueta="flex flex-col gap-1 text-sm font-medium" claseCampo={entrada} />
                            </div>
                        )}
                    </div>
                )}

                {/* Ley 21.719: los datos se registran solo después de informar la política de privacidad. */}
                <label className="flex items-start gap-2 text-sm">
                    <input type="checkbox" checked={informado} onChange={(e) => setInformado(e.target.checked)} required className="mt-1" />
                    <span>
                        Le informé al cliente la <Link href="/privacidad" target="_blank" className="underline">política de privacidad</Link> y
                        aceptó que registremos sus datos para contactarlo.
                    </span>
                </label>

                {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
                <button type="submit" disabled={guardando} className={`self-start ${PANEL_PRIMARIO} ${NORMAL}`}>
                    {guardando ? 'Guardando…' : 'Registrar solicitud'}
                </button>
            </form>
        </main>
    );
}
