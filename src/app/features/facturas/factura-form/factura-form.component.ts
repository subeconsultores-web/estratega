import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ToastrService } from 'ngx-toastr';

import { FacturaService } from '../../../core/services/factura.service';
import { AuthService } from '../../../core/services/auth.service';
import { CrmService } from '../../../core/services/crm.service';

@Component({
    selector: 'app-factura-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule],
    templateUrl: './factura-form.component.html'
})
export class FacturaFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private facturaService = inject(FacturaService);
    private authService = inject(AuthService);
    private crmService = inject(CrmService);
    private toastr = inject(ToastrService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private location = inject(Location);

    facturaForm: FormGroup;
    itemId = this.route.snapshot.paramMap.get('id');
    isEditMode = !!this.itemId && this.itemId !== 'new';

    // Could be auto-patched from Contratos logic
    contratoIdParam = this.route.snapshot.queryParamMap.get('contratoId');

    clientes: any[] = [];
    isLoading = false;
    isSaving = false;
    tenantId: string | null = null;

    constructor() {
        this.facturaForm = this.fb.group({
            clienteId: ['', Validators.required],
            fechaEmision: [new Date().toISOString().split('T')[0], Validators.required],
            fechaVencimiento: ['', Validators.required],
            moneda: ['CLP'],
            items: this.fb.array([]),
            notas: [''],
            porcentajeDescuento: [0, [Validators.min(0), Validators.max(100)]],
            porcentajeImpuesto: [19, [Validators.min(0), Validators.max(100)]]
        });

        // Listeners para forzar recalculación
        this.facturaForm.valueChanges.subscribe(() => {
            // En un entorno de producción, puedes agregar debounce o trigger events
        });
    }

    async ngOnInit() {
        this.isLoading = true;
        this.tenantId = await this.authService.getTenantId();
        if (!this.tenantId) {
            this.toastr.error('Error de sesión');
            return;
        }

        await this.loadDropdowns();

        if (this.isEditMode) {
            await this.loadFactura(this.itemId!);
        } else {
            // Al crear nueva, al menos 1 item vacío
            this.addItem();
        }

        this.isLoading = false;
    }

    get itemsArray() {
        return this.facturaForm.get('items') as FormArray;
    }

    addItem() {
        const itemForm = this.fb.group({
            descripcion: ['', Validators.required],
            cantidad: [1, [Validators.required, Validators.min(1)]],
            precioUnitario: [0, [Validators.required, Validators.min(0)]]
        });
        this.itemsArray.push(itemForm);
    }

    removeItem(index: number) {
        if (this.itemsArray.length > 1) {
            this.itemsArray.removeAt(index);
        }
    }

    async loadDropdowns() {
        if (this.tenantId) {
            this.crmService.getClientes().subscribe(cs => this.clientes = cs);
        }
    }

    async loadFactura(id: string) {
        this.facturaService.getFactura(id).subscribe(factura => {
            if (factura) {
                // Limpiamos items array local y re-armamos
                this.itemsArray.clear();
                if (factura.items) {
                    factura.items.forEach(i => {
                        this.itemsArray.push(this.fb.group({
                            descripcion: [i.descripcion, Validators.required],
                            cantidad: [i.cantidad, Validators.required],
                            precioUnitario: [i.precioUnitario, Validators.required]
                        }));
                    });
                }

                this.facturaForm.patchValue({
                    clienteId: factura.clienteId,
                    fechaEmision: (factura.fechaEmision as any)?.toDate ? (factura.fechaEmision as any).toDate().toISOString().split('T')[0] : new Date(factura.fechaEmision).toISOString().split('T')[0],
                    fechaVencimiento: (factura.fechaVencimiento as any)?.toDate ? (factura.fechaVencimiento as any).toDate().toISOString().split('T')[0] : new Date(factura.fechaVencimiento).toISOString().split('T')[0],
                    moneda: factura.moneda || 'CLP',
                    notas: (factura as any).notas,
                    porcentajeDescuento: (factura as any).porcentajeDescuento || 0,
                    porcentajeImpuesto: (factura as any).porcentajeImpuesto || 0
                });
            }
        });
    }

    // --- MATEMATICA CORE ---
    calcularSubtotalLineas(): number {
        return this.itemsArray.controls.reduce((acc, current) => {
            const val = current.value;
            return acc + ((val.cantidad || 0) * (val.precioUnitario || 0));
        }, 0);
    }

    calcularTotales() {
        const subtotalBase = this.calcularSubtotalLineas();
        const pDscto = this.facturaForm.value.porcentajeDescuento || 0;
        const montoDescuento = subtotalBase * (pDscto / 100);
        const subtotalConDscto = subtotalBase - montoDescuento;

        const pImp = this.facturaForm.value.porcentajeImpuesto || 0;
        const montoImpuesto = subtotalConDscto * (pImp / 100);

        const totalFinal = subtotalConDscto + montoImpuesto;

        return {
            subtotalBase, montoDescuento, montoImpuesto, totalFinal
        }
    }

    async onSubmit() {
        if (this.facturaForm.invalid) {
            this.toastr.warning('Completa todos los campos obligatorios');
            return;
        }

        this.isSaving = true;
        try {
            const calculos = this.calcularTotales();

            const payload: any = {
                tenantId: this.tenantId,
                clienteId: this.facturaForm.value.clienteId,
                moneda: this.facturaForm.value.moneda,
                fechaEmision: new Date(this.facturaForm.value.fechaEmision),
                fechaVencimiento: new Date(this.facturaForm.value.fechaVencimiento),
                condicionesPago: '30 días', // Default value missing on UI form
                notas: this.facturaForm.value.notas,
                estado: 'emitida', // Match literal type

                // Custom analytics for future handling
                porcentajeDescuento: this.facturaForm.value.porcentajeDescuento,
                porcentajeImpuesto: this.facturaForm.value.porcentajeImpuesto,

                subtotal: calculos.subtotalBase,
                impuestos: calculos.montoImpuesto,
                total: calculos.totalFinal,

                montoPagado: 0,
                montoPendiente: calculos.totalFinal,

                items: this.itemsArray.getRawValue().map((it: any) => ({
                    ...it,
                    total: (it.cantidad || 0) * (it.precioUnitario || 0)
                }))
            };

            if (this.isEditMode) {
                await this.facturaService.updateFactura(this.itemId!, payload);
                this.toastr.success('Factura actualizada');
            } else {
                const newId = await this.facturaService.createFactura(payload);
                this.toastr.success('Factura creada y serializada exitosamente');
                this.itemId = newId;
            }

            this.isSaving = false;
            this.router.navigate(['/facturas', this.itemId, 'view']);

        } catch (e) {
            console.error(e);
            this.toastr.error('Error al guardar la factura');
            this.isSaving = false;
        }
    }

    goBack() {
        this.location.back();
    }
}
