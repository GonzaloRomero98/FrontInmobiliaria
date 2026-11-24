import { Rotate3d } from "lucide-react";

// Bloques que ocupan el lugar del contenido mientras carga, con su mismo tamaño para que nada salte al aparecer.
// Son decorativos (aria-hidden): el aviso para lectores de pantalla va en un role="status" del contenedor.

// Color y pulso de todos los bloques. Sin pulso si la persona pidió reducir el movimiento.
export const ESQUELETO = "animate-pulse motion-reduce:animate-none bg-gray-200/70";

export function Esqueleto({ className }: { className: string }) {
    return <div aria-hidden="true" className={`${ESQUELETO} rounded-2xl ${className}`} />;
}

// Una línea de texto. El alto más el margen da el alto de la línea real:
// text-sm = h-3 my-1 (20 px), text-base = h-4 my-1 (24 px), text-lg y text-xl = h-5 my-1 (28 px).
export function Linea({ className }: { className: string }) {
    return <div aria-hidden="true" className={`${ESQUELETO} rounded-md ${className}`} />;
}

// Misma forma que ModeloCasaCard: foto 16:10, nombre, proyecto, precio, datos y botón.
export function EsqueletoTarjeta() {
    return (
        <div aria-hidden="true" className="flex flex-col h-full rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm">
            <div className={`${ESQUELETO} aspect-[16/10]`} />
            <div className="flex flex-col flex-1 gap-3 p-5">
                <div>
                    <Linea className="h-5 my-1 w-3/4" />
                    <Linea className="h-3 mt-2 mb-1 w-1/2" />
                </div>
                <div>
                    <Linea className="h-5 my-1 w-2/5" />
                    <Linea className="h-3 my-1 w-1/3" />
                </div>
                <div>
                    <Linea className="h-3 my-1 w-3/5" />
                    <Linea className="h-3 mt-2 mb-1 w-2/5" />
                </div>
                <div className={`${ESQUELETO} mt-auto min-h-11 rounded-xl`} />
            </div>
        </div>
    );
}

// Tapa el visor 3D o el recorrido mientras baja el modelo. La barra muestra el avance real de la descarga (0 a 1).
// El contenedor tiene que ser relative y tener su alto propio.
export function CargandoVisor({ texto, progreso = 0 }: { texto: string; progreso?: number }) {
    return (
        <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-hidden rounded-xl bg-gray-100">
            <Rotate3d aria-hidden="true" className="size-10 text-gray-400 animate-pulse motion-reduce:animate-none" />
            <p className="text-sm text-gray-600">{texto}…</p>
            {/* Solo aparece con el primer dato de avance; si el servidor no informa el tamaño, queda el texto. */}
            {progreso > 0 && (
                <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 bg-gray-200">
                    <div className="h-full origin-left bg-acento transition-transform duration-300 ease-out motion-reduce:transition-none"
                        style={{ transform: `scaleX(${Math.min(1, progreso)})` }} />
                </div>
            )}
        </div>
    );
}
