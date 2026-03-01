import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, MessageCircle, Send, Loader2, X, Bot } from 'lucide-angular';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { AuthService } from '../../../core/services/auth.service';

interface ChatMessage {
    role: 'user' | 'assistant';
    contenido: string;
    createdAt: Date;
}

@Component({
    selector: 'app-portal-chat',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    providers: [
        { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ MessageCircle, Send, Loader2, X, Bot }) }
    ],
    template: `
        <!-- Floating Trigger Button -->
        <button *ngIf="!isOpen" (click)="isOpen = true"
            class="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-elevation-2 hover:brightness-110 transition-all hover:scale-105 flex items-center justify-center z-50 btn-press" aria-label="Abrir chat de soporte">
            <lucide-icon name="message-circle" [size]="24"></lucide-icon>
        </button>

        <!-- Chat Panel -->
        <div *ngIf="isOpen"
            class="fixed bottom-6 right-6 w-96 h-[520px] bg-surface rounded-2xl shadow-elevation-3 border border-border flex flex-col overflow-hidden z-50 animate-scale-in">

            <!-- Header -->
            <div class="px-5 py-4 bg-primary text-white flex items-center justify-between shrink-0">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                        <lucide-icon name="bot" [size]="18"></lucide-icon>
                    </div>
                    <div>
                        <p class="text-sm font-semibold">Asistente del Proyecto</p>
                        <p class="text-xs opacity-80">Respuestas basadas en tu proyecto</p>
                    </div>
                </div>
                <button (click)="isOpen = false" aria-label="Cerrar chat" class="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                    <lucide-icon name="x" [size]="16"></lucide-icon>
                </button>
            </div>

            <!-- Messages -->
            <div class="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar" role="log" aria-live="polite">
                <div *ngIf="messages.length === 0" class="text-center py-8 text-txt-muted">
                    <lucide-icon name="bot" [size]="36" class="mx-auto mb-3 opacity-40"></lucide-icon>
                    <p class="text-sm font-medium">¡Hola! 👋</p>
                    <p class="text-xs mt-1">Pregúntame sobre tu proyecto, facturas o avance.</p>
                </div>

                <div *ngFor="let msg of messages; trackBy: trackByMsg"
                    class="flex" [class.justify-end]="msg.role === 'user'" [class.justify-start]="msg.role === 'assistant'">
                    <div class="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                        [ngClass]="{
                            'bg-primary text-white rounded-br-md': msg.role === 'user',
                            'bg-base text-txt-primary rounded-bl-md': msg.role === 'assistant'
                        }">
                        <p class="whitespace-pre-wrap">{{ msg.contenido }}</p>
                    </div>
                </div>

                <div *ngIf="isLoading" class="flex justify-start">
                    <div class="bg-base rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2 text-txt-muted">
                        <lucide-icon name="loader-2" [size]="14" class="animate-spin"></lucide-icon>
                        <span class="text-xs">Escribiendo...</span>
                    </div>
                </div>
            </div>

            <!-- Input -->
            <div class="px-4 py-3 border-t border-border shrink-0">
                <div class="flex items-center gap-2">
                    <input type="text" [(ngModel)]="pregunta" placeholder="Escribe tu pregunta..."
                        aria-label="Escribe tu pregunta"
                        (keydown.enter)="enviarPregunta()" [disabled]="isLoading"
                        class="flex-1 px-3 py-2.5 bg-base border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 text-txt-primary placeholder:text-txt-muted">
                    <button (click)="enviarPregunta()" [disabled]="!pregunta.trim() || isLoading" aria-label="Enviar pregunta"
                        class="p-2.5 bg-primary text-white rounded-xl hover:brightness-110 transition-all disabled:opacity-50 btn-press">
                        <lucide-icon name="send" [size]="16"></lucide-icon>
                    </button>
                </div>
            </div>
        </div>
    `
})
export class PortalChatComponent {
    private functions = inject(Functions);
    private authService = inject(AuthService);

    isOpen = false;
    isLoading = false;
    pregunta = '';
    messages: ChatMessage[] = [];

    // These would be passed from the portal layout or determined from the current user
    clienteId = '';
    proyectoId = '';

    async ngOnInit() {
        // Resolve clienteId from JWT claims via AuthService
        this.clienteId = await this.authService.getClienteId() || '';
    }

    async enviarPregunta() {
        if (!this.pregunta.trim() || this.isLoading) return;

        const texto = this.pregunta;
        this.pregunta = '';

        this.messages.push({
            role: 'user',
            contenido: texto,
            createdAt: new Date()
        });

        this.isLoading = true;

        try {
            const callFn = httpsCallable(this.functions, 'portalClienteChat');
            const result = await callFn({
                pregunta: texto,
                clienteId: this.clienteId,
                proyectoId: this.proyectoId
            });
            const payload: any = result.data;

            this.messages.push({
                role: 'assistant',
                contenido: payload?.data?.respuesta || 'No se pudo procesar tu consulta.',
                createdAt: new Date()
            });
        } catch (error) {
            console.error('Error en chat portal:', error);
            this.messages.push({
                role: 'assistant',
                contenido: 'Lo siento, hubo un error al procesar tu pregunta. Intenta de nuevo.',
                createdAt: new Date()
            });
        } finally {
            this.isLoading = false;
        }
    }

    trackByMsg(index: number): number { return index; }
}
