import { WHATSAPP_NUMERO } from "@/lib/sitio";

interface BotonWhatsAppProps {
    mensaje: string;
    className?: string;
}

// Abre WhatsApp con un mensaje prellenado. No se muestra si NEXT_PUBLIC_WHATSAPP_NUMERO no está configurado.
export default function BotonWhatsApp({ mensaje, className = '' }: BotonWhatsAppProps) {
    if (!WHATSAPP_NUMERO) return null;
    const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;
    return (
        <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className={`flex items-center justify-center gap-2 rounded-lg py-3 px-4 font-medium text-white bg-[#25D366] hover:bg-[#1ebe5b] transition-colors ${className}`}
        >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.43 9.43 0 1 1 7.99 4.42zm8.02-17.45A11.33 11.33 0 0 0 12.04.7C5.79.7.7 5.78.7 12.03c0 2 .52 3.95 1.52 5.67L.6 23.3l5.74-1.5a11.3 11.3 0 0 0 5.7 1.45c6.24 0 11.33-5.09 11.33-11.34 0-3.03-1.18-5.87-3.31-8.01z" />
            </svg>
            Consultar por WhatsApp
        </a>
    );
}
