import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, where, getDocs, orderBy, Timestamp } from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';
import { RegistroESG, ResumenESG } from '../models/sostenibilidad.model';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class EsgService {
    private firestore = inject(Firestore);
    private authService = inject(AuthService);

    constructor() { }

    /**
     * Obtiene todos los registros ESG del Tenant actual, ordenados por fecha.
     */
    getRegistrosESG(): Observable<RegistroESG[]> {
        return this.authService.user$.pipe(
            map(user => {
                if (!user || !user.tenantId) throw new Error('Usuario no autenticado o sin Tenant.');
                return user.tenantId;
            }),
            map(tenantId => {
                const esgRef = collection(this.firestore, 'sostenibilidad');
                // Para ordenar, Firestore requiere un índice compuesto: tenantId ASC, fechaFinPeriodo DESC
                const q = query(
                    esgRef,
                    where('tenantId', '==', tenantId)
                );
                return q;
            }),
            map(q => from(getDocs(q))),
            customFlatten()
        );
    }

    /**
     * Simula el agrupamiento por Mes/Año para la Dashboard (Doughnut Chart/Timelines).
     * @param registros Array crudo de Firestore.
     */
    agruparPorMes(registros: RegistroESG[]): ResumenESG[] {
        const resumenMap = new Map<string, ResumenESG>();

        registros.forEach(reg => {
            let fecha = reg.fechaFinPeriodo;
            if (fecha instanceof Timestamp) {
                fecha = fecha.toDate();
            } else if (typeof fecha === 'string') {
                fecha = new Date(fecha);
            }

            if (!fecha || isNaN(fecha.getTime())) return;

            const mes = fecha.getMonth() + 1;
            const anio = fecha.getFullYear();
            const key = `${anio}-${mes}`;

            let resumen = resumenMap.get(key);
            if (!resumen) {
                resumen = {
                    tenantId: reg.tenantId,
                    mes: mes,
                    anio: anio,
                    totalCarbonoKgCO2eq: 0,
                    desgloseEquivalente: { arbolesCompensar: 0, kmAutosEquivalente: 0 }
                };
                resumenMap.set(key, resumen);
            }

            resumen.totalCarbonoKgCO2eq += reg.huellaCarbonoKgCO2eq;
            // Cálculos equivalentes estándar
            resumen.desgloseEquivalente.arbolesCompensar = Math.round(resumen.totalCarbonoKgCO2eq / 21);
            resumen.desgloseEquivalente.kmAutosEquivalente = Math.round(resumen.totalCarbonoKgCO2eq * 4);
        });

        return Array.from(resumenMap.values()).sort((a, b) => {
            if (a.anio !== b.anio) return b.anio - a.anio;
            return b.mes - a.mes;
        });
    }

    /**
     * Valida publicamente un hash via URL para el Dashboard Criptografico ESG.
     * @param hash Cadena SHA-256 única guardada al momento de evaluar el OCR en DocumentAI
     */
    getRegistroByHash(hash: string): Observable<ResumenESG | null> {
        const esgRef = collection(this.firestore, 'sostenibilidad');
        const q = query(
            esgRef,
            where('signatureHash', '==', hash)
        );

        return from(getDocs(q)).pipe(
            map(snapshot => {
                if (snapshot.empty) return null;
                const reg = snapshot.docs[0].data() as RegistroESG;

                // Retornar en formato de ResumenESG UI-Friendly adaptando la data Cruda
                return {
                    tenantId: reg.tenantId,
                    mes: (reg.fechaFinPeriodo instanceof Timestamp ? reg.fechaFinPeriodo.toDate() : new Date(reg.fechaFinPeriodo)).getMonth() + 1,
                    anio: (reg.fechaFinPeriodo instanceof Timestamp ? reg.fechaFinPeriodo.toDate() : new Date(reg.fechaFinPeriodo)).getFullYear(),
                    totalCarbonoKgCO2eq: reg.huellaCarbonoKgCO2eq,
                    desgloseEquivalente: {
                        arbolesCompensar: Math.round(reg.huellaCarbonoKgCO2eq / 21),
                        kmAutosEquivalente: Math.round(reg.huellaCarbonoKgCO2eq * 4)
                    }
                } as ResumenESG;
            })
        );
    }
}

// Operador custom básico para aplanar Observable<Observable<T>> a Observable<T>
import { switchMap } from 'rxjs/operators';
function customFlatten() {
    return switchMap((obs: Observable<any>) => obs.pipe(
        map(querySnapshot => {
            return querySnapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            })) as RegistroESG[];
        })
    ));
}
