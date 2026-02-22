import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ToastrService } from 'ngx-toastr';

import { ContratoService } from '../../../core/services/contrato.service';
import { CrmService } from '../../../core/services/crm.service';
import { CotizacionService } from '../../../core/services/cotizacion.service';
import { AuthService } from '../../../core/services/auth.service';

import { Contrato, ContratoItem } from '../../../core/models/contrato.model';
import { Cliente } from '../../../core/models/crm.model';
import { Cotizacion } from '../../../core/models/cotizacion.model';
import { Timestamp } from '@angular/fire/firestore';

@Component({
    selector: 'app-contrato-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule],
    templateUrl: './contrato-form.component.html'
})
export class ContratoFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private contratoService = inject(ContratoService);
    private crmService = inject(CrmService);
    private cotizacionService = inject(CotizacionService);
    private authService = inject(AuthService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private location = inject(Location);
    private toastr = inject(ToastrService);

    contratoForm: FormGroup;
    itemId = this.route.snapshot.paramMap.get('id');
    isEditMode = !!this.itemId && this.itemId !== 'new';

    // Optional linkage to a quotation 
    cotiIdParam = this.route.snapshot.queryParamMap.get('cotiId');

    isLoading = false;
    isSaving = false;

    clientesActivos: Cliente[] = [];

    constructor() {
        this.contratoForm = this.fb.group({
            clienteId: ['', Validators.required],
            titulo: ['', Validators.required],
            fechaValidez: ['', Validators.required],
            cuerpoLegal: ['En la ciudad de X, con fecha Y, mediante el presente documento se acuerda...', Validators.required],
            cotizacionOrigenId: [''],
            moneda: ['CLP'],
            items: this.fb.array([]),
            total: [0]
        });
    }

    get itemsArray(): FormArray {
        return this.contratoForm.get('items') as FormArray;
    }

    ngOnInit() {
        this.loadMasters();
    }

    async loadMasters() {
        this.isLoading = true;
        try {
            this.crmService.getClientes().subscribe(async (clientes: Cliente[]) => {
                this.clientesActivos = clientes;

                if (this.isEditMode && this.itemId) {
                    this.contratoService.getContratoById(this.itemId).subscribe((cot: Contrato | undefined) => {
                        if (cot) this.patchFormulario(cot);
                        this.isLoading = false;
                    });
                } else if (this.cotiIdParam) {
                    // New from Cotizacion
                    this.cotizacionService.getCotizacion(this.cotiIdParam).subscribe((cot: Cotizacion | undefined) => {
                        if (cot) this.patchFromCotizacion(cot);
                        this.isLoading = false;
                    });
                } else {
                    this.isLoading = false;
                }
            });
        } catch (e) {
            console.error(e);
            this.toastr.error('Error pre-cargando maestros');
            this.isLoading = false;
        }
    }

    patchFormulario(c: Contrato) {
        let validezStr = '';
        if (c.fechaValidez instanceof Timestamp) {
            validezStr = c.fechaValidez.toDate().toISOString().substring(0, 10);
        } else if (c.fechaValidez) {
            validezStr = new Date(c.fechaValidez).toISOString().substring(0, 10);
        }

        this.contratoForm.patchValue({
            clienteId: c.clienteId,
            titulo: c.titulo,
            fechaValidez: validezStr,
            cuerpoLegal: c.cuerpoLegal,
            cotizacionOrigenId: c.cotizacionOrigenId || '',
            moneda: c.moneda || 'CLP',
            total: c.total || 0
        });

        this.itemsArray.clear();
        if (c.items) {
            c.items.forEach(i => {
                this.itemsArray.push(this.fb.group({
                    descripcion: [i.descripcion],
                    cantidad: [i.cantidad],
                    precioUnitario: [i.precioUnitario],
                    total: [i.total]
                }));
            });
        }
    }

    patchFromCotizacion(cot: Cotizacion) {
        this.contratoForm.patchValue({
            clienteId: cot.clienteId,
            titulo: `Contrato Comercial derivado de ${cot.correlativo}`,
            cotizacionOrigenId: cot.id || '',
            moneda: 'CLP', // Simplify default
            total: cot.totalFinal
        });

        this.itemsArray.clear();
        if (cot.items) {
            cot.items.forEach(i => {
                this.itemsArray.push(this.fb.group({
                    descripcion: [`${i.nombre} - ${i.descripcion}`],
                    cantidad: [i.cantidad],
                    precioUnitario: [i.precioUnitario],
                    total: [i.subtotal]
                }));
            });
        }
    }

    crearItemVacio() {
        this.itemsArray.push(this.fb.group({
            descripcion: ['', Validators.required],
            cantidad: [1, Validators.min(1)],
            precioUnitario: [0, Validators.min(0)],
            total: [0]
        }));
    }

    removerItem(index: number) {
        this.itemsArray.removeAt(index);
        this.recalcularTotalVacio();
    }

    recalcularTotalVacio() {
        let sum = 0;
        this.itemsArray.controls.forEach(c => {
            const q = c.get('cantidad')?.value || 0;
            const p = c.get('precioUnitario')?.value || 0;
            c.get('total')?.setValue(q * p, { emitEvent: false });
            sum += (q * p);
        });
        this.contratoForm.get('total')?.setValue(sum, { emitEvent: false });
    }

    async onSubmit() {
        if (this.contratoForm.invalid) {
            this.contratoForm.markAllAsTouched();
            this.toastr.error('Completa los campos obligatorios del contrato');
            return;
        }

        this.isSaving = true;
        const raw = this.contratoForm.getRawValue();
        const user = await this.authService.getCurrentUser();
        const tenantId = await this.authService.getTenantId();

        if (!tenantId || !user) {
            this.toastr.error('Error de sesión');
            this.isSaving = false;
            return;
        }

        const payload: Partial<Contrato> = {
            tenantId: tenantId,
            vendedorId: user.uid,
            clienteId: raw.clienteId,
            titulo: raw.titulo,
            cuerpoLegal: raw.cuerpoLegal,
            fechaValidez: new Date(raw.fechaValidez),
            fechaEmision: new Date(),
            cotizacionOrigenId: raw.cotizacionOrigenId,
            moneda: raw.moneda,
            total: raw.total,
            correlativo: `CNT-${new Date().getTime().toString().substring(7)}`, // basic correlate
            items: raw.items
        };

        try {
            if (this.isEditMode && this.itemId) {
                await this.contratoService.updateContrato(this.itemId, payload);
                this.toastr.success('Contrato actualizado');
            } else {
                await this.contratoService.createContrato(payload as Contrato);
                this.toastr.success('Contrato creado en Borrador');
            }
            this.router.navigate(['/contratos']);
        } catch (error) {
            console.error(error);
            this.toastr.error('Error guardando el contrato');
        } finally {
            this.isSaving = false;
        }
    }

    goBack() {
        this.location.back();
    }
}
