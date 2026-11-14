import Link from "next/link";
import { NOMBRE_SITIO } from "@/lib/sitio";

export default function PieDePagina() {
    return (
        <footer className="bg-marca mt-16">
            <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row gap-4 justify-between text-sm text-gray-300">
                <p>© {new Date().getFullYear()} {NOMBRE_SITIO}. Precios y valores referenciales.</p>
                <div className="flex gap-4 -my-3">
                    <Link href="/privacidad" className="inline-flex items-center min-h-11 hover:underline">Política de privacidad</Link>
                    <a href="https://www.openstreetmap.org/copyright" className="inline-flex items-center min-h-11 hover:underline" target="_blank" rel="noreferrer">
                        Mapas © OpenStreetMap
                    </a>
                </div>
            </div>
        </footer>
    );
}
