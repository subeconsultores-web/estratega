export type MetodoFirma = 'dibujo' | 'upload' | 'digital';
export type EstadoContrato = 'Borrador' | 'Enviado' | 'Firmado' | 'Cancelado';

export interface AuditTrail {
    nombreTipeado: string;
    timestamp: Date | any; // Any supports Firestore Timestamp
    userAgent: string;
    ipBase?: string;
}

export interface FirmaData {
    metodo: MetodoFirma;
    urlFirmaStorage?: string; // Para dibujo y upload
    auditTrail?: AuditTrail; // Para firma digital
}

export interface ContratoItem {
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    total: number;
}

export interface Contrato {
    id?: string;
    correlativo: string; // ej: CNT-0001
    tenantId: string;
    clienteId: string;
    vendedorId: string;
    cotizacionOrigenId?: string; // Link a sprint 5

    titulo: string;
    cuerpoLegal: string; // HTML o Texto con las clausulas
    items?: ContratoItem[]; // Optional if we inherit from Cotizacion
    total?: number;
    moneda?: 'CLP' | 'UF' | 'USD';

    fechaEmision: Date | any;
    fechaValidez: Date | any;
    fechaFirma?: Date | any;

    estadoActual: EstadoContrato;

    firmaData?: FirmaData;

    tokenFirmaPublica?: string;
    tokenExpiracion?: Date | any;

    historialEstados?: {
        estado: EstadoContrato;
        fecha: Date | any;
        comentario?: string;
        actorId?: string;
    }[];

    pdfUrl?: string;

    createdAt?: Date | any;
    updatedAt?: Date | any;
}
