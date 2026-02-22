export interface Notificacion {
    id: string;
    tenantId: string;
    usuarioId: string;
    tipo: 'cotizacion' | 'contrato' | 'factura' | 'tarea' | 'sistema' | 'alerta';
    titulo: string;
    mensaje: string;
    leida: boolean;
    accionUrl: string;
    entidadId: string;
    createdAt: Date;
}
