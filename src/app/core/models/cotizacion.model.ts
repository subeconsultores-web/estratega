export interface CatalogoServicio {
    id?: string;
    tenantId: string;
    nombre: string;
    descripcion: string;
    categoria: string;
    precioBase: number;
    unidad: 'hora' | 'sesion' | 'mes' | 'proyecto' | 'unidad';
    impuestosIncluidos: boolean;
    activo: boolean;
    versionPrecios?: {
        precio: number;
        fecha: any; // Timestamp o Date
        motivo: string;
    }[];
    createdAt?: any;
}

export interface CotizacionItem {
    servicioId?: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    descuento: number;
    total: number;
}

export interface Cotizacion {
    id?: string;
    tenantId: string;
    clienteId: string;
    correlativo: number;
    codigoFormateado: string;
    titulo: string;
    items: CotizacionItem[];
    subtotal: number;
    descuentoGlobal: number;
    impuestos: number;
    total: number;
    moneda: 'CLP' | 'UF' | 'USD';
    estado: 'borrador' | 'enviada' | 'en_revision' | 'aprobada' | 'rechazada' | 'expirada';
    validezDias: number;
    fechaExpiracion?: any;
    condiciones: string;
    notas: string;
    vendedorId?: string;
    plantillaId?: string;
    historialEstados?: {
        estado: string;
        fecha: any;
        usuarioId?: string;
        comentario?: string;
    }[];
    createdAt?: any;
    updatedAt?: any;
}
