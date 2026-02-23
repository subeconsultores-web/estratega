import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { AuthService } from '../../../core/services/auth.service';
import { Observable, from } from 'rxjs';

export interface ForecastTopDeal {
    descripcion: string;
    monto: number;
}

export interface ForecastAlerta {
    tipo: 'warning' | 'success' | 'info' | string;
    mensaje: string;
}

export interface ForecastResponse {
    success: boolean;
    datosBase: {
        montoFacturasPendientes: number;
        montoPipeline: number;
        montoRecurrenteMensual: number;
    };
    prediccionIA: {
        prediccion90Dias: number;
        ingresoEsperadoMesActual: number;
        montoPipelinePonderado: number;
        confianza: 'alta' | 'media' | 'baja' | string;
        topDeals: ForecastTopDeal[];
        alertasIA: ForecastAlerta[];
    };
}

@Injectable({
    providedIn: 'root'
})
export class ForecastService {
    private functions = inject(Functions);
    private authService = inject(AuthService);

    async getForecast(): Promise<ForecastResponse> {
        const tenantId = await this.authService.getTenantId();
        if (!tenantId) {
            throw new Error('Usuario sin Tenant');
        }

        const forecastPredictivoQuery = httpsCallable<{ tenantId: string }, ForecastResponse>(this.functions, 'forecastPredictivo');
        const response = await forecastPredictivoQuery({ tenantId });
        return response.data;
    }
}
