export interface User {
    uid: string;
    tenantId: string;
    email: string;
    nombre: string;
    role: 'super-admin' | 'admin' | 'vendedor' | 'consultor' | 'finanzas' | 'viewer';
    avatar?: string;
    activo: boolean;
    permisos?: Record<string, boolean>;
    config: {
        idioma: 'es' | 'en';
        notificaciones: Record<string, boolean>;
    };
    costoHora?: number;
    tarifaHora?: number;
    ultimoAcceso?: Date;
    createdAt: Date;
}
