export interface RegistroESG {
    id?: string;
    tenantId: string;

    // Tipo de recurso o emisión (Ej: 'electricidad', 'agua', 'combustible')
    tipoRecurso: 'electricidad' | 'agua' | 'combustible' | 'vuelos' | 'otro';

    // Datos crudos extraídos por Document AI
    consumoBruto: number; // Ej: 1540
    unidadMedida: 'kWh' | 'm3' | 'litros' | 'km'; // Ej: 'kWh'

    // Periodo de facturación
    fechaInicioPeriodo: Date | any; // Any para admitir Timestamp de Firestore
    fechaFinPeriodo: Date | any;

    // El documento fuente que generó este registro
    documentoFuenteId?: string; // ID en storage o de boleta
    documentoFuenteUrl?: string; // Link al PDF original

    // Métricas calculadas
    // Huella de Carbono = consumoBruto * factorEmision
    factorEmisionUtilizado: number; // Ej: 0.28 (kg CO2eq por kWh típico de la red chilena/latam)
    huellaCarbonoKgCO2eq: number; // Kg de CO2 Equivalente emitido

    // Trazabilidad y Certificación
    fechaProcesamiento: Date | any;
    procesadoPorAI: boolean; // Flag de confianza extraído auto vs manual
    firmaCriptograficaLog?: string; // SHA-256 hash validando el input original vs resultado
}

// Representa las métricas unificadas para el Chart de UI
export interface ResumenESG {
    tenantId: string;
    mes: number; // 1-12
    anio: number;
    totalCarbonoKgCO2eq: number;
    desgloseEquivalente: {
        arbolesCompensar: number; // Aprox 1 árbol = 21kg CO2 / año
        kmAutosEquivalente: number; // Aprox 1kg CO2 = 4km en un auto a gasolina aprox
    }
}
