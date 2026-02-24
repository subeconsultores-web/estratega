export interface Webhook {
    id?: string;
    tenantId: string;
    name: string;
    url: string;
    events: string[]; // e.g., ['cliente.creado', 'cotizacion.aprobada']
    isActive: boolean;
    createdAt: any;
    createdBy: string;
}
