import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LUCIDE_ICONS, LucideIconProvider,  LucideAngularModule, PackageSearch, Plus, Search  } from 'lucide-angular';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { CatalogoItem } from '../../../core/models/catalogo.model';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-catalogo-list',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule, DataTableComponent],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ PackageSearch, Plus, Search }) }
  ],
    templateUrl: './catalogo-list.component.html'
})
export class CatalogoListComponent implements OnInit {
    private catalogoService = inject(CatalogoService);
    private router = inject(Router);
    private toastr = inject(ToastrService);

    items: CatalogoItem[] = [];
    isLoading = true;

    // DataTable configuration
    columns: ColumnDef[] = [
        { key: 'nombre', label: 'Nombre / Descripción' },
        { key: 'tipo', label: 'Tipo', type: 'badge' },
        { key: 'skuCode', label: 'SKU/Ref' },
        { key: 'precioBase', label: 'Precio Base', type: 'currency' },
        { key: 'isActive', label: 'Estado', type: 'badge' },
        { key: 'actions', label: '', type: 'action' }
    ];

    ngOnInit() {
        this.loadItems();
    }

    loadItems() {
        this.isLoading = true;
        this.catalogoService.getItems().subscribe({
            next: (data: CatalogoItem[]) => {
                this.items = data.map(item => ({
                    ...item,
                    isActiveStr: String(item.isActive)
                }));
                this.items = this.items.map(item => ({ ...item, isActive: String(item.isActive) as any }));

                this.isLoading = false;
            },
            error: (err: any) => {
                console.error('Error loading catalogo items', err);
                this.toastr.error('Error al cargar del catálogo');
                this.isLoading = false;
            }
        });
    }

    onAction(event: { item: any, action: string }) {
        if (event.action === 'edit') {
            this.router.navigate(['/catalogo', event.item.id]);
        } else if (event.action === 'delete') {
            if (confirm(`¿Estás seguro de eliminar ${event.item.nombre}?`)) {
                this.catalogoService.deleteItem(event.item.id).then(() => {
                    this.toastr.success('Item eliminado correctamente');
                }).catch(err => {
                    console.error(err);
                    this.toastr.error('No se pudo eliminar el ítem');
                });
            }
        }
    }
}
