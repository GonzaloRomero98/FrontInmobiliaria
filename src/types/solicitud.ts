export interface CrearSolicitudInput{
    nombre:string;
    apellido:string;
    correo:string;
    celular:string;
    mensaje?:string;
    id_modelo_casa:string;
    aceptaPrivacidad:boolean;
}