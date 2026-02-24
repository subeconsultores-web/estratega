export interface ApiKey {
    id?: string;
    tenantId: string;
    name: string;
    key: string;       // El token en texto plano (solo se mostrará al crearlo, o si se decide guardarlo - aunque idealmente sería un hash. Para esta fase guardaremos el token o un prefijo+hash).
    prefix: string;    // Ejemplo: 'sube_xxxx' (los primeros caracteres visibles)
    createdAt: any;    // Timestamp o Date
    expiresAt?: any;   // Opcional: Fecha de expiración
    lastUsedAt?: any;  // Opcional: Última vez que se usó
    isActive: boolean;
    createdBy: string; // userId de quien la generó
}
