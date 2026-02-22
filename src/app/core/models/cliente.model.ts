export interface Cliente {
    id: string;
    tenantId: string;
    rut: string;
    nombreEmpresa: string;
    giro: string;
    contactoPrincipal: {
        nombre: string;
        email: string;
        telefono: string;
        cargo: string;
    };
    direccion: string;
    etiquetas: string[];
    fuenteAdquisicion: 'referido' | 'web' | 'redes' | 'evento' | 'otro';
    estado: 'lead' | 'prospecto' | 'activo' | 'inactivo';
    pipelineEtapa: string;
    score: number;
    vendedorAsignado: string;
    notas: string;
    totalHistorico: number;
    ultimaInteraccion: Date;
    createdAt: Date;
    updatedAt: Date;
}
