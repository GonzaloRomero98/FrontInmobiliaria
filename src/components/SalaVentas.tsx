import { Proyecto, urlComoLlegar } from "@/types/proyecto";

type DatosSala = Pick<Proyecto, 'salaDireccion' | 'salaHorario' | 'salaTelefono' | 'salaLatitud' | 'salaLongitud'>;

export default function SalaVentas({ proyecto, className = '' }: { proyecto: DatosSala; className?: string }) {
    if (!proyecto.salaDireccion) return null;
    return (
        <section className={`p-5 border rounded-2xl flex flex-col gap-1 text-sm ${className}`} aria-labelledby="titulo-sala">
            <h2 id="titulo-sala" className="font-semibold text-base mb-1">Sala de ventas</h2>
            <p className="text-gray-900">{proyecto.salaDireccion}</p>
            {proyecto.salaHorario && <p className="text-gray-600">{proyecto.salaHorario}</p>}
            {proyecto.salaTelefono && (
                <a href={`tel:${proyecto.salaTelefono.replace(/\s/g, '')}`} className="underline">{proyecto.salaTelefono}</a>
            )}
            <a href={urlComoLlegar(proyecto)} target="_blank" rel="noopener noreferrer" className="text-acento underline mt-1">
                Cómo llegar
            </a>
        </section>
    );
}
