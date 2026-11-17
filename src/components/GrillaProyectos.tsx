'use client'

import { useState } from "react";
import ProyectoCard, { ResumenPrecio } from "@/components/ProyectoCard";
import { Proyecto } from "@/types/proyecto";

const TODOS = 'TODOS';
const ENTREGA = 'ENTREGA_INMEDIATA';

// Las pestañas salen de los datos: una por comuna con proyectos y "Entrega inmediata" si algún proyecto lo está.
export default function GrillaProyectos({ proyectos }: { proyectos: { proyecto: Proyecto; precio?: ResumenPrecio }[] }) {
    const [filtro, setFiltro] = useState(TODOS);

    const comunas = [...new Set(proyectos.map(({ proyecto }) => proyecto.ciudad.nombre))].sort((a, b) => a.localeCompare(b, 'es'));
    const hayEntrega = proyectos.some(({ proyecto }) => proyecto.etapa === ENTREGA);
    const pestanas = [
        { valor: TODOS, texto: 'Todos' },
        ...comunas.map((c) => ({ valor: c, texto: c })),
        ...(hayEntrega ? [{ valor: ENTREGA, texto: 'Entrega inmediata' }] : []),
    ];
    const visibles = proyectos.filter(({ proyecto }) =>
        filtro === TODOS || (filtro === ENTREGA ? proyecto.etapa === ENTREGA : proyecto.ciudad.nombre === filtro));

    return (
        <div className="flex flex-col gap-6">
            {pestanas.length > 2 && (
                <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar proyectos">
                    {pestanas.map((p) => (
                        <button key={p.valor} type="button" aria-pressed={filtro === p.valor} onClick={() => setFiltro(p.valor)}
                            className={`min-h-11 px-4 rounded-full text-sm font-medium border transition-colors ${filtro === p.valor
                                ? 'bg-marca border-marca text-white shadow-sm'
                                : 'bg-white text-gray-700 hover:border-acento hover:text-marca'}`}>
                            {p.texto}
                        </button>
                    ))}
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibles.map(({ proyecto, precio }) => <ProyectoCard key={proyecto.id} proyecto={proyecto} precio={precio} />)}
            </div>
        </div>
    );
}
