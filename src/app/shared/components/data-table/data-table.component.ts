import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

export interface ColumnDef {
    key: string;
    label: string;
    type?: 'text' | 'currency' | 'date' | 'badge' | 'action';
    sortable?: boolean;
}

@Component({
    selector: 'app-data-table',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-txt-secondary">
          <thead class="text-xs text-txt-muted uppercase bg-surface-hover/50 border-b border-border">
            <tr>
              <th *ngFor="let col of columns" scope="col" class="px-6 py-4 font-semibold">
                <div class="flex items-center space-x-1" [ngClass]="{'cursor-pointer hover:text-txt-primary': col.sortable}" (click)="col.sortable && sort(col.key)">
                  <span>{{ col.label }}</span>
                  <lucide-icon *ngIf="col.sortable" name="arrow-up-down" class="w-3 h-3 text-txt-muted"></lucide-icon>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of paginatedData; let i = index" class="border-b border-border/50 hover:bg-surface-hover/30 transition-colors">
              <td *ngFor="let col of columns" class="px-6 py-4">
                
                <!-- Currency -->
                <ng-container *ngIf="col.type === 'currency'">
                  <span class="font-medium text-txt-primary">{{ formatCurrency(item[col.key]) }}</span>
                </ng-container>

                <!-- Date -->
                <ng-container *ngIf="col.type === 'date'">
                  <span>{{ formatDate(item[col.key]) }}</span>
                </ng-container>

                <!-- Badge -->
                <ng-container *ngIf="col.type === 'badge'">
                  <span [ngClass]="getBadgeClass(item[col.key])" class="px-2.5 py-1 text-xs font-semibold rounded-full border">
                    {{ item[col.key] | titlecase }}
                  </span>
                </ng-container>

                <!-- Action -->
                <ng-container *ngIf="col.type === 'action'">
                    <button (click)="actionClick.emit({ item, action: 'view' })" class="text-primary hover:text-primary/80 mr-3">
                        <lucide-icon name="eye" class="w-4 h-4"></lucide-icon>
                    </button>
                    <button (click)="actionClick.emit({ item, action: 'edit' })" class="text-txt-secondary hover:text-txt-primary mr-3">
                        <lucide-icon name="edit-2" class="w-4 h-4"></lucide-icon>
                    </button>
                    <button (click)="actionClick.emit({ item, action: 'delete' })" class="text-red-500 hover:text-red-700">
                        <lucide-icon name="trash-2" class="w-4 h-4"></lucide-icon>
                    </button>
                </ng-container>

                <!-- Default Text -->
                <ng-container *ngIf="!col.type || col.type === 'text'">
                  <span [class.font-medium]="i === 0" [class.text-txt-primary]="i === 0">{{ item[col.key] || '-' }}</span>
                </ng-container>

              </td>
            </tr>

            <tr *ngIf="data.length === 0">
              <td [attr.colspan]="columns.length" class="px-6 py-12 text-center text-txt-muted">
                No hay datos disponibles para mostrar.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div *ngIf="data.length > pageSize" class="flex items-center justify-between px-6 py-3 border-t border-border bg-surface-hover/10">
        <span class="text-sm text-txt-muted">
          Mostrando <span class="font-medium text-txt-primary">{{ startIndex + 1 }}</span> a <span class="font-medium text-txt-primary">{{ endIndex }}</span> de <span class="font-medium text-txt-primary">{{ data.length }}</span> resultados
        </span>
        <div class="flex items-center space-x-2">
          <button (click)="prevPage()" [disabled]="currentPage === 1" class="px-3 py-1 text-sm bg-base border border-border rounded-lg text-txt-secondary hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            Anterior
          </button>
          <button (click)="nextPage()" [disabled]="currentPage === totalPages" class="px-3 py-1 text-sm bg-base border border-border rounded-lg text-txt-secondary hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            Siguiente
          </button>
        </div>
      </div>
    </div>
  `
})
export class DataTableComponent {
    @Input() columns: ColumnDef[] = [];
    @Input() data: any[] = [];
    @Input() pageSize: number = 10;

    @Output() actionClick = new EventEmitter<{ item: any, action: string }>();

    currentPage: number = 1;
    sortColumn: string | null = null;
    sortDirection: 'asc' | 'desc' = 'asc';

    get totalPages(): number {
        return Math.ceil(this.data.length / this.pageSize);
    }

    get startIndex(): number {
        return (this.currentPage - 1) * this.pageSize;
    }

    get endIndex(): number {
        return Math.min(this.startIndex + this.pageSize, this.data.length);
    }

    get paginatedData(): any[] {
        let processData = [...this.data];

        // Simple sorting
        if (this.sortColumn) {
            processData.sort((a, b) => {
                const valA = a[this.sortColumn!];
                const valB = b[this.sortColumn!];

                if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
                if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return processData.slice(this.startIndex, this.endIndex);
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
        }
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
        }
    }

    sort(key: string) {
        if (this.sortColumn === key) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = key;
            this.sortDirection = 'asc';
        }
    }

    formatCurrency(value: any): string {
        if (value == null || isNaN(value)) return '$0';
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
    }

    formatDate(val: any): string {
        if (!val) return '-';
        // Handle Firestore Timestamp
        if (val.seconds) {
            return new Date(val.seconds * 1000).toLocaleDateString('es-CL');
        }
        return new Date(val).toLocaleDateString('es-CL');
    }

    getBadgeClass(status: string): string {
        const s = (status || '').toLowerCase();
        switch (s) {
            case 'activo':
            case 'prospecto':
                return 'bg-green-500/10 text-green-600 border-green-500/20';
            case 'lead':
                return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            case 'inactivo':
                return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
            default:
                return 'bg-primary/10 text-primary border-primary/20';
        }
    }
}
