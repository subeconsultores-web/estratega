import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, X, Send, Loader2, UserPlus, CheckCircle, AlertCircle } from 'lucide-angular';
import { Functions, httpsCallable } from '@angular/fire/functions';

@Component({
    selector: 'app-invitar-cliente-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    providers: [
        { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ X, Send, Loader2, UserPlus, CheckCircle, AlertCircle }) }
    ],
    template: `
        <!-- Overlay -->
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
             (click)="onBackdropClick($event)">

            <!-- Dialog -->
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">

                <!-- Header -->
                <div class="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <lucide-icon name="user-plus" class="w-5 h-5"></lucide-icon>
                        </div>
                        <div>
                            <h2 class="text-lg font-bold text-gray-900">Invitar al Portal</h2>
                            <p class="text-xs text-gray-500">{{ empresaNombre }}</p>
                        </div>
                    </div>
                    <button (click)="close.emit()" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <lucide-icon name="x" class="w-4 h-4 text-gray-400"></lucide-icon>
                    </button>
                </div>

                <!-- Success State -->
                <div *ngIf="inviteSuccess" class="px-6 py-10 text-center">
                    <div class="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <lucide-icon name="check-circle" class="w-8 h-8"></lucide-icon>
                    </div>
                    <h3 class="text-lg font-bold text-gray-900 mb-2">¡Invitación Enviada!</h3>
                    <p class="text-sm text-gray-500 max-w-xs mx-auto">
                        Se envió un enlace de acceso a <strong>{{ inviteEmail }}</strong>.
                        El cliente podrá acceder al portal tras establecer su contraseña.
                    </p>
                    <button (click)="close.emit()" class="mt-6 px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                        Cerrar
                    </button>
                </div>

                <!-- Form State -->
                <form *ngIf="!inviteSuccess" (ngSubmit)="enviarInvitacion()" class="px-6 py-5 space-y-4">
                    <p class="text-sm text-gray-600">
                        Se creará una cuenta de acceso al Portal de Cliente para esta empresa.
                        El contacto recibirá un email con las instrucciones de acceso.
                    </p>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email del contacto</label>
                        <input type="email" [(ngModel)]="inviteEmail" name="email" required
                            placeholder="nombre@empresa.com"
                            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del contacto</label>
                        <input type="text" [(ngModel)]="inviteNombre" name="nombre" required
                            placeholder="Ej. María González"
                            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm">
                    </div>

                    <!-- Error -->
                    <div *ngIf="errorMessage" class="flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                        <lucide-icon name="alert-circle" class="w-4 h-4 mt-0.5 shrink-0"></lucide-icon>
                        <p class="text-sm">{{ errorMessage }}</p>
                    </div>

                    <!-- Actions -->
                    <div class="flex justify-end gap-3 pt-2">
                        <button type="button" (click)="close.emit()"
                            class="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" [disabled]="isSubmitting || !inviteEmail || !inviteNombre"
                            class="inline-flex items-center px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                            <ng-container *ngIf="isSubmitting">
                                <lucide-icon name="loader-2" class="w-4 h-4 mr-2 animate-spin"></lucide-icon>
                                Creando...
                            </ng-container>
                            <ng-container *ngIf="!isSubmitting">
                                <lucide-icon name="send" class="w-4 h-4 mr-2"></lucide-icon>
                                Enviar Invitación
                            </ng-container>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `
})
export class InvitarClienteDialogComponent {
    private functions = inject(Functions);

    @Input() clienteId!: string;
    @Input() empresaNombre = '';
    @Input() contactoEmail = '';
    @Input() contactoNombre = '';
    @Output() close = new EventEmitter<void>();
    @Output() invited = new EventEmitter<{ uid: string; email: string }>();

    inviteEmail = '';
    inviteNombre = '';
    isSubmitting = false;
    inviteSuccess = false;
    errorMessage = '';

    ngOnInit() {
        // Pre-populate from CRM contact data
        this.inviteEmail = this.contactoEmail || '';
        this.inviteNombre = this.contactoNombre || '';
    }

    async enviarInvitacion() {
        if (!this.inviteEmail || !this.inviteNombre || !this.clienteId) return;

        this.isSubmitting = true;
        this.errorMessage = '';

        try {
            const createClientUser = httpsCallable(this.functions, 'createClientUser');
            const result: any = await createClientUser({
                email: this.inviteEmail,
                nombre: this.inviteNombre,
                clienteId: this.clienteId
            });

            if (result.data?.success) {
                this.inviteSuccess = true;
                this.invited.emit({ uid: result.data.uid, email: this.inviteEmail });
            } else {
                this.errorMessage = result.data?.message || 'Error desconocido al crear la invitación.';
            }
        } catch (error: any) {
            console.error('Error invitando cliente:', error);
            this.errorMessage = error?.message || 'Error al crear la cuenta de cliente. Intenta de nuevo.';
        } finally {
            this.isSubmitting = false;
        }
    }

    onBackdropClick(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            this.close.emit();
        }
    }
}
