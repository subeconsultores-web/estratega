import { Timestamp } from '@angular/fire/firestore';

export interface PartidaPresupuestaria {
    id: string;
    nombre: string;
    montoEstimado: number;
    montoEjecutado: number;
}

export interface Proyecto {
    id?: string;
    tenantId: string;
    clienteId: string;
    nombre: string;
    descripcion?: string;
    estado: 'activo' | 'pausado' | 'completado';
    // Control Financiero & Burn-Rate Predictivo
    horasEstimadas?: number;    // Capacidad original vendida
    horasInvertidas?: number;   // Horas ejecutadas totales (rollup de TimeTracking)
    tarifaHoraAprox?: number;   // Utilidad estimada (Ingreso / horasEstimadas)
    progresoGlobal?: number;
    presupuestoHoras?: number;
    horasConsumidas?: number;
    presupuestoFinancieroEstimado?: number;
    presupuestoFinancieroEjecutado?: number;
    partidas?: PartidaPresupuestaria[];
    fechaInicio?: Timestamp | Date | any;
    fechaFin?: Timestamp | Date | any;
    createdAt?: Timestamp | Date | any;
    updatedAt?: Timestamp | Date | any;
}

export type TareaEstado = 'todo' | 'in_progress' | 'review' | 'done';

export interface Tarea {
    id?: string;
    tenantId: string;
    proyectoId: string;
    titulo: string;
    descripcion?: string;
    estado: TareaEstado;
    asignadoA?: string; // userId
    tiempoEstimado?: number; // en horas o minutos
    tiempoConsumido?: number; // tiempo trackeado en crudo
    fechaVencimiento?: Timestamp | Date | any;
    orden?: number; // para indexación en Kanban
    createdAt?: Timestamp | Date | any;
    updatedAt?: Timestamp | Date | any;
}
