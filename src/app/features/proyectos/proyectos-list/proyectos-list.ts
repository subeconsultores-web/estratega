import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ProyectosService } from '../../../core/services/proyectos.service';
import { Proyecto } from '../../../core/models/proyectos.model';
import { Observable } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { RouterModule, Router } from '@angular/router';
import { LoadingSkeleton } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';

@Component({
    selector: 'app-proyectos-list',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, RouterModule, LoadingSkeleton, DataTableComponent],
    templateUrl: './proyectos-list.html',
    providers: [DatePipe]
})
export class ProyectosList implements OnInit {
    private proyectosService = inject(ProyectosService);
    private router = inject(Router);

    proyectos$!: Observable<Proyecto[]>;

    columns: ColumnDef[] = [
        { key: 'nombre', label: 'Proyecto' },
        { key: 'clienteId', label: 'Cliente (Ref)' },
        { key: 'estado', label: 'Estado', type: 'badge' },
        { key: 'presupuestoHoras', label: 'Horas (Presupuesto)' }
    ];

    ngOnInit() {
        this.proyectos$ = this.proyectosService.getProyectos();
    }

    onActionClick(event: { item: any, action: string }) {
        if (event.action === 'view' || event.action === 'edit') {
            this.router.navigate(['/proyectos', event.item.id, 'kanban']);
        }
    }

    nuevoProyecto() {
        // Stub for quick creation logic
        const id = prompt('Crear Mock - Escribe un nombre de prueba para el proyecto:');
        if (id) {
            this.proyectosService.createProyecto({
                nombre: id,
                clienteId: 'C-MOCK-001',
                estado: 'activo',
                descripcion: 'Proyecto auto-generado mock',
                presupuestoHoras: 40
            }).then(res => this.router.navigate(['/proyectos', res, 'kanban']));
        }
    }
}
