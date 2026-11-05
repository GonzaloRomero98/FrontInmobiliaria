'use client';
import { QRCodeSVG } from "qrcode.react";

interface QRArProps{
    urlPropiedad:string;
}

export default function QrAr({urlPropiedad}:QRArProps){
    return(
        <div className="flex flex-col items-center gap-2 p-4 border rounded-xl">
            <p className="text-sm font-medium text-gray-700">
                Escanea el codigo con tu celular
            </p>
            <QRCodeSVG value={urlPropiedad} size={160} />
        </div>
    );
}