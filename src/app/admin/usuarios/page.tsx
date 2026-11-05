'use client'

import { actualizarUsuario, crearUsuario, getUsuarios, Rol, Usuario } from "@/services/usuario.service";
import { isAxiosError } from "axios";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

// Muestra el mensaje de validación del backend (política de contraseña, correo duplicado...)
function mensajeError(e: unknown, porDefecto: string): string {
    const mensaje = isAxiosError(e) ? e.response?.data?.message : null;
    return Array.isArray(mensaje) ? mensaje.join('. ') : mensaje ?? porDefecto;
}

const NUEVO = { correo: '', nombre: '', contrasena: '', rol: 'SECRETARIO' as Rol };

export default function Usuarios() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [aviso, setAviso] = useState<string | null>(null);
    const [nuevo, setNuevo] = useState(NUEVO);
    const [creando, setCreando] = useState(false);
    const [restableciendo, setRestableciendo] = useState<string | null>(null);
    const [contrasenaNueva, setContrasenaNueva] = useState('');

    useEffect(() => {
        getUsuarios().then(setUsuarios).catch(() => setError('No se pudo cargar los usuarios')).finally(() => setCargando(false));
    }, []);

    async function crear(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setAviso(null);
        setCreando(true);
        try {
            const creado = await crearUsuario(nuevo);
            setUsuarios((lista) => [...lista, creado]);
            setNuevo(NUEVO);
            setAviso(`Cuenta creada para ${creado.correo}`);
        } catch (err) {
            setError(mensajeError(err, 'No se pudo crear el usuario'));
        } finally {
            setCreando(false);
        }
    }

    async function alternarActivo(usuario: Usuario) {
        if (usuario.activo && !confirm(`¿Desactivar a ${usuario.nombre}? No podrá iniciar sesión y su sesión actual se cierra.`)) return;
        setError(null);
        setAviso(null);
        try {
            const actualizado = await actualizarUsuario(usuario.id, { activo: !usuario.activo });
            setUsuarios((lista) => lista.map((u) => (u.id === usuario.id ? { ...u, activo: actualizado.activo } : u)));
        } catch (err) {
            setError(mensajeError(err, 'No se pudo actualizar el usuario'));
        }
    }

    async function restablecer(e: FormEvent, usuario: Usuario) {
        e.preventDefault();
        setError(null);
        setAviso(null);
        try {
            await actualizarUsuario(usuario.id, { contrasena: contrasenaNueva });
            setRestableciendo(null);
            setContrasenaNueva('');
            setAviso(`Contraseña de ${usuario.correo} actualizada. Comunícasela por un canal seguro.`);
        } catch (err) {
            setError(mensajeError(err, 'No se pudo cambiar la contraseña'));
        }
    }

    return (
        <main className="max-w-3xl mx-auto px-4 py-10">
            <Link href="/admin" className="text-sm text-gray-500 hover:underline">← Panel</Link>
            <h1 className="text-2xl font-bold mb-6">Usuarios</h1>

            <form onSubmit={crear} className="border rounded-xl p-4 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <h2 className="font-semibold sm:col-span-2">Nueva cuenta</h2>
                <input required value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
                    placeholder="Nombre" aria-label="Nombre" className="border rounded-lg px-3 py-2" />
                <input required type="email" value={nuevo.correo} onChange={(e) => setNuevo({ ...nuevo, correo: e.target.value })}
                    placeholder="Correo" aria-label="Correo" className="border rounded-lg px-3 py-2" />
                <input required type="password" autoComplete="new-password" value={nuevo.contrasena} onChange={(e) => setNuevo({ ...nuevo, contrasena: e.target.value })}
                    placeholder="Contraseña inicial" aria-label="Contraseña inicial" className="border rounded-lg px-3 py-2" />
                <select value={nuevo.rol} onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value as Rol })}
                    aria-label="Rol" className="border rounded-lg px-3 py-2">
                    <option value="SECRETARIO">Secretario (solo solicitudes)</option>
                    <option value="ADMIN">Administrador</option>
                </select>
                <p className="text-xs text-gray-500 sm:col-span-2">Mínimo 10 caracteres, con mayúscula, minúscula y número.</p>
                <button type="submit" disabled={creando} className="sm:col-span-2 bg-black text-white rounded-lg py-2 font-medium disabled:opacity-50">
                    {creando ? 'Creando...' : 'Crear cuenta'}
                </button>
            </form>

            {aviso && <p className="text-green-700 text-sm mb-4" role="status">{aviso}</p>}
            {error && <p className="text-red-500 text-sm mb-4" role="alert">{error}</p>}
            {cargando && <p className="text-gray-500">Cargando...</p>}

            <div className="flex flex-col divide-y border rounded-xl">
                {usuarios.map((usuario) => (
                    <div key={usuario.id} className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <p className={`font-medium ${usuario.activo ? '' : 'text-gray-400'}`}>
                                    {usuario.nombre}
                                    <span className="ml-2 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{usuario.rol.nombre === 'ADMIN' ? 'Administrador' : 'Secretario'}</span>
                                    {!usuario.activo && <span className="ml-2 text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded">Desactivado</span>}
                                </p>
                                <p className="text-sm text-gray-500">{usuario.correo}</p>
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => { setRestableciendo(restableciendo === usuario.id ? null : usuario.id); setContrasenaNueva(''); }}
                                    className="text-sm border rounded-lg px-3 py-1.5 hover:bg-gray-50">
                                    Restablecer contraseña
                                </button>
                                <button type="button" onClick={() => alternarActivo(usuario)}
                                    className={`text-sm border rounded-lg px-3 py-1.5 ${usuario.activo ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-300 text-green-700 hover:bg-green-50'}`}>
                                    {usuario.activo ? 'Desactivar' : 'Reactivar'}
                                </button>
                            </div>
                        </div>
                        {restableciendo === usuario.id && (
                            <form onSubmit={(e) => restablecer(e, usuario)} className="flex gap-2 mt-3">
                                <input required type="password" autoComplete="new-password" value={contrasenaNueva} onChange={(e) => setContrasenaNueva(e.target.value)}
                                    placeholder="Contraseña nueva" aria-label={`Contraseña nueva para ${usuario.correo}`} className="flex-1 border rounded-lg px-3 py-1.5 text-sm" />
                                <button type="submit" className="text-sm bg-black text-white rounded-lg px-3 py-1.5">Guardar</button>
                            </form>
                        )}
                    </div>
                ))}
            </div>
        </main>
    );
}
