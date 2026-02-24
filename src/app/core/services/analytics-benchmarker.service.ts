import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Observable, from } from 'rxjs';

export interface BqProyectosData {
    total_proyectos: number;
    total_horas_estimadas: number;
    total_horas_reales: number;
    presupuesto_total: number;
    facturado_total: number;
    proyectos_en_riesgo: number;
}

export interface BqCajaData {
    total_facturas: number;
    flujo_total: number;
    facturas_pagadas: number;
    ingresos_reales: number;
}

export interface BenchmarkingResponse {
    status: string;
    proyectos: BqProyectosData | null;
    caja: BqCajaData | null;
}

@Injectable({
    providedIn: 'root'
})
export class AnalyticsBenchmarkerService {
    private functions = inject(Functions);

    constructor() { }

    /**
     * Obtiene los KPIs macroeconómicos de la agencia desde Cloud Functions conectado a BigQuery.
     * La Cloud Function valida el token y retorna solo los datos del TenantId del usuario.
     */
    getBenchmarkingData(): Observable<BenchmarkingResponse> {
        // LLamada RPC a la function "getAnalyticsBenchmarking" registrada en functions/index.ts
        const callable = httpsCallable<void, BenchmarkingResponse>(this.functions, 'getAnalyticsBenchmarking');
        return from(callable().then(result => result.data));
    }
}
