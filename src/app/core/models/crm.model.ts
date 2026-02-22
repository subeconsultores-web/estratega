import { Timestamp } from '@angular/fire/firestore';

export interface Cliente {
    id?: string;
    tenantId: string;
    rut: string;
    nombreEmpresa: string;
    giro?: string;
    contactoPrincipal: {
        nombre: string;
        email: string;
        telefono: string;
        cargo?: string;
    };
    direccion?: string;
    etiquetas?: string[];
    fuenteAdquisicion?: 'referido' | 'web' | 'redes' | 'evento' | 'otro' | string;
    estado: 'lead' | 'prospecto' | 'activo' | 'inactivo' | string;
    pipelineEtapa?: string;
    score?: number;
    vendedorAsignado?: string;
    notas?: string;
    totalHistorico?: number;
    ultimaInteraccion?: Timestamp | Date;
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}

export interface Actividad {
    id?: string;
    tenantId: string;
    clienteId: string;
    tipo: 'llamada' | 'reunion' | 'email' | 'nota' | 'tarea' | 'seguimiento' | string;
    titulo: string;
    descripcion?: string;
    fecha: Timestamp | Date;
    completada: boolean;
    resultado?: 'positivo' | 'neutral' | 'negativo' | string;
    usuarioId: string;
    cotizacionId?: string;
    createdAt: Timestamp | Date;
}
