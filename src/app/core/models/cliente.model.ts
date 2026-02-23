export interface ScoreIA {
    score: number;                    // 0-100
    confianza: 'alta' | 'media' | 'baja';
    factores: string[];               // ["Empresa mediana con sitio web activo", "Sector compatible"]
    recomendacion: string;
    siguienteMejorAccion: string;
    fechaCalculo: Date;
    datosExternos?: {
        empleadosEstimados?: string;
        sectorDetectado?: string;
        presenciaDigital?: 'alta' | 'media' | 'baja';
    };
}

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
    scoringIA?: ScoreIA;
    vendedorAsignado: string;
    notas: string;
    totalHistorico: number;
    ultimaInteraccion: Date;
    createdAt: Date;
    updatedAt: Date;
}
