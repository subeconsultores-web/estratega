import { Component, inject, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, Clock, Plus, Trash2, Calendar, FileText, DollarSign, CheckCircle2 } from 'lucide-angular';
import { RegistroTiempoService } from '../../../core/services/registro-tiempo.service';
import { RegistroTiempo } from '../../../core/models/registro-tiempo.model';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '@angular/fire/auth';

@Component({
    selector: 'app-time-tracking',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
    providers: [
        { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Clock, Plus, Trash2, Calendar, FileText, DollarSign, CheckCircle2 }) }
    ],
    templateUrl: './time-tracking.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimeTrackingComponent implements OnInit {
    @Input() proyectoId!: string;

    private timeService = inject(RegistroTiempoService);
    private authService = inject(AuthService);
    private fb = inject(FormBuilder);

    registros$!: Observable<RegistroTiempo[]>;
    showForm = false;
    timeForm!: FormGroup;
    isSaving = false;
    currentUser: User | null = null;

    async ngOnInit() {
        this.currentUser = await this.authService.getCurrentUser();
        if (this.proyectoId) {
            this.cargarRegistros();
            this.initForm();
        }
    }

    cargarRegistros() {
        this.registros$ = this.timeService.getRegistrosByProyecto(this.proyectoId);
    }

    initForm() {
        this.timeForm = this.fb.group({
            fecha: [new Date().toISOString().split('T')[0], Validators.required],
            duracionMinutos: [60, [Validators.required, Validators.min(1)]],
            descripcion: ['', [Validators.required, Validators.maxLength(250)]],
            facturable: [true]
        });
    }

    abrirFormulario() {
        this.initForm();
        this.showForm = true;
    }

    cerrarFormulario() {
        this.showForm = false;
    }

    async guardarTiempo() {
        if (this.timeForm.invalid || !this.currentUser) return;

        this.isSaving = true;
        try {
            const formVal = this.timeForm.value;
            const nuevoRegistro: Partial<RegistroTiempo> = {
                proyectoId: this.proyectoId,
                usuarioId: this.currentUser.uid!,
                clienteId: 'placeholder', // Ideally linked from `Proyecto` input, but will let functions handle cross-data if needed
                fecha: new Date(formVal.fecha || new Date()),
                duracionMinutos: formVal.duracionMinutos,
                descripcion: formVal.descripcion,
                facturable: formVal.facturable,
                aprobado: true // Auto-approve for now based on role
            };

            await this.timeService.addRegistro(nuevoRegistro);
            this.cerrarFormulario();
        } catch (e) {
            console.error('Error guardando registro de tiempo:', e);
        } finally {
            this.isSaving = false;
        }
    }

    async eliminarRegistro(id: string) {
        if (confirm('¿Estás seguro de que deseas eliminar este registro de tiempo?')) {
            await this.timeService.deleteRegistro(id);
        }
    }
}
