import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Política de privacidad",
};

// Revisar y completar los datos marcados entre corchetes antes de publicar.
const RESPONSABLE = "[Nombre de la inmobiliaria]";
const CORREO_CONTACTO = "[correo@inmobiliaria.cl]";
const DIAS_RETENCION = 365;

export default function PoliticaPrivacidad() {
    return (
        <main className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-6">
            <h1 className="text-3xl font-bold">Política de privacidad</h1>

            <section className="flex flex-col gap-2">
                <h2 className="text-xl font-semibold">Qué datos recopilamos</h2>
                <p>
                    Cuando envías el formulario de contacto de una propiedad guardamos tu nombre, apellido,
                    correo electrónico, número de celular, el mensaje que escribas (opcional), la propiedad
                    consultada y la fecha en que aceptaste esta política.
                </p>
            </section>

            <section className="flex flex-col gap-2">
                <h2 className="text-xl font-semibold">Para qué los usamos</h2>
                <p>
                    Solo para contactarte y responder tu consulta sobre la propiedad. No los usamos para
                    publicidad ni los compartimos con terceros.
                </p>
            </section>

            <section className="flex flex-col gap-2">
                <h2 className="text-xl font-semibold">Cuánto tiempo los guardamos</h2>
                <p>
                    Tus datos se eliminan automáticamente {DIAS_RETENCION} días después de enviada la
                    solicitud, o antes si lo pides.
                </p>
                <p>
                    Si realizas una reserva o compra, tus datos se conservan mientras dure la relación
                    contractual y los plazos legales que correspondan.
                </p>
            </section>

            <section className="flex flex-col gap-2">
                <h2 className="text-xl font-semibold">Quién puede verlos y cómo los protegemos</h2>
                <p>
                    Solo el personal autorizado de {RESPONSABLE} que gestiona las solicitudes. El acceso
                    requiere usuario y contraseña, queda registrado, y los datos viajan y se almacenan en
                    servidores con conexiones cifradas.
                </p>
            </section>

            <section className="flex flex-col gap-2">
                <h2 className="text-xl font-semibold">Tus derechos</h2>
                <p>
                    Puedes pedir acceder a tus datos, corregirlos, eliminarlos u oponerte a su uso
                    escribiendo a <a href={`mailto:${CORREO_CONTACTO}`} className="underline">{CORREO_CONTACTO}</a> desde
                    el correo con que enviaste la solicitud.
                </p>
            </section>

            <p className="text-sm text-gray-500">Responsable del tratamiento: {RESPONSABLE}.</p>
        </main>
    );
}
