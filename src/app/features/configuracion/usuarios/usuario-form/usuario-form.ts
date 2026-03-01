import { Component, EventEmitter, Output, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, X, Save, UserPlus, Edit2, Loader2 } from 'lucide-angular';
import { UserService } from '../../../../core/services/user.service';
import { ToastrService } from 'ngx-toastr';
import { UserData } from '../../../../core/models/user.model';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ X, Save, UserPlus, Edit2, Loader2 }) }
  ],
  templateUrl: './usuario-form.html',
  styleUrl: './usuario-form.scss',
})
export class UsuarioForm implements OnInit {
  @Input() userToEdit: UserData | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private toastr = inject(ToastrService);

  userForm: FormGroup;
  isSaving = false;
  get isEditMode(): boolean {
    return !!this.userToEdit;
  }

  constructor() {
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      nombre: ['', Validators.required],
      rol: ['admin', Validators.required],
      password: [''],
      activo: [true]
    });
  }

  ngOnInit() {
    if (this.userToEdit) {
      this.userForm.patchValue({
        email: this.userToEdit.email,
        nombre: this.userToEdit.nombre,
        rol: this.userToEdit.role || 'admin',
        activo: this.userToEdit.activo !== false // Default true unless explicitly false
      });
      // Email cannot be easily changed through standard edit form, so we disable it
      this.userForm.get('email')?.disable();
    }
  }

  async onSubmit() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const formValue = this.userForm.getRawValue(); // use getRawValue to get disabled email if needed

    try {
      if (this.isEditMode) {
        // Update user
        const updateData: any = {
          uid: this.userToEdit!.uid,
          nombre: formValue.nombre,
          role: formValue.rol,
          activo: formValue.activo
        };
        // only include password if typed
        if (formValue.password && formValue.password.trim() !== '') {
          updateData.password = formValue.password;
        }

        const response = await this.userService.updateTeamMember(updateData);
        this.toastr.success(response.message || 'Usuario actualizado correctamente', 'Éxito', { timeOut: 5000 });
      } else {
        // Create user
        const createData: any = {
          email: formValue.email,
          nombre: formValue.nombre,
          role: formValue.rol
        };

        if (formValue.password && formValue.password.trim() !== '') {
          createData.password = formValue.password;
        }

        const response = await this.userService.createTeamMember(createData);
        this.toastr.success(response.message || 'Usuario creado correctamente', 'Éxito', { timeOut: 10000 });
      }

      this.saved.emit();
      this.close.emit();
    } catch (error) {
      console.error('Error saving user:', error);
      this.toastr.error(this.isEditMode ? 'Error al actualizar el usuario' : 'Error al crear el usuario');
    } finally {
      this.isSaving = false;
    }
  }


}
