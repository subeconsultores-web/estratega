import { Timestamp } from '@angular/fire/firestore';

export interface Factura {
    id?: string;
    tenantId: string;
    clienteId: string;
    cotizacionId?: string; // Si proviene de una cotización
    numeroBoletaFactura?: string; // Folio fiscal real cuando se emite
    fechaEmision: Timestamp | Date | any;
    fechaVencimiento: Timestamp | Date | any;
    subtotal: number;
    impuestos: number;
    total: number;
    saldoPendiente: number; // Para cobros parciales
    moneda: 'CLP' | 'UF' | 'USD';
    estado: 'borrador' | 'emitida' | 'pagada' | 'pagada_parcial' | 'vencida' | 'anulada';
    metodoPagoPreferido?: 'transferencia' | 'tarjeta' | 'efectivo' | string;
    linkPagoStripe?: string; // Link de checkout session
    notas?: string;
    createdAt?: Timestamp | Date | any;
    updatedAt?: Timestamp | Date | any;
}

export interface Transaccion {
    id?: string;
    tenantId: string;
    facturaId?: string; // Puede no estar atado a una factura (egreso simple)
    clienteId?: string;
    tipo: 'ingreso' | 'egreso';
    categoria: 'venta' | 'suscripcion' | 'reembolso' | 'gasto_operativo' | 'salarios' | 'impuestos' | string;
    monto: number;
    moneda: 'CLP' | 'UF' | 'USD';
    fecha: Timestamp | Date | any;
    metodoPago: 'transferencia' | 'tarjeta_credito' | 'tarjeta_debito' | 'efectivo' | 'stripe' | string;
    referenciaExterna?: string; // Ej: ID de transacción de banco o Stripe
    estado: 'completado' | 'pendiente' | 'fallido' | 'reembolsado';
    comprobanteUrl?: string; // Link a Firebase Storage
    notas?: string;
    creadoPor: string; // userId config
    createdAt?: Timestamp | Date | any;
}

/**
 * Interfaz auxiliar para Gráficos del Dashboard
 */
export interface MetricasFinancieras {
    mrr: number; // Monthly recurring revenue
    ingresosMesActual: number;
    egresosMesActual: number;
    porCobrar: number;
    crecimientoMRR: number; // Porcentaje vs mes anterior
}
