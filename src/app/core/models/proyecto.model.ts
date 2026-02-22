export interface ProyectoEquipo {
    userId: string;
    rol: string;
    horasAsignadas: number;
}

export interface Proyecto {
    id: string;
    tenantId: string;
    clienteId: string;
    contratoId?: string;
    nombre: string;
    descripcion: string;
    estado: 'planificacion' | 'en_progreso' | 'pausado' | 'completado' | 'cancelado';
    fechaInicio: Date;
    fechaFin: Date;
    presupuesto: number;
    costoReal: number;
    ingresoTotal: number;
    rentabilidad: number;
    equipo: ProyectoEquipo[];
    progreso: number;
    etiquetas: string[];
    createdAt: Date;
    updatedAt: Date;
}
