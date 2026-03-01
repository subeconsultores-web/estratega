export interface UserData {
    uid: string;
    tenantId: string;
    email: string;
    nombre: string;
    role: 'super-admin' | 'admin' | 'vendedor' | 'consultor' | 'finanzas' | 'viewer' | 'client';
    clienteId?: string;        // ID del doc en /clientes/ — solo para role 'client'
    avatar?: string;
    activo: boolean;
    permisos?: Record<string, boolean>;
    config: {
        idioma: 'es' | 'en';
        notificaciones: Record<string, boolean>;
    };
    costoHora?: number;
    tarifaHora?: number;
    skills?: string[];
    ultimoAcceso?: Date;
    createdAt: Date;
}
