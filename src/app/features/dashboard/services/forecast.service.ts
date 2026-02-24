import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { AuthService } from '../../../core/services/auth.service';
import { firstValueFrom } from 'rxjs';

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
        const tenantId = await firstValueFrom(this.authService.tenantId$);

        const forecastPredictivoQuery = httpsCallable<{ tenantId: string }, ForecastResponse>(this.functions, 'forecastPredictivo');
        const response = await forecastPredictivoQuery({ tenantId });
        return response.data;
    }
}
