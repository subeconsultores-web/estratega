export interface FacturaItem {
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    total: number;
}

export interface FacturaCuota {
    numero: number;
    monto: number;
    fechaVencimiento: Date;
    estado: 'pendiente' | 'pagada';
    fechaPago?: Date;
}

export interface FacturaPago {
    monto: number;
    fecha: Date;
    metodo: string;
    referencia: string;
    comprobante: string;
}

export interface Factura {
    id: string;
    tenantId: string;
    clienteId: string;
    contratoId?: string;
    correlativo: number;
    codigoFormateado: string;
    items: FacturaItem[];
    subtotal: number;
    impuestos: number;
    total: number;
    moneda: 'CLP' | 'UF' | 'USD';
    estado: 'borrador' | 'emitida' | 'pagada_parcial' | 'pagada' | 'vencida' | 'anulada';
    fechaEmision: Date;
    fechaVencimiento: Date;
    condicionesPago: '30 días' | '60 días' | 'contado' | 'cuotas';
    cuotas?: FacturaCuota[];
    pagos?: FacturaPago[];
    montoPagado: number;
    montoPendiente: number;
    pdfUrl?: string;

    // Integración Stripe
    urlStripeCheckout?: string; // URL generada temporal de la sesión para el cliente
    stripeCheckoutSessionId?: string; // ID interno de la sesión de Stripe
    stripePaymentIntentId?: string; // Referencia del cobro validado en Stripe

    createdAt: Date;
    updatedAt: Date;
}
