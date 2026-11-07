'use client'

import { getMetricas, Metricas } from "@/services/metricas.service";
import Link from "next/link";
import { useEffect, useState } from "react";

function Cifra({valor, etiqueta, href}:{valor:number; etiqueta:string; href?:string}){
    const contenido = (
        <>
            <p className="text-3xl font-bold">{valor}</p>
            <p className="text-sm text-gray-500">{etiqueta}</p>
        </>
    );
    return href
        ? <Link href={href} className="p-4 border rounded-xl hover:shadow-lg transition-shadow">{contenido}</Link>
        : <div className="p-4 border rounded-xl">{contenido}</div>;
}

export default function AdminDashboard(){
    const [metricas, setMetricas] = useState<Metricas | null>(null);
    const [error, setError] = useState(false);

    useEffect(()=>{
        getMetricas().then(setMetricas).catch(()=> setError(true));
    },[]);

    return(
    <main className="max-w-5xl mx-auto px-4 py-10">
        {/* Perfil y cierre de sesión están en el menú del usuario del encabezado */}
        <h1 className="text-2xl font-bold mb-8">Panel de administracion</h1>

        {error && <p className="text-red-500 text-sm mb-6">No se pudieron cargar las métricas</p>}
        {metricas && (
            <section aria-label="Resumen" className="mb-10">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Cifra valor={metricas.solicitudes.pendientes} etiqueta="Solicitudes pendientes" href="/secretario" />
                    <Cifra valor={metricas.solicitudes.ultimos30Dias} etiqueta="Solicitudes últimos 30 días" />
                    <Cifra valor={metricas.modelos.publicados} etiqueta={`Modelos publicados (${metricas.modelos.borradores} borradores)`} href="/admin/modelosCasa" />
                    <Cifra valor={metricas.proyectosActivos} etiqueta="Proyectos activos" href="/admin/proyectos" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div className="p-4 border rounded-xl">
                        <h2 className="font-semibold mb-2">Inventario</h2>
                        <p className="text-sm text-gray-700">{metricas.modelos.disponibles} disponibles · {metricas.modelos.reservados} reservados · {metricas.modelos.vendidos} vendidos</p>
                    </div>
                    <div className="p-4 border rounded-xl">
                        <h2 className="font-semibold mb-2">Modelos más consultados</h2>
                        {metricas.masSolicitados.length === 0 ? (
                            <p className="text-sm text-gray-500">Aún no hay solicitudes.</p>
                        ) : (
                            <ol className="text-sm text-gray-700 list-decimal list-inside">
                                {metricas.masSolicitados.map((m) => (
                                    <li key={m.id}>{m.nombreModelo} — {m.solicitudes}</li>
                                ))}
                            </ol>
                        )}
                    </div>
                </div>
            </section>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href='/secretario' className="p-6 border rounded-xl hover:shadow-lg transition-shadow">
                <h2 className="font-semibold text-lg">Solicitudes</h2>
                <p className="text-gray-500 text-sm mt-1">Interesados por contactar: WhatsApp, correo y estado</p>
            </Link>

            <Link href='/admin/proyectos/nuevo' className="p-6 border rounded-xl hover:shadow-lg transition-shadow">
                <h2 className="font-semibold text-lg">Crear proyecto</h2>
                <p className="text-gray-500 text-sm mt-1">Registra un nuevo condominio o edificio</p>
            </Link>

            <Link href='/admin/proyectos' className="p-6 border rounded-xl hover:shadow-lg transition-shadow">
                <h2 className="font-semibold text-lg">Proyectos</h2>
                <p className="text-gray-500 text-sm mt-1">Editar, despublicar, ubicación, entorno y normativa</p>
            </Link>

            <Link href='/admin/modelosCasa/nuevo' className="p-6 border rounded-xl hover:shadow-lg transition-shadow">
                <h2 className="font-semibold text-lg">Crear modelo casa</h2>
                <p className="text-gray-500 text-sm mt-1">Agrega un nuevo modelo para un proyecto que exista</p>
            </Link>

            <Link href='/admin/modelosCasa' className="p-6 border rounded-xl hover:shadow-lg transition-shadow">
                <h2 className="font-semibold text-lg">Modelos de casa</h2>
                <p className="text-gray-500 text-sm mt-1">Editar, despublicar y gestionar su galería de fotos</p>
            </Link>

            <Link href='/admin/caracteristicas' className="p-6 border rounded-xl hover:shadow-lg transition-shadow">
                <h2 className="font-semibold text-lg">Caracteristicas</h2>
                <p className="text-gray-500 text-sm mt-1">Piscina, quincho y otras comodidades</p>
            </Link>

            <Link href='/admin/usuarios' className="p-6 border rounded-xl hover:shadow-lg transition-shadow">
                <h2 className="font-semibold text-lg">Usuarios</h2>
                <p className="text-gray-500 text-sm mt-1">Crear secretarios, desactivar cuentas y restablecer contraseñas</p>
            </Link>

            <Link href='/admin/auditoria' className="p-6 border rounded-xl hover:shadow-lg transition-shadow">
                <h2 className="font-semibold text-lg">Auditoría</h2>
                <p className="text-gray-500 text-sm mt-1">Quién cambió qué, accesos rechazados y exportaciones</p>
            </Link>

            <Link href='/' className="p-6 border rounded-xl hover:shadow-lg transition-shadow">
                <h2 className="font-semibold text-lg">Ver catalogo</h2>
                <p className="text-gray-500 text-sm mt-1">Vista previa de como se ve el catalogo</p>
            </Link>
        </div>
    </main>
    );
}