import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LUCIDE_ICONS, LucideIconProvider,  LucideAngularModule, ArrowLeft, Calculator, Layers, Loader2, Plus, Save, User, X  } from 'lucide-angular';
import { ToastrService } from 'ngx-toastr';
import { CotizacionService } from '../../../core/services/cotizacion.service';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { CrmService } from '../../../core/services/crm.service';

// Modelos
import { Cotizacion, CotizacionItemDetalle } from '../../../core/models/cotizacion.model';
import { CatalogoItem } from '../../../core/models/catalogo.model';
import { Cliente } from '../../../core/models/crm.model';
import { Timestamp } from '@angular/fire/firestore';

@Component({
    selector: 'app-cotizacion-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ ArrowLeft, Calculator, Layers, Loader2, Plus, Save, User, X }) }
  ],
    templateUrl: './cotizacion-form.component.html'
})
export class CotizacionFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private cotizacionService = inject(CotizacionService);
    private catalogoService = inject(CatalogoService);
    private crmService = inject(CrmService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private location = inject(Location);
    private toastr = inject(ToastrService);

    cotiForm: FormGroup;
    itemId = this.route.snapshot.paramMap.get('id');
    isEditMode = !!this.itemId;

    isLoading = false;
    isSaving = false;

    // Data Masters
    clientesActivos: Cliente[] = [];
    catalogoActivo: CatalogoItem[] = [];

    constructor() {
        this.cotiForm = this.fb.group({
            clienteId: ['', Validators.required],
            fechaExpiracion: ['', Validators.required], // Usaremos input date HTML
            moneda: ['CLP', Validators.required],       // Default moneda para la coti global (simplificación visual)

            items: this.fb.array([], [Validators.required, Validators.minLength(1)]),

            descuentoTipo: ['monto'],     // 'porcentaje' o 'monto'
            descuentoValor: [0, [Validators.min(0)]],

            porcentajeImpuesto: [19, [Validators.min(0), Validators.max(100)]],
            condicionesAdicionales: ['La presente cotización tiene una validez de 15 días a contar de su fecha de emisión. Valores expresados no incluyen costos de viáticos de equipos en caso de visitas a terreno no estipuladas explícitamente.']
        });

        // Detectar cambios en Descuento e Impuestos para recalcular Totales
        this.cotiForm.get('descuentoTipo')?.valueChanges.subscribe(() => this.recalcularTotales());
        this.cotiForm.get('descuentoValor')?.valueChanges.subscribe(() => this.recalcularTotales());
        this.cotiForm.get('porcentajeImpuesto')?.valueChanges.subscribe(() => this.recalcularTotales());
    }

    // Getters para UI y form array
    get itemsArray(): FormArray {
        return this.cotiForm.get('items') as FormArray;
    }

    // Storage del recalculo dinámico
    subtotal: number = 0;
    montoDescuento: number = 0;
    montoImpuesto: number = 0;
    totalFinal: number = 0;

    ngOnInit() {
        this.loadMasters();
    }

    async loadMasters() {
        this.isLoading = true;
        try {
            // 1. Cargar CRMs
            this.crmService.getClientes().subscribe((clientes: Cliente[]) => {
                this.clientesActivos = clientes;
            });

            // 2. Cargar Catálogo (Solo ítems activos)
            this.catalogoService.getItems().subscribe((cat: CatalogoItem[]) => {
                this.catalogoActivo = cat.filter(i => i.isActive);
            });

            // 3. Cargar Cotización si Edit Mode
            if (this.isEditMode && this.itemId) {
                this.cotizacionService.getCotizacion(this.itemId).subscribe((cot: Cotizacion | undefined) => {
                    if (cot) this.patchFormularioContexto(cot);
                    this.isLoading = false;
                });
            } else {
                this.agregarLineaItem(); // 1 linea en blanco por defecto
                this.isLoading = false;
            }
        } catch (e) {
            console.error(e);
            this.toastr.error('Error pre-cargando módulos maestros');
            this.isLoading = false;
        }
    }

    patchFormularioContexto(cot: Cotizacion) {
        // Parsear fechaExpiracion para input date de HTML (YYYY-MM-DD)
        let expiracionStr = '';
        if (cot.fechaExpiracion instanceof Timestamp) {
            expiracionStr = cot.fechaExpiracion.toDate().toISOString().substring(0, 10);
        } else if (cot.fechaExpiracion) {
            expiracionStr = new Date(cot.fechaExpiracion).toISOString().substring(0, 10);
        }

        this.cotiForm.patchValue({
            clienteId: cot.clienteId,
            fechaExpiracion: expiracionStr,
            porcentajeImpuesto: cot.porcentajeImpuesto,
            descuentoTipo: cot.descuento?.tipo || 'monto',
            descuentoValor: cot.descuento?.valor || 0,
            condicionesAdicionales: cot.condicionesAdicionales
        });

        // Reconstruir Array de Iteams
        this.itemsArray.clear();
        if (cot.items && cot.items.length > 0) {
            cot.items.forEach((i: CotizacionItemDetalle) => {
                const row = this.createItemRowGrp();
                row.patchValue({
                    catalogoItemId: i.catalogoItemId,
                    nombre: i.nombre,
                    descripcion: i.descripcion,
                    cantidad: i.cantidad,
                    precioUnitario: i.precioUnitario,
                    subtotal: i.subtotal
                });
                this.itemsArray.push(row);
            });
        }
        this.recalcularTotales();
    }

    // --- ARRAYS DE SERVICIOS LÓGICA ---

    createItemRowGrp(): FormGroup {
        const grp = this.fb.group({
            catalogoItemId: ['', Validators.required],
            nombre: ['', Validators.required],
            descripcion: [''],
            cantidad: [1, [Validators.required, Validators.min(1)]],
            precioUnitario: [0, [Validators.required, Validators.min(0)]],
            subtotal: [{ value: 0, disabled: true }] // Calculado automáticamente
        });

        // Escuchar cambios de Item catálogo para autollenar metadata comercial
        grp.get('catalogoItemId')?.valueChanges.subscribe(catId => {
            const found = this.catalogoActivo.find(c => c.id === catId);
            if (found) {
                grp.patchValue({
                    nombre: found.nombre,
                    descripcion: found.descripcion,
                    precioUnitario: found.precioBase
                }, { emitEvent: false });
                this.recalcularLineaSubtotal(grp);
            }
        });

        // Escuchar Quantity y Precio para recomputar subtotales on the fly
        grp.get('cantidad')?.valueChanges.subscribe(() => this.recalcularLineaSubtotal(grp));
        grp.get('precioUnitario')?.valueChanges.subscribe(() => this.recalcularLineaSubtotal(grp));

        return grp;
    }

    agregarLineaItem() {
        this.itemsArray.push(this.createItemRowGrp());
    }

    removerLineaItem(index: number) {
        if (this.itemsArray.length > 1) {
            this.itemsArray.removeAt(index);
            this.recalcularTotales();
        } else {
            this.toastr.warning('La cotización debe tener al menos un ítem');
        }
    }

    private recalcularLineaSubtotal(grp: FormGroup) {
        const q = grp.get('cantidad')?.value || 1;
        const p = grp.get('precioUnitario')?.value || 0;
        grp.get('subtotal')?.setValue(q * p, { emitEvent: false });
        this.recalcularTotales();
    }

    // --- MOTOR MATEMÁTICO BASE ---

    recalcularTotales() {
        // 1. Subtotal de los items
        this.subtotal = this.itemsArray.controls.reduce((acc, currentGrp) => {
            return acc + (currentGrp.get('subtotal')?.value || 0);
        }, 0);

        // 2. Aplicar Descuentos Globales
        const dType = this.cotiForm.get('descuentoTipo')?.value;
        const dValue = this.cotiForm.get('descuentoValor')?.value || 0;

        if (dType === 'porcentaje') {
            this.montoDescuento = (this.subtotal * (dValue / 100));
        } else {
            this.montoDescuento = dValue;
            if (this.montoDescuento > this.subtotal) this.montoDescuento = this.subtotal; // Prevenir descuentos infitnitos
        }

        const totalConDescuento = this.subtotal - this.montoDescuento;

        // 3. Multiplicar Impuestos
        const pImpuesto = this.cotiForm.get('porcentajeImpuesto')?.value || 0;
        this.montoImpuesto = totalConDescuento * (pImpuesto / 100);

        // 4. Gran Total
        this.totalFinal = totalConDescuento + this.montoImpuesto;
    }


    async onSubmit() {
        if (this.cotiForm.invalid) {
            this.cotiForm.markAllAsTouched();
            this.toastr.error('Revisa los campos requeridos en la cotización.');
            return;
        }

        this.isSaving = true;
        const formRaw = this.cotiForm.getRawValue();

        // Map the payload
        const payload: Partial<Cotizacion> = {
            clienteId: formRaw.clienteId,
            fechaExpiracion: new Date(formRaw.fechaExpiracion),
            fechaEmision: new Date(), // Emisión siempre es hoy en Borrador al crear

            items: formRaw.items.map((it: any) => ({
                catalogoItemId: it.catalogoItemId,
                nombre: it.nombre,
                descripcion: it.descripcion,
                cantidad: Number(it.cantidad),
                precioUnitario: Number(it.precioUnitario),
                subtotal: Number(it.cantidad) * Number(it.precioUnitario)
            })),

            subtotal: this.subtotal,
            descuento: {
                tipo: formRaw.descuentoTipo,
                valor: Number(formRaw.descuentoValor),
                montoAplicado: this.montoDescuento
            },
            porcentajeImpuesto: Number(formRaw.porcentajeImpuesto),
            montoImpuesto: this.montoImpuesto,
            totalFinal: this.totalFinal,

            condicionesAdicionales: formRaw.condicionesAdicionales
        };

        try {
            if (this.isEditMode && this.itemId) {
                await this.cotizacionService.updateCotizacion(this.itemId, payload);
                this.toastr.success('Cotización actualizada y re-calculada');
            } else {
                await this.cotizacionService.createCotizacion(payload);
                this.toastr.success('Cotización en Borrador creada correctamente');
            }
            this.router.navigate(['/cotizaciones/lista']);
        } catch (error) {
            console.error('Error saving Coti', error);
            this.toastr.error('Hubo un problema procesando la cotización');
        } finally {
            this.isSaving = false;
        }
    }

    goBack() {
        this.location.back();
    }
}
