'use server';
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

// Las páginas públicas quedan en caché 60 segundos. Cuando el admin cambia algo se invalida el caché para que el cambio se vea al recargar.
// Mejora pendiente: solo se revisa la cookie de rol, que se puede falsificar. En el peor caso alguien fuerza a regenerar el caché antes de tiempo.
export async function refrescarCatalogo() {
    if ((await cookies()).get('rol_usuario')?.value !== 'ADMIN') return;
    revalidatePath('/', 'layout');
}
