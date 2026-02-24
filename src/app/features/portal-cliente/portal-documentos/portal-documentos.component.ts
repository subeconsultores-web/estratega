import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { LUCIDE_ICONS, LucideIconProvider,  LucideAngularModule, FileSignature  } from 'lucide-angular';
import { Observable } from 'rxjs';
import { ContratoService } from '../../../core/services/contrato.service';
import { Contrato } from '../../../core/models/contrato.model';
import { LoadingSkeleton } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';

@Component({
    selector: 'app-portal-documentos',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, LoadingSkeleton, DataTableComponent],
    providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ FileSignature }) },DatePipe],
    template: `
        <div class="space-y-6">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Acuerdos y Documentos Legales</h1>
                    <p class="text-gray-500 mt-1 text-sm">Visualiza y aprueba tus contratos o propuestas técnicas emitidas.</p>
                </div>
            </div>

            <ng-container *ngIf="contratos$ | async as contratos; else loading">
                <app-data-table *ngIf="contratos.length > 0; else emptyState" [data]="contratos" [columns]="columns" (actionClick)="onActionClick($event)">
                </app-data-table>

                <ng-template #emptyState>
                     <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <div class="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <lucide-icon name="file-signature" class="w-8 h-8"></lucide-icon>
                        </div>
                        <h3 class="text-lg font-bold text-gray-900 mb-2">Bandeja Vacía</h3>
                        <p class="text-gray-500 max-w-md mx-auto">No hay acuerdos pendientes o firmados en su expediente en este momento.</p>
                    </div>
                </ng-template>
            </ng-container>

            <ng-template #loading>
                <app-loading-skeleton></app-loading-skeleton>
            </ng-template>
        </div>
    `
})
export class PortalDocumentosComponent implements OnInit {
    private contratoService = inject(ContratoService);

    contratos$!: Observable<Contrato[]>;

    columns: ColumnDef[] = [
        { key: 'titulo', label: 'Documento' },
        { key: 'estadoActual', label: 'Estatus', type: 'badge' },
        { key: 'updatedAt', label: 'Última Actualización', type: 'date' }
    ];

    ngOnInit() {
        this.contratos$ = this.contratoService.getContratos();
    }

    onActionClick(event: { item: any, action: string }) {
        if (event.action === 'view') {
            if (event.item.id) {
                window.open(`/firma/${event.item.id}`, '_blank');
            }
        }
    }
}
