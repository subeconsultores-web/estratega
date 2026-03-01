import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiKeyService } from '../../../core/services/api-key.service';
import { AuthService } from '../../../core/services/auth.service';
import { ApiKey } from '../../../core/models/api-key.model';
import { Observable, of, switchMap, catchError } from 'rxjs';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, Key, Plus, Copy, Trash2, ShieldAlert, Shield } from 'lucide-angular';
import { ToastrService } from 'ngx-toastr';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';

import { EmptyState } from '../../../shared/components/empty-state/empty-state.component';

@Component({
    selector: 'app-api-keys',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule, EmptyState],
    providers: [
        { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Key, Plus, Copy, Trash2, ShieldAlert, Shield }) }
    ],
    templateUrl: './api-keys.component.html'
})
export class ApiKeysComponent implements OnInit {
    private apiKeyService = inject(ApiKeyService);
    private authService = inject(AuthService);
    private toastr = inject(ToastrService);
    private confirmDialog = inject(ConfirmDialogService);

    readonly KeyIcon = Key;
    readonly PlusIcon = Plus;
    readonly CopyIcon = Copy;
    readonly TrashIcon = Trash2;
    readonly AlertIcon = ShieldAlert;
    readonly ShieldIcon = Shield;

    apiKeys$!: Observable<ApiKey[]>;
    showCreateModal = false;
    newKeyName = '';
    recentlyCreatedKey = '';

    ngOnInit() {
        this.apiKeys$ = this.authService.tenantId$.pipe(
            switchMap(tenantId => this.apiKeyService.getApiKeys(tenantId)),
            catchError(err => {
                console.error('Error cargando API Keys:', err);
                return of([] as ApiKey[]);
            })
        );
    }

    async generateKey() {
        if (!this.newKeyName.trim()) {
            this.toastr.warning('Ingresa un nombre para la llave');
            return;
        }
        try {
            const tenantId = await this.authService.getTenantId();
            if (!tenantId) return;

            this.recentlyCreatedKey = await this.apiKeyService.generateApiKey(tenantId, this.newKeyName);
            this.newKeyName = '';
            this.toastr.success('API Key generada con éxito');
        } catch (error) {
            console.error(error);
            this.toastr.error('Error al generar la llave');
        }
    }

    async toggleStatus(key: ApiKey) {
        if (!key.id) return;
        try {
            await this.apiKeyService.toggleApiKeyStatus(key.id, key.isActive);
        } catch (e) {
            this.toastr.error('Error actualizando el estado de la llave');
        }
    }

    async deleteKey(keyId: string) {
        const ok = await this.confirmDialog.confirm({
            title: 'Revocar API Key',
            message: '¿Estás seguro de que quieres revocar y eliminar esta API Key permanentemente? Cualquier integración que la use dejará de funcionar.',
            variant: 'danger',
            confirmText: 'Revocar'
        });
        if (ok) {
            try {
                await this.apiKeyService.deleteApiKey(keyId);
                this.toastr.success('API Key revocada');
            } catch (e) {
                this.toastr.error('Error al revocar la llave');
            }
        }
    }

    copyToClipboard(text: string) {
        navigator.clipboard.writeText(text).then(() => {
            this.toastr.info('Copiado al portapapeles');
        });
    }

    closeModal() {
        this.showCreateModal = false;
        this.newKeyName = '';
        this.recentlyCreatedKey = '';
    }
}
