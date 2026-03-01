import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, where, getDocs, orderBy, Timestamp, addDoc } from '@angular/fire/firestore';
import { Observable, from, map, switchMap, take } from 'rxjs';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { RegistroESG, ResumenESG } from '../models/sostenibilidad.model';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class EsgService {
    private firestore = inject(Firestore);
    private authService = inject(AuthService);
    private functions = inject(Functions);

    constructor() { }

    /**
     * Agrega un registro ESG manual a la base de datos.
     * @param registro Datos del registro (sin tenantId)
     */
    addRegistroManual(registro: Omit<RegistroESG, 'tenantId'>): Promise<any> {
        return new Promise((resolve, reject) => {
            this.authService.tenantId$.pipe(take(1)).subscribe(tenantId => {
                if (!tenantId) {
                    reject(new Error('No tenant ID available'));
                    return;
                }
                const newRecord: RegistroESG = {
                    ...registro,
                    tenantId
                } as RegistroESG;

                const esgRef = collection(this.firestore, 'sostenibilidad');
                addDoc(esgRef, newRecord)
                    .then(resolve)
                    .catch(reject);
            });
        });
    }

    /**
     * Llama a la Cloud Function para calcular la huella digital automática del tenant.
     */
    calcularHuellaAutomatica(): Observable<any> {
        return this.authService.tenantId$.pipe(
            take(1),
            switchMap(tenantId => {
                const callable = httpsCallable(this.functions, 'calcularHuellaDigitalAuto');
                return from(callable({ tenantId }));
            })
        );
    }

    /**
     * Obtiene todos los registros ESG del Tenant actual, ordenados por fecha.
     */
    getRegistrosESG(): Observable<RegistroESG[]> {
        return this.authService.tenantId$.pipe(
            switchMap(tenantId => {
                const esgRef = collection(this.firestore, 'sostenibilidad');
                const q = query(
                    esgRef,
                    where('tenantId', '==', tenantId)
                );
                return from(getDocs(q)).pipe(
                    map(querySnapshot => {
                        return querySnapshot.docs.map((doc: any) => ({
                            id: doc.id,
                            ...doc.data()
                        })) as RegistroESG[];
                    })
                );
            })
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
