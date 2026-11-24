import { Esqueleto, Linea } from "@/components/Esqueleto";

// Misma estructura que la página: título, texto y los dos selectores.
export default function CargandoAgendar() {
    return (
        <main role="status" className="max-w-3xl w-full mx-auto px-4 py-10 flex flex-col gap-6">
            <span className="sr-only">Cargando proyectos…</span>
            <div className="flex flex-col gap-2">
                <Linea className="h-9 my-1 w-64" />
                <Linea className="h-4 my-1 w-full" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Esqueleto className="h-[72px]" />
                <Esqueleto className="h-[72px]" />
            </div>
        </main>
    );
}
