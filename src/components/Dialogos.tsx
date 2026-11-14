'use client';

import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";

// Reemplaza confirm(), prompt() y alert() con el estilo del sitio.
// Se monta una vez en el layout y se usa con await confirmar({...}) y avisar(...).
interface OpcionesConfirmar {
    titulo: string;
    mensaje?: ReactNode;
    boton: string;
    peligroso?: boolean;
    campo?: { etiqueta: string; inicial?: string };
    // Se ejecuta con el diálogo abierto. Si devuelve un texto, se muestra como error y el diálogo no se cierra.
    accion?: (valor: string) => Promise<string | void> | string | void;
}

interface Aviso {
    id: number;
    texto: string;
    error?: boolean;
    accion?: { texto: string; alHacer: () => void };
}

type Dialogo = OpcionesConfirmar & { id: number; resolver: (valor: string | null) => void };

let estado: { dialogo: Dialogo | null; avisos: Aviso[] } = { dialogo: null, avisos: [] };
let siguienteId = 1;
const oyentes = new Set<() => void>();

function actualizar(cambios: Partial<typeof estado>) {
    estado = { ...estado, ...cambios };
    oyentes.forEach((oyente) => oyente());
}

function suscribir(oyente: () => void) {
    oyentes.add(oyente);
    return () => { oyentes.delete(oyente); };
}

export function confirmar(opciones: OpcionesConfirmar): Promise<string | null> {
    estado.dialogo?.resolver(null);
    return new Promise((resolver) => actualizar({ dialogo: { ...opciones, id: siguienteId++, resolver } }));
}

function cerrarDialogo(valor: string | null) {
    estado.dialogo?.resolver(valor);
    actualizar({ dialogo: null });
}

export function avisar(texto: string, opciones: { error?: boolean; accion?: Aviso['accion'] } = {}) {
    actualizar({ avisos: [...estado.avisos, { id: siguienteId++, texto, ...opciones }] });
}

function quitarAviso(id: number) {
    actualizar({ avisos: estado.avisos.filter((a) => a.id !== id) });
}

export default function Dialogos() {
    const { dialogo, avisos } = useSyncExternalStore(suscribir, () => estado, () => estado);
    return (
        <>
            {dialogo && <VentanaDialogo key={dialogo.id} dialogo={dialogo} />}
            {/* En el celular los avisos van arriba para no chocar con las barras fijas de abajo. */}
            <div className="fixed top-4 inset-x-4 sm:top-auto sm:bottom-4 sm:left-auto sm:w-96 z-50 flex flex-col gap-2" aria-live="polite">
                {avisos.map((aviso) => <TarjetaAviso key={aviso.id} aviso={aviso} />)}
            </div>
        </>
    );
}

function VentanaDialogo({ dialogo }: { dialogo: Dialogo }) {
    const ref = useRef<HTMLDialogElement>(null);
    const idTitulo = useId();
    const [valor, setValor] = useState(dialogo.campo?.inicial ?? '');
    const [error, setError] = useState<string | null>(null);
    const [ocupado, setOcupado] = useState(false);

    useEffect(() => { ref.current?.showModal(); }, []);

    async function enviar(e: FormEvent) {
        e.preventDefault();
        const limpio = valor.trim();
        setOcupado(true);
        setError(null);
        try {
            const problema = await dialogo.accion?.(limpio);
            if (problema) setError(problema);
            else cerrarDialogo(limpio);
        } catch {
            setError('Ocurrió un error. Inténtalo de nuevo.');
        } finally {
            setOcupado(false);
        }
    }

    return (
        <dialog ref={ref} aria-labelledby={idTitulo} onCancel={(e) => { e.preventDefault(); if (!ocupado) cerrarDialogo(null); }}
            className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-xl p-0 shadow-xl backdrop:bg-black/40">
            <form onSubmit={enviar} className="flex flex-col gap-4 p-5">
                <h2 id={idTitulo} className="text-lg font-semibold">{dialogo.titulo}</h2>
                {dialogo.mensaje && <div className="text-sm text-gray-700 flex flex-col gap-2">{dialogo.mensaje}</div>}
                {dialogo.campo && (
                    <label className="flex flex-col gap-1 text-sm font-medium">
                        {dialogo.campo.etiqueta}
                        <input value={valor} onChange={(e) => setValor(e.target.value)} required autoFocus
                            className="border rounded-lg px-3 py-2 font-normal" />
                    </label>
                )}
                {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
                {/* Cancelar va primero porque recibe el foco inicial, así un Enter no confirma por accidente. */}
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => cerrarDialogo(null)} disabled={ocupado}
                        className="border rounded-lg px-4 py-2 font-medium hover:bg-gray-50 disabled:opacity-50">
                        Cancelar
                    </button>
                    <button type="submit" disabled={ocupado}
                        className={`rounded-lg px-4 py-2 font-medium text-white disabled:opacity-50 ${dialogo.peligroso ? 'bg-red-600 hover:bg-red-700' : 'bg-marca hover:bg-marca/90'}`}>
                        {ocupado ? 'Procesando…' : dialogo.boton}
                    </button>
                </div>
            </form>
        </dialog>
    );
}

function TarjetaAviso({ aviso }: { aviso: Aviso }) {
    // El aviso no se cierra mientras el puntero o el foco están encima, para alcanzar a leerlo y usar Deshacer (WCAG 2.2.1).
    const [pausado, setPausado] = useState(false);
    useEffect(() => {
        if (aviso.error || pausado) return;
        const temporizador = setTimeout(() => quitarAviso(aviso.id), 10000);
        return () => clearTimeout(temporizador);
    }, [aviso, pausado]);

    return (
        <div role={aviso.error ? 'alert' : 'status'}
            onMouseEnter={() => setPausado(true)} onMouseLeave={() => setPausado(false)}
            onFocus={() => setPausado(true)} onBlur={() => setPausado(false)}
            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm shadow-lg ${aviso.error ? 'bg-red-700 text-white' : 'bg-gray-900 text-white'}`}>
            <p className="flex-1">{aviso.texto}</p>
            {aviso.accion && (
                <button type="button" onClick={() => { quitarAviso(aviso.id); aviso.accion!.alHacer(); }}
                    className="font-semibold underline underline-offset-2 hover:no-underline">
                    {aviso.accion.texto}
                </button>
            )}
            <button type="button" onClick={() => quitarAviso(aviso.id)} aria-label="Cerrar aviso" className="text-lg leading-none opacity-80 hover:opacity-100">
                ×
            </button>
        </div>
    );
}
