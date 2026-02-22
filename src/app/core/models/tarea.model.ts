export interface Tarea {
    id: string;
    tenantId: string;
    proyectoId: string;
    titulo: string;
    descripcion: string;
    estado: 'pendiente' | 'en_progreso' | 'en_revision' | 'completada';
    prioridad: 'baja' | 'media' | 'alta' | 'urgente';
    asignadoA: string;
    fechaLimite: Date;
    horasEstimadas: number;
    horasReales: number;
    orden: number;
    subtareas: { titulo: string; completada: boolean }[];
    createdAt: Date;
    updatedAt: Date;
}
