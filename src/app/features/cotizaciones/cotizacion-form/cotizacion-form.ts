import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CotizacionService } from '../../../core/services/cotizacion.service';
import { CrmService } from '../../../core/services/crm.service';
import { Cliente } from '../../../core/models/crm.model';
import { CatalogoServicio, Cotizacion } from '../../../core/models/cotizacion.model';
import { LucideAngularModule } from 'lucide-angular';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-cotizacion-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule],
  templateUrl: './cotizacion-form.html',
  styleUrl: './cotizacion-form.scss',
})
export class CotizacionFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private cotizacionService = inject(CotizacionService);
  private crmService = inject(CrmService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  cotizacionForm!: FormGroup;
  isEditMode = false;
  cotizacionId: string | null = null;
  isSaving = false;
  isLoadingData = true;

  clientes: Cliente[] = [];
  servicios: CatalogoServicio[] = [];

  // Tasa de impuesto (Por defecto 19% en Chile) - Idealmente viene de config tenant
  readonly TASA_IVA = 0.19;

  private formSub!: Subscription;

  get itemsFormArray() {
    return this.cotizacionForm.get('items') as FormArray;
  }

  ngOnInit() {
    this.initForm();
    this.loadCatalogAndClients();

    this.cotizacionId = this.route.snapshot.paramMap.get('id');
    if (this.cotizacionId) {
      this.isEditMode = true;
      this.loadCotizacionData();
    } else {
      this.isLoadingData = false;
      this.addItem(); // Empezar con un item vacío
    }
  }

  ngOnDestroy() {
    if (this.formSub) this.formSub.unsubscribe();
  }

  initForm() {
    this.cotizacionForm = this.fb.group({
      clienteId: ['', Validators.required],
      titulo: ['', Validators.required],
      moneda: ['CLP', Validators.required],
      estado: ['borrador', Validators.required],
      validezDias: [30, [Validators.required, Validators.min(1)]],
      items: this.fb.array([]),
      subtotal: [0],
      descuentoGlobal: [0, [Validators.min(0)]],
      impuestos: [0],
      total: [0],
      condiciones: ['Cotización válida por 30 días.'],
      notas: ['']
    });

    // Suscripción para recalcular totales cuando cambian los items o el descuento
    this.formSub = this.cotizacionForm.valueChanges.subscribe(val => {
      this.calcularTotales();
    });
  }

  loadCatalogAndClients() {
    this.crmService.getClientes().subscribe(data => this.clientes = data);
    this.cotizacionService.getCatalogo().subscribe(data => this.servicios = data);
  }

  loadCotizacionData() {
    this.cotizacionService.getCotizacion(this.cotizacionId!).subscribe({
      next: (data) => {
        if (data) {
          // Limpiar items existentes antes de parchear
          while (this.itemsFormArray.length !== 0) {
            this.itemsFormArray.removeAt(0);
          }

          if (data.items && data.items.length) {
            data.items.forEach(item => this.addItem(item));
          }

          this.cotizacionForm.patchValue({
            clienteId: data.clienteId,
            titulo: data.titulo,
            moneda: data.moneda,
            estado: data.estado,
            validezDias: data.validezDias,
            descuentoGlobal: data.descuentoGlobal,
            condiciones: data.condiciones,
            notas: data.notas
          });
        }
        this.isLoadingData = false;
      },
      error: (err) => {
        this.toastr.error('Cotización no encontrada');
        this.router.navigate(['/cotizaciones']);
      }
    });
  }

  createItemFormGroup(item?: any) {
    return this.fb.group({
      servicioId: [item?.servicioId || ''],
      descripcion: [item?.descripcion || '', Validators.required],
      cantidad: [item?.cantidad || 1, [Validators.required, Validators.min(1)]],
      precioUnitario: [item?.precioUnitario || 0, [Validators.required, Validators.min(0)]],
      descuento: [item?.descuento || 0, [Validators.min(0)]],
      total: [item?.total || 0]
    });
  }

  addItem(item?: any) {
    this.itemsFormArray.push(this.createItemFormGroup(item));
  }

  removeItem(index: number) {
    if (this.itemsFormArray.length > 1) {
      this.itemsFormArray.removeAt(index);
    } else {
      this.toastr.warning('Debe existir al menos un ítem');
    }
  }

  onServicioSelect(index: number) {
    const formGroup = this.itemsFormArray.at(index);
    const servicioId = formGroup.get('servicioId')?.value;

    if (servicioId) {
      const servicio = this.servicios.find(s => s.id === servicioId);
      if (servicio) {
        formGroup.patchValue({
          descripcion: servicio.descripcion || servicio.nombre,
          precioUnitario: servicio.precioBase,
          // reseteamos cantidad y desc
          cantidad: 1,
          descuento: 0
        }, { emitEvent: true });
      }
    }
  }

  calcularTotales() {
    let subtotal = 0;

    // Calcular total por línea
    this.itemsFormArray.controls.forEach(control => {
      const cantidad = control.get('cantidad')?.value || 0;
      const precioUnitario = control.get('precioUnitario')?.value || 0;
      const descuentoLinea = control.get('descuento')?.value || 0;

      const lineaBruto = cantidad * precioUnitario;
      const lineaNeto = lineaBruto - descuentoLinea;

      // Update del control silencioso
      control.get('total')?.setValue(lineaNeto > 0 ? lineaNeto : 0, { emitEvent: false });

      subtotal += (lineaNeto > 0 ? lineaNeto : 0);
    });

    const descuentoGlobal = this.cotizacionForm.get('descuentoGlobal')?.value || 0;
    const baseImponible = (subtotal - descuentoGlobal) > 0 ? (subtotal - descuentoGlobal) : 0;

    const impuestos = Math.round(baseImponible * this.TASA_IVA);
    const total = baseImponible + impuestos;

    this.cotizacionForm.patchValue({
      subtotal: subtotal,
      impuestos: impuestos,
      total: total
    }, { emitEvent: false }); // Avoid infinite loop
  }

  async onSubmit() {
    if (this.cotizacionForm.invalid) {
      this.cotizacionForm.markAllAsTouched();
      this.toastr.error('Revise los errores en el formulario');
      return;
    }

    if (this.itemsFormArray.length === 0) {
      this.toastr.error('Debe incluir al menos un ítem en la cotización');
      return;
    }

    this.isSaving = true;
    const formValue = this.cotizacionForm.getRawValue();

    try {
      if (this.isEditMode && this.cotizacionId) {
        await this.cotizacionService.updateCotizacion(this.cotizacionId, formValue);
        this.toastr.success('Cotización actualizada');
      } else {
        // Generar un código Formateado Dummy para desarrollo (luego se pasa a CF)
        const temporalCorrelativo = Math.floor(Math.random() * 1000);
        formValue.codigoFormateado = `COT-${temporalCorrelativo.toString().padStart(4, '0')}`;
        await this.cotizacionService.createCotizacion(formValue);
        this.toastr.success('Cotización generada exitosamente');
      }
      this.router.navigate(['/cotizaciones']);
    } catch (error) {
      console.error(error);
      this.toastr.error('Error al guardar la propuesta');
    } finally {
      this.isSaving = false;
    }
  }
}
