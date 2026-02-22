import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CotizacionService } from '../../../core/services/cotizacion.service';
import { Cotizacion } from '../../../core/models/cotizacion.model';
import { LucideAngularModule } from 'lucide-angular';
import { EmptyState } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSkeleton } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-cotizaciones-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, LucideAngularModule, EmptyState, LoadingSkeleton],
  templateUrl: './cotizaciones-list.html',
  styleUrl: './cotizaciones-list.scss',
})
export class CotizacionesListComponent implements OnInit {
  private cotizacionService = inject(CotizacionService);

  cotizaciones: Cotizacion[] = [];
  filteredCotizaciones: Cotizacion[] = [];
  isLoading = true;

  searchControl = new FormControl('');
  estadoFilter = new FormControl('todas');

  ngOnInit() {
    this.cargarCotizaciones();
    this.setupFilters();
  }

  cargarCotizaciones() {
    this.cotizacionService.getCotizaciones().subscribe({
      next: (data) => {
        this.cotizaciones = data;
        this.aplicarFiltros();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando cotizaciones:', error);
        this.isLoading = false;
      }
    });
  }

  setupFilters() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => this.aplicarFiltros());

    this.estadoFilter.valueChanges.subscribe(() => this.aplicarFiltros());
  }

  aplicarFiltros() {
    let result = this.cotizaciones;
    const searchTerm = this.searchControl.value?.toLowerCase() || '';
    const estado = this.estadoFilter.value || 'todas';

    if (searchTerm) {
      result = result.filter(c =>
        c.titulo?.toLowerCase().includes(searchTerm) ||
        c.codigoFormateado?.toLowerCase().includes(searchTerm) ||
        c.clienteId?.toLowerCase().includes(searchTerm) // Ideamente buscar por empresa
      );
    }

    if (estado !== 'todas') {
      result = result.filter(c => c.estado === estado);
    }

    this.filteredCotizaciones = result;
  }

  getEstadoBadgeStr(estado: string): string {
    const states: { [key: string]: string } = {
      'borrador': 'bg-gray-100 text-gray-800',
      'enviada': 'bg-blue-100 text-blue-800',
      'en_revision': 'bg-yellow-100 text-yellow-800',
      'aprobada': 'bg-green-100 text-green-800',
      'rechazada': 'bg-red-100 text-red-800',
      'expirada': 'bg-orange-100 text-orange-800'
    };
    return states[estado] || 'bg-gray-100 text-gray-800';
  }

  getEstadoLabel(estado: string): string {
    const labels: { [key: string]: string } = {
      'borrador': 'Borrador',
      'enviada': 'Enviada',
      'en_revision': 'En Revisión',
      'aprobada': 'Aprobada',
      'rechazada': 'Rechazada',
      'expirada': 'Expirada'
    };
    return labels[estado] || estado;
  }
}
