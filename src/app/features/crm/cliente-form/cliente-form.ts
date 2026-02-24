import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { LUCIDE_ICONS, LucideIconProvider,  LucideAngularModule, ChevronLeft  } from 'lucide-angular';
import { CrmService } from '../../../core/services/crm.service';

function rutValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const rutLimpio = control.value.replace(/[^0-9kK]/g, '').toUpperCase();
  if (rutLimpio.length < 2) return { rutInvalido: true };

  const cuerpo = rutLimpio.slice(0, -1);
  let dv = rutLimpio.slice(-1);
  let suma = 0;
  let multiplo = 2;

  for (let i = 1; i <= cuerpo.length; i++) {
    suma = suma + multiplo * parseInt(cuerpo.charAt(cuerpo.length - i));
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }

  const dvEsperado = 11 - (suma % 11);
  let dvCalculado = (dvEsperado === 11) ? "0" : ((dvEsperado === 10) ? "K" : dvEsperado.toString());

  if (dvCalculado !== dv) return { rutInvalido: true };
  return null;
}

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ ChevronLeft }) }
  ],
  templateUrl: './cliente-form.html',
  styleUrl: './cliente-form.scss',
})
export class ClienteForm implements OnInit {
  private fb = inject(FormBuilder);
  private crmService = inject(CrmService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastr = inject(ToastrService);

  clienteForm!: FormGroup;
  clienteId: string | null = null;
  isEditMode = false;
  isSaving = false;
  isLoadingData = false;

  ngOnInit() {
    this.initForm();
    this.clienteId = this.route.snapshot.paramMap.get('id');

    if (this.clienteId) {
      this.isEditMode = true;
      this.loadClienteData(this.clienteId);
    }
  }

  private initForm() {
    this.clienteForm = this.fb.group({
      nombreEmpresa: ['', Validators.required],
      rut: ['', [rutValidator]],
      giro: [''],
      direccion: [''],
      fuenteAdquisicion: ['web'],
      estado: ['lead', Validators.required],
      notas: [''],
      contactoPrincipal: this.fb.group({
        nombre: ['', Validators.required],
        email: ['', [Validators.email]],
        telefono: [''],
        cargo: ['']
      })
    });
  }

  private loadClienteData(id: string) {
    this.isLoadingData = true;
    this.crmService.getCliente(id).subscribe({
      next: (cliente) => {
        if (cliente) {
          this.clienteForm.patchValue(cliente);
        } else {
          this.toastr.error('Cliente no encontrado');
          this.router.navigate(['/crm/clientes']);
        }
        this.isLoadingData = false;
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Error al cargar datos del cliente');
        this.isLoadingData = false;
      }
    });
  }

  async onSubmit() {
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      this.toastr.error('Por favor, revise los campos marcados en rojo');
      return;
    }

    this.isSaving = true;
    const formValues = this.clienteForm.value;

    try {
      if (this.isEditMode && this.clienteId) {
        await this.crmService.updateCliente(this.clienteId, formValues);
        this.toastr.success('Cliente actualizado correctamente');
      } else {
        await this.crmService.createCliente(formValues);
        this.toastr.success('Cliente creado correctamente');
      }
      this.router.navigate(['/crm/clientes']);
    } catch (error) {
      console.error(error);
      this.toastr.error('No se pudo guardar el cliente');
    } finally {
      this.isSaving = false;
    }
  }

  get f() { return this.clienteForm.controls; }
  get contactoF() { return (this.clienteForm.get('contactoPrincipal') as FormGroup).controls; }
}
