import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, Folder } from 'lucide-angular';
import { Observable, switchMap, combineLatest, of, map } from 'rxjs';
import { Firestore, collection, collectionData, query, where } from '@angular/fire/firestore';
import { ProyectosService } from '../../../core/services/proyectos.service';
import { AuthService } from '../../../core/services/auth.service';
import { Proyecto } from '../../../core/models/proyectos.model';
import { LoadingSkeleton } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';

@Component({
    selector: 'app-portal-proyectos',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, LoadingSkeleton, DataTableComponent],
    providers: [
        { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Folder }) }, DatePipe],
    template: `
        <div class="space-y-6">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-txt-primary tracking-tight">Mis Proyectos</h1>
                    <p class="text-txt-secondary mt-1 text-sm">Realiza seguimiento sobre el avance operativo de tus encargos.</p>
                </div>
            </div>

            <ng-container *ngIf="proyectos$ | async as proyectos; else loading">
                <app-data-table *ngIf="proyectos.length > 0; else emptyState" [data]="proyectos" [columns]="columns">
                </app-data-table>

                <ng-template #emptyState>
                     <div class="bg-surface rounded-xl shadow-elevation-1 border border-border p-12 text-center">
                        <div class="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                            <lucide-icon name="folder" class="w-8 h-8"></lucide-icon>
                        </div>
                        <h2 class="text-lg font-bold text-txt-primary mb-2">Sin proyectos activos</h2>
                        <p class="text-txt-secondary max-w-md mx-auto">Aún no tienes proyectos asignados a tu cuenta por parte de la Agencia.</p>
                    </div>
                </ng-template>
            </ng-container>

            <ng-template #loading>
                <app-loading-skeleton></app-loading-skeleton>
            </ng-template>
        </div>
    `
})
export class PortalProyectosComponent implements OnInit {
    private firestore = inject(Firestore);
    private authService = inject(AuthService);

    proyectos$!: Observable<Proyecto[]>;

    columns: ColumnDef[] = [
        { key: 'nombre', label: 'Proyecto' },
        { key: 'estado', label: 'Estatus', type: 'badge' },
        { key: 'createdAt', label: 'Fecha de Alta', type: 'date' }
    ];

    ngOnInit() {
        // Filtrar proyectos por clienteId del usuario autenticado
        this.proyectos$ = combineLatest([
            this.authService.tenantId$,
            this.authService.clienteId$
        ]).pipe(
            switchMap(([tenantId, clienteId]) => {
                if (!tenantId || !clienteId) return of([] as Proyecto[]);
                const ref = collection(this.firestore, 'proyectos');
                const q = query(ref,
                    where('tenantId', '==', tenantId),
                    where('clienteId', '==', clienteId)
                );
                return (collectionData(q, { idField: 'id' }) as Observable<Proyecto[]>).pipe(
                    map(proyectos => proyectos.sort((a, b) => {
                        const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                        const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                        return dateB - dateA;
                    }))
                );
            })
        );
    }
}
