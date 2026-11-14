'use client'

import { Building2, ExternalLink, House, LayoutDashboard, ListChecks, Menu, MessageSquare, ShieldCheck, Users, X, type LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import AvatarUsuario from "@/components/AvatarUsuario";
import BotonDesconectar from "@/components/BotonDesconectar";
import { NOMBRE_SITIO } from "@/lib/sitio";
import { EVENTO_PERFIL_ACTUALIZADO, getMiPerfil, Usuario } from "@/services/usuario.service";
import { EVENTO_SOLICITUDES_ACTUALIZADAS, getResumenSolicitudes } from "@/services/solicitud.service";

const PanelContext = createContext<{ perfil: Usuario | null }>({ perfil: null });
export const usePanel = () => useContext(PanelContext);

interface Item { href: string; etiqueta: string; icono: LucideIcon; soloAdmin?: boolean; soloSecretario?: boolean; insignia?: boolean; exacto?: boolean }
const GRUPOS: { titulo: string | null; items: Item[] }[] = [
    { titulo: null, items: [
        { href: '/admin', etiqueta: 'Inicio', icono: LayoutDashboard, soloAdmin: true, exacto: true },
        { href: '/secretario', etiqueta: 'Inicio', icono: LayoutDashboard, soloSecretario: true, exacto: true },
    ] },
    { titulo: 'Ventas', items: [{ href: '/secretario/solicitudes', etiqueta: 'Solicitudes', icono: MessageSquare, insignia: true }] },
    { titulo: 'Catálogo', items: [
        { href: '/admin/proyectos', etiqueta: 'Proyectos', icono: Building2, soloAdmin: true },
        { href: '/admin/modelosCasa', etiqueta: 'Modelos', icono: House, soloAdmin: true },
        { href: '/admin/caracteristicas', etiqueta: 'Características', icono: ListChecks, soloAdmin: true },
    ] },
    { titulo: 'Administración', items: [
        { href: '/admin/usuarios', etiqueta: 'Usuarios', icono: Users, soloAdmin: true },
        { href: '/admin/auditoria', etiqueta: 'Auditoría', icono: ShieldCheck, soloAdmin: true },
    ] },
];

function Navegacion({ esAdmin, pendientes, perfil, ruta }: { esAdmin: boolean; pendientes: number | null; perfil: Usuario | null; ruta: string }) {
    const grupos = GRUPOS
        .map((g) => ({ ...g, items: g.items.filter((i) => esAdmin ? !i.soloSecretario : !i.soloAdmin) }))
        .filter((g) => g.items.length > 0);
    return (
        <>
            <Link href={esAdmin ? '/admin' : '/secretario'} className="block bg-white rounded-xl px-3 py-2.5 mb-5">
                <Image src="/logo-inmocap.png" alt={NOMBRE_SITIO} width={562} height={144} className="h-8 w-auto" priority />
            </Link>
            <nav aria-label="Secciones del panel" className="flex flex-col">
                {grupos.map((g) => (
                    <div key={g.titulo ?? 'inicio'} className="flex flex-col gap-0.5">
                        {g.titulo && <p className="px-3 mt-5 mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{g.titulo}</p>}
                        {g.items.map(({ href, etiqueta, icono: Icono, insignia, exacto }) => {
                            const activo = exacto ? ruta === href : ruta === href || ruta.startsWith(`${href}/`);
                            return (
                                <Link key={href} href={href} aria-current={activo ? 'page' : undefined}
                                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${activo ? 'bg-white/15 text-white' : 'hover:bg-white/10 hover:text-white'}`}>
                                    <Icono className="w-4.5 h-4.5 shrink-0" aria-hidden />
                                    {etiqueta}
                                    {insignia && !!pendientes && (
                                        <span className="ml-auto rounded-full bg-white text-marca text-xs font-bold px-2 py-0.5 tabular-nums" aria-label={`${pendientes} sin contactar`}>
                                            {pendientes}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                ))}
                <Link href="/" className="mt-6 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-white/10 hover:text-white">
                    <ExternalLink className="w-4.5 h-4.5 shrink-0" aria-hidden />
                    Ver catálogo
                </Link>
            </nav>
            <div className="mt-auto pt-4 border-t border-white/15 flex items-center gap-3">
                <AvatarUsuario nombre={perfil?.nombre ?? '?'} fotoUrl={perfil?.fotoUrl} />
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{perfil?.nombre ?? 'Mi cuenta'}</p>
                    <p className="text-xs text-slate-400 truncate">{perfil?.correo}</p>
                    <div className="flex gap-3 mt-1 text-xs">
                        <Link href="/cuenta" className="hover:text-white underline-offset-2 hover:underline">Mi perfil</Link>
                        <BotonDesconectar className="hover:text-white underline-offset-2 hover:underline" />
                    </div>
                </div>
            </div>
        </>
    );
}

// El rol viene del servidor para que no aparezca primero el menú equivocado.
export default function PanelLayout({ rol, children }: { rol: string | undefined; children: ReactNode }) {
    const ruta = usePathname();
    const esAdmin = rol === 'ADMIN';
    const [perfil, setPerfil] = useState<Usuario | null>(null);
    const [pendientes, setPendientes] = useState<number | null>(null);
    const [menuAbierto, setMenuAbierto] = useState(false);
    const botonMenu = useRef<HTMLButtonElement>(null);
    const botonCerrar = useRef<HTMLButtonElement>(null);
    const panelMenu = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const cargar = () => { getMiPerfil().then(setPerfil).catch(() => setPerfil(null)); };
        cargar();
        window.addEventListener(EVENTO_PERFIL_ACTUALIZADO, cargar);
        return () => window.removeEventListener(EVENTO_PERFIL_ACTUALIZADO, cargar);
    }, []);

    useEffect(() => {
        const cargar = () => { getResumenSolicitudes().then((r) => setPendientes(r.pendientes)).catch(() => {}); };
        cargar();
        window.addEventListener(EVENTO_SOLICITUDES_ACTUALIZADAS, cargar);
        return () => window.removeEventListener(EVENTO_SOLICITUDES_ACTUALIZADAS, cargar);
    }, [ruta]);

    // eslint-disable-next-line react-hooks/set-state-in-effect -- el menú móvil se cierra al cambiar de página
    useEffect(() => { setMenuAbierto(false); }, [ruta]);

    useEffect(() => {
        if (!menuAbierto) return;
        botonCerrar.current?.focus();
        const alTecla = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setMenuAbierto(false);
                botonMenu.current?.focus();
            }
            // El menú es un diálogo modal, así que Tab da la vuelta dentro de él.
            if (e.key === 'Tab' && panelMenu.current) {
                const enfocables = panelMenu.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
                const primero = enfocables[0], ultimo = enfocables[enfocables.length - 1];
                const dentro = panelMenu.current.contains(document.activeElement);
                if (e.shiftKey && (document.activeElement === primero || !dentro)) { e.preventDefault(); ultimo?.focus(); }
                else if (!e.shiftKey && (document.activeElement === ultimo || !dentro)) { e.preventDefault(); primero?.focus(); }
            }
        };
        document.addEventListener('keydown', alTecla);
        return () => document.removeEventListener('keydown', alTecla);
    }, [menuAbierto]);

    const navegacion = <Navegacion esAdmin={esAdmin} pendientes={pendientes} perfil={perfil} ruta={ruta} />;

    return (
        <PanelContext.Provider value={{ perfil }}>
            <div className="lg:flex min-h-screen bg-slate-50">
                <aside className="hidden lg:flex print:hidden w-64 shrink-0 sticky top-0 h-screen overflow-y-auto flex-col bg-marca text-slate-300 px-4 py-5">
                    {navegacion}
                </aside>

                <div className="lg:hidden print:hidden sticky top-0 z-40 flex items-center justify-between gap-3 bg-marca px-4 h-14">
                    <Link href={esAdmin ? '/admin' : '/secretario'} className="bg-white rounded-lg px-2 py-1.5">
                        <Image src="/logo-inmocap.png" alt={NOMBRE_SITIO} width={562} height={144} className="h-6 w-auto" />
                    </Link>
                    <button ref={botonMenu} type="button" onClick={() => setMenuAbierto(true)} aria-expanded={menuAbierto} aria-controls="menu-panel"
                        className="flex items-center gap-2 text-white rounded-lg px-2 py-1.5 hover:bg-white/10">
                        {!!pendientes && <span className="rounded-full bg-white text-marca text-xs font-bold px-2 py-0.5 tabular-nums" aria-label={`${pendientes} solicitudes sin contactar`}>{pendientes}</span>}
                        <Menu className="w-6 h-6" aria-hidden />
                        <span className="sr-only">Abrir menú</span>
                    </button>
                </div>
                {menuAbierto && (
                    <div className="lg:hidden print:hidden fixed inset-0 z-50">
                        <div className="absolute inset-0 bg-black/40" onClick={() => setMenuAbierto(false)} aria-hidden />
                        <div ref={panelMenu} id="menu-panel" role="dialog" aria-modal="true" aria-label="Menú del panel"
                            className="absolute inset-y-0 left-0 w-72 max-w-[85vw] flex flex-col overflow-y-auto bg-marca text-slate-300 px-4 py-5">
                            <button ref={botonCerrar} type="button" onClick={() => { setMenuAbierto(false); botonMenu.current?.focus(); }}
                                className="self-end -mt-1 mb-2 text-white rounded-lg p-1.5 hover:bg-white/10">
                                <X className="w-5 h-5" aria-hidden />
                                <span className="sr-only">Cerrar menú</span>
                            </button>
                            {navegacion}
                        </div>
                    </div>
                )}

                <div className="flex-1 min-w-0">{children}</div>
            </div>
        </PanelContext.Provider>
    );
}
