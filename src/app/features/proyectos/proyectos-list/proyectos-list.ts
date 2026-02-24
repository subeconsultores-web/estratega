import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ProyectosService } from '../../../core/services/proyectos.service';
import { Proyecto } from '../../../core/models/proyectos.model';
import { LUCIDE_ICONS, LucideIconProvider,  LucideAngularModule, FolderPlus, Plus  } from 'lucide-angular';
import { RouterModule, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { LoadingSkeleton } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';
import { ProyectoFormComponent } from '../proyecto-form/proyecto-form.component';
import { CrmService } from '../../../core/services/crm.service';
import { combineLatest, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-proyectos-list',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, RouterModule, LoadingSkeleton, DataTableComponent, ProyectoFormComponent],
    templateUrl: './proyectos-list.html',
    providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ FolderPlus, Plus }) },DatePipe]
})
export class ProyectosList implements OnInit, OnDestroy {
    private proyectosService = inject(ProyectosService);
    private crmService = inject(CrmService);
    private router = inject(Router);
    private toastr = inject(ToastrService);
    private cdr = inject(ChangeDetectorRef);
    private sub?: Subscription;

    proyectos: any[] = [];
    isLoading = true;
    showProyectoModal = false;

    columns: ColumnDef[] = [
        { key: 'nombre', label: 'Proyecto' },
        { key: 'clienteNombre', label: 'Cliente' },
        { key: 'estado', label: 'Estado', type: 'badge' },
        { key: 'presupuestoHoras', label: 'Horas (Presupuesto)' },
        { key: 'actions', label: 'Acciones', type: 'action' }
    ];

    ngOnInit() {
        this.loadData();
    }

    ngOnDestroy() {
        this.sub?.unsubscribe();
    }

    private loadData() {
        this.isLoading = true;
        console.log('[ProyectosList] loadData() called, setting up combineLatest...');

        const proyectos$ = this.proyectosService.getProyectos();
        const clientes$ = this.crmService.getClientes();

        console.log('[ProyectosList] Both observables created, subscribing via combineLatest...');

        this.sub = combineLatest([proyectos$, clientes$]).subscribe({
            next: ([proyectos, clientes]) => {
                console.log('[ProyectosList] combineLatest emitted:', proyectos.length, 'proyectos,', clientes.length, 'clientes');
                const clienteMap = new Map<string, string>();
                clientes.forEach(c => clienteMap.set(c.id!, c.nombreEmpresa || c.contactoPrincipal?.nombre || 'Sin nombre'));

                this.proyectos = proyectos.map(p => ({
                    ...p,
                    clienteNombre: clienteMap.get(p.clienteId) || 'Sin asignar'
                }));
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('[ProyectosList] combineLatest ERROR:', err);
                this.proyectos = [];
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });

        console.log('[ProyectosList] combineLatest subscription created');
    }

    async onActionClick(event: { item: any, action: string }) {
        if (event.action === 'view' || event.action === 'edit') {
            this.router.navigate(['/proyectos', event.item.id, 'kanban']);
        } else if (event.action === 'delete') {
            if (confirm(`¿Seguro que deseas eliminar el proyecto "${event.item.nombre}"?`)) {
                try {
                    await this.proyectosService.deleteProyecto(event.item.id);
                    this.toastr.info('Proyecto eliminado exitosamente');
                } catch (error) {
                    console.error('Error eliminando proyecto:', error);
                    this.toastr.error('No se pudo eliminar el proyecto');
                }
            }
        }
    }

    nuevoProyecto() {
        this.showProyectoModal = true;
    }

    cerrarModal() {
        this.showProyectoModal = false;
    }

    async guardarProyecto(proyectoData: Partial<Proyecto>) {
        this.showProyectoModal = false;
        try {
            const newId = await this.proyectosService.createProyecto(proyectoData as Proyecto);
            this.router.navigate(['/proyectos', newId, 'kanban']);
        } catch (error) {
            console.error('Error al crear proyecto:', error);
            alert('No se pudo crear el proyecto.');
        }
    }
}
