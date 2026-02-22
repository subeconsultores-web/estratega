export interface Actividad {
    id: string;
    tenantId: string;
    clienteId: string;
    tipo: 'llamada' | 'reunion' | 'email' | 'nota' | 'tarea' | 'seguimiento';
    titulo: string;
    descripcion: string;
    fecha: Date;
    completada: boolean;
    resultado: 'positivo' | 'neutral' | 'negativo';
    usuarioId: string;
    cotizacionId?: string;
    createdAt: Date;
}
