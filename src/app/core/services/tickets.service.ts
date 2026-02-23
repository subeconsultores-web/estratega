import { inject, Injectable } from '@angular/core';
import {
    Firestore,
    collection,
    addDoc,
    serverTimestamp
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Ticket } from '../models/ticket.model';

@Injectable({
    providedIn: 'root'
})
export class TicketsService {
    private firestore = inject(Firestore);
    private authService = inject(AuthService);

    async createTicket(ticket: Omit<Ticket, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const tenantId = await this.authService.getTenantId();
        if (!tenantId) throw new Error('No tenant');

        const ref = collection(this.firestore, 'tickets');

        const newDoc: Ticket = {
            ...ticket,
            tenantId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(ref, newDoc);
        return docRef.id;
    }
}
