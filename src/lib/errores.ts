import { isAxiosError } from "axios";

// NestJS envía el error como texto o como lista de errores de validación.
export function mensajeError(err: unknown, porDefecto: string): string {
    const mensaje = isAxiosError(err) ? err.response?.data?.message : null;
    return Array.isArray(mensaje) ? mensaje.join('. ') : mensaje ?? porDefecto;
}
