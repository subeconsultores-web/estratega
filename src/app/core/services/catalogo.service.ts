import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, docData, collectionData, setDoc, updateDoc, deleteDoc, query, where, Timestamp } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { CatalogoItem } from '../models/catalogo.model';
import { Observable, from, of, firstValueFrom } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class CatalogoService {
    private firestore = inject(Firestore);
    private authService = inject(AuthService);
    private collectionName = 'catalogo';

    // Helper para obtener la referencia de la colección filtrada por tenantId
    private getTenantCollectionRef() {
        return this.authService.user$.pipe(
            switchMap(user => {
                if (!user || !user.tenantId) throw new Error('Usuario no autenticado o sin tenantId');
                return of(collection(this.firestore, this.collectionName));
            })
        );
    }

    getItems(): Observable<CatalogoItem[]> {
        return this.authService.user$.pipe(
            switchMap(user => {
                if (!user || !user.tenantId) return of([]);
                const q = query(collection(this.firestore, this.collectionName), where('tenantId', '==', user.tenantId));
                return collectionData(q, { idField: 'id' }) as Observable<CatalogoItem[]>;
            })
        );
    }

    getItem(id: string): Observable<CatalogoItem | undefined> {
        const docRef = doc(this.firestore, `${this.collectionName}/${id}`);
        return docData(docRef, { idField: 'id' }) as Observable<CatalogoItem | undefined>;
    }

    async createItem(item: Partial<CatalogoItem>): Promise<void> {
        const user = await firstValueFrom(this.authService.user$);
        if (!user || !user.tenantId) throw new Error('No authenticado');

        const newDocRef = doc(collection(this.firestore, this.collectionName));
        const payload: CatalogoItem = {
            ...item as CatalogoItem,
            id: newDocRef.id,
            tenantId: user.tenantId,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            isActive: item.isActive ?? true
        };
        return setDoc(newDocRef, payload);
    }

    async updateItem(id: string, item: Partial<CatalogoItem>): Promise<void> {
        const docRef = doc(this.firestore, `${this.collectionName}/${id}`);
        return updateDoc(docRef, {
            ...item,
            updatedAt: Timestamp.now()
        });
    }

    async deleteItem(id: string): Promise<void> {
        const docRef = doc(this.firestore, `${this.collectionName}/${id}`);
        return deleteDoc(docRef);
    }
}
