import { inject, Injectable } from '@angular/core';
import { Firestore, collection, addDoc, serverTimestamp } from '@angular/fire/firestore';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SessionAuditService {
    private firestore = inject(Firestore);
    private authService = inject(AuthService);
    private _registered = false;

    async registrarSesion(): Promise<void> {
        if (this._registered) return;

        try {
            const user = await this.authService.getCurrentUser();
            if (!user) return;

            const metadata = {
                uid: user.uid,
                email: user.email || 'unknown',
                userAgent: navigator.userAgent,
                idioma: navigator.language,
                plataforma: navigator.platform || 'unknown',
                pantalla: `${screen.width}x${screen.height}`,
                zonaHoraria: Intl.DateTimeFormat().resolvedOptions().timeZone,
                timestamp: serverTimestamp(),
                horaLocal: new Date().toISOString()
            };

            const ref = collection(this.firestore, 'session_logs');
            await addDoc(ref, metadata);
            this._registered = true;
        } catch (error) {
            console.error('Error registrando sesión para auditoría:', error);
        }
    }
}
