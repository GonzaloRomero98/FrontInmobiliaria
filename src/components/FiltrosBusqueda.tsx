'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { gerRegiones, getCiudades } from "@/services/ubicacion.service";
import { Ciudad, Region } from "@/types/ubicacion";
import { FiltrosBusqueda as Filtros, Operacion } from "@/types/modeloCasa";

const MINIMOS = ['1', '2', '3', '4'];

// Cada operación se publica en su moneda habitual: venta en UF y arriendo en pesos
const MONEDA_POR_OPERACION: Record<Operacion, 'UF' | 'CLP'> = { VENTA: 'UF', ARRIENDO: 'CLP' };

export default function FiltrosBusqueda({ iniciales }: { iniciales: Filtros }) {
    const router = useRouter();
    const [filtros, setFiltros] = useState<Filtros>(iniciales);
    const [regiones, setRegiones] = useState<Region[]>([]);
    const [ciudades, setCiudades] = useState<Ciudad[]>([]);

    useEffect(() => {
        gerRegiones().then(setRegiones).catch(() => setRegiones([]));
    }, []);

    useEffect(() => {
        if (!filtros.id_region) return;
        getCiudades(Number(filtros.id_region)).then(setCiudades).catch(() => setCiudades([]));
    }, [filtros.id_region]);

    // Sin región elegida no se ofrecen comunas (las cargadas antes quedan de otra región)
    const ciudadesDeRegion = filtros.id_region ? ciudades : [];

    function cambiar<K extends keyof Filtros>(clave: K, valor: Filtros[K] | '') {
        setFiltros((actual) => {
            const siguiente = { ...actual, [clave]: valor || undefined };
            if (clave === 'id_region') siguiente.id_ciudad = undefined;
            if (clave === 'tipoOperacion') {
                // Al cambiar de operación, el rango de precio deja de tener sentido (cambia la moneda)
                siguiente.precioMin = undefined;
                siguiente.precioMax = undefined;
            }
            return siguiente;
        });
    }

    function buscar(e: React.FormEvent) {
        e.preventDefault();
        const moneda = filtros.tipoOperacion ? MONEDA_POR_OPERACION[filtros.tipoOperacion] : undefined;
        const params = new URLSearchParams();
        for (const [clave, valor] of Object.entries({ ...filtros, moneda: filtros.precioMin || filtros.precioMax ? moneda : undefined })) {
            if (valor) params.set(clave, String(valor));
        }
        router.push(`/buscar${params.size ? `?${params}` : ''}`);
    }

    const moneda = filtros.tipoOperacion ? MONEDA_POR_OPERACION[filtros.tipoOperacion] : null;
    const campo = "w-full border rounded-lg px-3 py-2 bg-white";

    return (
        <form onSubmit={buscar} className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 border rounded-xl bg-gray-50">
            <label className="flex flex-col gap-1 text-sm col-span-2 lg:col-span-1">
                Operación
                <select value={filtros.tipoOperacion ?? ''} onChange={(e) => cambiar('tipoOperacion', e.target.value as Operacion)} className={campo}>
                    <option value="">Venta o arriendo</option>
                    <option value="VENTA">Venta</option>
                    <option value="ARRIENDO">Arriendo</option>
                </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
                Región
                <select value={filtros.id_region ?? ''} onChange={(e) => cambiar('id_region', e.target.value)} className={campo}>
                    <option value="">Todas</option>
                    {regiones.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
                Comuna
                <select value={filtros.id_ciudad ?? ''} onChange={(e) => cambiar('id_ciudad', e.target.value)} className={campo} disabled={!filtros.id_region}>
                    <option value="">Todas</option>
                    {ciudadesDeRegion.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
                Ordenar por
                <select value={filtros.orden ?? ''} onChange={(e) => cambiar('orden', e.target.value as Filtros['orden'])} className={campo}>
                    <option value="">Nombre</option>
                    <option value="precio_asc">Menor precio</option>
                    <option value="precio_desc">Mayor precio</option>
                    <option value="superficie_desc">Mayor superficie</option>
                    <option value="recientes">Más recientes</option>
                </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
                Precio desde {moneda && `(${moneda})`}
                <input type="number" min={0} inputMode="numeric" value={filtros.precioMin ?? ''} disabled={!moneda}
                    onChange={(e) => cambiar('precioMin', e.target.value)} placeholder={moneda ? 'Mínimo' : 'Elige operación'} className={campo} />
            </label>

            <label className="flex flex-col gap-1 text-sm">
                Precio hasta {moneda && `(${moneda})`}
                <input type="number" min={0} inputMode="numeric" value={filtros.precioMax ?? ''} disabled={!moneda}
                    onChange={(e) => cambiar('precioMax', e.target.value)} placeholder={moneda ? 'Máximo' : 'Elige operación'} className={campo} />
            </label>

            <label className="flex flex-col gap-1 text-sm">
                Dormitorios
                <select value={filtros.dormitorios ?? ''} onChange={(e) => cambiar('dormitorios', e.target.value)} className={campo}>
                    <option value="">Cualquiera</option>
                    {MINIMOS.map((n) => <option key={n} value={n}>{n}+</option>)}
                </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
                Baños
                <select value={filtros.banos ?? ''} onChange={(e) => cambiar('banos', e.target.value)} className={campo}>
                    <option value="">Cualquiera</option>
                    {MINIMOS.slice(0, 3).map((n) => <option key={n} value={n}>{n}+</option>)}
                </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
                Superficie mínima (m²)
                <input type="number" min={0} inputMode="numeric" value={filtros.superficieMin ?? ''}
                    onChange={(e) => cambiar('superficieMin', e.target.value)} placeholder="Ej: 70" className={campo} />
            </label>

            <label className="flex items-center gap-2 text-sm self-end pb-2">
                <input type="checkbox" checked={filtros.mascotas === 'true'} onChange={(e) => cambiar('mascotas', e.target.checked ? 'true' : '')} />
                Acepta mascotas
            </label>

            <div className="col-span-2 flex gap-2 self-end">
                <button type="submit" className="flex-1 bg-marca text-white rounded-lg py-2.5 font-medium">Buscar</button>
                <button type="button" onClick={() => { setFiltros({}); router.push('/buscar'); }} className="px-4 border rounded-lg bg-white">
                    Limpiar
                </button>
            </div>
        </form>
    );
}
