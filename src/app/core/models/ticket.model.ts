import { Timestamp } from '@angular/fire/firestore';

export interface Ticket {
    id?: string;
    tenantId: string;
    clienteId: string;
    asunto: string;
    mensaje: string;
    estado: 'abierto' | 'en_progreso' | 'resuelto';
    prioridad: 'baja' | 'media' | 'alta';
    createdAt?: Timestamp | Date | any;
    updatedAt?: Timestamp | Date | any;
}
