import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";
import { ETIQUETA_VISITA, EstadoVisita } from "@/types/solicitud";

export const ZONA = 'America/Santiago';

export const numero = (n: number) => n.toLocaleString('es-CL');

export function hace(iso: string): string {
    const minutos = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
    const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
    if (minutos < 60) return rtf.format(-minutos, 'minute');
    if (minutos < 24 * 60) return rtf.format(-Math.round(minutos / 60), 'hour');
    return rtf.format(-Math.round(minutos / (24 * 60)), 'day');
}

export function Tarjeta({ titulo, enlace, extra, children, id }: { titulo: string; enlace?: { href: string; texto: string }; extra?: ReactNode; children: ReactNode; id?: string }) {
    const idTitulo = `${id ?? titulo}-titulo`;
    return (
        <section id={id} aria-labelledby={idTitulo} className="bg-white border rounded-2xl p-5 scroll-mt-20">
            <div className="flex items-center justify-between gap-3 mb-4">
                <h2 id={idTitulo} className="text-base font-bold">{titulo}</h2>
                {enlace && <Link href={enlace.href} className="text-sm font-medium text-acento hover:underline">{enlace.texto} →</Link>}
                {extra}
            </div>
            {children}
        </section>
    );
}

export function Accion({ cifra, texto, href, enlace }: { cifra: number; texto: string; href: string; enlace: string }) {
    return (
        <Link href={href} className="group flex flex-col bg-acento-suave border border-acento/20 rounded-2xl p-5 hover:border-acento/50 transition-colors">
            <span className="font-titulo text-4xl font-bold text-marca tabular-nums">{numero(cifra)}</span>
            <span className="font-semibold text-marca mt-1">{texto}</span>
            <span className="mt-auto pt-3 text-sm font-semibold text-acento inline-flex items-center gap-1">
                {enlace} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
        </Link>
    );
}

export function Informativa({ cifra, texto, children }: { cifra: number; texto: string; children?: ReactNode }) {
    return (
        <div className="px-5 py-4">
            <p className="font-titulo text-2xl font-bold text-marca tabular-nums">{numero(cifra)}</p>
            <p className="text-sm text-slate-600">{texto}{children}</p>
        </div>
    );
}

export interface Visita { id: string; nombre: string; apellido: string; visitaPreferida: string; visitaEstado: EstadoVisita | null; modelo: string | null; proyecto: string | null }

const parteFecha = (iso: string, opciones: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleString('es-CL', { timeZone: ZONA, ...opciones });

export function Dia({ iso }: { iso: string }) {
    return (
        <span className="w-12 shrink-0 text-center border rounded-lg py-1 leading-tight">
            <span className="block text-[11px] uppercase text-slate-600">{parteFecha(iso, { weekday: 'short' }).replace('.', '')}</span>
            <span className="font-titulo font-bold text-lg text-marca tabular-nums">{parteFecha(iso, { day: 'numeric' })}</span>
        </span>
    );
}

export const hora = (iso: string) => parteFecha(iso, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

export function ProximasVisitas({ visitas }: { visitas: Visita[] }) {
    if (visitas.length === 0) return <p className="text-sm text-slate-600">No hay visitas agendadas para los próximos 7 días.</p>;
    return (
        <ul className="divide-y divide-slate-100">
            {visitas.map((v) => (
                <li key={v.id} className="flex gap-3 py-2.5 first:pt-0 last:pb-0">
                    <Dia iso={v.visitaPreferida} />
                    <div className="min-w-0">
                        <Link href={`/secretario/solicitudes/${v.id}`} className="block font-semibold text-marca truncate hover:underline">
                            {v.nombre} {v.apellido} · {hora(v.visitaPreferida)}
                        </Link>
                        <p className="text-sm text-slate-600 truncate">
                            {v.visitaEstado && <span className={v.visitaEstado === 'POR_CONFIRMAR' ? 'font-semibold text-amber-700' : 'text-green-700'}>{ETIQUETA_VISITA[v.visitaEstado]} · </span>}
                            {[v.modelo, v.proyecto].filter(Boolean).join(' · ')}
                        </p>
                    </div>
                </li>
            ))}
        </ul>
    );
}

export function Esqueleto({ className }: { className: string }) {
    return <div className={`animate-pulse bg-slate-200/70 rounded-2xl ${className}`} />;
}
