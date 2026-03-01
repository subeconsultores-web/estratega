import { Component, inject, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, MessageCircle, Plus, Send, Sparkles, Loader2, X, Search, Archive, Clock } from 'lucide-angular';
import { ToastrService } from 'ngx-toastr';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Subscription } from 'rxjs';

import { MensajeriaService } from '../../../core/services/mensajeria.service';
import { CrmService } from '../../../core/services/crm.service';
import { AuthService } from '../../../core/services/auth.service';
import { Conversacion, Mensaje } from '../../../core/models/mensaje.model';
import { Cliente } from '../../../core/models/crm.model';

@Component({
    selector: 'app-chat-inbox',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
    providers: [
        { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ MessageCircle, Plus, Send, Sparkles, Loader2, X, Search, Archive, Clock }) }
    ],
    templateUrl: './chat-inbox.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatInboxComponent implements OnInit, OnDestroy {
    private mensajeriaService = inject(MensajeriaService);
    private crmService = inject(CrmService);
    private authService = inject(AuthService);
    private functions = inject(Functions);
    private toastr = inject(ToastrService);
    private cdr = inject(ChangeDetectorRef);

    conversaciones: Conversacion[] = [];
    mensajes: Mensaje[] = [];
    conversacionActiva: Conversacion | null = null;

    // Input states
    nuevoMensaje = '';
    searchTerm = '';

    // Modal nueva conversación
    showNuevaConv = false;
    clientes: Cliente[] = [];
    nuevaConv = { clienteId: '', asunto: '' };

    // IA states
    isLoadingSugerencia = false;
    sugerenciaIA = '';

    // Loading
    isLoading = true;

    private subs: Subscription[] = [];
    private msgsSub?: Subscription;

    ngOnInit(): void {
        this.loadConversaciones();
        this.loadClientes();
    }

    ngOnDestroy(): void {
        this.subs.forEach(s => s.unsubscribe());
        if (this.msgsSub) this.msgsSub.unsubscribe();
    }

    private loadConversaciones() {
        const sub = this.mensajeriaService.getConversaciones().subscribe({
            next: convs => {
                this.conversaciones = convs;
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: err => {
                console.error('Error cargando conversaciones:', err);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
        this.subs.push(sub);
    }

    private loadClientes() {
        const sub = this.crmService.getClientes().subscribe(clientes => {
            this.clientes = clientes;
            this.cdr.detectChanges();
        });
        this.subs.push(sub);
    }

    seleccionarConversacion(conv: Conversacion) {
        this.conversacionActiva = conv;
        this.sugerenciaIA = '';
        if (this.msgsSub) {
            this.msgsSub.unsubscribe();
        }
        if (conv.id) {
            this.msgsSub = this.mensajeriaService.getMensajes(conv.id).subscribe(msgs => {
                this.mensajes = msgs;
                this.cdr.detectChanges();
            });
            this.subs.push(this.msgsSub);
        }
    }

    async enviarMensaje() {
        if (!this.nuevoMensaje.trim() || !this.conversacionActiva?.id) return;
        const texto = this.nuevoMensaje;
        this.nuevoMensaje = '';

        try {
            const user = await this.authService.getCurrentUser();
            const nombre = user?.displayName || user?.email || 'Agente';
            await this.mensajeriaService.enviarMensaje(
                this.conversacionActiva.id!,
                texto,
                nombre,
                'interno'
            );
        } catch (error) {
            console.error('Error enviando mensaje:', error);
            this.toastr.error('Error al enviar el mensaje.');
        }
    }

    async crearConversacion() {
        if (!this.nuevaConv.clienteId || !this.nuevaConv.asunto) return;

        const cliente = this.clientes.find(c => c.id === this.nuevaConv.clienteId);
        try {
            const id = await this.mensajeriaService.createConversacion({
                clienteId: this.nuevaConv.clienteId,
                clienteNombre: cliente?.nombreEmpresa || 'Cliente',
                asunto: this.nuevaConv.asunto
            });
            this.showNuevaConv = false;
            this.nuevaConv = { clienteId: '', asunto: '' };
            this.toastr.success('Conversación creada');
        } catch (error) {
            console.error(error);
            this.toastr.error('Error al crear la conversación.');
        }
    }

    async sugerirRespuestaIA() {
        if (!this.conversacionActiva?.id) return;
        this.isLoadingSugerencia = true;
        this.sugerenciaIA = '';

        try {
            const callFn = httpsCallable(this.functions, 'sugerirRespuestaIA');
            const result = await callFn({ conversacionId: this.conversacionActiva.id });
            const payload: any = result.data;
            if (payload?.success) {
                this.sugerenciaIA = payload.data.respuestaSugerida;
            }
        } catch (error) {
            console.error('Error obteniendo sugerencia IA:', error);
            this.toastr.error('Error al consultar la IA.');
        } finally {
            this.isLoadingSugerencia = false;
            this.cdr.detectChanges();
        }
    }

    usarSugerencia() {
        this.nuevoMensaje = this.sugerenciaIA;
        this.sugerenciaIA = '';
    }

    trackByConv(index: number, c: Conversacion): string { return c.id || index.toString(); }
    trackByMsg(index: number, m: Mensaje): string { return m.id || index.toString(); }
    trackByCliente(index: number, c: Cliente): string { return c.id || index.toString(); }

    get conversacionesFiltradas(): Conversacion[] {
        if (!this.searchTerm.trim()) return this.conversaciones;
        const term = this.searchTerm.toLowerCase();
        return this.conversaciones.filter(c =>
            c.clienteNombre?.toLowerCase().includes(term) ||
            c.asunto?.toLowerCase().includes(term)
        );
    }
}
