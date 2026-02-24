import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiKeyService } from '../../../core/services/api-key.service';
import { AuthService } from '../../../core/services/auth.service';
import { ApiKey } from '../../../core/models/api-key.model';
import { Observable, switchMap } from 'rxjs';
import { LUCIDE_ICONS, LucideIconProvider,  LucideAngularModule, Key, Plus, Copy, Trash2, ShieldAlert, Shield  } from 'lucide-angular';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-api-keys',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Key, Plus, Copy, Trash2, ShieldAlert, Shield }) }
  ],
    templateUrl: './api-keys.component.html'
})
export class ApiKeysComponent implements OnInit {
    private apiKeyService = inject(ApiKeyService);
    private authService = inject(AuthService);
    private toastr = inject(ToastrService);

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
        this.apiKeys$ = this.authService.user$.pipe(
            switchMap(user => {
                if (!user?.tenantId) throw new Error('No tenant ID');
                return this.apiKeyService.getApiKeys(user.tenantId);
            })
        );
    }

    async generateKey() {
        if (!this.newKeyName.trim()) {
            this.toastr.warning('Ingresa un nombre para la llave');
            return;
        }
        try {
            const user = await this.authService.getCurrentUser();
            if (!user?.tenantId) return;

            this.recentlyCreatedKey = await this.apiKeyService.generateApiKey(user.tenantId, this.newKeyName);
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
        if (confirm('¿Estás seguro de que quieres revocar y eliminar esta API Key permanentemente? Cualquier integración que la use dejará de funcionar.')) {
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
