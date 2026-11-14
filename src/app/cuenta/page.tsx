'use client'

import AvatarUsuario from "@/components/AvatarUsuario";
import { obtenerUrlSubida, subirArchivo } from "@/services/s3.service";
import { actualizarMiPerfil, cambiarMiContrasena, getMiPerfil, Usuario } from "@/services/usuario.service";
import { isAxiosError } from "axios";
import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FOTO_BYTES = 2 * 1024 * 1024;
const NOMBRE_ROL = {ADMIN: 'Administrador', SECRETARIO: 'Secretario'} as const;
const ESTILO_TARJETA = "border rounded-xl p-6 flex flex-col gap-4";
const ESTILO_BOTON = "bg-marca text-white rounded-lg px-4 py-2 font-medium disabled:opacity-50";

type Aviso = {tipo:'ok' | 'error'; texto:string} | null;

function mensajeDeError(err:unknown, porDefecto:string):string{
    const mensaje = isAxiosError(err) ? err.response?.data?.message : null;
    return Array.isArray(mensaje) ? mensaje.join('. ') : mensaje ?? porDefecto;
}

function TextoAviso({aviso}:{aviso:Aviso}){
    if(!aviso) return null;
    return aviso.tipo === 'error'
        ? <p className="text-red-500 text-sm" role="alert">{aviso.texto}</p>
        : <p className="text-green-700 text-sm" role="status">{aviso.texto}</p>;
}

export default function MiPerfil(){
    const [perfil, setPerfil] = useState<Usuario | null>(null);
    const [errorCarga, setErrorCarga] = useState(false);

    useEffect(() => {
        getMiPerfil().then(setPerfil).catch(() => setErrorCarga(true));
    }, []);

    return (
        <main className="max-w-2xl mx-auto px-4 py-10 flex flex-col gap-6">
            <div>
                {perfil && (
                    <Link href={perfil.rol.nombre === 'ADMIN' ? '/admin' : '/secretario'} className="text-sm text-gray-500 hover:underline">← Mi panel</Link>
                )}
                <h1 className="text-2xl font-bold">Mi perfil</h1>
            </div>
            {errorCarga && <p className="text-red-500 text-sm" role="alert">No se pudo cargar tu perfil</p>}
            {!perfil && !errorCarga && <p className="text-gray-500 text-sm">Cargando...</p>}
            {perfil && (
                <>
                    <SeccionFoto perfil={perfil} alCambiar={setPerfil} />
                    <SeccionDatos perfil={perfil} alCambiar={setPerfil} />
                    <SeccionContrasena />
                </>
            )}
        </main>
    );
}

function SeccionFoto({perfil, alCambiar}:{perfil:Usuario; alCambiar:(u:Usuario) => void}){
    const [subiendo, setSubiendo] = useState(false);
    const [progreso, setProgreso] = useState(0);
    const [aviso, setAviso] = useState<Aviso>(null);

    async function elegirFoto(e:ChangeEvent<HTMLInputElement>){
        const archivo = e.target.files?.[0];
        e.target.value = '';
        if(!archivo) return;
        setAviso(null);
        if(!TIPOS_FOTO.includes(archivo.type)){
            setAviso({tipo:'error', texto:'La foto debe ser JPG, PNG o WebP'});
            return;
        }
        if(archivo.size > MAX_FOTO_BYTES){
            setAviso({tipo:'error', texto:'La foto no puede superar los 2 MB'});
            return;
        }
        setSubiendo(true);
        setProgreso(0);
        try{
            const {uploadUrl, publicUrl, contentType} = await obtenerUrlSubida(archivo, 'perfiles');
            await subirArchivo(archivo, uploadUrl, contentType, setProgreso);
            alCambiar(await actualizarMiPerfil({fotoUrl:publicUrl}));
            setAviso({tipo:'ok', texto:'Foto actualizada'});
        }catch(err){
            setAviso({tipo:'error', texto:mensajeDeError(err, 'No se pudo subir la foto')});
        }finally{
            setSubiendo(false);
        }
    }

    async function quitarFoto(){
        setAviso(null);
        setSubiendo(true);
        try{
            alCambiar(await actualizarMiPerfil({fotoUrl:null}));
            setAviso({tipo:'ok', texto:'Foto eliminada'});
        }catch(err){
            setAviso({tipo:'error', texto:mensajeDeError(err, 'No se pudo quitar la foto')});
        }finally{
            setSubiendo(false);
        }
    }

    return (
        <section aria-labelledby="titulo-foto" className={ESTILO_TARJETA}>
            <h2 id="titulo-foto" className="font-semibold">Foto de perfil</h2>
            <div className="flex flex-wrap items-center gap-4">
                <AvatarUsuario nombre={perfil.nombre} fotoUrl={perfil.fotoUrl} tamano={80} />
                <div className="flex flex-wrap gap-2">
                    <label className={`${ESTILO_BOTON} cursor-pointer focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-marca ${subiendo ? 'opacity-50 pointer-events-none' : ''}`}>
                        {perfil.fotoUrl ? 'Cambiar foto' : 'Subir foto'}
                        <input type="file" accept={TIPOS_FOTO.join(',')} onChange={elegirFoto} disabled={subiendo} className="sr-only" />
                    </label>
                    {perfil.fotoUrl && (
                        <button type="button" onClick={quitarFoto} disabled={subiendo}
                            className="border rounded-lg px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                            Quitar foto
                        </button>
                    )}
                </div>
            </div>
            <p className="text-xs text-gray-500">JPG, PNG o WebP de hasta 2 MB.</p>
            {subiendo && progreso > 0 && (
                <div className="w-full bg-gray-100 rounded-full h-2" role="progressbar" aria-valuenow={progreso} aria-valuemin={0} aria-valuemax={100} aria-label="Subiendo foto">
                    <div className="bg-marca h-2 rounded-full transition-all" style={{width:`${progreso}%`}} />
                </div>
            )}
            <TextoAviso aviso={aviso} />
        </section>
    );
}

function SeccionDatos({perfil, alCambiar}:{perfil:Usuario; alCambiar:(u:Usuario) => void}){
    const [nombre, setNombre] = useState(perfil.nombre);
    const [guardando, setGuardando] = useState(false);
    const [aviso, setAviso] = useState<Aviso>(null);
    const sinCambios = nombre.trim() === perfil.nombre || !nombre.trim();

    async function guardar(e:FormEvent){
        e.preventDefault();
        setAviso(null);
        setGuardando(true);
        try{
            const actualizado = await actualizarMiPerfil({nombre:nombre.trim()});
            alCambiar(actualizado);
            setNombre(actualizado.nombre);
            setAviso({tipo:'ok', texto:'Datos actualizados'});
        }catch(err){
            setAviso({tipo:'error', texto:mensajeDeError(err, 'No se pudieron guardar los datos')});
        }finally{
            setGuardando(false);
        }
    }

    return (
        <section aria-labelledby="titulo-datos" className={ESTILO_TARJETA}>
            <h2 id="titulo-datos" className="font-semibold">Tus datos</h2>
            <form onSubmit={guardar} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1 text-sm">
                    Nombre
                    <input required maxLength={100} autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)}
                        className="border rounded-lg px-3 py-2 text-base" />
                </label>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                    <dt className="text-gray-500">Correo</dt>
                    <dd className="break-all">{perfil.correo}</dd>
                    <dt className="text-gray-500">Rol</dt>
                    <dd>{NOMBRE_ROL[perfil.rol.nombre] ?? perfil.rol.nombre}</dd>
                    <dt className="text-gray-500">Cuenta creada</dt>
                    <dd>{new Date(perfil.creadoEn).toLocaleDateString('es-CL', {day:'numeric', month:'long', year:'numeric'})}</dd>
                </dl>
                <p className="text-xs text-gray-500">El correo identifica tu cuenta; si necesitas cambiarlo, pídeselo a un administrador.</p>
                <TextoAviso aviso={aviso} />
                <button type="submit" disabled={guardando || sinCambios} className={`${ESTILO_BOTON} self-start`}>
                    {guardando ? 'Guardando...' : 'Guardar'}
                </button>
            </form>
        </section>
    );
}

function SeccionContrasena(){
    const [actual, setActual] = useState('');
    const [nueva, setNueva] = useState('');
    const [repetida, setRepetida] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [aviso, setAviso] = useState<Aviso>(null);

    async function guardar(e:FormEvent){
        e.preventDefault();
        setAviso(null);
        if(nueva !== repetida){
            setAviso({tipo:'error', texto:'Las contraseñas nuevas no coinciden'});
            return;
        }
        setGuardando(true);
        try{
            await cambiarMiContrasena(actual, nueva);
            setActual('');
            setNueva('');
            setRepetida('');
            setAviso({tipo:'ok', texto:'Contraseña actualizada'});
        }catch(err){
            setAviso({tipo:'error', texto:mensajeDeError(err, 'No se pudo cambiar la contraseña')});
        }finally{
            setGuardando(false);
        }
    }

    return (
        <section aria-labelledby="titulo-contrasena" className={ESTILO_TARJETA}>
            <h2 id="titulo-contrasena" className="font-semibold">Cambiar contraseña</h2>
            <form onSubmit={guardar} className="flex flex-col gap-4">
                <input required type="password" autoComplete="current-password" value={actual} onChange={(e) => setActual(e.target.value)}
                    placeholder="Contraseña actual" aria-label="Contraseña actual" className="border rounded-lg px-3 py-2" />
                <input required type="password" autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)}
                    placeholder="Contraseña nueva" aria-label="Contraseña nueva" className="border rounded-lg px-3 py-2" />
                <input required type="password" autoComplete="new-password" value={repetida} onChange={(e) => setRepetida(e.target.value)}
                    placeholder="Repite la contraseña nueva" aria-label="Repite la contraseña nueva" className="border rounded-lg px-3 py-2" />
                <p className="text-xs text-gray-500">Mínimo 10 caracteres, con mayúscula, minúscula y número.</p>
                <TextoAviso aviso={aviso} />
                <button type="submit" disabled={guardando} className={`${ESTILO_BOTON} self-start`}>
                    {guardando ? 'Guardando...' : 'Cambiar contraseña'}
                </button>
            </form>
        </section>
    );
}
