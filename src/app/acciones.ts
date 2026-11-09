'use server';
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

// Las páginas públicas se cachean (revalidate = 60): tras un cambio del admin se invalidan para que se vean al refrescar.
// shortcut: confía en la cookie de rol (falsificable); lo peor que se logra es regenerar el caché antes de tiempo.
export async function refrescarCatalogo() {
    if ((await cookies()).get('rol_usuario')?.value !== 'ADMIN') return;
    revalidatePath('/', 'layout');
}
