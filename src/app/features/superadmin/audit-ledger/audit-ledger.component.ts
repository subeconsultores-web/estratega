import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, ShieldCheck, ShieldAlert, Loader2, RefreshCw, FileText, FileSignature } from 'lucide-angular';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-audit-ledger',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    providers: [
        { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ ShieldCheck, ShieldAlert, Loader2, RefreshCw, FileText, FileSignature }) }
    ],
    template: `
        <div class="space-y-6">
            <!-- Header -->
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-txt-primary flex items-center gap-3">
                        <lucide-icon name="shield-check" [size]="28" class="text-emerald-600"></lucide-icon>
                        Audit Trail Criptográfico
                    </h1>
                    <p class="text-sm text-txt-secondary mt-1">Verificación de integridad del ledger con hashing SHA-256</p>
                </div>
                <button (click)="verificar()" [disabled]="isLoading"
                    class="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50">
                    <lucide-icon *ngIf="isLoading" name="loader-2" [size]="16" class="animate-spin"></lucide-icon>
                    <lucide-icon *ngIf="!isLoading" name="refresh-cw" [size]="16"></lucide-icon>
                    {{ isLoading ? 'Verificando...' : 'Verificar Integridad' }}
                </button>
            </div>

            <!-- Estado Global -->
            <div *ngIf="resultado" class="rounded-2xl border-2 p-6"
                [ngClass]="{
                    'border-emerald-200 bg-emerald-50': resultado.integridadGlobal,
                    'border-red-200 bg-red-50': !resultado.integridadGlobal
                }">
                <div class="flex items-center gap-3 mb-2">
                    <lucide-icon [name]="resultado.integridadGlobal ? 'shield-check' : 'shield-alert'" [size]="24"
                        [class]="resultado.integridadGlobal ? 'text-emerald-600' : 'text-red-600'"></lucide-icon>
                    <h2 class="text-lg font-bold" [class]="resultado.integridadGlobal ? 'text-emerald-800' : 'text-red-800'">
                        {{ resultado.integridadGlobal ? '✅ Integridad Verificada' : '🚨 Discrepancias Detectadas' }}
                    </h2>
                </div>
                <p class="text-sm" [class]="resultado.integridadGlobal ? 'text-emerald-700' : 'text-red-700'">
                    Verificado: {{ resultado.verificadoEn | date:'medium' }}
                </p>
            </div>

            <!-- Resultados por Entidad -->
            <div *ngIf="resultado" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div *ngFor="let key of entidadKeys; trackBy: trackByKey" class="bg-surface rounded-2xl border border-border p-5 shadow-elevation-1">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center"
                            [ngClass]="{
                                'bg-blue-100 text-blue-600': key === 'factura',
                                'bg-violet-100 text-violet-600': key === 'contrato'
                            }">
                            <lucide-icon [name]="key === 'factura' ? 'file-text' : 'file-signature'" [size]="20"></lucide-icon>
                        </div>
                        <div>
                            <h3 class="text-sm font-bold text-txt-primary capitalize">{{ key }}s</h3>
                            <p class="text-xs text-txt-muted">Total eventos: {{ resultado.resultados[key].totalEventos }}</p>
                        </div>
                        <span class="ml-auto text-xs font-bold px-3 py-1 rounded-full"
                            [ngClass]="{
                                'bg-emerald-100 text-emerald-700': resultado.resultados[key].integridadOk,
                                'bg-red-100 text-red-700': !resultado.resultados[key].integridadOk
                            }">
                            {{ resultado.resultados[key].integridadOk ? 'ÍNTEGRO' : 'COMPROMETIDO' }}
                        </span>
                    </div>

                    <div class="grid grid-cols-3 gap-3 text-center">
                        <div class="bg-base rounded-lg p-3">
                            <p class="text-lg font-bold text-txt-primary">{{ resultado.resultados[key].totalEventos }}</p>
                            <p class="text-[10px] text-txt-muted uppercase font-semibold">Total</p>
                        </div>
                        <div class="bg-emerald-50 rounded-lg p-3">
                            <p class="text-lg font-bold text-emerald-700">{{ resultado.resultados[key].eventosValidos }}</p>
                            <p class="text-[10px] text-emerald-600 uppercase font-semibold">Válidos</p>
                        </div>
                        <div class="rounded-lg p-3" [ngClass]="resultado.resultados[key].eventosTampereados > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-base'">
                            <p class="text-lg font-bold" [class]="resultado.resultados[key].eventosTampereados > 0 ? 'text-red-700 dark:text-red-400' : 'text-txt-muted'">{{ resultado.resultados[key].eventosTampereados }}</p>
                            <p class="text-[10px] uppercase font-semibold" [class]="resultado.resultados[key].eventosTampereados > 0 ? 'text-red-600 dark:text-red-400' : 'text-txt-muted'">Alterados</p>
                        </div>
                    </div>

                    <!-- Discrepancias -->
                    <div *ngIf="resultado.resultados[key].discrepancias?.length > 0" class="mt-4 space-y-2">
                        <p class="text-xs font-semibold text-red-700">Discrepancias detectadas:</p>
                        <div *ngFor="let d of resultado.resultados[key].discrepancias"
                            class="text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-800">
                            Sec #{{ d.secuencia }} · {{ d.tipoEvento }} · Doc: {{ d.entidadId }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <div *ngIf="!resultado && !isLoading" class="bg-base rounded-2xl p-12 text-center">
                <lucide-icon name="shield-check" [size]="48" class="mx-auto mb-4 text-txt-muted"></lucide-icon>
                <p class="text-txt-secondary font-medium">Pulsa "Verificar Integridad" para auditar la cadena de hashes</p>
                <p class="text-xs text-txt-muted mt-1">Se recalcula cada hash y se compara con el almacenado en Firestore</p>
            </div>
        </div>
    `
})
export class AuditLedgerComponent {
    private functions = inject(Functions);
    private toastr = inject(ToastrService);

    isLoading = false;
    resultado: any = null;

    get entidadKeys(): string[] {
        return this.resultado?.resultados ? Object.keys(this.resultado.resultados) : [];
    }

    trackByKey(index: number, key: string): string { return key; }

    async verificar() {
        this.isLoading = true;
        try {
            const callFn = httpsCallable(this.functions, 'verificarIntegridadLedger');
            const result = await callFn({});
            const payload: any = result.data;
            if (payload?.success) {
                this.resultado = payload.data;
                this.toastr.success(
                    this.resultado.integridadGlobal
                        ? 'Ledger íntegro — sin alteraciones detectadas'
                        : '¡Alerta! Se detectaron discrepancias en el ledger',
                    'Verificación completada'
                );
            }
        } catch (error) {
            console.error('Error verificando integridad:', error);
            this.toastr.error('Error al verificar la integridad del ledger.');
        } finally {
            this.isLoading = false;
        }
    }
}
