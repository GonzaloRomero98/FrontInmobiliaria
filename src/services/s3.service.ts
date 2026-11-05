// services/s3.service.ts
import { api } from "@/lib/api";

interface PresignedUrlResponse {
    uploadUrl: string;
    publicUrl: string;
    key: string;
    contentType: string;
}

// Los navegadores suelen dejar vacío el tipo de los modelos 3D
const TIPOS_POR_EXTENSION: Record<string, string> = {
    glb: 'model/gltf-binary',
    gltf: 'model/gltf+json',
};

function tipoDeArchivo(archivo: File): string {
    const extension = archivo.name.split('.').pop()?.toLowerCase() ?? '';
    return archivo.type || TIPOS_POR_EXTENSION[extension] || 'application/octet-stream';
}

export async function obtenerUrlSubida(
    archivo: File,
    carpeta: 'proyectos' | 'modelosImagenes' | 'modelos3D',
): Promise<PresignedUrlResponse> {
    const { data } = await api.post('/s3/presigned-url', {
        archivo: archivo.name,
        contentType: tipoDeArchivo(archivo),
        tamano: archivo.size,
        carpeta,
    });
    return data;
}

// contentType debe ser el mismo con el que se firmó la URL (viene en la respuesta de obtenerUrlSubida)
export function subirArchivo(archivo: File, url: string, contentType: string, onProgress?: (pct: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', url);
        xhr.setRequestHeader('Content-Type', contentType);
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) {
                onProgress(Math.round((e.loaded / e.total) * 100));
            }
        };
        xhr.onload = () => (xhr.status === 200 ? resolve() : reject(new Error('Error al subir el archivo')));
        xhr.onerror = () => reject(new Error('Error de red al subir el archivo'));
        xhr.send(archivo);
    });
}
