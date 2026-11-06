'use client'

import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { SelectorUbicacion } from "@/components/mapas";
import { actualizarEntorno, actualizarProyecto, getEntorno } from "@/services/proyecto.service";
import { Proyecto } from "@/types/proyecto";
import { CATEGORIAS_ENTORNO, CategoriaEntorno, EntornoProyecto } from "@/types/entorno";

const ESPERA_ENTORNO_MS = 5000;
const INTENTOS_ENTORNO = 12;

function ResumenEntorno({ datos }: { datos: EntornoProyecto }) {
    return (
        <div className="text-sm text-gray-700">
            <p className="flex flex-wrap gap-x-4 gap-y-1">
                {(Object.keys(CATEGORIAS_ENTORNO) as CategoriaEntorno[]).map((c) => (
                    <span key={c}>{CATEGORIAS_ENTORNO[c].etiqueta}: <strong>{datos.entorno.resumen[c]}</strong></span>
                ))}
            </p>
            <p className="text-xs text-gray-500 mt-1">Actualizado el {new Date(datos.actualizadoEn).toLocaleString('es-CL')}</p>
        </div>
    );
}

export default function FormularioUbicacion({ proyecto, onGuardado }: { proyecto: Proyecto; onGuardado: (p: Proyecto) => void }) {
    const [direccion, setDireccion] = useState(proyecto.direccion ?? '');
    const [latitud, setLatitud] = useState<number | null>(proyecto.latitud);
    const [longitud, setLongitud] = useState<number | null>(proyecto.longitud);
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

    const [entorno, setEntorno] = useState<EntornoProyecto | null>(null);
    const [calculando, setCalculando] = useState(false);

    useEffect(() => {
        getEntorno(proyecto.id).then(setEntorno).catch(() => setEntorno(null));
    }, [proyecto.id]);

    // Tras cambiar la ubicación el backend calcula el entorno en segundo plano: se consulta hasta que esté
    const esperarEntorno = useCallback(async () => {
        setCalculando(true);
        for (let i = 0; i < INTENTOS_ENTORNO; i++) {
            await new Promise((r) => setTimeout(r, ESPERA_ENTORNO_MS));
            const datos = await getEntorno(proyecto.id).catch(() => null);
            if (datos) {
                setEntorno(datos);
                setCalculando(false);
                return;
            }
        }
        setCalculando(false);
        setMensaje({ tipo: 'error', texto: 'OpenStreetMap está tardando en responder. Usa "Actualizar entorno" en unos minutos.' });
    }, [proyecto.id]);

    async function guardar() {
        setMensaje(null);
        setGuardando(true);
        try {
            const cambiaUbicacion = latitud !== proyecto.latitud || longitud !== proyecto.longitud;
            const actualizado = await actualizarProyecto(proyecto.id, {
                direccion: direccion.trim() || undefined,
                ...(latitud !== null && longitud !== null && { latitud, longitud }),
            });
            onGuardado({ ...proyecto, ...actualizado });
            setMensaje({ tipo: 'ok', texto: 'Ubicación guardada' });
            if (cambiaUbicacion && latitud !== null) {
                setEntorno(null);
                void esperarEntorno();
            }
        } catch {
            setMensaje({ tipo: 'error', texto: 'No se pudo guardar la ubicación' });
        } finally {
            setGuardando(false);
        }
    }

    async function recalcular() {
        setMensaje(null);
        setCalculando(true);
        try {
            setEntorno(await actualizarEntorno(proyecto.id));
        } catch (error) {
            const texto = isAxiosError(error) && error.response?.status === 503
                ? 'OpenStreetMap no está disponible ahora, intenta en unos minutos'
                : 'No se pudo actualizar el entorno';
            setMensaje({ tipo: 'error', texto });
        } finally {
            setCalculando(false);
        }
    }

    function coordenada(valor: string, min: number, max: number): number | null {
        const n = Number(valor);
        return valor === '' || Number.isNaN(n) || n < min || n > max ? null : Number(n.toFixed(6));
    }

    return (
        <section className="flex flex-col gap-4 p-5 border rounded-xl">
            <div>
                <h2 className="text-xl font-semibold">Ubicación</h2>
                <p className="text-sm text-gray-500">Haz clic en el mapa en la ubicación del proyecto. Con ella se calculan los servicios cercanos.</p>
            </div>

            <input value={direccion} onChange={(e) => setDireccion(e.target.value)} maxLength={200}
                placeholder="Dirección (ej: 1 Sur 1234)" className="w-full border rounded-lg px-3 py-2" />

            <SelectorUbicacion latitud={latitud} longitud={longitud} onCambio={(lat, lng) => { setLatitud(lat); setLongitud(lng); }} />

            <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                    Latitud
                    <input type="number" step="0.000001" value={latitud ?? ''} onChange={(e) => setLatitud(coordenada(e.target.value, -90, 90))}
                        className="border rounded-lg px-3 py-2" />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Longitud
                    <input type="number" step="0.000001" value={longitud ?? ''} onChange={(e) => setLongitud(coordenada(e.target.value, -180, 180))}
                        className="border rounded-lg px-3 py-2" />
                </label>
            </div>

            <button type="button" onClick={guardar} disabled={guardando}
                className="bg-marca text-white rounded-lg py-2.5 font-medium disabled:opacity-50">
                {guardando ? 'Guardando...' : 'Guardar ubicación'}
            </button>

            {mensaje && <p className={`text-sm ${mensaje.tipo === 'ok' ? 'text-green-700' : 'text-red-600'}`}>{mensaje.texto}</p>}

            {proyecto.latitud !== null && (
                <div className="flex flex-col gap-2 pt-3 border-t">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="font-medium">Entorno (OpenStreetMap)</h3>
                        <button type="button" onClick={recalcular} disabled={calculando}
                            className="text-sm border rounded-lg px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50">
                            {calculando ? 'Calculando...' : 'Actualizar entorno'}
                        </button>
                    </div>
                    {entorno ? <ResumenEntorno datos={entorno} /> : (
                        <p className="text-sm text-gray-500">{calculando ? 'Consultando servicios cercanos...' : 'Aún no se calcula el entorno.'}</p>
                    )}
                </div>
            )}
        </section>
    );
}
