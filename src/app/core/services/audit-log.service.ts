import { inject, Injectable } from '@angular/core';
import { Firestore, collection, addDoc, serverTimestamp } from '@angular/fire/firestore';
import { AuthService } from './auth.service';

export interface AuditEventPayload {
    entidad: 'factura' | 'cliente' | 'propuesta' | 'usuario' | 'settings' | 'proyecto' | 'otro';
    entidadId?: string;
    accion: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'APPROVE' | 'REJECT';
    descripcion?: string;
    metadata?: Record<string, any>;
}

/**
 * Servicio genérico para auditar acciones explícitas de los usuarios en el frontend.
 * Escribe en la colección `activity_logs`.
 */
@Injectable({ providedIn: 'root' })
export class AuditLogService {
    private firestore = inject(Firestore);
    private authService = inject(AuthService);

    async logAction(payload: AuditEventPayload): Promise<void> {
        try {
            const user = await this.authService.getCurrentUser();
            let actorInfo = { uid: 'anonymous', email: 'unknown' };

            if (user) {
                actorInfo = {
                    uid: user.uid,
                    email: user.email || 'unknown'
                };
            }

            const docData = {
                actor: actorInfo,
                ...payload,
                timestamp: serverTimestamp(),
                userAgent: navigator.userAgent
            };

            const ref = collection(this.firestore, 'activity_logs');
            await addDoc(ref, docData);

            // Opcional: Console log en dev mode
            // console.log(`AuditLog [${payload.accion}] en ${payload.entidad}`, docData);
        } catch (error) {
            console.error('Error registrando evento de auditoría:', error);
        }
    }
}
