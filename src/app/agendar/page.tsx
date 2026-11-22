import type { Metadata } from "next";
import Link from "next/link";
import AgendarVisita, { OpcionProyecto } from "@/components/AgendarVisita";
import { getProyectos } from "@/services/proyecto.service";
import { getModeloCasa } from "@/services/modeloCasa.service";

export const metadata: Metadata = {
    title: "Agendar visita",
    description: "Elige el proyecto y el modelo, y agenda tu visita a la sala de ventas.",
};

export const revalidate = 60;

export default async function Agendar() {
    let opciones: OpcionProyecto[] = [];
    let error = false;
    try {
        const [proyectos, modelos] = await Promise.all([getProyectos(), getModeloCasa()]);
        // Solo proyectos con sala de ventas, y solo modelos que no estén agotados.
        opciones = proyectos
            .filter((p) => p.salaDireccion)
            .map((p) => ({
                id: p.id,
                nombre: p.nombre,
                sala: {
                    salaDireccion: p.salaDireccion, salaHorario: p.salaHorario, salaHorarios: p.salaHorarios,
                    salaTelefono: p.salaTelefono, salaLatitud: p.salaLatitud, salaLongitud: p.salaLongitud,
                },
                modelos: modelos
                    .filter((m) => m.proyecto.id === p.id && m.estado !== 'VENDIDO')
                    .map((m) => ({ id: m.id, nombre: m.nombreModelo })),
            }))
            .filter((p) => p.modelos.length > 0);
    } catch {
        error = true;
    }

    return (
        <main className="max-w-3xl w-full mx-auto px-4 py-10 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold">Agendar visita</h1>
                <p className="text-gray-600">Elige el proyecto y el modelo que te interesa, y la fecha para visitar la sala de ventas.</p>
            </div>
            {error ? (
                <p role="alert" className="text-red-600">No pudimos cargar los proyectos. Intenta de nuevo en unos minutos.</p>
            ) : opciones.length === 0 ? (
                <p className="text-gray-600">
                    Por ahora ningún proyecto tiene sala de ventas para agendar.{' '}
                    <Link href="/#proyectos" className="text-acento underline">Ver proyectos</Link>
                </p>
            ) : (
                <AgendarVisita proyectos={opciones} />
            )}
        </main>
    );
}
