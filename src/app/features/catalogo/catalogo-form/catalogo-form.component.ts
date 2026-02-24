import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LUCIDE_ICONS, LucideIconProvider,  LucideAngularModule, ArrowLeft, Banknote, Loader2, Package, Save, Settings2  } from 'lucide-angular';
import { ToastrService } from 'ngx-toastr';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { CatalogoItem } from '../../../core/models/catalogo.model';

@Component({
    selector: 'app-catalogo-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ ArrowLeft, Banknote, Loader2, Package, Save, Settings2 }) }
  ],
    templateUrl: './catalogo-form.component.html'
})
export class CatalogoFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private catalogoService = inject(CatalogoService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private location = inject(Location);
    private toastr = inject(ToastrService);

    catalogoForm: FormGroup;
    itemId = this.route.snapshot.paramMap.get('id');
    isEditMode = !!this.itemId;
    isLoading = false;
    isSaving = false;

    constructor() {
        this.catalogoForm = this.fb.group({
            nombre: ['', [Validators.required, Validators.minLength(3)]],
            descripcion: [''],
            tipo: ['producto', Validators.required],
            precioBase: [0, [Validators.required, Validators.min(0)]],
            moneda: ['CLP', Validators.required],
            skuCode: [''],
            categoria: [''],
            isActive: [true]
        });
    }

    ngOnInit() {
        if (this.isEditMode) {
            this.loadItemData();
        }
    }

    loadItemData() {
        if (!this.itemId) return;
        this.isLoading = true;

        this.catalogoService.getItem(this.itemId).subscribe({
            next: (item: CatalogoItem | undefined) => {
                if (item) {
                    this.catalogoForm.patchValue(item);
                } else {
                    this.toastr.error('El ítem no existe o fue eliminado');
                    this.goBack();
                }
                this.isLoading = false;
            },
            error: (err: any) => {
                console.error('Error fetching catalogo item', err);
                this.toastr.error('Error al cargar datos del ítem');
                this.isLoading = false;
            }
        });
    }

    async onSubmit() {
        if (this.catalogoForm.invalid) {
            this.catalogoForm.markAllAsTouched();
            this.toastr.error('Revisa los campos requeridos');
            return;
        }

        this.isSaving = true;
        const formValue = this.catalogoForm.value;

        try {
            if (this.isEditMode && this.itemId) {
                await this.catalogoService.updateItem(this.itemId, formValue);
                this.toastr.success('Ítem actualizado correctamente');
            } else {
                await this.catalogoService.createItem(formValue);
                this.toastr.success('Ítem registrado correctamente');
            }
            this.router.navigate(['/catalogo/lista']);
        } catch (error) {
            console.error('Error saving item', error);
            this.toastr.error('Hubo un problema al guardar el ítem');
        } finally {
            this.isSaving = false;
        }
    }

    goBack() {
        this.location.back();
    }
}
