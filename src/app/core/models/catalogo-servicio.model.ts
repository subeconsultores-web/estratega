export interface CatalogoServicio {
    id: string;
    tenantId: string;
    nombre: string;
    descripcion: string;
    categoria: string;
    precioBase: number;
    unidad: 'hora' | 'sesion' | 'mes' | 'proyecto' | 'unidad';
    impuestosIncluidos: boolean;
    activo: boolean;
    versionPrecios: { precio: number; fecha: Date; motivo: string }[];
    createdAt: Date;
}
