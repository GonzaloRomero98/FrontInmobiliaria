import Link from "next/link";
import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos";

// Se muestra para una URL que no existe y cuando una ficha llama a notFound(). Mismo diseño que error.tsx.
export default function NotFound() {
    return (
        <main className="max-w-xl mx-auto px-4 py-20 flex flex-col items-center gap-4 text-center">
            <h1 className="text-2xl font-bold">No encontramos esta página</h1>
            <p className="text-gray-600">
                El enlace puede estar mal escrito o la propiedad ya no está publicada.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
                <Link href="/buscar" className={`${BOTON_PRIMARIO} min-h-12 px-5`}>Buscar propiedades</Link>
                <Link href="/" className={`${BOTON_SECUNDARIO} min-h-12 px-5`}>Ir al inicio</Link>
            </div>
        </main>
    );
}
