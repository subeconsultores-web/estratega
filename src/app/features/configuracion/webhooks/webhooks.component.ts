import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, Webhook, Plus, Trash2, ShieldAlert, Shield } from 'lucide-angular';
import { ToastrService } from 'ngx-toastr';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { Observable, of, switchMap, catchError } from 'rxjs';
import { WebhookService } from '../../../core/services/webhook.service';
import { AuthService } from '../../../core/services/auth.service';
import { Webhook as WebhookModel } from '../../../core/models/webhook.model';

import { EmptyState } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-webhooks',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, EmptyState],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Webhook, Plus, Trash2, ShieldAlert, Shield }) }
  ],
  templateUrl: './webhooks.component.html'
})
export class WebhooksComponent implements OnInit {
  private webhookService = inject(WebhookService);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);
  private confirmDialog = inject(ConfirmDialogService);

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
    this.webhooks$ = this.authService.tenantId$.pipe(
      switchMap(tenantId => this.webhookService.getWebhooks(tenantId)),
      catchError(err => {
        console.error('Error cargando webhooks:', err);
        return of([] as WebhookModel[]);
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
      const tenantId = await this.authService.getTenantId();
      if (!tenantId) return;

      await this.webhookService.createWebhook(
        tenantId,
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
    const ok = await this.confirmDialog.confirm({
      title: 'Eliminar webhook',
      message: '¿Eliminar esta suscripción webhook? Ya no se enviarán datos a esta URL.',
      variant: 'danger',
      confirmText: 'Eliminar'
    });
    if (ok) {
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
