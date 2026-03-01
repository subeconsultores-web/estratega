import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, docData, collectionData, setDoc, updateDoc, deleteDoc, query, where, Timestamp } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { CatalogoItem } from '../models/catalogo.model';
import { Observable, of, firstValueFrom } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class CatalogoService {
    private firestore = inject(Firestore);
    private authService = inject(AuthService);
    private collectionName = 'catalogo';

    getItems(): Observable<CatalogoItem[]> {
        return this.authService.tenantId$.pipe(
            switchMap(tenantId => {
                const q = query(collection(this.firestore, this.collectionName), where('tenantId', '==', tenantId));
                return collectionData(q, { idField: 'id' }) as Observable<CatalogoItem[]>;
            })
        );
    }

    getItem(id: string): Observable<CatalogoItem | undefined> {
        const docRef = doc(this.firestore, `${this.collectionName}/${id}`);
        return docData(docRef, { idField: 'id' }) as Observable<CatalogoItem | undefined>;
    }

    async createItem(item: Partial<CatalogoItem>): Promise<void> {
        const tenantId = await firstValueFrom(this.authService.tenantId$);

        const newDocRef = doc(collection(this.firestore, this.collectionName));
        const payload: CatalogoItem = {
            ...item as CatalogoItem,
            id: newDocRef.id,
            tenantId,
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
