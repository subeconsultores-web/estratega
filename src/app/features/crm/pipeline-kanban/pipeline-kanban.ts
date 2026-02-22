import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CrmService } from '../../../core/services/crm.service';
import { Cliente } from '../../../core/models/crm.model';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ToastrService } from 'ngx-toastr';
import { LoadingSkeleton } from '../../../shared/components/loading-skeleton/loading-skeleton.component';

interface KanbanColumn {
  id: string;
  title: string;
  clientes: Cliente[];
}

@Component({
  selector: 'app-pipeline-kanban',
  standalone: true,
  imports: [CommonModule, DragDropModule, LoadingSkeleton],
  templateUrl: './pipeline-kanban.html',
  styleUrl: './pipeline-kanban.scss',
})
export class PipelineKanban implements OnInit {
  private crmService = inject(CrmService);
  private toastr = inject(ToastrService);

  isLoading = true;

  columns: KanbanColumn[] = [
    { id: 'lead', title: 'Nuevos', clientes: [] },
    { id: 'contacto', title: 'Contactados', clientes: [] },
    { id: 'calificado', title: 'Calificados', clientes: [] },
    { id: 'propuesta', title: 'Propuesta', clientes: [] },
    { id: 'negociacion', title: 'Negociación', clientes: [] },
    { id: 'ganado', title: 'Cerrado Ganado', clientes: [] },
    { id: 'perdido', title: 'Cerrado Perdido', clientes: [] }
  ];

  ngOnInit() {
    this.cargarClientes();
  }

  cargarClientes() {
    this.crmService.getClientes().subscribe({
      next: (data) => {
        // Limpiar todas las columnas
        this.columns.forEach(col => col.clientes = []);

        // Distribuir a las columnas
        data.forEach(cliente => {
          let etapa = cliente.pipelineEtapa || 'lead';
          let column = this.columns.find(c => c.id === etapa);
          if (column) {
            column.clientes.push(cliente);
          } else {
            this.columns[0].clientes.push(cliente); // Fallback a leads
          }
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando clientes para Kanban:', err);
        this.toastr.error('Error al cargar el Pipeline Kanban');
        this.isLoading = false;
      }
    });
  }

  async drop(event: CdkDragDrop<Cliente[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      const clienteMovido = event.container.data[event.currentIndex];
      const newContainerId = event.container.id; // Corresponde al ID de la KanbanColumn

      try {
        if (clienteMovido.id) {
          await this.crmService.updateCliente(clienteMovido.id, { pipelineEtapa: newContainerId });
        }
      } catch (error) {
        this.toastr.error('Error al actualizar avance de etapa');
        // Revert the transfer (opcional)
      }
    }
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  }
}
