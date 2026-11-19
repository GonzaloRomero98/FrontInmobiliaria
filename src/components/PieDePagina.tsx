import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { CONTACTO, DESCRIPCION_SITIO, NOMBRE_SITIO } from "@/lib/sitio";

const ENLACE = "inline-flex items-center min-h-11 hover:text-white transition-colors";
const TITULO = "text-sm font-semibold uppercase tracking-wider text-white";

const COLUMNAS = [
    {
        titulo: 'Enlaces rápidos',
        enlaces: [
            { href: '/buscar', texto: 'Buscar propiedades' },
            { href: '/comparar', texto: 'Comparar modelos' },
            { href: '/login', texto: 'Ingresar' },
        ],
    },
    {
        titulo: 'Navegación',
        enlaces: [
            { href: '/#proyectos', texto: 'Proyectos' },
            { href: '/#beneficios', texto: 'Beneficios' },
            { href: '/#ubicacion', texto: 'Ubicación' },
        ],
    },
];

export default function PieDePagina() {
    return (
        <footer className="bg-marca mt-16 text-gray-300">
            <div className="max-w-6xl mx-auto px-4 pt-14 pb-8 flex flex-col gap-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] gap-10">
                    <div className="flex flex-col gap-3">
                        <p className="font-titulo text-2xl font-extrabold tracking-tight text-white">{NOMBRE_SITIO.toUpperCase()}</p>
                        <p className="text-sm max-w-xs">{DESCRIPCION_SITIO}</p>
                    </div>

                    {COLUMNAS.map((c) => (
                        <nav key={c.titulo} aria-label={c.titulo} className="flex flex-col gap-2">
                            <p className={TITULO}>{c.titulo}</p>
                            <ul className="flex flex-col text-sm">
                                {c.enlaces.map((e) => <li key={e.href}><Link href={e.href} className={ENLACE}>{e.texto}</Link></li>)}
                            </ul>
                        </nav>
                    ))}

                    <div className="flex flex-col gap-2">
                        <p className={TITULO}>Contacto</p>
                        <ul className="flex flex-col text-sm">
                            <li className="flex items-center gap-2 min-h-11">
                                <MapPin className="w-4 h-4 shrink-0 text-acento-suave" aria-hidden="true" />
                                {CONTACTO.direccion}
                            </li>
                            <li>
                                <a href={CONTACTO.telefonoEnlace} className={`${ENLACE} gap-2`}>
                                    <Phone className="w-4 h-4 shrink-0 text-acento-suave" aria-hidden="true" />
                                    {CONTACTO.telefono}
                                </a>
                            </li>
                            <li>
                                <a href={`mailto:${CONTACTO.correo}`} className={`${ENLACE} gap-2`}>
                                    <Mail className="w-4 h-4 shrink-0 text-acento-suave" aria-hidden="true" />
                                    {CONTACTO.correo}
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-between border-t border-white/10 pt-6 text-sm text-gray-400">
                    <p className="flex items-center">© {new Date().getFullYear()} {NOMBRE_SITIO}. Precios y valores referenciales.</p>
                    <div className="flex flex-wrap gap-x-4 -my-3">
                        <Link href="/privacidad" className={ENLACE}>Política de privacidad</Link>
                        <a href="https://www.openstreetmap.org/copyright" className={ENLACE} target="_blank" rel="noreferrer">
                            Mapas © OpenStreetMap
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
