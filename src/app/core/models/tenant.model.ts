export interface Tenant {
    id: string;
    nombreEmpresa: string;
    rut: string;
    giro: string;
    direccion: string;
    telefono: string;
    email: string;
    sitioWeb?: string;
    plan: 'free' | 'starter' | 'professional' | 'enterprise';
    config: {
        logoUrl?: string;
        colorPrimario: string;
        colorSecundario: string;
        moneda: 'CLP' | 'UF' | 'USD';
        impuesto: number;
        correlativos: {
            cotizacion: number;
            contrato: number;
            factura: number;
        };
    };
    limites: {
        usuarios: number;
        almacenamientoMb: number;
    };
    suscripcion: {
        estado: 'active' | 'trial' | 'suspended' | 'cancelled';
        fechaInicio: Date;
        fechaRenovacion: Date;
    };
    createdAt: Date;
    updatedAt: Date;
}
