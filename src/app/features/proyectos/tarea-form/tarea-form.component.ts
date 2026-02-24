import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LUCIDE_ICONS, LucideIconProvider,  LucideAngularModule, CheckSquare, Clock, Edit3, Loader2, Save, X  } from 'lucide-angular';
import { Tarea, TareaEstado } from '../../../core/models/proyectos.model';

@Component({
    selector: 'app-tarea-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ CheckSquare, Clock, Edit3, Loader2, Save, X }) }
  ],
    templateUrl: './tarea-form.component.html'
})
export class TareaFormComponent implements OnInit {
    private fb = inject(FormBuilder);

    @Input() tareaSeleccionada?: Tarea;
    @Input() columnaInicial: TareaEstado = 'todo'; // Por si se crea la tarea desde un botón en una columna específica
    @Output() onSave = new EventEmitter<Partial<Tarea>>();
    @Output() onCancel = new EventEmitter<void>();

    tareaForm!: FormGroup;
    isSubmitting = false;

    ngOnInit(): void {
        this.initForm();
        if (this.tareaSeleccionada) {
            this.tareaForm.patchValue(this.tareaSeleccionada);
        }
    }

    private initForm(): void {
        this.tareaForm = this.fb.group({
            titulo: ['', [Validators.required, Validators.minLength(3)]],
            descripcion: [''],
            estado: [this.columnaInicial, Validators.required],
            tiempoEstimado: [0, [Validators.min(0)]]
        });
    }

    submit(): void {
        if (this.tareaForm.invalid) {
            this.tareaForm.markAllAsTouched();
            return;
        }

        this.isSubmitting = true;
        const formValues = this.tareaForm.value;

        // Devolvemos el objeto parcial de Tarea
        this.onSave.emit(formValues);
    }

    cancel(): void {
        this.onCancel.emit();
    }
}
