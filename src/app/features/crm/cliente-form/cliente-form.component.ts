import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ToastrService } from 'ngx-toastr';
import { CrmService } from '../../../core/services/crm.service';
import { Cliente } from '../../../core/models/crm.model';

@Component({
    selector: 'app-cliente-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule],
    templateUrl: './cliente-form.component.html'
})
export class ClienteFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private crmService = inject(CrmService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private toastr = inject(ToastrService);

    clienteForm!: FormGroup;
    isEditing = false;
    clienteId: string | null = null;
    isSaving = false;

    ngOnInit() {
        this.initForm();
        this.clienteId = this.route.snapshot.paramMap.get('id');

        if (this.clienteId) {
            this.isEditing = true;
            this.loadClienteData();
        }
    }

    initForm() {
        this.clienteForm = this.fb.group({
            rut: ['', [Validators.required]],
            nombreEmpresa: ['', [Validators.required, Validators.minLength(3)]],
            giro: ['', Validators.required],
            direccion: [''],
            contactoPrincipal: this.fb.group({
                nombre: ['', Validators.required],
                email: ['', [Validators.required, Validators.email]],
                telefono: [''],
                cargo: ['']
            }),
            fuenteAdquisicion: ['web', Validators.required],
            estado: ['lead', Validators.required],
            pipelineEtapa: ['Contacto Inicial'],
            notas: ['']
        });
    }

    loadClienteData() {
        if (!this.clienteId) return;

        this.crmService.getCliente(this.clienteId).subscribe({
            next: (cliente: Cliente | undefined) => {
                if (cliente) {
                    this.clienteForm.patchValue(cliente);
                } else {
                    this.toastr.error('Cliente no encontrado');
                    this.router.navigate(['/crm/clientes']);
                }
            },
            error: () => this.toastr.error('Error al cargar datos del cliente')
        });
    }

    async save() {
        if (this.clienteForm.invalid) {
            this.clienteForm.markAllAsTouched();
            this.toastr.warning('Por favor, completa los campos requeridos correctamente');
            return;
        }

        this.isSaving = true;
        const formData = this.clienteForm.value;

        try {
            if (this.isEditing && this.clienteId) {
                await this.crmService.updateCliente(this.clienteId, formData);
                this.toastr.success('Cliente actualizado correctamente');
            } else {
                // Init properties
                formData.totalHistorico = 0;
                await this.crmService.createCliente(formData);
                this.toastr.success('Cliente creado correctamente');
            }
            this.router.navigate(['/crm/clientes']);
        } catch (error) {
            console.error(error);
            this.toastr.error('Ocurrió un error al guardar el cliente');
        } finally {
            this.isSaving = false;
        }
    }
}
