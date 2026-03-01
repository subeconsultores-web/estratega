import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, Save, Palette, Image as ImageIcon } from 'lucide-angular';
import { TenantService } from '../../../core/services/tenant';
import { take } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-configuracion-apariencia',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
    providers: [
        { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Save, Palette, ImageIcon }) }
    ],
    template: `
    <div class="space-y-6 animate-in fade-in duration-500">
      
      <div class="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold tracking-tight text-txt-primary">Apariencia y Marca Blanca</h2>
          <p class="text-txt-muted text-sm mt-1">Personaliza el logo y los colores corporativos de tu organización. Estos cambios se reflejarán en el Portal de Cliente y en los documentos PDF generados.</p>
        </div>
        <button (click)="guardarCambios()" [disabled]="form.invalid || isLoading"
                class="flex items-center justify-center space-x-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg active:scale-95 transition-all w-full md:w-auto disabled:opacity-50">
          <lucide-icon name="save" class="w-5 h-5"></lucide-icon>
          <span>{{ isLoading ? 'Guardando...' : 'Guardar Cambios' }}</span>
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Columna Formulario -->
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
            <div class="p-4 sm:p-6 border-b border-border bg-surface-hover/30">
              <h3 class="text-lg font-bold text-txt-primary flex items-center">
                <lucide-icon name="image" class="w-5 h-5 mr-2 text-primary"></lucide-icon> Logo Corporativo
              </h3>
            </div>
            <div class="p-4 sm:p-6" [formGroup]="form">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-txt-primary mb-1">URL del Logo</label>
                  <input type="text" formControlName="logoUrl" placeholder="https://ejemplo.com/logo.png"
                         class="w-full bg-base border border-border rounded-lg px-4 py-2.5 text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all">
                  <p class="text-xs text-txt-muted mt-1.5">Sube tu logo a un almacenamiento público (como Firebase Storage o Imgur) e introduce la URL aquí. Recomendamos imágenes PNG con fondo transparente.</p>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
            <div class="p-4 sm:p-6 border-b border-border bg-surface-hover/30">
              <h3 class="text-lg font-bold text-txt-primary flex items-center">
                <lucide-icon name="palette" class="w-5 h-5 mr-2 text-primary"></lucide-icon> Colores de Marca
              </h3>
            </div>
            <div class="p-4 sm:p-6" [formGroup]="form">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-txt-primary mb-1">Color Primario</label>
                  <div class="flex items-center space-x-3">
                    <input type="color" formControlName="colorPrimario"
                           class="w-12 h-12 rounded cursor-pointer border-0 p-0 bg-transparent">
                    <input type="text" formControlName="colorPrimario"
                           class="flex-1 bg-base border border-border rounded-lg px-4 py-2 text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all uppercase pattern-hex">
                  </div>
                  <p class="text-xs text-txt-muted mt-1.5">Se usa para botones principales, acentos y fondos destacados.</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-txt-primary mb-1">Color Secundario</label>
                  <div class="flex items-center space-x-3">
                    <input type="color" formControlName="colorSecundario"
                           class="w-12 h-12 rounded cursor-pointer border-0 p-0 bg-transparent">
                    <input type="text" formControlName="colorSecundario"
                           class="flex-1 bg-base border border-border rounded-lg px-4 py-2 text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all uppercase pattern-hex">
                  </div>
                  <p class="text-xs text-txt-muted mt-1.5">Se usa para interacciones secundarias y gradientes.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Columna Preview -->
        <div class="space-y-6">
          <div class="bg-surface rounded-xl border border-border shadow-sm overflow-hidden sticky top-24">
            <div class="p-4 border-b border-border bg-base text-center">
              <span class="text-xs font-bold text-txt-muted uppercase tracking-wider">Vista Previa (Portal Cliente)</span>
            </div>
            <div class="p-6 bg-slate-50 dark:bg-slate-900 min-h-[300px] flex flex-col items-center justify-center space-y-6">
              
              <!-- Preview Header / Logo -->
              <div class="bg-surface p-4 rounded-xl shadow-sm w-full border border-border flex items-center justify-center">
                <img *ngIf="form.get('logoUrl')?.value; else noLogo" 
                     [src]="form.get('logoUrl')?.value" alt="Preview Logo" class="h-10 max-w-[200px] object-contain">
                <ng-template #noLogo>
                  <div class="flex items-center space-x-2">
                    <lucide-icon name="palette" class="w-6 h-6" [style.color]="form.get('colorPrimario')?.value"></lucide-icon>
                    <span class="font-bold text-lg text-txt-primary">Tu Marca</span>
                  </div>
                </ng-template>
              </div>

              <!-- Preview Button -->
              <div class="w-full flex justify-center">
                <button class="px-6 py-2.5 rounded-lg text-white font-medium shadow-md transition-all hover:-translate-y-0.5"
                        [style.background]="form.get('colorPrimario')?.value"
                        [style.box-shadow]="'0 4px 14px 0 ' + form.get('colorPrimario')?.value + '40'">
                  Botón Principal
                </button>
              </div>

              <!-- Preview Accent -->
              <div class="w-full flex justify-center mt-2">
                <div class="px-4 py-2 rounded-lg text-sm font-medium border"
                    [style.background]="form.get('colorSecundario')?.value + '15'"
                    [style.border-color]="form.get('colorSecundario')?.value + '30'"
                    [style.color]="form.get('colorSecundario')?.value">
                  Etiqueta Secundaria
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class AparienciaComponent implements OnInit {
    private fb = inject(FormBuilder);
    private tenantService = inject(TenantService);
    private toastr = inject(ToastrService);

    form: FormGroup;
    isLoading = false;

    constructor() {
        this.form = this.fb.group({
            logoUrl: [''],
            colorPrimario: ['#0f172a', Validators.required],
            colorSecundario: ['#3b82f6', Validators.required]
        });
    }

    ngOnInit() {
        this.tenantService.config$.pipe(take(1)).subscribe(config => {
            if (config) {
                this.form.patchValue({
                    logoUrl: config.logoUrl || '',
                    colorPrimario: config.colorPrimario || '#0f172a',
                    colorSecundario: config.colorSecundario || '#3b82f6'
                });
            }
        });

        // Optionally apply CSS variables live strictly for preview if needed,
        // but the preview box uses inline styles which is safer.
    }

    async guardarCambios() {
        if (this.form.invalid) return;

        this.isLoading = true;
        try {
            await this.tenantService.updateConfig(this.form.value);
            this.toastr.success('Configuración de apariencia actualizada correctamente', 'Éxito');

            // Update css variables dynamically so the user sees the new colors in the admin interface too if desired
            this.tenantService.applyTenantConfig(this.form.value as any);

        } catch (e: any) {
            console.error(e);
            this.toastr.error('Ocurrió un error al guardar la configuración', 'Error');
        } finally {
            this.isLoading = false;
        }
    }
}
