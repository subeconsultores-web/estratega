import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, PackageSearch, Plus, Search } from 'lucide-angular';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { CatalogoItem } from '../../../core/models/catalogo.model';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';
import { EmptyState } from '../../../shared/components/empty-state/empty-state.component';
import { ToastrService } from 'ngx-toastr';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';

@Component({
    selector: 'app-catalogo-list',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule, DataTableComponent, EmptyState],
    providers: [
        { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ PackageSearch, Plus, Search }) }
    ],
    templateUrl: './catalogo-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogoListComponent implements OnInit {
    private catalogoService = inject(CatalogoService);
    private router = inject(Router);
    private toastr = inject(ToastrService);
    private cdr = inject(ChangeDetectorRef);
    private confirmDialog = inject(ConfirmDialogService);
    private destroyRef = inject(DestroyRef);

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
        this.catalogoService.getItems().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data: CatalogoItem[]) => {
                this.items = data.map(item => ({
                    ...item,
                    isActiveStr: String(item.isActive)
                }));
                this.items = this.items.map(item => ({ ...item, isActive: String(item.isActive) as any }));

                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err: any) => {
                console.error('Error loading catalogo items', err);
                this.toastr.error('Error al cargar del catálogo');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    async onAction(event: { item: any, action: string }) {
        if (event.action === 'edit') {
            this.router.navigate(['/catalogo', event.item.id]);
        } else if (event.action === 'delete') {
            const ok = await this.confirmDialog.confirm({
                title: 'Eliminar del catálogo',
                message: `¿Estás seguro de eliminar ${event.item.nombre}? Esta acción no se puede deshacer.`,
                variant: 'danger',
                confirmText: 'Eliminar'
            });
            if (ok) {
                this.catalogoService.deleteItem(event.item.id).then(() => {
                    this.toastr.success('Item eliminado correctamente');
                }).catch(err => {
                    console.error(err);
                    this.toastr.error('No se pudo eliminar el ítem');
                });
            }
        }
    }

    goToNuevoItem() {
        this.router.navigate(['/catalogo/nuevo']);
    }
}
