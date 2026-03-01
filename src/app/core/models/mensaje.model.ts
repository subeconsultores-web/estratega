import { Timestamp } from '@angular/fire/firestore';

export interface Conversacion {
    id?: string;
    tenantId: string;
    clienteId: string;
    clienteNombre?: string;
    canal: 'interno' | 'whatsapp' | 'email';
    asunto?: string;
    participantes: string[]; // UIDs de usuarios internos
    ultimoMensaje?: string;
    ultimoMensajeAt?: Timestamp | Date;
    noLeidos: number;
    estado: 'abierta' | 'cerrada' | 'archivada';
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}

export interface Mensaje {
    id?: string;
    conversacionId: string;
    autorId: string;
    autorNombre: string;
    autorTipo: 'interno' | 'cliente' | 'ia';
    contenido: string;
    leido: boolean;
    metadata?: {
        sugeridoPorIA?: boolean;
        canal?: string;
    };
    createdAt: Timestamp | Date;
}
