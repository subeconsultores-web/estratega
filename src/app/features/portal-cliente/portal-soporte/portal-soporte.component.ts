import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TicketsService } from '../../../core/services/tickets.service';

@Component({
    selector: 'app-portal-soporte',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    template: `
        <div class="max-w-3xl mx-auto space-y-6">
            <div class="mb-8">
                <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Centro de Soporte</h1>
                <p class="text-gray-500 mt-1 text-sm">¿Tienes alguna duda o incidencia? Escríbenos y un agente lo resolverá a la brevedad.</p>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <form (ngSubmit)="enviarTicket()" #ticketForm="ngForm" class="space-y-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
                        <input type="text" [(ngModel)]="ticket.asunto" name="asunto" required
                            placeholder="Ej. Problemas con el acceso al sistema mensual"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                        <select [(ngModel)]="ticket.prioridad" name="prioridad"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white">
                            <option value="baja">Baja - Duda general</option>
                            <option value="media">Media - Falla una funcionalidad no vital</option>
                            <option value="alta">Alta - El sistema está caído o me impide operar</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Descripción de la incidencia</label>
                        <textarea [(ngModel)]="ticket.mensaje" name="mensaje" required rows="5"
                            placeholder="Describe paso a paso lo que ha ocurrido..."
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-y"></textarea>
                    </div>

                    <div class="pt-4 border-t border-gray-100 mt-6 flex justify-end">
                        <button type="submit" [disabled]="!ticketForm.form.valid || isSubmitting"
                            class="inline-flex items-center px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                            <ng-container *ngIf="isSubmitting">
                                <lucide-icon name="loader-2" class="w-4 h-4 mr-2 animate-spin"></lucide-icon>
                                Enviando...
                            </ng-container>
                            <ng-container *ngIf="!isSubmitting">
                                <lucide-icon name="send" class="w-4 h-4 mr-2"></lucide-icon>
                                Enviar Ticket
                            </ng-container>
                        </button>
                    </div>
                </form>
            </div>
            
            <!-- Success Message (Mocked visually after submission) -->
            <div *ngIf="successMessage" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
                 <lucide-icon name="check-circle" class="w-5 h-5 mr-2"></lucide-icon>
                 Su ticket ha sido enviado correctamente. Recibirá notificaciones en su correo.
            </div>
        </div>
    `
})
export class PortalSoporteComponent {
    private ticketsService = inject(TicketsService);

    isSubmitting = false;
    successMessage = false;

    ticket = {
        asunto: '',
        mensaje: '',
        prioridad: 'baja' as 'baja' | 'media' | 'alta',
        clienteId: 'CU-TEMP-001' // Mock pending Auth injection
    };

    async enviarTicket() {
        if (!this.ticket.asunto || !this.ticket.mensaje) return;

        this.isSubmitting = true;
        try {
            await this.ticketsService.createTicket({
                asunto: this.ticket.asunto,
                mensaje: this.ticket.mensaje,
                prioridad: this.ticket.prioridad,
                clienteId: this.ticket.clienteId,
                estado: 'abierto'
            });
            this.successMessage = true;
            this.ticket.asunto = '';
            this.ticket.mensaje = '';

            setTimeout(() => this.successMessage = false, 5000);
        } catch (error) {
            console.error(error);
            alert('Error al enviar el ticket');
        } finally {
            this.isSubmitting = false;
        }
    }
}
