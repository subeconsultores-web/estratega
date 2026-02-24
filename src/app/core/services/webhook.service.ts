import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, addDoc, updateDoc, deleteDoc, collectionData, query, where, Timestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Webhook } from '../models/webhook.model';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class WebhookService {
    private firestore = inject(Firestore);
    private authService = inject(AuthService);

    getWebhooks(tenantId: string): Observable<Webhook[]> {
        const webhooksRef = collection(this.firestore, 'webhooks');
        const q = query(webhooksRef, where('tenantId', '==', tenantId));
        return collectionData(q, { idField: 'id' }) as Observable<Webhook[]>;
    }

    async createWebhook(tenantId: string, name: string, url: string, events: string[]): Promise<string> {
        const user = await this.authService.getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

        const newWebhook: Omit<Webhook, 'id'> = {
            tenantId,
            name,
            url,
            events,
            isActive: true,
            createdAt: Timestamp.now(),
            createdBy: user.uid
        };

        const webhooksRef = collection(this.firestore, 'webhooks');
        const docRef = await addDoc(webhooksRef, newWebhook);

        return docRef.id;
    }

    async toggleWebhookStatus(webhookId: string, currentStatus: boolean): Promise<void> {
        const webhookRef = doc(this.firestore, 'webhooks', webhookId);
        return updateDoc(webhookRef, { isActive: !currentStatus });
    }

    async deleteWebhook(webhookId: string): Promise<void> {
        const webhookRef = doc(this.firestore, 'webhooks', webhookId);
        return deleteDoc(webhookRef);
    }
}
