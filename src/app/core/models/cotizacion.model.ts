import { Timestamp } from '@angular/fire/firestore';

export type CotizacionEstado = 'Borrador' | 'Enviada' | 'Revision_Solicitada' | 'Aceptada' | 'Rechazada';

export interface CotizacionItemDetalle {
    catalogoItemId: string; // Foreign key a CatalogoItem
    nombre: string;         // Snapshot al momento de cotizar
    descripcion?: string;
    cantidad: number;
    precioUnitario: number; // Snapshot del precio
    subtotal: number;       // Calculado: cantidad * precioUnitario
}

export interface CotizacionHistorialEstado {
    estado: CotizacionEstado;
    fecha: Timestamp | Date;
    actorId: string;       // El usuario (vendedor/admin) o cliente que generó el cambio
    comentario?: string;
}

export interface Cotizacion {
    id?: string;
    tenantId: string;

    // Metadatos y Participantes
    correlativo: string;   // Ej: COT-0001 (Generado)
    clienteId: string;     // FK a CRM Cliente
    vendedorId: string;    // FK a Auth Usuario (quién la creó/vende)

    // Tiempos
    fechaEmision: Timestamp | Date;
    fechaExpiracion: Timestamp | Date;

    // Datos Comerciales
    items: CotizacionItemDetalle[];
    subtotal: number;
    descuento: {
        tipo: 'porcentaje' | 'monto';
        valor: number;
        montoAplicado: number; // Resultado matemático
    };
    porcentajeImpuesto: number; // Default 19% en Chile (o según ONBOARDING)
    montoImpuesto: number;
    totalFinal: number;

    // Condiciones Contractuales/Flexibles
    condicionesAdicionales?: string; // HTML o Texto Libre

    // Máquina de Estados y Trazabilidad
    estadoActual: CotizacionEstado;
    historialEstados: CotizacionHistorialEstado[];

    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}
