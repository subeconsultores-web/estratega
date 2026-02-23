import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { ToastrService } from 'ngx-toastr';
import { LucideAngularModule } from 'lucide-angular';
import { FirebaseError } from '@angular/fire/app';

@Component({
    selector: 'app-register-agency',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule],
    templateUrl: './register-agency.component.html'
})
export class RegisterAgencyComponent {
    private fb = inject(FormBuilder);
    private auth = inject(Auth);
    private functions = inject(Functions);
    private router = inject(Router);
    private toastr = inject(ToastrService);

    registerForm: FormGroup;
    isLoading = false;

    constructor() {
        this.registerForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            nombreAgencia: ['', [Validators.required, Validators.minLength(3)]],
            rutAgencia: [''],
            telefono: [''],
        });
    }

    async onSubmit() {
        if (this.registerForm.invalid) {
            this.toastr.warning('Por favor completa los campos obligatorios correctamente.');
            return;
        }

        this.isLoading = true;
        const { email, password, nombreAgencia, rutAgencia, telefono } = this.registerForm.value;

        try {
            // 1. Crear usuario en Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);

            // 2. Llamar a la Cloud Function para aprovisionar el Tenant y asignar Claims
            const registerFn = httpsCallable(this.functions, 'registerAgency');
            await registerFn({ nombreAgencia, rutAgencia, telefono });

            // 3. Forzar refresco del token para obtener los Custom Claims (tenantId, role)
            if (userCredential.user) {
                await userCredential.user.getIdToken(true);
            }

            this.toastr.success('¡Agencia creada exitosamente! Bienvenido a Estratega SaaS.');
            this.router.navigate(['/dashboard']);

        } catch (error: any) {
            console.error('Error registrando agencia:', error);
            let errorMsg = 'Error al crear la cuenta. Intenta nuevamente.';

            if (error instanceof FirebaseError) {
                if (error.code === 'auth/email-already-in-use') {
                    errorMsg = 'El correo electrónico ya está registrado.';
                } else if (error.code === 'auth/weak-password') {
                    errorMsg = 'La contraseña es muy débil (mínimo 6 caracteres).';
                }
            } else if (error.message) {
                errorMsg = error.message; // Error de HttpsError (Cloud Function)
            }

            this.toastr.error(errorMsg);
        } finally {
            this.isLoading = false;
        }
    }
}
