import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, addDoc, updateDoc, deleteDoc, collectionData, query, where, Timestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { ApiKey } from '../models/api-key.model';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class ApiKeyService {
    private firestore = inject(Firestore);
    private authService = inject(AuthService);

    getApiKeys(tenantId: string): Observable<ApiKey[]> {
        const apiKeysRef = collection(this.firestore, 'apiKeys');
        const q = query(apiKeysRef, where('tenantId', '==', tenantId));
        return collectionData(q, { idField: 'id' }) as Observable<ApiKey[]>;
    }

    async generateApiKey(tenantId: string, name: string): Promise<string> {
        const user = await this.authService.getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

        // Generar un token aleatorio
        const rawKey = this.generateRandomToken();
        const prefix = rawKey.substring(0, 10); // 'sube_' (5 chars) + 5 random = 10 chars

        const newKey: Omit<ApiKey, 'id'> = {
            tenantId,
            name,
            key: rawKey,
            prefix,
            createdAt: Timestamp.now(),
            isActive: true,
            createdBy: user.uid
        };

        const apiKeysRef = collection(this.firestore, 'apiKeys');
        await addDoc(apiKeysRef, newKey);

        return rawKey;
    }

    async toggleApiKeyStatus(apiKeyId: string, currentStatus: boolean): Promise<void> {
        const apiKeyRef = doc(this.firestore, 'apiKeys', apiKeyId);
        return updateDoc(apiKeyRef, { isActive: !currentStatus });
    }

    async deleteApiKey(apiKeyId: string): Promise<void> {
        const apiKeyRef = doc(this.firestore, 'apiKeys', apiKeyId);
        return deleteDoc(apiKeyRef);
    }

    private generateRandomToken(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = 'sube_';
        for (let i = 0; i < 32; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
    }
}
