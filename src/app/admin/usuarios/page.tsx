'use client'

import { actualizarUsuario, crearUsuario, getUsuarios, Rol, Usuario } from "@/services/usuario.service";
import { FormEvent, useEffect, useState } from "react";
import { mensajeError } from "@/lib/errores";
import { confirmar } from "@/components/Dialogos";
import { CargandoLista } from "@/components/panel/Tablero";
import { COMPACTO, NORMAL, PANEL_EXITO, PANEL_PAGINA, PANEL_PELIGRO, PANEL_PRIMARIO, PANEL_SECUNDARIO, PILDORA, SUPERFICIE, TONO, CAMPO_PANEL } from "@/lib/estilos";

const ETIQUETA = "flex flex-col gap-1 text-sm font-medium text-gray-800";
const ENTRADA = CAMPO_PANEL;

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
        getUsuarios().then(setUsuarios).catch(() => setError('No se pudieron cargar los usuarios')).finally(() => setCargando(false));
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
        // Se pide confirmación porque la cuenta se puede reactivar, pero la sesión que se cierra no vuelve.
        if (usuario.activo && await confirmar({
            titulo: `Desactivar a ${usuario.nombre}`,
            mensaje: 'No podrá iniciar sesión y su sesión actual se cierra de inmediato. Puedes reactivarlo cuando quieras.',
            boton: 'Desactivar',
            peligroso: true,
        }) === null) return;
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
        <main className={PANEL_PAGINA}>
            <h1 className="text-2xl font-bold mb-6">Usuarios</h1>

            <form onSubmit={crear} className={`${SUPERFICIE} p-5 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-3`}>
                <h2 className="font-semibold sm:col-span-2">Nueva cuenta</h2>
                <label className={ETIQUETA}>
                    Nombre
                    <input required value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} className={ENTRADA} />
                </label>
                <label className={ETIQUETA}>
                    Correo
                    <input required type="email" value={nuevo.correo} onChange={(e) => setNuevo({ ...nuevo, correo: e.target.value })} className={ENTRADA} />
                </label>
                <label className={ETIQUETA}>
                    Contraseña inicial
                    <input required type="password" autoComplete="new-password" value={nuevo.contrasena} onChange={(e) => setNuevo({ ...nuevo, contrasena: e.target.value })}
                        aria-describedby="regla-contrasena" className={ENTRADA} />
                    <span id="regla-contrasena" className="text-xs font-normal text-gray-600">Mínimo 10 caracteres, con mayúscula, minúscula y número.</span>
                </label>
                <label className={ETIQUETA}>
                    Rol
                    <select value={nuevo.rol} onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value as Rol })} className={`${ENTRADA} bg-white`}>
                        <option value="SECRETARIO">Secretario (solo solicitudes)</option>
                        <option value="ADMIN">Administrador</option>
                    </select>
                </label>
                <button type="submit" disabled={creando} className={`sm:col-span-2 ${PANEL_PRIMARIO} ${NORMAL}`}>
                    {creando ? 'Creando...' : 'Crear cuenta'}
                </button>
            </form>

            {aviso && <p className="text-green-700 text-sm mb-4" role="status">{aviso}</p>}
            {error && <p className="text-red-700 text-sm mb-4" role="alert">{error}</p>}
            {cargando && <CargandoLista filas={3} etiqueta="Cargando usuarios" />}

            {!cargando && usuarios.length > 0 && (
            <div className={`${SUPERFICIE} flex flex-col divide-y divide-gray-200`}>
                {usuarios.map((usuario) => (
                    <div key={usuario.id} className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <p className={`font-medium ${usuario.activo ? '' : 'text-gray-500'}`}>
                                    {usuario.nombre}
                                    <span className={`ml-2 ${PILDORA} ${TONO.neutro}`}>{usuario.rol.nombre === 'ADMIN' ? 'Administrador' : 'Secretario'}</span>
                                    {!usuario.activo && <span className={`ml-2 ${PILDORA} ${TONO.peligro}`}>Desactivado</span>}
                                </p>
                                <p className="text-sm text-gray-600">{usuario.correo}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => { setRestableciendo(restableciendo === usuario.id ? null : usuario.id); setContrasenaNueva(''); }}
                                    aria-expanded={restableciendo === usuario.id} aria-controls={`restablecer-${usuario.id}`}
                                    className={`${PANEL_SECUNDARIO} ${COMPACTO}`}>
                                    Restablecer contraseña
                                </button>
                                <button type="button" onClick={() => alternarActivo(usuario)}
                                    className={`${usuario.activo ? PANEL_PELIGRO : PANEL_EXITO} ${COMPACTO}`}>
                                    {usuario.activo ? 'Desactivar' : 'Reactivar'}
                                </button>
                            </div>
                        </div>
                        {restableciendo === usuario.id && (
                            <form id={`restablecer-${usuario.id}`} onSubmit={(e) => restablecer(e, usuario)} className="flex flex-wrap items-end gap-2 mt-3">
                                <label className={`${ETIQUETA} flex-1 min-w-56`}>
                                    Contraseña nueva para {usuario.correo}
                                    <input required type="password" autoComplete="new-password" value={contrasenaNueva} onChange={(e) => setContrasenaNueva(e.target.value)}
                                        className={ENTRADA} />
                                </label>
                                <button type="submit" className={`${PANEL_PRIMARIO} ${NORMAL}`}>Guardar</button>
                            </form>
                        )}
                    </div>
                ))}
            </div>
            )}
        </main>
    );
}
