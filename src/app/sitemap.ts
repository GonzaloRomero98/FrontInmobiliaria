import type { MetadataRoute } from "next";
import { getProyectos } from "@/services/proyecto.service";
import { getModeloCasa } from "@/services/modeloCasa.service";
import { URL_SITIO } from "@/lib/sitio";

export const revalidate = 3600;

// Mapa del sitio para buscadores: páginas fijas + cada proyecto y modelo publicado
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const fijas: MetadataRoute.Sitemap = [
        { url: `${URL_SITIO}/`, changeFrequency: 'daily', priority: 1 },
        { url: `${URL_SITIO}/buscar`, changeFrequency: 'daily', priority: 0.8 },
        { url: `${URL_SITIO}/privacidad`, changeFrequency: 'yearly', priority: 0.1 },
    ];
    try {
        const [proyectos, modelos] = await Promise.all([getProyectos(), getModeloCasa()]);
        return [
            ...fijas,
            ...proyectos.map((p) => ({ url: `${URL_SITIO}/proyectos/${p.id}`, lastModified: p.creadoEn, priority: 0.7 })),
            ...modelos.map((m) => ({ url: `${URL_SITIO}/modelosCasa/${m.id}`, lastModified: m.creadoEn, priority: 0.6 })),
        ];
    } catch {
        return fijas;
    }
}
