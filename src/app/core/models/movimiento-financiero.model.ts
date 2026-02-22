export interface MovimientoFinanciero {
    id: string;
    tenantId: string;
    tipo: 'ingreso' | 'egreso';
    categoria: 'pago_factura' | 'gasto_operativo' | 'honorario' | 'otro';
    monto: number;
    moneda: 'CLP' | 'UF' | 'USD';
    fecha: Date;
    descripcion: string;
    facturaId?: string;
    clienteId?: string;
    proyectoId?: string;
    metodoPago: 'transferencia' | 'efectivo' | 'cheque' | 'tarjeta';
    referencia: string;
    conciliado: boolean;
    comprobanteUrl?: string;
    createdAt: Date;
}
