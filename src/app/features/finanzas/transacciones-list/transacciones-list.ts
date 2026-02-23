import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FinanzasService } from '../../../core/services/finanzas.service';
import { Transaccion } from '../../../core/models/finanzas.model';
import { Observable } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { RouterModule, Router } from '@angular/router';
import { LoadingSkeleton } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-transacciones-list',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterModule, LoadingSkeleton, DataTableComponent],
  templateUrl: './transacciones-list.html',
  styles: ``,
  providers: [CurrencyPipe, DatePipe]
})
export class TransaccionesList implements OnInit {
  private finanzasService = inject(FinanzasService);
  private router = inject(Router);

  transacciones$!: Observable<Transaccion[]>;

  columns: ColumnDef[] = [
    { key: 'fecha', label: 'Fecha', type: 'date' },
    { key: 'tipo', label: 'Tipo', type: 'badge' },
    { key: 'categoria', label: 'Categoría', type: 'badge' },
    { key: 'monto', label: 'Monto', type: 'currency' },
    { key: 'metodoPago', label: 'Método' },
    { key: 'estado', label: 'Estado', type: 'badge' }
  ];

  ngOnInit() {
    this.transacciones$ = this.finanzasService.getTransacciones();
  }

  onActionClick(event: { item: any, action: string }) {
    if (event.action === 'edit' || event.action === 'view') {
      this.router.navigate(['/finanzas/transacciones/editar', event.item.id]);
    }
  }
}
