import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LUCIDE_ICONS, LucideIconProvider,  LucideAngularModule, Building2, Clock, Edit2, FolderPlus, Loader2, Save, X  } from 'lucide-angular';
import { Observable } from 'rxjs';

import { CrmService } from '../../../core/services/crm.service';
import { Cliente } from '../../../core/models/crm.model';
import { Proyecto } from '../../../core/models/proyectos.model';

@Component({
    selector: 'app-proyecto-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Building2, Clock, Edit2, FolderPlus, Loader2, Save, X }) }
  ],
    templateUrl: './proyecto-form.component.html'
})
export class ProyectoFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private crmService = inject(CrmService);

    @Input() proyectoSeleccionado?: Proyecto;
    @Output() onSave = new EventEmitter<Partial<Proyecto>>();
    @Output() onCancel = new EventEmitter<void>();

    proyectoForm!: FormGroup;
    clientes$!: Observable<Cliente[]>;
    isSubmitting = false;

    ngOnInit(): void {
        this.clientes$ = this.crmService.getClientes();
        this.initForm();
        if (this.proyectoSeleccionado) {
            this.proyectoForm.patchValue(this.proyectoSeleccionado);
        }
    }

    private initForm(): void {
        this.proyectoForm = this.fb.group({
            nombre: ['', [Validators.required, Validators.minLength(3)]],
            clienteId: ['', Validators.required],
            descripcion: [''],
            estado: ['activo', Validators.required],
            presupuestoHoras: [0, [Validators.min(0)]]
        });
    }

    submit(): void {
        if (this.proyectoForm.invalid) {
            this.proyectoForm.markAllAsTouched();
            return;
        }

        this.isSubmitting = true;
        const formValues = this.proyectoForm.value;

        // Devolvemos el objeto parcial de Proyecto
        this.onSave.emit(formValues);
    }

    cancel(): void {
        this.onCancel.emit();
    }
}
