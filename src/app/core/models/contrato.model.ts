export interface ContratoItem {
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    total: number;
}

export interface Contrato {
    id: string;
    tenantId: string;
    clienteId: string;
    cotizacionId?: string;
    correlativo: number;
    codigoFormateado: string;
    titulo: string;
    items: ContratoItem[];
    total: number;
    moneda: 'CLP' | 'UF' | 'USD';
    estado: 'borrador' | 'enviado' | 'firmado_interno' | 'firmado_cliente' | 'finalizado' | 'cancelado';
    fechaInicio: Date;
    fechaFin: Date;
    tokenFirmaPublica: string;
    tokenExpiracion: Date;
    firmaRepresentante?: {
        url: string;
        fecha: Date;
        nombre: string;
    };
    firmaCliente?: {
        url: string;
        fecha: Date;
        nombre: string;
        ip: string;
    };
    clausulas: string[];
    condicionesPago: string;
    historialEventos: { estado: string; fecha: Date; usuarioId: string; comentario: string }[];
    pdfUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}
