export interface RegistroTiempo {
    id: string;
    tenantId: string;
    usuarioId: string;
    proyectoId: string;
    tareaId?: string;
    clienteId: string;
    fecha: Date;
    horaInicio: Date;
    horaFin: Date;
    duracionMinutos: number;
    descripcion: string;
    facturable: boolean;
    costoInterno: number;
    valorFacturable: number;
    aprobado: boolean;
    createdAt: Date;
}
