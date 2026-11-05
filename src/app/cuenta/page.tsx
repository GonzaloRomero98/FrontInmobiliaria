'use client'

import { cambiarMiContrasena } from "@/services/usuario.service";
import { isAxiosError } from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function Cuenta() {
    const [actual, setActual] = useState('');
    const [nueva, setNueva] = useState('');
    const [repetida, setRepetida] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [listo, setListo] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const router = useRouter();

    async function guardar(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setListo(false);
        if (nueva !== repetida) {
            setError('Las contraseñas nuevas no coinciden');
            return;
        }
        setGuardando(true);
        try {
            await cambiarMiContrasena(actual, nueva);
            setActual('');
            setNueva('');
            setRepetida('');
            setListo(true);
        } catch (err) {
            const mensaje = isAxiosError(err) ? err.response?.data?.message : null;
            setError(Array.isArray(mensaje) ? mensaje.join('. ') : mensaje ?? 'No se pudo cambiar la contraseña');
        } finally {
            setGuardando(false);
        }
    }

    return (
        <main className="max-w-md mx-auto px-4 py-10">
            {/* La cookie solo existe en el navegador: se lee al hacer clic */}
            <button type="button" onClick={() => router.push(Cookies.get('rol_usuario') === 'ADMIN' ? '/admin' : '/secretario')}
                className="text-sm text-gray-500 hover:underline">← Volver</button>
            <h1 className="text-2xl font-bold mb-6">Cambiar mi contraseña</h1>
            <form onSubmit={guardar} className="flex flex-col gap-4">
                <input required type="password" autoComplete="current-password" value={actual} onChange={(e) => setActual(e.target.value)}
                    placeholder="Contraseña actual" aria-label="Contraseña actual" className="border rounded-lg px-3 py-2" />
                <input required type="password" autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)}
                    placeholder="Contraseña nueva" aria-label="Contraseña nueva" className="border rounded-lg px-3 py-2" />
                <input required type="password" autoComplete="new-password" value={repetida} onChange={(e) => setRepetida(e.target.value)}
                    placeholder="Repite la contraseña nueva" aria-label="Repite la contraseña nueva" className="border rounded-lg px-3 py-2" />
                <p className="text-xs text-gray-500">Mínimo 10 caracteres, con mayúscula, minúscula y número.</p>
                {error && <p className="text-red-500 text-sm" role="alert">{error}</p>}
                {listo && <p className="text-green-700 text-sm" role="status">Contraseña actualizada</p>}
                <button type="submit" disabled={guardando} className="bg-black text-white rounded-lg py-3 font-medium disabled:opacity-50">
                    {guardando ? 'Guardando...' : 'Guardar'}
                </button>
            </form>
        </main>
    );
}
