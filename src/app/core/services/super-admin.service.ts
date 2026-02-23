import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, query, orderBy, collectionData, updateDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface SaaSMetrics {
    totalTenants: number;
    activeTenants: number;
    trialTenants: number;
    estimatedMRR: number; // Ingreso recurrente mensual estimado simulado
}

export interface Tenant {
    id: string;
    nombre: string;
    rut?: string;
    emailContacto?: string;
    ownerUid: string;
    isActive: boolean;
    plan: 'trial' | 'pro' | 'enterprise';
    createdAt: any;
    updatedAt: any;
}

@Injectable({
    providedIn: 'root'
})
export class SuperAdminService {
    private firestore = inject(Firestore);

    // Obtener todos los tenants
    getTenants(): Observable<Tenant[]> {
        const docRef = collection(this.firestore, 'tenants');
        const q = query(docRef, orderBy('createdAt', 'desc'));
        return collectionData(q, { idField: 'id' }) as Observable<Tenant[]>;
    }

    // Toggle estado activo del tenant (Suspender/Restaurar)
    async setTenantStatus(tenantId: string, isActive: boolean): Promise<void> {
        const ref = doc(this.firestore, `tenants/${tenantId}`);
        await updateDoc(ref, { isActive });
    }

    // Cambiar plan
    async changeTenantPlan(tenantId: string, newPlan: string): Promise<void> {
        const ref = doc(this.firestore, `tenants/${tenantId}`);
        await updateDoc(ref, { plan: newPlan });
    }
}
