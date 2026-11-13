import { isAxiosError } from "axios";

// Mensaje de la API (NestJS lo manda como texto o como lista de errores de validación), o el texto por defecto
export function mensajeError(err: unknown, porDefecto: string): string {
    const mensaje = isAxiosError(err) ? err.response?.data?.message : null;
    return Array.isArray(mensaje) ? mensaje.join('. ') : mensaje ?? porDefecto;
}
