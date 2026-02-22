import { Timestamp } from '@angular/fire/firestore';

export interface CatalogoItem {
    id?: string;
    tenantId: string;
    nombre: string;
    descripcion?: string;
    tipo: 'producto' | 'servicio' | string;
    precioBase: number;
    moneda: 'CLP' | 'UF' | 'USD' | string;
    skuCode?: string;
    categoria?: string;
    imagenUrl?: string; // TBD: Upload via StorageService
    isActive: boolean;
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}
