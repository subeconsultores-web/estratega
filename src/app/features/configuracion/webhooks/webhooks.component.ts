import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LUCIDE_ICONS, LucideIconProvider,  LucideAngularModule, Webhook, Plus, Trash2, ShieldAlert, Shield  } from 'lucide-angular';
import { ToastrService } from 'ngx-toastr';
import { Observable, switchMap } from 'rxjs';
import { WebhookService } from '../../../core/services/webhook.service';
import { AuthService } from '../../../core/services/auth.service';
import { Webhook as WebhookModel } from '../../../core/models/webhook.model';

@Component({
  selector: 'app-webhooks',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Webhook, Plus, Trash2, ShieldAlert, Shield }) }
  ],
  templateUrl: './webhooks.component.html'
})
export class WebhooksComponent implements OnInit {
  private webhookService = inject(WebhookService);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);

  readonly WebhookIcon = Webhook;
  readonly PlusIcon = Plus;
  readonly TrashIcon = Trash2;
  readonly AlertIcon = ShieldAlert;
  readonly ShieldIcon = Shield;

  webhooks$!: Observable<WebhookModel[]>;
  showCreateModal = false;

  newName = '';
  newUrl = '';

  ngOnInit() {
    this.webhooks$ = this.authService.user$.pipe(
      switchMap(user => {
        if (!user?.tenantId) throw new Error('No tenant ID');
        return this.webhookService.getWebhooks(user.tenantId);
      })
    );
  }

  async createWebhook() {
    if (!this.newName.trim() || !this.newUrl.trim()) return;

    // Validación básica de URL
    try {
      new URL(this.newUrl);
    } catch (_) {
      this.toastr.warning('Ingresa una URL válida (http/https)');
      return;
    }

    try {
      const user = await this.authService.getCurrentUser();
      if (!user?.tenantId) return;

      await this.webhookService.createWebhook(
        user.tenantId,
        this.newName,
        this.newUrl,
        ['cliente.creado'] // Único evento soportado actualmente
      );

      this.toastr.success('Webhook registrado');
      this.closeModal();
    } catch (e) {
      console.error(e);
      this.toastr.error('Error registrando webhook');
    }
  }

  async toggleStatus(wh: WebhookModel) {
    if (!wh.id) return;
    try {
      await this.webhookService.toggleWebhookStatus(wh.id, wh.isActive);
    } catch (e) {
      this.toastr.error('Error actualizando estado');
    }
  }

  async deleteWebhook(whId: string) {
    if (confirm('¿Eliminar esta suscripción webhook? Ya no se enviarán datos.')) {
      try {
        await this.webhookService.deleteWebhook(whId);
        this.toastr.success('Webhook eliminado');
      } catch (e) {
        this.toastr.error('Error eliminando webhook');
      }
    }
  }

  closeModal() {
    this.showCreateModal = false;
    this.newName = '';
    this.newUrl = '';
  }
}
