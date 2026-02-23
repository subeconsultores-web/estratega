import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { RouterModule } from '@angular/router';
import { Observable, switchMap, from } from 'rxjs';
import { ProyectosService } from '../../../core/services/proyectos.service';
import { AuthService } from '../../../core/services/auth.service';
import { Proyecto } from '../../../core/models/proyectos.model';
import { LoadingSkeleton } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';

@Component({
    selector: 'app-portal-proyectos',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, RouterModule, LoadingSkeleton, DataTableComponent],
    providers: [DatePipe],
    template: `
        <div class="space-y-6">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Mis Proyectos</h1>
                    <p class="text-gray-500 mt-1 text-sm">Realiza seguimiento sobre el avance operativo de tus encargos.</p>
                </div>
            </div>

            <ng-container *ngIf="proyectos$ | async as proyectos; else loading">
                <app-data-table *ngIf="proyectos.length > 0; else emptyState" [data]="proyectos" [columns]="columns">
                </app-data-table>

                <ng-template #emptyState>
                     <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <div class="w-16 h-16 bg-blue-50 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                            <lucide-icon name="folder" class="w-8 h-8"></lucide-icon>
                        </div>
                        <h3 class="text-lg font-bold text-gray-900 mb-2">Sin proyectos activos</h3>
                        <p class="text-gray-500 max-w-md mx-auto">Aún no tienes proyectos asignados a tu cuenta por parte de la Agencia.</p>
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
    private proyectosService = inject(ProyectosService);
    private authService = inject(AuthService);

    proyectos$!: Observable<Proyecto[]>;

    columns: ColumnDef[] = [
        { key: 'nombre', label: 'Proyecto' },
        { key: 'estado', label: 'Estatus', type: 'badge' },
        { key: 'createdAt', label: 'Fecha de Alta', type: 'date' }
    ];

    ngOnInit() {
        // En Produccion Real, se debe flitrar los Proyectos por ClienteId
        // Por ahora listamos todos del Tenant para ilustrar la vista read-only
        this.proyectos$ = this.proyectosService.getProyectos();
    }
}
