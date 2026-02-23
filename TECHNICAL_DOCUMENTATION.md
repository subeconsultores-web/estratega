# ESTRATEGA SUBE IA
SaaS Multi-Tenant — Angular 19 + Firebase + Gemini AI

**Documento Técnico de Arquitectura y Especificaciones**  
Versión 3.0 — Febrero 2026  
Preparado para: Equipo Antigravity  
Preparado por: SUBE IA Tech — www.subeia.tech
CONFIDENCIAL

---

## Tabla de Contenidos

### Parte I: Arquitectura Base
1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura Multi-Tenant](#3-arquitectura-multi-tenant)
4. [Modelo de Datos Firestore](#4-modelo-de-datos-firestore)
5. [Especificación de Módulos](#5-especificación-de-módulos)
6. [Cloud Functions (Backend)](#6-cloud-functions-backend)
7. [Lineamientos de UI/UX](#7-lineamientos-de-uiux)
8. [Planes y Límites SaaS](#8-planes-y-límites-saas)
9. [Hoja de Ruta de Implementación](#9-hoja-de-ruta-de-implementación)
10. [Requisitos No Funcionales](#10-requisitos-no-funcionales)
- [Apéndice A: Índices Firestore Requeridos](#apéndice-a-índices-firestore-requeridos)

### Parte II: Instrucciones Completas de Implementación (Versión 3.0)
11. [Análisis de Brechas: Qué Falta Implementar](#11-análisis-de-brechas-qué-falta-implementar)
12. [Estructura del Proyecto Angular](#12-estructura-del-proyecto-angular)
13. [Configuración de Routing Completa](#13-configuración-de-routing-completa)
14. [Matriz de Permisos por Rol](#14-matriz-de-permisos-por-rol)
15. [Firestore Security Rules Completas](#15-firestore-security-rules-completas)
16. [Especificación de Servicios Angular](#16-especificación-de-servicios-angular)
17. [Estrategia de Error Handling Global](#17-estrategia-de-error-handling-global)
18. [Módulo Super Admin SaaS (admin-saas)](#18-módulo-super-admin-saas-admin-saas)
19. [Sistema de Suscripciones y Billing](#19-sistema-de-suscripciones-y-billing)
20. [Templates de Emails y PDFs](#20-templates-de-emails-y-pdfs)
21. [Búsqueda Global](#21-búsqueda-global)
22. [Gestión de Archivos](#22-gestión-de-archivos)
23. [Módulo de Configuración del Tenant](#23-módulo-de-configuración-del-tenant)
24. [Manejo de Multi-Moneda](#24-manejo-de-multi-moneda)
25. [Estrategia de Testing](#25-estrategia-de-testing)
26. [Pipeline CI/CD](#26-pipeline-cicd)
27. [Audit Logging](#27-audit-logging)
28. [Accesibilidad e Internacionalización](#28-accesibilidad-e-internacionalización)
29. [Importación y Exportación de Datos](#29-importación-y-exportación-de-datos)
30. [Hoja de Ruta Revisada (Sprints Detallados)](#30-hoja-de-ruta-revisada-sprints-detallados)
31. [Naming y Branding del Producto](#31-naming-y-branding-del-producto)

---

# PARTE I: ARQUITECTURA BASE

# 1. Resumen Ejecutivo
SUBE Gestión es un Software as a Service (SaaS) diseñado para empresas de servicios profesionales, consultoría y tecnología que necesitan gestionar el ciclo completo de vida de sus operaciones comerciales: desde la captación de leads hasta la facturación y análisis de rentabilidad.

La plataforma se construye como un sistema multi-tenant donde cada empresa (Tenant) opera en un entorno completamente aislado, con su propia configuración, datos, branding y usuarios. El sistema está diseñado para escalar desde una empresa individual hasta cientos de organizaciones sin cambios arquitectónicos.

## 1.1 Objetivos del Producto
*   **Gestión integral del ciclo de ventas:** Desde lead hasta contrato firmado, con pipeline visual y métricas en tiempo real.
*   **Control financiero operativo:** Facturación, pagos, flujo de caja proyectado y conciliación básica.
*   **Visibilidad de rentabilidad:** Timetracking por proyecto/tarea con análisis de costo vs. ingreso real.
*   **Transparencia con clientes:** Portal del cliente con acceso a cotizaciones, contratos, avance de proyectos y firma digital.
*   **Inteligencia de negocio con IA:** Asistente conversacional que analiza datos del tenant y genera insights accionables.
*   **Escalabilidad SaaS:** Arquitectura multi-tenant preparada para onboarding de múltiples empresas con aislamiento total de datos.

## 1.2 Alcance de este Documento
Este documento cubre la especificación técnica completa para el desarrollo del sistema, incluyendo: arquitectura de software, modelo de datos Firestore, especificación de cada módulo, reglas de seguridad, diseño de Cloud Functions, lineamientos de UI/UX, y la hoja de ruta de implementación en sprints.

---

# 2. Stack Tecnológico
Todas las tecnologías seleccionadas priorizan soluciones gratuitas o con tiers generosos, escalabilidad serverless, y ecosistema Google.

| Capa | Tecnología | Versión | Justificación |
| :--- | :--- | :--- | :--- |
| Frontend | Angular | 19+ | Framework robusto, tipado fuerte con TypeScript, SSR nativo |
| Estilos | Tailwind CSS | 4.x | Utility-first, rápido para iterar, excelente responsive |
| Backend | Firebase Cloud Functions | Gen 2 | Serverless, auto-scaling, integrado con Firestore |
| Base de Datos | Cloud Firestore | - | NoSQL en tiempo real, reglas de seguridad nativas, offline support |
| Autenticación | Firebase Authentication | - | Email/password, Google SSO, Custom Claims para roles |
| Almacenamiento | Cloud Storage for Firebase | - | Archivos, firmas, logos, documentos de proyecto |
| Email | Firebase Extensions + SendGrid | - | Trigger Email Extension para transaccionales |
| IA | Gemini API (Google AI) | 2.0 Flash | Tier gratuito generoso, integración nativa con Google |
| PDF | Puppeteer en Cloud Functions | - | Generación server-side de PDFs con HTML templates |
| Tiempo Real | Firestore onSnapshot | - | Listeners en tiempo real sin WebSocket manual |
| Monitoreo | Firebase Crashlytics + Analytics | - | Gratuito, integrado al ecosistema |
| CI/CD | GitHub Actions + Firebase Hosting | - | Deploy automático en merge a main |

## 2.1 Dependencias Clave del Frontend
| Paquete | Propósito |
| :--- | :--- |
| `@angular/fire` | SDK oficial de Firebase para Angular |
| `@angular/cdk/drag-drop` | Drag and drop nativo para tableros Kanban |
| `signature_pad` | Canvas HTML5 para firma digital |
| `chart.js` + `ng2-charts` | Gráficos del dashboard y reportes |
| `html2pdf.js` | Exportación de cotizaciones/contratos a PDF (client-side backup) |
| `date-fns` | Manipulación de fechas (más liviano que moment) |
| `ngx-toastr` | Notificaciones toast |
| `@ngrx/component-store` | Estado local por componente (opcional para módulos complejos) |

---

# 3. Arquitectura Multi-Tenant
El sistema implementa un patrón de multi-tenancy basado en colecciones raíz con `tenantId` como campo discriminador. Este enfoque ofrece el mejor balance entre simplicidad, rendimiento y aislamiento para Firestore.

## 3.1 Modelo de Aislamiento
Cada documento en Firestore contiene un campo `tenantId` que vincula el dato a la empresa propietaria. Las Firebase Security Rules garantizan que ningún usuario pueda leer o escribir datos de un tenant al que no pertenece.

## 3.2 Flujo de Registro de Empresa (Onboarding)
1. El usuario completa el formulario de registro con datos de empresa y usuario administrador.
2. Firebase Auth crea la cuenta de usuario.
3. Una Cloud Function (trigger `onCreate` en Auth) ejecuta la lógica de onboarding:
    *   **a) Crea documento en colección tenants:** con configuración base, plan, branding por defecto.
    *   **b) Crea documento en colección users:** vinculando uid con `tenantId` y rol `super-admin`.
    *   **c) Asigna Custom Claims:** al token de Firebase Auth: `{ tenantId, role: 'super-admin' }`.
    *   **d) Crea estructura inicial:** catálogo de servicios vacío, configuración de numeración, etc.
4. El frontend detecta los Custom Claims y redirige al dashboard.

## 3.3 Custom Claims (JWT)
Los Custom Claims se inyectan en el token JWT de Firebase Auth y están disponibles tanto en el frontend (para lógica de UI) como en las Security Rules (para validación server-side).

| Claim | Tipo | Descripción |
| :--- | :--- | :--- |
| `tenantId` | string | ID del tenant al que pertenece el usuario |
| `role` | string | Rol del usuario: super-admin, admin, vendedor, consultor, finanzas, viewer |
| `plan` | string | Plan del tenant: free, starter, professional, enterprise |

## 3.4 Security Rules Pattern
Todas las colecciones de datos implementan el siguiente patrón de seguridad en Firestore Rules:

```javascript
match /clientes/{docId} {
  allow read: if request.auth.token.tenantId == resource.data.tenantId;
  allow create: if request.auth.token.tenantId == request.resource.data.tenantId;
  allow update: if request.auth.token.tenantId == resource.data.tenantId
    && request.auth.token.tenantId == request.resource.data.tenantId;
  allow delete: if request.auth.token.tenantId == resource.data.tenantId
    && request.auth.token.role in ['super-admin', 'admin'];
}
```

Regla crítica: El `tenantId` NUNCA puede ser modificado en un update. Esto se refuerza con una regla global adicional que compara `resource.data.tenantId == request.resource.data.tenantId` en toda operación de escritura.

---

# 4. Modelo de Datos Firestore
A continuación se detalla cada colección raíz del sistema con sus campos, tipos y relaciones. Todos los documentos (excepto `tenants` y `users`) incluyen `tenantId` como campo obligatorio.

## 4.1 tenants
Almacena la información de cada empresa registrada en el sistema.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | string (auto) | ID único del tenant |
| `nombreEmpresa` | string | Razón social o nombre comercial |
| `rut` | string | RUT de la empresa (Chile) |
| `giro` | string | Giro comercial |
| `direccion` | string | Dirección fiscal |
| `telefono` | string | Teléfono principal |
| `email` | string | Email corporativo |
| `sitioWeb` | string | URL del sitio web |
| `plan` | string | free \| starter \| professional \| enterprise |
| `config.logoUrl` | string | URL del logo en Cloud Storage |
| `config.colorPrimario` | string | Color hex del branding (#1A56DB) |
| `config.colorSecundario` | string | Color hex secundario |
| `config.moneda` | string | CLP \| UF \| USD |
| `config.impuesto` | number | Tasa de IVA (0.19 para Chile) |
| `config.correlativos.cotizacion` | number | Último número correlativo de cotización |
| `config.correlativos.contrato` | number | Último número correlativo de contrato |
| `config.correlativos.factura` | number | Último número correlativo de factura |
| `limites.usuarios` | number | Máx usuarios según plan |
| `limites.almacenamientoMb` | number | Máx storage según plan |
| `suscripcion.estado` | string | active \| trial \| suspended \| cancelled |
| `suscripcion.fechaInicio` | timestamp | Inicio de la suscripción actual |
| `suscripcion.fechaRenovacion` | timestamp | Próxima fecha de cobro |
| `createdAt` | timestamp | Fecha de creación |
| `updatedAt` | timestamp | Fecha de última modificación |

## 4.2 users
Usuarios del sistema vinculados a Firebase Auth y a un tenant.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `uid` | string | UID de Firebase Auth |
| `tenantId` | string | Referencia al tenant |
| `email` | string | Email del usuario |
| `nombre` | string | Nombre completo |
| `role` | string | super-admin \| admin \| vendedor \| consultor \| finanzas \| viewer |
| `avatar` | string | URL foto de perfil |
| `activo` | boolean | Si el usuario está habilitado |
| `permisos` | map | Permisos granulares opcionales por módulo |
| `config.idioma` | string | es \| en |
| `config.notificaciones` | map | Preferencias de notificación por canal |
| `costoHora` | number | Costo interno por hora (para cálculo de rentabilidad) |
| `tarifaHora` | number | Tarifa que se cobra al cliente por hora |
| `ultimoAcceso` | timestamp | Fecha de último login |
| `createdAt` | timestamp | Fecha de creación |

## 4.3 clientes
Directorio de clientes de cada empresa. Incluye datos de contacto, segmentación y scoring.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | string (auto) | ID único |
| `tenantId` | string | Referencia al tenant |
| `rut` | string | RUT/DNI del cliente |
| `nombreEmpresa` | string | Razón social del cliente |
| `giro` | string | Giro comercial |
| `contactoPrincipal.nombre` | string | Nombre del contacto principal |
| `contactoPrincipal.email` | string | Email del contacto |
| `contactoPrincipal.telefono` | string | Teléfono del contacto |
| `contactoPrincipal.cargo` | string | Cargo en la empresa |
| `direccion` | string | Dirección del cliente |
| `etiquetas` | array<string> | Tags para segmentación (VIP, Recurrente, etc.) |
| `fuenteAdquisicion` | string | referido \| web \| redes \| evento \| otro |
| `estado` | string | lead \| prospecto \| activo \| inactivo |
| `pipelineEtapa` | string | Etapa actual en el pipeline de ventas |
| `score` | number | Lead scoring calculado (0-100) |
| `vendedorAsignado` | string | UID del vendedor responsable |
| `notas` | string | Notas libres |
| `totalHistorico` | number | Total facturado histórico (calculado) |
| `ultimaInteraccion` | timestamp | Fecha de última actividad |
| `createdAt` | timestamp | Fecha de creación |
| `updatedAt` | timestamp | Fecha de última modificación |

## 4.4 actividades
Registro de todas las interacciones y actividades comerciales con clientes. Alimenta el timeline del CRM y el cálculo de lead scoring.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | string (auto) | ID único |
| `tenantId` | string | Referencia al tenant |
| `clienteId` | string | Referencia al cliente |
| `tipo` | string | llamada \| reunion \| email \| nota \| tarea \| seguimiento |
| `titulo` | string | Título breve de la actividad |
| `descripcion` | string | Detalle de la actividad |
| `fecha` | timestamp | Fecha programada o realizada |
| `completada` | boolean | Si la actividad fue completada |
| `resultado` | string | Resultado: positivo \| neutral \| negativo |
| `usuarioId` | string | UID del usuario que registró |
| `cotizacionId` | string (opt) | Cotización vinculada si aplica |
| `createdAt` | timestamp | Fecha de creación |

## 4.5 catalogoServicios
Biblioteca reutilizable de servicios y productos con precios base. Se usa como fuente para cotizaciones y contratos.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | string (auto) | ID único |
| `tenantId` | string | Referencia al tenant |
| `nombre` | string | Nombre del servicio/producto |
| `descripcion` | string | Descripción detallada |
| `categoria` | string | Categoría (consultoría, desarrollo, capacitación, etc.) |
| `precioBase` | number | Precio unitario base |
| `unidad` | string | hora \| sesión \| mes \| proyecto \| unidad |
| `impuestosIncluidos` | boolean | Si el precio incluye IVA |
| `activo` | boolean | Si está disponible para cotizar |
| `versionPrecios` | array | Historial: `[{precio, fecha, motivo}]` |
| `createdAt` | timestamp | Fecha de creación |

## 4.6 cotizaciones
Cotizaciones comerciales generadas para clientes. Soportan múltiples ítems, descuentos y conversión directa a contrato.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | string (auto) | ID único |
| `tenantId` | string | Referencia al tenant |
| `clienteId` | string | Referencia al cliente |
| `correlativo` | number | Número secuencial por tenant |
| `codigoFormateado` | string | Código visible: COT-001, COT-002... |
| `titulo` | string | Título descriptivo de la cotización |
| `items` | array | `[{servicioId, descripcion, cantidad, precioUnitario, descuento, total}]` |
| `subtotal` | number | Suma de totales de ítems |
| `descuentoGlobal` | number | Descuento adicional sobre subtotal |
| `impuestos` | number | IVA calculado |
| `total` | number | Total final |
| `moneda` | string | CLP \| UF \| USD |
| `estado` | string | borrador \| enviada \| en_revision \| aprobada \| rechazada \| expirada |
| `validezDias` | number | Días de validez (default 30) |
| `fechaExpiracion` | timestamp | Fecha límite de validez |
| `condiciones` | string | Términos y condiciones |
| `notas` | string | Notas internas |
| `vendedorId` | string | UID del vendedor que creó |
| `plantillaId` | string (opt) | Plantilla usada como base |
| `historialEstados` | array | `[{estado, fecha, usuarioId, comentario}]` |
| `createdAt` | timestamp | Fecha de creación |
| `updatedAt` | timestamp | Fecha de última modificación |

## 4.7 contratos
Contratos generados a partir de cotizaciones aprobadas o creados directamente. Incluyen flujo de firma digital interna y externa.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | string (auto) | ID único |
| `tenantId` | string | Referencia al tenant |
| `clienteId` | string | Referencia al cliente |
| `cotizacionId` | string (opt) | Cotización origen si aplica |
| `correlativo` | number | Número secuencial por tenant |
| `codigoFormateado` | string | CONT-001, CONT-002... |
| `titulo` | string | Título del contrato |
| `items` | array | `[{descripcion, cantidad, precioUnitario, total}]` |
| `total` | number | Monto total del contrato |
| `moneda` | string | CLP \| UF \| USD |
| `estado` | string | borrador \| enviado \| firmado_interno \| firmado_cliente \| finalizado \| cancelado |
| `fechaInicio` | timestamp | Inicio de vigencia |
| `fechaFin` | timestamp | Fin de vigencia |
| `tokenFirmaPublica` | string | Token único para URL pública de firma |
| `tokenExpiracion` | timestamp | Expiración del token de firma |
| `firmaRepresentante.url` | string | URL imagen firma interna (Cloud Storage) |
| `firmaRepresentante.fecha` | timestamp | Fecha de firma interna |
| `firmaRepresentante.nombre` | string | Nombre del firmante interno |
| `firmaCliente.url` | string | URL imagen firma del cliente |
| `firmaCliente.fecha` | timestamp | Fecha de firma del cliente |
| `firmaCliente.nombre` | string | Nombre del firmante externo |
| `firmaCliente.ip` | string | IP desde donde firmó el cliente |
| `clausulas` | array<string> | Cláusulas contractuales |
| `condicionesPago` | string | Términos de pago acordados |
| `historialEventos` | array | `[{estado, fecha, usuarioId, comentario}]` |
| `pdfUrl` | string | URL del PDF generado |
| `createdAt` | timestamp | Fecha de creación |
| `updatedAt` | timestamp | Fecha de última modificación |

## 4.8 facturas
Facturas emitidas por contratos o servicios. Soportan pagos parciales y cuotas programadas.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | string (auto) | ID único |
| `tenantId` | string | Referencia al tenant |
| `clienteId` | string | Referencia al cliente |
| `contratoId` | string (opt) | Contrato asociado |
| `correlativo` | number | Número secuencial |
| `codigoFormateado` | string | FACT-001, FACT-002... |
| `items` | array | `[{descripcion, cantidad, precioUnitario, total}]` |
| `subtotal` | number | Subtotal antes de impuestos |
| `impuestos` | number | IVA |
| `total` | number | Total facturado |
| `moneda` | string | CLP \| UF \| USD |
| `estado` | string | borrador \| emitida \| pagada_parcial \| pagada \| vencida \| anulada |
| `fechaEmision` | timestamp | Fecha de emisión |
| `fechaVencimiento` | timestamp | Fecha límite de pago |
| `condicionesPago` | string | 30 días \| 60 días \| contado \| cuotas |
| `cuotas` | array | `[{numero, monto, fechaVencimiento, estado, fechaPago}]` |
| `pagos` | array | `[{monto, fecha, metodo, referencia, comprobante}]` |
| `montoPagado` | number | Total pagado acumulado |
| `montoPendiente` | number | Total - montoPagado |
| `pdfUrl` | string | URL del PDF generado |
| `createdAt` | timestamp | Fecha de creación |
| `updatedAt` | timestamp | Fecha de última modificación |

## 4.9 proyectos
Proyectos creados a partir de contratos finalizados. Centralizan la ejecución operativa con presupuesto, equipo y timeline.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | string (auto) | ID único |
| `tenantId` | string | Referencia al tenant |
| `clienteId` | string | Referencia al cliente |
| `contratoId` | string (opt) | Contrato origen |
| `nombre` | string | Nombre del proyecto |
| `descripcion` | string | Descripción del alcance |
| `estado` | string | planificacion \| en_progreso \| pausado \| completado \| cancelado |
| `fechaInicio` | timestamp | Fecha de inicio planificada |
| `fechaFin` | timestamp | Fecha de fin planificada |
| `presupuesto` | number | Presupuesto total asignado |
| `costoReal` | number | Costo real acumulado (calculado desde timetracking) |
| `ingresoTotal` | number | Ingreso total del contrato asociado |
| `rentabilidad` | number | % calculado: (ingreso - costo) / ingreso * 100 |
| `equipo` | array | `[{userId, rol, horasAsignadas}]` |
| `progreso` | number | % completado (calculado desde tareas) |
| `etiquetas` | array<string> | Tags del proyecto |
| `createdAt` | timestamp | Fecha de creación |
| `updatedAt` | timestamp | Fecha de última modificación |

## 4.10 tareas
Tareas vinculadas a proyectos con asignación, prioridad y tracking de estado estilo Kanban.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | string (auto) | ID único |
| `tenantId` | string | Referencia al tenant |
| `proyectoId` | string | Referencia al proyecto |
| `titulo` | string | Título de la tarea |
| `descripcion` | string | Detalle de la tarea |
| `estado` | string | pendiente \| en_progreso \| en_revision \| completada |
| `prioridad` | string | baja \| media \| alta \| urgente |
| `asignadoA` | string | UID del usuario asignado |
| `fechaLimite` | timestamp | Deadline de la tarea |
| `horasEstimadas` | number | Horas estimadas para completar |
| `horasReales` | number | Horas reales registradas (calculado) |
| `orden` | number | Posición en el tablero Kanban |
| `subtareas` | array | `[{titulo, completada}]` |
| `createdAt` | timestamp | Fecha de creación |
| `updatedAt` | timestamp | Fecha de última modificación |

## 4.11 registrosTiempo
Timetracking detallado por usuario, proyecto y tarea. Base para cálculos de rentabilidad y facturación por hora.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | string (auto) | ID único |
| `tenantId` | string | Referencia al tenant |
| `usuarioId` | string | UID del usuario que registra |
| `proyectoId` | string | Referencia al proyecto |
| `tareaId` | string (opt) | Referencia a la tarea específica |
| `clienteId` | string | Referencia al cliente (denormalizado) |
| `fecha` | timestamp | Fecha del registro |
| `horaInicio` | timestamp | Inicio del período trabajado |
| `horaFin` | timestamp | Fin del período trabajado |
| `duracionMinutos` | number | Duración total en minutos |
| `descripcion` | string | Descripción del trabajo realizado |
| `facturable` | boolean | Si las horas son facturables al cliente |
| `costoInterno` | number | Calculado: duracion * costoHora del usuario |
| `valorFacturable` | number | Calculado: duracion * tarifaHora del usuario |
| `aprobado` | boolean | Si el registro fue aprobado por un admin |
| `createdAt` | timestamp | Fecha de creación |

## 4.12 movimientosFinancieros
Registro unificado de ingresos y egresos para flujo de caja y conciliación básica.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | string (auto) | ID único |
| `tenantId` | string | Referencia al tenant |
| `tipo` | string | ingreso \| egreso |
| `categoria` | string | pago_factura \| gasto_operativo \| honorario \| otro |
| `monto` | number | Monto del movimiento |
| `moneda` | string | CLP \| UF \| USD |
| `fecha` | timestamp | Fecha del movimiento |
| `descripcion` | string | Descripción del movimiento |
| `facturaId` | string (opt) | Factura relacionada |
| `clienteId` | string (opt) | Cliente relacionado |
| `proyectoId` | string (opt) | Proyecto relacionado |
| `metodoPago` | string | transferencia \| efectivo \| cheque \| tarjeta |
| `referencia` | string | Número de operación bancaria |
| `conciliado` | boolean | Si fue conciliado con cartola bancaria |
| `comprobanteUrl` | string | URL del comprobante en Storage |
| `createdAt` | timestamp | Fecha de creación |

## 4.13 notificaciones
Notificaciones in-app generadas por el sistema para cada usuario.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | string (auto) | ID único |
| `tenantId` | string | Referencia al tenant |
| `usuarioId` | string | Destinatario |
| `tipo` | string | cotizacion \| contrato \| factura \| tarea \| sistema \| alerta |
| `titulo` | string | Título de la notificación |
| `mensaje` | string | Contenido |
| `leida` | boolean | Si fue leída |
| `accionUrl` | string | Ruta interna para navegar al recurso |
| `entidadId` | string | ID del recurso relacionado |
| `createdAt` | timestamp | Fecha de creación |

---

# 5. Especificación de Módulos
Cada módulo se describe con su propósito, vistas principales, componentes Angular, servicios requeridos y reglas de negocio.

## 5.1 Autenticación y Onboarding
### Vistas
*   **LoginComponent:** Formulario email/password interactivo y profesional. Construido con una interfaz moderna y *responsive* utilizando Tailwind CSS (diseño split-screen con branding dinámico de "SUBE Gestión"). Incorpora validación de formularios mediante `ReactiveFormsModule` y se integra de forma segura con `AuthService` para login de Firebase. Incluye opción de Google SSO, link a registro y recuperación, manejando estados de carga visuales.
*   **RegisterComponent:** Formulario de registro de empresa en 2 pasos: (1) Datos empresa, (2) Datos usuario admin. Valida RUT chileno.
*   **ForgotPasswordComponent:** Envía email de reseteo via Firebase Auth.
*   **OnboardingWizardComponent:** Wizard post-registro para configuración inicial: logo, colores, moneda, impuesto, primer servicio.

### Reglas de negocio
*   Al registrarse, se crea el tenant, usuario y Custom Claims en una transacción atómica via Cloud Function.
*   El plan por defecto es free con límite de 3 usuarios y 500MB storage.
*   AuthGuard verifica token válido y Custom Claims en cada navegación.
*   RoleGuard verifica el rol mínimo requerido para cada ruta.

## 5.2 Dashboard
### KPIs principales (cards superiores)
*   Total cotizado en el mes en curso (suma de cotizaciones con estado != borrador).
*   Total facturado en el mes (facturas emitidas).
*   Total cobrado en el mes (pagos recibidos).
*   Tasa de conversión: cotizaciones aprobadas / cotizaciones enviadas * 100.
*   Horas registradas en la semana (timetracking).
*   Cuentas por cobrar vencidas (facturas con fechaVencimiento < hoy y estado != pagada).

### Gráficos
*   **Embudo de ventas:** Chart de embudo mostrando cantidad y monto por etapa del pipeline.
*   **Ingresos vs Gastos mensual:** Gráfico de barras últimos 12 meses.
*   **Rentabilidad por proyecto:** Scatter plot: eje X = ingreso, eje Y = rentabilidad %.
*   **Distribución de horas:** Donut chart por proyecto/cliente en la semana.

### Widgets adicionales
*   Lista de tareas urgentes y próximas a vencer.
*   Cotizaciones pendientes de respuesta (> 7 días sin cambio de estado).
*   Facturas por vencer esta semana.
*   Últimas actividades del equipo (feed cronológico).

## 5.3 CRM y Pipeline de Ventas
### Vistas
*   **ClientesListComponent:** Tabla con búsqueda, filtros por estado/etiqueta/vendedor, paginación.
*   **ClienteDetalleComponent:** Vista 360° del cliente: datos, timeline de actividades, cotizaciones, contratos, facturas, proyectos, total histórico.
*   **ClienteFormComponent:** Formulario reactivo para crear/editar con validación de RUT.
*   **PipelineKanbanComponent:** Vista Kanban del pipeline de ventas con columnas configurables por tenant. Drag-and-drop entre etapas.
*   **ActividadFormComponent:** Modal para registrar llamadas, reuniones, emails, notas vinculadas al cliente.

### Pipeline de ventas — Etapas por defecto
| Etapa | Color Badge | Acción esperada |
| :--- | :--- | :--- |
| Lead nuevo | Azul claro | Primer contacto, calificación inicial |
| Contactado | Azul | Se estableció comunicación, hay interés |
| Calificado | Amarillo | Necesidad confirmada, presupuesto viable |
| Propuesta enviada | Naranja | Cotización formal enviada |
| Negociación | Púrpura | Ajustes de precio/alcance en curso |
| Cerrado ganado | Verde | Contrato firmado, conversión exitosa |
| Cerrado perdido | Rojo | Oportunidad descartada con motivo |

### Lead Scoring (calculado automáticamente)
Cloud Function que recalcula el score cada vez que se registra una actividad o cambia el estado del cliente:
*   Actividad registrada en últimos 7 días: +15 puntos
*   Cotización enviada: +20 puntos
*   Reunión completada: +10 puntos
*   Sin contacto en 30+ días: -20 puntos
*   Cotización rechazada: -10 puntos
*   Monto cotizado > promedio del tenant: +15 puntos

## 5.4 Módulo de Cotizaciones
### Vistas
*   **CotizacionesListComponent:** Tabla con filtros por estado, cliente, vendedor, rango de fecha. Badge de colores por estado.
*   **CotizacionFormComponent:** Formulario complejo con: selección de cliente (autocomplete), ítems dinámicos desde catálogo de servicios, cálculos en tiempo real de subtotal/IVA/total, descuento global, notas y condiciones.
*   **CotizacionDetalleComponent:** Vista previa estilo PDF con datos del tenant, cliente, ítems y totales. Botones de acción según estado.
*   **CotizacionPdfComponent:** Template HTML optimizado para generación de PDF con Puppeteer (server-side) o html2pdf.js (client-side fallback).

### Flujo de estados
*   borrador → enviada → en_revision → aprobada → (convertir a contrato)
*   borrador → enviada → en_revision → rechazada (con motivo obligatorio)
*   Cualquier estado → expirada (automático via Cloud Function scheduled cuando fecha > fechaExpiracion)

### Reglas de negocio
*   Numeración correlativa: Cloud Function atómica que incrementa `config.correlativos.cotizacion` del tenant y asigna el nuevo número. Usa FieldValue.increment(1) dentro de transacción.
*   Al seleccionar un servicio del catálogo, se precargan nombre, descripción y precio base editables.
*   El PDF incluye logo y colores del tenant, datos fiscales de la empresa, datos del cliente, tabla de ítems, totales y condiciones.
*   Al cambiar estado a enviada, se dispara Cloud Function que envía email al cliente con PDF adjunto y link al Portal del Cliente.

## 5.5 Contratos y Firma Digital
### Flujo completo
1.  Botón Convertir a Contrato en cotización aprobada crea documento en contratos heredando todos los datos.
2.  Usuario edita cláusulas contractuales y condiciones de pago.
3.  Representante de la empresa firma internamente usando SignaturePad (canvas HTML5).
4.  La firma se guarda como imagen PNG en Cloud Storage y se vincula al contrato.
5.  Botón Enviar a Cliente genera token único (UUID v4) con expiración de 7 días.
6.  Cloud Function envía email con link público: `app.subegestion.com/firma/{contratoId}/{token}`
7.  El cliente accede a URL pública (sin login), ve el PDF del contrato y firma con canvas.
8.  Al firmar, Cloud Function valida token, guarda firma, registra IP/timestamp, cambia estado.
9.  Se genera PDF final con ambas firmas y se envía copia a ambas partes.

### Requisitos de la URL pública de firma
*   Ruta Angular no protegida por AuthGuard (módulo lazy-loaded independiente).
*   100% responsiva — el 90% de clientes firmarán desde celular.
*   Canvas de firma debe funcionar con touch events en móvil.
*   Mostrar datos básicos del contrato sin revelar información sensible del tenant.
*   Token de un solo uso: una vez firmado, la URL muestra mensaje de confirmación.
*   Token expirado muestra mensaje amigable con opción de solicitar nuevo link.

## 5.6 Gestión Financiera
### Vistas
*   **FacturasListComponent:** Tabla con filtros por estado, cliente, rango de fecha. Badges: borrador (gris), emitida (azul), pagada parcial (amarillo), pagada (verde), vencida (rojo), anulada (negro).
*   **FacturaFormComponent:** Formulario para crear factura manual o desde contrato. Soporta cuotas programadas.
*   **FacturaDetalleComponent:** Vista con datos de factura, historial de pagos, botón de registrar pago, botón de enviar recordatorio.
*   **FlujoCajaComponent:** Dashboard financiero con: flujo de caja proyectado (próximos 90 días basado en facturas pendientes), cuentas por cobrar aging (30/60/90 días), ingresos vs egresos mensual.
*   **MovimientosComponent:** Tabla de movimientos financieros con filtros y exportación a CSV.
*   **ConciliacionComponent:** Importar cartola bancaria (CSV/OFX), matching automático con pagos registrados, conciliación manual de discrepancias.

### Reglas de negocio
*   Al registrar un pago en una factura, se actualiza automáticamente montoPagado y montoPendiente. Si montoPendiente llega a 0, el estado cambia a pagada.
*   Cloud Function scheduled diaria revisa facturas vencidas y cambia estado a vencida, generando notificación.
*   Flujo de caja proyectado: suma de ingresos esperados (facturas pendientes por fechaVencimiento) menos egresos recurrentes registrados.
*   Al crear factura desde contrato, hereda items y calcula cuotas según condicionesPago.
*   Recordatorio automático: Cloud Function envía email al cliente 3 días antes del vencimiento y el día del vencimiento.

#### Arquitectura de Pagos (Stripe Integration V1)
En vez de incrustar **Stripe Elements** directos en el DOM que obligaría a mantener métricas estrictas de PCI compliance, optamos escalar mediante **Stripe Checkout Sessions**:
1. El usuario cliente pulsa **Pagar con Stripe** y dispara la Callable Firebase local `@angular/fire/functions`: `createCheckoutSession`.
2. Esta función pura de NodeJS constata credenciales transaccionales e instancia un ticket asíncrono sobre la API de Stripe generando un portal Hosted.
3. Aceptado el pago vía ApplePay/Cards, el servidor de Stripe ejecuta proactivamente nuestro webhook proxy: `stripeWebhook`. Este verifica criptográficamente evitar manipulaciones, actualizando atómicamente la Factura ligada hacia el estado `pagada` previniendo race conditions en cliente.

## 5.7 Timetracking y Rentabilidad
### Vistas
*   **TimerComponent:** Widget persistente en la barra superior: botón Start/Stop, selector de proyecto/tarea, cronómetro visible. Al detener, abre modal para agregar descripción y confirmar.
*   **RegistrosTiempoListComponent:** Tabla semanal/mensual con filtros por usuario, proyecto, cliente. Vista de calendario opcional.
*   **RegistroManualComponent:** Formulario para agregar horas manualmente (para quienes prefieren no usar timer).
*   **ReporteRentabilidadComponent:** Análisis por proyecto: horas totales, costo interno (horas x costoHora de cada usuario), ingreso del contrato, margen bruto, rentabilidad %. Comparativo entre proyectos.
*   **ReporteEquipoComponent:** Vista de carga por persona: horas registradas vs capacidad (160h/mes), distribución por proyecto, horas facturables vs no facturables.

### Reglas de negocio
*   El timer en la barra superior persiste entre navegaciones (servicio singleton en Angular).
*   Al completar un registro, Cloud Function calcula costoInterno y valorFacturable basado en los rates del usuario.
*   Cloud Function trigger actualiza horasReales en la tarea y costoReal en el proyecto al crear/editar un registro de tiempo.
*   Rentabilidad del proyecto = (ingresoTotal - costoReal) / ingresoTotal * 100.
*   Alerta automática si un proyecto supera el 80% del presupuesto de horas.
*   Reporte semanal automático por email con resumen de horas del equipo (Cloud Function scheduled).

## 5.8 Portal del Cliente
Módulo externo (lazy-loaded, SSR recomendado para SEO y performance) donde los clientes de los tenants acceden a su información sin necesitar credenciales del sistema principal.

### Acceso
*   Link mágico (magic link) enviado por email: el cliente recibe un link con token temporal que lo autentica por 24 horas.
*   Alternativa: login con email + código de verificación (OTP) enviado por email. Sin password.
*   Cada sesión del portal queda vinculada al `clienteId` y `tenantId`.

### Funcionalidades del Portal
*   **Mis Cotizaciones:** Listado de cotizaciones recibidas. Puede aprobar o rechazar (con comentario). Ver PDF.
*   **Mis Contratos:** Listado de contratos con estado. Firma digital directa desde el portal.
*   **Mis Facturas:** Facturas emitidas con estado de pago. Descarga PDF. Link de pago si se integra pasarela.
*   **Mis Proyectos:** Avance del proyecto: progreso %, timeline, hitos completados. Sin detalle de costos internos.
*   **Documentos:** Carpeta compartida donde el tenant puede subir archivos para el cliente y viceversa.
*   **Mensajes:** Chat simple vinculado al cliente para comunicación rápida con el equipo.

### Reglas de negocio
*   El portal NUNCA muestra información financiera interna (costos, rentabilidad, notas internas).
*   El branding del portal usa los colores y logo del tenant, no de SUBE Gestión.
*   Cada acción del cliente (aprobar cotización, firmar contrato, enviar mensaje) genera notificación al vendedor asignado.
*   Los magic links expiran en 24 horas y son de un solo uso.

## 5.9 Proyectos y Tareas
### Vistas
*   **ProyectosListComponent:** Tabla/cards con filtros por estado, cliente, equipo. Progress bar visual por proyecto.
*   **ProyectoDetalleComponent:** Vista completa: overview (presupuesto, timeline, equipo, rentabilidad), tablero Kanban de tareas, timeline de actividad, archivos del proyecto.
*   **KanbanBoardComponent:** Tablero drag-and-drop con columnas: Pendiente, En Progreso, En Revisión, Completada. Cards muestran título, asignado, prioridad (color-coded), deadline.
*   **GanttSimpleComponent:** Vista de timeline simplificada mostrando tareas en barras horizontales con dependencias básicas (opcional, se puede implementar en fase posterior).

### Reglas de negocio
*   Al crear proyecto desde contrato, se heredan: cliente, monto (como presupuesto), fechas.
*   Progreso del proyecto = tareas completadas / total tareas * 100.
*   Al completar todas las tareas, se sugiere cambiar estado del proyecto a completado.
*   Archivos del proyecto se almacenan en Cloud Storage bajo `/tenants/{tenantId}/proyectos/{proyectoId}/`.

## 5.10 Asistente de IA
### Arquitectura
El asistente utiliza Gemini 2.0 Flash via Cloud Functions como proxy. Antes de enviar la pregunta del usuario a la API, el sistema inyecta contexto relevante del tenant.

### Flujo
1.  Usuario escribe pregunta en el chat.
2.  Frontend envía mensaje a Cloud Function con el `tenantId`.
3.  Cloud Function consulta Firestore para obtener contexto relevante: KPIs actuales, cotizaciones recientes, facturas pendientes, rendimiento del pipeline, rentabilidad de proyectos.
4.  Construye prompt: system prompt con instrucciones + contexto de datos + pregunta del usuario.
5.  Envía a Gemini API y retorna respuesta streamed al frontend.

### Capacidades del asistente
*   **Análisis de ventas:** Razón de cotizaciones perdidas, patrones de conversión, estacionalidad.
*   **Predicción:** Scoring de probabilidad de cierre por cotización basado en historial.
*   **Alertas inteligentes:** Clientes sin contacto, proyectos en riesgo, anomalías de flujo de caja.
*   **Generación de contenido:** Borradores de cotización, emails de seguimiento, resumen ejecutivo semanal.
*   **Insights de rentabilidad:** Proyectos más/menos rentables, clientes más valiosos, optimización de tarifas.

### Límites por plan
| Plan | Mensajes/mes | Contexto | Funciones |
| :--- | :--- | :--- | :--- |
| Free | 50 | Básico (KPIs) | Análisis simple |
| Starter | 200 | Medio (KPIs + cotizaciones) | Análisis + alertas |
| Professional | 1000 | Completo | Todas las funciones |
| Enterprise | Ilimitado | Completo + historial | Todas + personalización |

## 5.5 Cotizaciones y Propuestas (Sprint 5)
Módulo encargado del ciclo de vida comercial previo al contrato formal, permitiendo a los vendedores estructurar ofertas basadas en el catálogo de productos y servicios.

**Modelos de Datos Principales (`cotizacion.model.ts`):**
*   `Cotizacion`: Entidad principal que almacena `tenantId`, `clienteId`, `vendedorId`, y un `correlativo` legible e incrementable automáticamente.
*   `CotizacionItemDetalle`: Líneas de ítems incrustadas vinculadas a `CatalogoItem` con subtotal integrado.
*   **Gestor Económico:** Cálculo en tiempo real de `subtotal`, `descuento` (monto o Módulo), `impuestos` aplicables y `totalFinal`.
*   **Trazabilidad:** Máquina de estados con historial en array (`Borrador`, `Enviada`, `Revision_Solicitada`, `Aceptada`, `Rechazada`).

**Componentes Principales:**
*   `CotizacionesListComponent`: Datatable de gestión multi-tenant para supervisar, filtrar y administrar propuestas, listando correlativos y estados con badges.
*   `CotizacionFormComponent`: Generador de cotizaciones con interfaz reactiva y FormArrays. Relaciona ítems del catálogo en tiempo real con matemática integrada. Autocompleta clientes activos del CRM e inserta Condiciones Adicionales.
*   `CotizacionViewComponent`: Vista de lectura estructurada del desglose económico y la línea temporal de trazabilidad de estados. Prepara el entorno para firma de contratos y notificaciones asíncronas.

---

## 5.6 Contratos y Firmas Electrónicas (Sprint 6)
Módulo encargado de formalizar las cotizaciones mediante acuerdos legales strictos soportando 3 métodos distintos de validación de identidad para el cliente.

**Modelos de Datos Principales (`contrato.model.ts`):**
*   `Contrato`: Entidad principal alojando `tenantId`, `cotizacionOrigenId`, `cuerpoLegal` detallado y `itemsArray` anexando la matemática transaccional subyacente de los servicios.
*   `FirmaData`: Sub-Objeto almacenado tras la firma del cliente, definiendo el `metodo` (dibujo, upload, digital), el `urlFirmaStorage` (si aplica) y la huella `auditTrail` (con timestamp y user-agent para Firmas Electrónicas Simples sin imagen).
*   **Trazabilidad de Estados:** Máquina controlada `Borrador -> Enviado -> Firmado -> Cancelado`.

**Componentes Principales:**
*   `ContratosListComponent`: Reutilización estructural de `app-data-table` controlando la vista global de los acuerdos.
*   `ContratoFormComponent`: Creador de contratos. Diseñado para inyectar información pre-existente desde una propuesta (`patchFromCotizacion`) o generarse de 0. Administra un Textarea puro para la inyección de las Cláusulas de Acuerdo.
*   `SignaturePadComponent`: Componente reusable y agnóstico que gestiona 3 pestañas (Render de Canvas dinámico capturando punteros/touch para PNGs, Lector de archivos para carga gráfica corporativa y Formulario estricto de captura Audit-Trail). Sube binarios a Storage e informa al Parent.
*   `ContratoViewComponent`: La vista "Pública" expuesta a Clientes. Condiciona dinámicamente el despliegue del texto legal, activando el *SignaturePad* o mostrando un escudo criptográfico de validación si el contrato ya ha mutado a `Firmado`.

---

# 6. Cloud Functions (Backend)
Todas las Cloud Functions se implementan en Node.js/TypeScript usando Firebase Functions Gen 2 (v2). Se organizan en módulos por dominio.

## 6.1 Funciones Trigger (Event-driven)
| Función | Trigger | Acción |
| :--- | :--- | :--- |
| `onUserCreated` | Auth onCreate | Crea tenant + user doc + Custom Claims |
| `onCotizacionUpdated` | Firestore onUpdate cotizaciones | Si estado cambia a enviada: genera PDF, envía email |
| `onContratoFirmado` | Firestore onUpdate contratos | Si firmaCliente se completa: genera PDF final, notifica, crea proyecto automático |
| `onPagoRegistrado` | Firestore onCreate pagos (sub) | Actualiza montoPagado/montoPendiente en factura, registra movimiento financiero |
| `onRegistroTiempoCreated` | Firestore onCreate registrosTiempo | Calcula costos, actualiza horas en tarea y proyecto |
| `onActividadCreated` | Firestore onCreate actividades | Recalcula lead score del cliente |

## 6.2 Funciones Callable (HTTP)
| Función | Método | Descripción |
| :--- | :--- | :--- |
| `convertirACotizacion` | POST | Crea contrato desde cotización aprobada (transacción atómica) |
| `generarCorrelativo` | POST | Genera número correlativo thread-safe con `FieldValue.increment` |
| `enviarContratoFirma` | POST | Genera token, envía email al cliente con link de firma |
| `validarFirmaCliente` | POST | Valida token, guarda firma, registra metadata |
| `generarPdf` | POST | Genera PDF con Puppeteer desde template HTML |
| `chatIA` | POST (stream) | Proxy a Gemini API con inyección de contexto del tenant |
| `enviarMagicLink` | POST | Genera y envía magic link para Portal del Cliente |
| `importarCartola` | POST | Procesa CSV/OFX de cartola bancaria para conciliación |
| `exportarReporte` | POST | Genera reportes en PDF o Excel bajo demanda |

## 6.3 Funciones Scheduled (Cron)
| Función | Frecuencia | Acción |
| :--- | :--- | :--- |
| `verificarCotizacionesExpiradas` | Diario 00:00 | Cambia estado a expirada si fecha > fechaExpiracion |
| `verificarFacturasVencidas` | Diario 08:00 | Cambia estado a vencida, genera notificación y email de recordatorio |
| `recordatorioFacturasPorVencer` | Diario 08:00 | Envía email 3 días antes del vencimiento |
| `resumenSemanalEquipo` | Lunes 09:00 | Genera y envía resumen de horas/rendimiento por email |
| `limpiarTokensExpirados` | Diario 02:00 | Elimina tokens de firma expirados |
| `calcularMetricasMensuales` | Primer día del mes | Snapshot de métricas clave para historial |
| `alertasClientesSinContacto` | Semanal | Notifica sobre clientes sin actividad en 30+ días |

---

# 7. Lineamientos de UI/UX
El sistema debe verse moderno, limpio y profesional. Referentes de diseño: Stripe Dashboard, Linear, Vercel.

## 7.1 Layout Principal
*   **Sidebar izquierdo:** Colapsable. Íconos Lucide. Secciones: Dashboard, CRM (Clientes, Pipeline), Ventas (Cotizaciones, Contratos), Finanzas (Facturas, Flujo de Caja, Movimientos), Operaciones (Proyectos, Tareas), Timetracking, Asistente IA, Configuración.
*   **Navbar superior:** Logo del tenant (o SUBE Gestión si no hay logo), barra de búsqueda global, timer de timetracking, icono de notificaciones con badge, avatar de usuario con dropdown.
*   **Content area:** Max-width 1280px centrado. Padding lateral 24px.

## 7.2 Componentes Clave
*   **Data Tables:** Construcción propia con Tailwind. Búsqueda en tiempo real, paginación, sort por columna, estados con badges de colores, acciones en última columna (ver, editar, eliminar).
*   **Formularios:** Reactivos de Angular. Validación en tiempo real con mensajes inline. Autocomplete para selectores de cliente/servicio. Items dinámicos con botón + y -.
*   **Cards de KPIs:** Fondo blanco, sombra sutil, ícono, valor principal grande, variación vs mes anterior con flecha y color (verde +, rojo -).
*   **Toasts:** Esquina superior derecha. Tipos: success (verde), error (rojo), warning (amarillo), info (azul). Auto-dismiss en 4 segundos.
*   **Loading States:** Skeleton loaders para tablas y cards. Spinner para acciones puntuales. Nunca pantalla en blanco.
*   **Empty States:** Ilustración + texto descriptivo + CTA cuando no hay datos (ej: "No tienes cotizaciones aún. Crea tu primera cotización").
*   **Modales:** Formularios cortos y confirmaciones. Overlay con blur. Cerrar con Escape y click fuera.

## 7.3 Responsividad
*   Mobile-first approach con Tailwind breakpoints (`sm`, `md`, `lg`, `xl`).
*   En móvil: sidebar se convierte en bottom navigation con 5 íconos principales. Tablas se transforman en cards apiladas. Kanban se convierte en lista vertical con swipe para cambiar columna.
*   URL pública de firma: diseño exclusivamente mobile-first, canvas de firma ocupa 100% del ancho.
*   Portal del cliente: totalmente responsivo, priorizando la experiencia móvil.

## 7.4 Temas y Branding
*   CSS variables para colores del tenant: `--color-primary`, `--color-secondary`.
*   Al cargar la app, el AuthService obtiene la config del tenant y aplica los CSS variables globalmente.
*   Modo oscuro: planificado para fase posterior, pero la estructura CSS debe soportarlo (usar variables, no colores hardcoded).

---

# 8. Planes y Límites SaaS
Estructura de planes orientada a escalar desde freelancers hasta empresas medianas.

| Característica | Free | Starter | Professional | Enterprise |
| :--- | :--- | :--- | :--- | :--- |
| Usuarios | 3 | 10 | 25 | Ilimitado |
| Clientes | 20 | 100 | 500 | Ilimitado |
| Cotizaciones/mes | 10 | 50 | Ilimitado | Ilimitado |
| Storage | 500 MB | 5 GB | 25 GB | 100 GB |
| Mensajes IA/mes | 50 | 200 | 1000 | Ilimitado |
| Portal del Cliente | No | Básico | Completo | Completo + personalizado |
| Timetracking | Básico | Completo | Completo + reportes | Completo + API |
| Integraciones | No | Email | Email + Calendar | Todas |
| Soporte | Comunidad | Email | Prioritario | Dedicado |
| Precio (USD/mes) | Gratis | $29 | $79 | Personalizado |

---

# 9. Hoja de Ruta de Implementación
Plan de desarrollo en 10 sprints de 2 semanas cada uno. Total estimado: 20 semanas (5 meses).

## Sprint 1 — Fundamentos (Semanas 1-2)
Objetivo: Setup completo del proyecto y sistema de autenticación multi-tenant funcional.
*   Inicializar proyecto Angular 19 con Tailwind CSS 4, @angular/fire, routing.
*   Configurar proyecto Firebase: Auth, Firestore, Storage, Functions (Gen 2).
*   Implementar LoginComponent, RegisterComponent, ForgotPasswordComponent.
*   Cloud Function `onUserCreated`: creación de tenant + user + Custom Claims.
*   AuthGuard y RoleGuard para protección de rutas.
*   Firestore Security Rules base con patrón tenantId.
*   OnboardingWizardComponent para configuración inicial del tenant.

## Sprint 2 — Layout y Dashboard (Semanas 3-4)
Objetivo: Shell de la aplicación con navegación y dashboard funcional.
*   Sidebar colapsable con navegación completa y íconos Lucide.
*   Navbar superior con búsqueda, notificaciones, perfil de usuario.
*   Servicio de notificaciones Toast (ngx-toastr).
*   DashboardComponent con cards de KPIs (datos mockeados inicialmente).
*   Integración chart.js: gráfico de barras y donut chart.
*   Skeleton loaders y empty states base.
*   Responsive: bottom navigation en móvil.

## Sprint 3 — CRM y Pipeline (Semanas 5-6)
Objetivo: Gestión completa de clientes con pipeline visual.
*   CRUD completo de clientes con validación de RUT chileno.
*   ClienteDetalleComponent: vista 360°.
*   CRUD de actividades vinculadas a clientes.
*   PipelineKanbanComponent con drag-and-drop (@angular/cdk).
*   Cloud Function para lead scoring automático.
*   Filtros y búsqueda avanzada en listado de clientes.

## Sprint 4 — Catálogo y Cotizaciones (Semanas 7-8)
Objetivo: Catálogo de servicios y flujo completo de cotizaciones.
*   CRUD de catálogo de servicios con historial de precios.
*   Formulario de cotización con ítems dinámicos desde catálogo.
*   Cálculos en tiempo real: subtotal, descuento, IVA, total.
*   Cloud Function para numeración correlativa atómica.
*   Vista de detalle y preview de cotización.
*   Flujo de estados con historial.
*   Generación de PDF con template profesional (Puppeteer en Cloud Function).

## Sprint 5 — Contratos y Firma Digital (Semanas 9-10)
Objetivo: Flujo completo de contratos con firma digital interna y externa.
*   Conversión de cotización aprobada a contrato.
*   Editor de cláusulas contractuales.
*   SignaturePad: firma interna del representante.
*   Cloud Function: generación de token, envío de email.
*   URL pública de firma (mobile-first, responsive).
*   Validación de token y registro de firma del cliente.
*   Generación de PDF final con ambas firmas.
*   Envío de copia firmada a ambas partes.

## Sprint 6 — Facturación y Pagos (Semanas 11-12)
Objetivo: Sistema de facturación con control de pagos y cuotas.
*   CRUD de facturas con generación desde contrato.
*   Sistema de cuotas programadas.
*   Registro de pagos con comprobante (upload a Storage).
*   Cálculo automático de montoPagado/montoPendiente.
*   Cloud Functions: facturas vencidas, recordatorios automáticos.
*   Generación de PDF de factura.
*   Registro automático de movimientos financieros por pago.

## Sprint 7 — Finanzas y Flujo de Caja (Semanas 13-14)
Objetivo: Dashboard financiero, movimientos y conciliación básica.
*   FlujoCajaComponent: proyección 90 días, aging de cuentas por cobrar.
*   CRUD de movimientos financieros (ingresos/egresos manuales).
*   Importación de cartola bancaria (CSV parser).
*   Matching automático y conciliación manual.
*   Gráfico de ingresos vs egresos mensual.
*   Exportación de reportes financieros a CSV/PDF.

## Sprint 8 — Timetracking (Semanas 15-16)
Objetivo: Sistema completo de registro de horas con análisis de rentabilidad.
*   TimerComponent persistente en navbar.
*   Registro manual de horas.
*   Vista semanal/mensual de registros por usuario.
*   Cloud Functions: cálculo de costos, actualización de proyectos.
*   ReporteRentabilidadComponent por proyecto.
*   ReporteEquipoComponent: carga y distribución.
*   Alertas de presupuesto de horas excedido.

## Sprint 9 — Portal del Cliente (Semanas 17-18)
Objetivo: Portal externo funcional para clientes de los tenants.
*   Sistema de autenticación con magic link y OTP.
*   Vistas: Mis Cotizaciones, Mis Contratos, Mis Facturas, Mis Proyectos.
*   Aprobación/rechazo de cotizaciones desde el portal.
*   Firma de contratos integrada.
*   Sistema de documentos compartidos (upload/download).
*   Mensajería simple cliente-equipo.
*   Branding dinámico del tenant (logo, colores).

## Sprint 10 — IA, Integraciones y Polish (Semanas 19-20)
Objetivo: Asistente IA, integraciones finales, y pulido general.
*   Chat IA con inyección de contexto del tenant via Cloud Function.
*   Prompts especializados para cada tipo de análisis.
*   Sistema de notificaciones completo (in-app, email).
*   Dashboard con datos reales y tiempo real (onSnapshot).
*   Búsqueda global (clientes, cotizaciones, contratos, proyectos).
*   Configuración del tenant: branding, impuestos, correlativos, permisos.
*   Testing E2E de flujos críticos.
*   Optimización de performance y bundle size.
*   Deploy a producción en Firebase Hosting.

---

# 10. Requisitos No Funcionales
## 10.1 Performance
*   Time to Interactive (TTI) < 3 segundos en conexión 3G.
*   Lazy loading de módulos Angular para reducir bundle inicial.
*   Índices compuestos en Firestore para queries frecuentes (`tenantId` + `estado`, `tenantId` + `clienteId` + `createdAt`).
*   Paginación con cursor-based pagination en todas las listas (no offset).

## 10.2 Seguridad
*   HTTPS obligatorio (provisto por Firebase Hosting).
*   Custom Claims en JWT para validación server-side de `tenantId` y `role`.
*   Firestore Security Rules exhaustivas: ningún documento accesible sin `tenantId` válido.
*   Tokens de firma con UUID v4, expiración de 7 días, un solo uso.
*   Rate limiting en Cloud Functions callable (max 100 req/min por tenant).
*   Validación de inputs en Cloud Functions (nunca confiar solo en el frontend).
*   Sanitización de HTML en campos de texto libre para prevenir XSS.

## 10.3 Escalabilidad
*   Firestore escala automáticamente sin configuración adicional.
*   Cloud Functions Gen 2 con auto-scaling y cold start optimizado.
*   Cloud Storage con CDN de Google para archivos estáticos.
*   Diseño de índices Firestore para evitar hot spots (no usar timestamps secuenciales como document ID).

## 10.4 Disponibilidad y Backup
*   Firebase provee SLA de 99.95% para Firestore y Auth.
*   Backups automáticos de Firestore activados (export diario a Cloud Storage).
*   Point-in-time recovery de Firestore habilitado.

## 10.5 Monitoreo
*   Firebase Analytics para tracking de uso por feature y tenant.
*   Cloud Functions logs en Google Cloud Logging.
*   Alertas configuradas: errores en funciones, latencia alta, quota cerca del límite.
*   Dashboard de métricas técnicas en Google Cloud Monitoring.

---

# Apéndice A: Índices Firestore Requeridos
Los siguientes índices compuestos deben configurarse en `firestore.indexes.json` para optimizar las queries más frecuentes del sistema.

| Colección | Campos | Orden |
| :--- | :--- | :--- |
| `cotizaciones` | tenantId, estado, createdAt | ASC, ASC, DESC |
| `cotizaciones` | tenantId, clienteId, createdAt | ASC, ASC, DESC |
| `cotizaciones` | tenantId, vendedorId, estado | ASC, ASC, ASC |
| `contratos` | tenantId, estado, createdAt | ASC, ASC, DESC |
| `contratos` | tenantId, tokenFirmaPublica | ASC, ASC |
| `facturas` | tenantId, estado, fechaVencimiento | ASC, ASC, ASC |
| `facturas` | tenantId, clienteId, createdAt | ASC, ASC, DESC |
| `clientes` | tenantId, estado, score | ASC, ASC, DESC |
| `clientes` | tenantId, pipelineEtapa | ASC, ASC |
| `actividades` | tenantId, clienteId, fecha | ASC, ASC, DESC |
| `registrosTiempo` | tenantId, usuarioId, fecha | ASC, ASC, DESC |
| `registrosTiempo` | tenantId, proyectoId, fecha | ASC, ASC, DESC |
| `proyectos` | tenantId, estado, fechaInicio | ASC, ASC, DESC |
| `tareas` | tenantId, proyectoId, estado, orden | ASC, ASC, ASC, ASC |
| `movimientosFinancieros` | tenantId, tipo, fecha | ASC, ASC, DESC |
| `notificaciones` | tenantId, usuarioId, leida, createdAt | ASC, ASC, ASC, DESC |

---

# PARTE II: INSTRUCCIONES COMPLETAS DE IMPLEMENTACIÓN (VERSIÓN 3.0)

## 11. Análisis de Brechas: Qué Falta Implementar

El documento técnico v2.0 define correctamente la arquitectura, modelo de datos, especificación de módulos y roadmap. Sin embargo, para que Antigravity pueda ejecutar el desarrollo sin ambigüedades, se identificaron las siguientes brechas críticas que este documento resuelve:

### 11.1 Brechas de Arquitectura de Código
* Estructura de carpetas del proyecto Angular no definida: sin ella cada dev organiza diferente.
* No hay especificación de Angular Services por módulo ni interfaces TypeScript.
* Routing completo no detallado (lazy loading, guards por ruta, redirects).
* Sin patrón estandarizado para llamadas a Cloud Functions desde Angular.
* State management: solo mención de `@ngrx/component-store` sin guía de uso.
* Sin estrategia de error handling global (interceptors, error boundaries).

### 11.2 Brechas de Seguridad y Reglas
* Firestore Security Rules: solo se muestra un patrón, falta el archivo completo.
* Sin matriz de permisos por rol (qué puede hacer cada rol en cada módulo).
* Storage Security Rules no definidas.
* Sin estrategia de audit logging para acciones sensibles.
* Rate limiting: mencionado pero sin implementación detallada.

### 11.3 Brechas de Funcionalidad
* Panel de Super Admin SaaS: no existe módulo para gestionar todos los tenants.
* Sistema de suscripciones y billing: planes definidos pero sin flujo de pago/upgrade.
* Templates de emails transaccionales: no especificados.
* Templates HTML para PDFs: no detallados.
* Búsqueda global: mencionada pero sin arquitectura.
* Importación/exportación de datos: sin especificación.
* Multi-moneda: campos existen pero sin lógica de conversión UF/USD.
* Gestión de archivos del proyecto: sin patrón de upload/download.
* Configuración del tenant (Settings): mencionada sin detallar.

### 11.4 Brechas de Calidad
* Sin estrategia de testing (unit, integration, E2E).
* Sin pipeline de CI/CD detallado.
* Sin guía de accesibilidad (a11y).
* Sin guía de internacionalización (i18n) aunque `config.idioma` existe.
* Sin convenciones de código (naming, commits, PRs).

Las siguientes secciones de este documento resuelven cada una de estas brechas con especificaciones ejecutables.

## 12. Estructura del Proyecto Angular

Estructura de carpetas obligatoria. Cada módulo es lazy-loaded con su propio routing. Los servicios compartidos viven en `core/`, los componentes reutilizables en `shared/`.

```text
estratega-sube-ia/
├── src/
│   ├── app/
│   │   ├── core/                          # Singleton services, guards, interceptors
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts
│   │   │   │   ├── role.guard.ts
│   │   │   │   └── plan.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── error.interceptor.ts          # Global HTTP error handling
│   │   │   │   └── loading.interceptor.ts        # Global loading state
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts               # Firebase Auth + Custom Claims
│   │   │   │   ├── tenant.service.ts             # Tenant config, branding, limits
│   │   │   │   ├── notification.service.ts       # Toasts + in-app notifications
│   │   │   │   ├── cloud-functions.service.ts    # Wrapper for callable functions
│   │   │   │   ├── file-upload.service.ts        # Cloud Storage upload/download
│   │   │   │   ├── search.service.ts             # Global search
│   │   │   │   └── timer.service.ts              # Singleton timetracking timer
│   │   │   ├── interfaces/
│   │   │   │   ├── tenant.interface.ts
│   │   │   │   ├── user.interface.ts
│   │   │   │   ├── cliente.interface.ts
│   │   │   │   ├── cotizacion.interface.ts
│   │   │   │   ├── contrato.interface.ts
│   │   │   │   ├── factura.interface.ts
│   │   │   │   ├── proyecto.interface.ts
│   │   │   │   ├── tarea.interface.ts
│   │   │   │   ├── registro-tiempo.interface.ts
│   │   │   │   ├── movimiento.interface.ts
│   │   │   │   └── notificacion.interface.ts
│   │   │   └── models/
│   │   │       ├── enums.ts                      # All enums (estados, roles, etc.)
│   │   │       └── constants.ts                  # App-wide constants
│   │   ├── shared/                        # Reusable components & pipes
│   │   │   ├── components/
│   │   │   │   ├── data-table/                   # Generic data table
│   │   │   │   ├── stat-card/                    # KPI card
│   │   │   │   ├── badge/                        # Status badge
│   │   │   │   ├── confirm-dialog/               # Generic confirmation modal
│   │   │   │   ├── file-uploader/                # Drag-and-drop file upload
│   │   │   │   ├── signature-pad/                # Reusable signature canvas
│   │   │   │   ├── empty-state/                  # Empty state with CTA
│   │   │   │   ├── skeleton-loader/              # Skeleton loading
│   │   │   │   ├── search-input/                 # Debounced search
│   │   │   │   └── pagination/                   # Cursor-based pagination
│   │   │   ├── pipes/
│   │   │   │   ├── currency-format.pipe.ts       # CLP, UF, USD formatting
│   │   │   │   ├── rut-format.pipe.ts            # Chilean RUT formatting
│   │   │   │   └── relative-time.pipe.ts         # 'hace 2 horas'
│   │   │   ├── directives/
│   │   │   │   ├── role-visible.directive.ts     # *appRoleVisible='admin'
│   │   │   │   └── click-outside.directive.ts
│   │   │   └── validators/
│   │   │       ├── rut.validator.ts              # Chilean RUT validation
│   │   │       └── email.validator.ts
│   │   ├── layout/                        # App shell
│   │   │   ├── sidebar/
│   │   │   ├── navbar/
│   │   │   ├── bottom-nav/                   # Mobile navigation
│   │   │   └── layout.component.ts
│   │   ├── features/                      # Feature modules (lazy-loaded)
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── clientes/
│   │   │   ├── pipeline/
│   │   │   ├── cotizaciones/
│   │   │   ├── contratos/
│   │   │   ├── facturas/
│   │   │   ├── finanzas/
│   │   │   ├── proyectos/
│   │   │   ├── tareas/
│   │   │   ├── timetracking/
│   │   │   ├── catalogo/
│   │   │   ├── asistente-ia/
│   │   │   ├── portal-cliente/               # Lazy module, no AuthGuard
│   │   │   ├── firma-publica/                # Public signature route
│   │   │   ├── configuracion/                # Tenant settings
│   │   │   └── admin-saas/                   # Super admin panel
│   │   ├── app.routes.ts
│   │   ├── app.component.ts
│   │   └── app.config.ts
│   ├── assets/
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   └── styles/
│       ├── globals.css                    # Tailwind + CSS variables
│       └── themes.css                     # Tenant dynamic theming
├── functions/                         # Firebase Cloud Functions
│   ├── src/
│   │   ├── triggers/
│   │   ├── callable/
│   │   ├── scheduled/
│   │   ├── templates/                     # HTML templates for PDFs & emails
│   │   ├── utils/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── firebase.json
└── .github/workflows/deploy.yml
```

Cada feature module sigue esta estructura interna:
```text
features/cotizaciones/
  ├── components/                    # UI components del módulo
  │   ├── cotizacion-list/
  │   ├── cotizacion-form/
  │   ├── cotizacion-detalle/
  │   └── cotizacion-pdf-preview/
  ├── services/
  │   └── cotizaciones.service.ts        # Firestore CRUD + business logic
  ├── cotizaciones.routes.ts
  └── index.ts
```

## 13. Configuración de Routing Completa

Todas las rutas protegidas usan `AuthGuard` + `RoleGuard`. Los módulos de features cargan via lazy loading con `loadChildren`.

| Ruta | Módulo | Guards | Roles Mínimos |
| :--- | :--- | :--- | :--- |
| `/login` | auth | Ninguno (redirect si auth) | --- |
| `/registro` | auth | Ninguno | --- |
| `/recuperar` | auth | Ninguno | --- |
| `/onboarding` | auth | AuthGuard | super-admin |
| `/` | dashboard | AuthGuard | Todos |
| `/clientes` | clientes | AuthGuard | vendedor+ |
| `/clientes/:id` | clientes | AuthGuard | vendedor+ |
| `/pipeline` | pipeline | AuthGuard | vendedor+ |
| `/catalogo` | catalogo | AuthGuard | admin+ |
| `/cotizaciones` | cotizaciones | AuthGuard | vendedor+ |
| `/cotizaciones/nueva` | cotizaciones | AuthGuard | vendedor+ |
| `/cotizaciones/:id` | cotizaciones | AuthGuard | vendedor+ |
| `/contratos` | contratos | AuthGuard | vendedor+ |
| `/contratos/:id` | contratos | AuthGuard | vendedor+ |
| `/facturas` | facturas | AuthGuard | finanzas+ |
| `/facturas/:id` | facturas | AuthGuard | finanzas+ |
| `/finanzas/flujo-caja` | finanzas | AuthGuard | finanzas+ |
| `/finanzas/movimientos` | finanzas | AuthGuard | finanzas+ |
| `/finanzas/conciliacion` | finanzas | AuthGuard | admin+ |
| `/proyectos` | proyectos | AuthGuard | consultor+ |
| `/proyectos/:id` | proyectos | AuthGuard | consultor+ |
| `/timetracking` | timetracking | AuthGuard | consultor+ |
| `/timetracking/reportes` | timetracking | AuthGuard | admin+ |
| `/asistente` | asistente-ia | AuthGuard, PlanGuard(starter+) | vendedor+ |
| `/configuracion` | configuracion | AuthGuard | admin+ |
| `/configuracion/equipo` | configuracion | AuthGuard | super-admin |
| `/configuracion/planes` | configuracion | AuthGuard | super-admin |
| `/admin` | admin-saas | AuthGuard, SuperAdminGuard | platform-admin |
| `/firma/:contratoId/:token` | firma-publica | Ninguno | --- |
| `/portal/**` | portal-cliente | PortalAuthGuard | --- |

### 13.1 Jerarquía de Roles
Los roles se evalúan jerárquicamente. Un rol superior hereda todos los permisos del inferior:

`platform-admin` > `super-admin` > `admin` > `finanzas` > `vendedor` > `consultor` > `viewer`

El `platform-admin` es un rol interno de SUBE IA Tech para gestionar todos los tenants. No es visible para los tenants.

## 14. Matriz de Permisos por Rol

Define exactamente qué puede hacer cada rol en cada módulo. C = Crear, L = Leer, E = Editar, D = Eliminar, X = Sin acceso.

| Módulo / Acción | Super Admin | Admin | Finanzas | Vendedor | Consultor | Viewer |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Dashboard | CLED | CLED | L | L | L | L |
| Clientes: CRUD | CLED | CLED | L | CLE | L | L |
| Pipeline: mover etapas | CLED | CLED | X | CLE | X | L |
| Actividades: registrar | CLED | CLED | X | CLE | CLE | X |
| Catálogo servicios | CLED | CLED | L | L | L | L |
| Cotizaciones: crear/editar | CLED | CLED | L | CLE | X | L |
| Cotizaciones: aprobar/rechazar | CLED | CLE | X | X | X | X |
| Contratos: gestionar | CLED | CLED | L | CLE | L | L |
| Contratos: firmar interno | CLED | CLE | X | X | X | X |
| Facturas: CRUD | CLED | CLED | CLED | L | X | L |
| Facturas: registrar pago | CLED | CLE | CLE | X | X | X |
| Finanzas: flujo caja | CLED | CLED | CLE | X | X | X |
| Finanzas: conciliación | CLED | CLE | CLE | X | X | X |
| Proyectos: CRUD | CLED | CLED | L | CLE | CLE | L |
| Tareas: gestionar | CLED | CLED | X | CLE | CLE | L |
| Timetracking: propio | CLED | CLE | CLE | CLE | CLE | X |
| Timetracking: de otros | CLED | L | L | X | X | X |
| Timetracking: reportes | CLED | CLE | L | X | X | X |
| Asistente IA | CLED | CLE | CLE | CLE | CLE | X |
| Configuración: branding | CLED | CLE | X | X | X | X |
| Configuración: equipo | CLED | X | X | X | X | X |
| Configuración: plan/billing | CLED | X | X | X | X | X |

**Implementación:** Cada ruta usa `RoleGuard` con el rol mínimo. Dentro de los componentes, la directiva `*appRoleVisible` controla visibilidad de botones y acciones según el rol del usuario autenticado.

## 15. Firestore Security Rules Completas

Archivo completo `firestore.rules` que Antigravity debe implementar. Cubre todas las colecciones con validación de `tenantId`, roles y reglas específicas por colección.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ===== HELPER FUNCTIONS =====
    function isAuthenticated() {
      return request.auth != null;
    }
    function getTenantId() {
      return request.auth.token.tenantId;
    }
    function getRole() {
      return request.auth.token.role;
    }
    function isOwnerTenant(data) {
      return isAuthenticated() && getTenantId() == data.tenantId;
    }
    function tenantIdUnchanged() {
      return request.resource.data.tenantId == resource.data.tenantId;
    }
    function hasRole(minRole) {
      let hierarchy = {
        'platform-admin': 7, 'super-admin': 6, 'admin': 5,
        'finanzas': 4, 'vendedor': 3, 'consultor': 2, 'viewer': 1
      };
      return hierarchy[getRole()] >= hierarchy[minRole];
    }

    // ===== TENANTS =====
    match /tenants/{tenantId} {
      allow read: if isAuthenticated() && getTenantId() == tenantId;
      allow update: if isAuthenticated() && getTenantId() == tenantId && hasRole('admin');
      // create/delete only via Cloud Functions
    }

    // ===== USERS =====
    match /users/{uid} {
      allow read: if isAuthenticated() && getTenantId() == resource.data.tenantId;
      allow update: if isAuthenticated() && getTenantId() == resource.data.tenantId
        && (request.auth.uid == uid || hasRole('super-admin'))
        && tenantIdUnchanged();
      // create/delete only via Cloud Functions (role assignment)
    }

    // ===== GENERIC TENANT DATA PATTERN =====
    // Applied to: clientes, actividades, catalogoServicios, cotizaciones,
    // contratos, facturas, proyectos, tareas, registrosTiempo,
    // movimientosFinancieros
    match /{collection}/{docId} {
      allow read: if collection in ['clientes','actividades','catalogoServicios',
        'cotizaciones','contratos','facturas','proyectos','tareas',
        'registrosTiempo','movimientosFinancieros']
        && isOwnerTenant(resource.data);
      allow create: if collection in ['clientes','actividades','catalogoServicios',
        'cotizaciones','contratos','facturas','proyectos','tareas',
        'registrosTiempo','movimientosFinancieros']
        && isAuthenticated()
        && getTenantId() == request.resource.data.tenantId
        && hasRole('consultor');
      allow update: if collection in ['clientes','actividades','catalogoServicios',
        'cotizaciones','contratos','facturas','proyectos','tareas',
        'registrosTiempo','movimientosFinancieros']
        && isOwnerTenant(resource.data)
        && tenantIdUnchanged()
        && hasRole('consultor');
      allow delete: if collection in ['clientes','actividades','catalogoServicios',
        'cotizaciones','contratos','facturas','proyectos','tareas',
        'registrosTiempo','movimientosFinancieros']
        && isOwnerTenant(resource.data)
        && hasRole('admin');
    }

    // ===== NOTIFICACIONES =====
    match /notificaciones/{docId} {
      allow read: if isAuthenticated()
        && resource.data.usuarioId == request.auth.uid;
      allow update: if isAuthenticated()
        && resource.data.usuarioId == request.auth.uid
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['leida']);
      // create/delete only via Cloud Functions
    }

    // ===== CONTRATOS PUBLIC SIGNATURE =====
    match /contratos_publicos/{docId} {
      allow read: if true;  // Public access for signature page
      // write only via Cloud Functions
    }
  }
}
```

### 15.1 Storage Security Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /tenants/{tenantId}/{allPaths=**} {
      allow read: if request.auth != null
        && request.auth.token.tenantId == tenantId;
      allow write: if request.auth != null
        && request.auth.token.tenantId == tenantId
        && request.resource.size < 10 * 1024 * 1024;  // Max 10MB
    }
    match /firmas/{allPaths=**} {
      allow read: if true;  // Public for PDF rendering
      // write only via Cloud Functions
    }
  }
}
```

## 16. Especificación de Servicios Angular

Cada servicio se detalla con sus métodos, parámetros y responsabilidades. Estos son los servicios core singleton inyectados en root.

### 16.1 AuthService
| Método | Retorno | Descripción |
| :--- | :--- | :--- |
| `login(email, password)` | `Promise<UserCredential>` | Login con Firebase Auth, fuerza refresh de token para obtener Claims |
| `loginWithGoogle()` | `Promise<UserCredential>` | Google SSO popup |
| `register(empresaData, userData)` | `Promise<void>` | Crea cuenta Auth, trigger Cloud Function onUserCreated |
| `logout()` | `Promise<void>` | Sign out + limpiar estado local |
| `resetPassword(email)` | `Promise<void>` | Envía email de recuperación |
| `getCurrentUser()` | `Observable<User \| null>` | Stream del usuario autenticado |
| `getClaims()` | `Observable<CustomClaims>` | Stream de Custom Claims (tenantId, role, plan) |
| `refreshToken()` | `Promise<void>` | Fuerza refresh del JWT para obtener Claims actualizados |

### 16.2 TenantService
| Método | Retorno | Descripción |
| :--- | :--- | :--- |
| `getTenantConfig()` | `Observable<Tenant>` | Stream reactivo de la config del tenant actual |
| `updateConfig(config)` | `Promise<void>` | Actualiza configuración (branding, impuesto, moneda) |
| `uploadLogo(file)` | `Promise<string>` | Sube logo a Storage, retorna URL |
| `getCorrelativos()` | `Observable<Correlativos>` | Obtiene estado actual de correlativos |
| `applyBranding()` | `void` | Aplica CSS variables de colores del tenant al DOM |
| `checkLimits(resource)` | `Observable<boolean>` | Verifica si el tenant está dentro de los límites del plan |

### 16.3 CloudFunctionsService
Wrapper estandarizado para todas las llamadas a Cloud Functions callable. Maneja errores, loading state y tipado.

```typescript
// Patrón de uso:
async call<T>(functionName: string, data: any): Promise<T> {
  const fn = httpsCallable<any, T>(this.functions, functionName);
  try {
    const result = await fn(data);
    return result.data;
  } catch (error) {
    this.handleError(error); // Mapea códigos Firebase a mensajes amigables
    throw error;
  }
}
```

### 16.4 TimerService (Singleton)
Servicio singleton que mantiene el estado del cronómetro de timetracking entre navegaciones.

| Propiedad/Método | Tipo | Descripción |
| :--- | :--- | :--- |
| `isRunning$` | `Observable<boolean>` | Si el timer está activo |
| `elapsed$` | `Observable<number>` | Segundos transcurridos |
| `currentProject$` | `Observable<Proyecto>` | Proyecto seleccionado |
| `currentTask$` | `Observable<Tarea>` | Tarea seleccionada (opcional) |
| `start(proyectoId, tareaId?)` | `void` | Inicia el cronómetro |
| `stop()` | `Promise<RegistroTiempo>` | Detiene y abre modal de confirmación |
| `discard()` | `void` | Descarta el registro actual |

### 16.5 Servicios de Feature Modules
Cada feature module tiene su propio servicio con el patrón CRUD estandarizado:

| Método Estándar | Descripción |
| :--- | :--- |
| `getAll(filters?, pagination?)` | Query Firestore con tenantId automático, filtros y cursor-based pagination |
| `getById(id)` | Documento individual con listener en tiempo real (onSnapshot) |
| `create(data)` | Inyecta tenantId + createdAt + usuarioId, valida contra límites del plan |
| `update(id, data)` | Partial update preservando tenantId, actualiza updatedAt |
| `delete(id)` | Soft delete o hard delete según colección |
| `getByCliente(clienteId)` | Filtra por clienteId dentro del tenant |
| `exportToCsv(filters?)` | Genera y descarga CSV con los datos filtrados |

## 17. Estrategia de Error Handling Global

### 17.1 HTTP Error Interceptor
Interceptor Angular que captura todos los errores de Cloud Functions y los mapea a mensajes amigables en español.

| Código Firebase | Mensaje Usuario | Acción |
| :--- | :--- | :--- |
| `unauthenticated` | Sesión expirada. Por favor inicia sesión. | Redirect a /login |
| `permission-denied` | No tienes permisos para esta acción. | Toast error |
| `not-found` | El recurso solicitado no existe. | Toast warning |
| `already-exists` | Este registro ya existe. | Toast warning |
| `resource-exhausted` | Has alcanzado el límite de tu plan. | Toast warning + link upgrade |
| `unavailable` | Servicio temporalmente no disponible. Reintentando... | Auto-retry x3 |
| `internal` | Error interno. Si persiste, contacta soporte. | Toast error + log |
| `invalid-argument` | Datos inválidos. Revisa el formulario. | Toast error |

### 17.2 Global Error Handler
Implementar ErrorHandler de Angular que captura excepciones no controladas, las logea en console (dev) o en un servicio de monitoreo (prod), y muestra toast genérico al usuario.

### 17.3 Firestore Offline Handling
* Activar persistencia offline de Firestore: `enableIndexedDbPersistence()`
* Detectar estado de conexión con `navigator.onLine` y mostrar banner cuando está offline.
* Las operaciones escritas offline se sincronizan automáticamente al reconectar.
* Mostrar indicador visual (badge naranja) cuando hay escrituras pendientes de sincronizar.

## 18. Módulo Super Admin SaaS (admin-saas)

Panel exclusivo para el equipo de SUBE IA Tech para gestionar todos los tenants del sistema. Requiere rol `platform-admin` (asignado manualmente en Firebase Console).

### 18.1 Vistas del Panel
* **TenantsListComponent:** Tabla de todas las empresas registradas con: nombre, plan, estado suscripción, usuarios activos, storage usado, fecha registro, último acceso.
* **TenantDetailComponent:** Vista detallada del tenant: métricas de uso, historial de pagos, cambio manual de plan, suspensión/reactivación, impersonación (ver como el tenant).
* **MetricasGlobalesComponent:** Dashboard con: total tenants activos, MRR (Monthly Recurring Revenue), churn rate, tenants por plan, crecimiento mensual.
* **SoporteComponent:** Tickets de soporte de todos los tenants. Poder responder y escalar.

### 18.2 Funcionalidades críticas
* **Impersonación segura:** el platform-admin puede navegar como cualquier tenant sin conocer su password. Se implementa con Custom Claims temporales via Cloud Function.
* **Suspensión de tenant:** desactiva acceso de todos los usuarios del tenant. Datos se preservan.
* **Upgrade/downgrade de plan manual:** para acuerdos especiales o cortesias.
* **Export de métricas globales** para reporting interno de SUBE IA Tech.

## 19. Sistema de Suscripciones y Billing

Flujo completo para que los tenants gestionen su plan y pagos. Se recomienda integrar con Mercado Pago (Chile/LatAm) o Stripe como pasarela.

### 19.1 Flujo de Upgrade
1. Super-admin del tenant accede a Configuración > Plan y Facturación.
2. Ve comparativa de planes con features y precios.
3. Selecciona nuevo plan y hace clic en Upgrade.
4. Se redirige a checkout de la pasarela (Mercado Pago / Stripe).
5. Webhook de la pasarela notifica a Cloud Function del pago exitoso.
6. Cloud Function actualiza plan en `tenant doc` + Custom Claims de todos los usuarios.
7. Frontend detecta cambio de Claims y desbloquea features del nuevo plan.

### 19.2 Manejo de Límites
Cuando un tenant alcanza un límite de su plan (ej: máx 3 usuarios en Free):
* La acción bloqueada muestra modal con mensaje claro del límite.
* El modal ofrece botón de Upgrade con link directo al checkout.
* Cloud Functions validan límites server-side antes de ejecutar operaciones.
* Nunca bloquear lectura de datos existentes, solo creación de nuevos.

### 19.3 Colección Firestore: suscripciones
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | string (auto) | ID del documento |
| `tenantId` | string | Tenant asociado |
| `plan` | string | free \| starter \| professional \| enterprise |
| `estado` | string | active \| trial \| past_due \| cancelled |
| `pasarelaId` | string | ID de la suscripción en Mercado Pago/Stripe |
| `metodoPago` | map | `{tipo, ultimos4, marca}` |
| `montoMensual` | number | Monto en USD |
| `fechaInicio` | timestamp | Inicio del periodo actual |
| `fechaRenovacion` | timestamp | Próxima fecha de cobro |
| `historialPagos` | array | `[{fecha, monto, estado, pasarelaRef}]` |
| `createdAt` | timestamp | Fecha de creación |


## 20. Templates de Emails y PDFs

### 20.1 Emails Transaccionales
Todos los emails se envían via Firebase Extension Trigger Email con SendGrid. Cada email usa el branding del tenant (logo + colores).

| Template | Trigger | Destinatario | Contenido |
| :--- | :--- | :--- | :--- |
| Bienvenida | Registro exitoso | Admin del tenant | Datos de acceso, link al dashboard, guía inicio rápido |
| Cotización enviada | Estado → enviada | Cliente | PDF adjunto, link al portal, botón aprobar/rechazar |
| Contrato para firma | Envío de firma | Cliente | Resumen del contrato, link de firma pública, expiración |
| Contrato firmado | Firma completada | Ambas partes | PDF final con firmas, link al portal |
| Factura emitida | Factura creada | Cliente | PDF adjunto, monto, vencimiento, link de pago si hay pasarela |
| Recordatorio pago | 3 días antes vencimiento | Cliente | Monto pendiente, fecha límite, link de pago |
| Factura vencida | Día posterior a vencimiento | Cliente + Admin | Monto vencido, días de mora, link al portal |
| Magic link portal | Solicitud de acceso | Cliente | Link temporal válido 24h, branding del tenant |
| Resumen semanal | Lunes 09:00 scheduled | Admin del tenant | KPIs de la semana, tareas pendientes, alertas |
| Nuevo usuario invitado | Admin invita usuario | Nuevo usuario | Link de activación, rol asignado, datos de acceso |


### 20.2 Templates HTML para PDFs
Los PDFs se generan server-side con Puppeteer en Cloud Functions. Cada template es un archivo HTML con Handlebars para variables dinámicas.

| Template | Variables Clave | Elementos |
| :--- | :--- | :--- |
| `cotizacion.html` | tenant (logo, colores, datos fiscales), cliente, items[], totales, condiciones, correlativo | Header con logo, tabla de ítems responsiva, pie con condiciones, número correlativo |
| `contrato.html` | tenant, cliente, items[], clausulas[], firmaRepresentante, firmaCliente, correlativo | Encabezado, cláusulas numeradas, tabla de servicios, zona de firmas con fecha/nombre |
| `factura.html` | tenant, cliente, items[], totales, cuotas[], pagos[], correlativo | Header fiscal, detalle de ítems, estado de pagos, pie con condiciones de pago |
| `reporte-rentabilidad.html` | proyecto, equipo[], registrosTiempo[], metricas | KPIs, tabla de horas por persona, gráfico de rentabilidad, comparativo |

Ubicación de templates: `functions/src/templates/*.html`
El servicio `generarPdf` recibe el nombre del template + data, renderiza con Handlebars, genera PDF con Puppeteer (formato carta, márgenes 2cm), y retorna URL de Cloud Storage.

## 21. Búsqueda Global

El `SearchService` implementa búsqueda unificada across todas las colecciones del tenant.

### 21.1 Arquitectura
Dado que Firestore no soporta full-text search nativo, se implementa con un enfoque híbrido:

1. **Búsqueda client-side rápida**: Para colecciones pequeñas (< 500 docs por tenant), se mantiene un cache local y se busca con Fuse.js (fuzzy search).
2. **Keywords array en Firestore**: Cada documento tiene un campo `searchKeywords: array<string>` generado al crear/actualizar, con tokens del nombre, email, código, etc. Se usa `array-contains` para queries.
3. **Upgrade futuro**: Si un tenant supera 10,000 docs, migrar a Algolia o Typesense via Cloud Function sync.

### 21.2 Colecciones buscables
| Colección | Campos indexados | Display |
| :--- | :--- | :--- |
| `clientes` | nombreEmpresa, rut, contactoPrincipal.nombre, contactoPrincipal.email | Nombre empresa + contacto |
| `cotizaciones` | codigoFormateado, titulo, cliente.nombre | COT-XXX + título |
| `contratos` | codigoFormateado, titulo, cliente.nombre | CONT-XXX + título |
| `facturas` | codigoFormateado, cliente.nombre | FACT-XXX + cliente |
| `proyectos` | nombre, cliente.nombre | Nombre proyecto |

El campo `searchKeywords` se genera automáticamente en Cloud Functions trigger onCreate/onUpdate para cada colección buscable. Ejemplo para un cliente 'Empresa ABC SpA': keywords = `['empresa', 'abc', 'spa', 'empresa abc', 'empresa abc spa']`

## 22. Gestión de Archivos

### 22.1 Estructura en Cloud Storage
```text
/tenants/{tenantId}/
  ├── branding/
  │   └── logo.png
  ├── firmas/
  │   ├── representante_{contratoId}.png
  │   └── cliente_{contratoId}.png
  ├── pdfs/
  │   ├── cotizaciones/COT-001.pdf
  │   ├── contratos/CONT-001.pdf
  │   └── facturas/FACT-001.pdf
  ├── proyectos/{proyectoId}/
  │   ├── entregables/
  │   └── documentos/
  ├── comprobantes/
  │   └── pago_{facturaId}_{fecha}.jpg
  └── portal/
      └── compartidos/{clienteId}/
```

### 22.2 FileUploadService
* Upload con progress tracking (`Observable<number>` de 0-100%).
* Validación client-side: tipos permitidos (pdf, jpg, png, doc, xls), tamaño máximo 10MB.
* Compresión automática de imágenes > 2MB con canvas API antes de subir.
* Nombre de archivo sanitizado: eliminar caracteres especiales, agregar timestamp.
* Al completar upload, retorna la downloadURL para vincular al documento Firestore.
* Componente `FileUploaderComponent` con drag-and-drop zone + preview de archivos.

## 23. Módulo de Configuración del Tenant

Vista organizada en tabs accesible desde Configuración en el sidebar. Solo visible para admin+ roles.

| Tab | Contenido | Rol Mínimo |
| :--- | :--- | :--- |
| Empresa | Razón social, RUT, giro, dirección, teléfono, email, sitio web | admin |
| Branding | Logo (upload), color primario (color picker), color secundario, preview en tiempo real | admin |
| Facturación | Moneda por defecto, tasa de impuesto, condiciones de pago por defecto, numeración correlativa | admin |
| Equipo | Lista de usuarios del tenant, invitar nuevo usuario, cambiar roles, desactivar usuario, costo/tarifa hora | super-admin |
| Pipeline | Personalizar etapas del pipeline de ventas: nombre, color, orden. Agregar/quitar etapas | admin |
| Plantillas | Cláusulas contractuales por defecto, condiciones de cotización, pie de factura | admin |
| Notificaciones | Configurar qué eventos envían email, frecuencia de resumenes, destinatarios | admin |
| Plan | Plan actual, uso vs límites, historial de pagos, botón upgrade/downgrade | super-admin |
| Integraciones | Conexión con Google Calendar, configuración de WhatsApp (futuro) | super-admin |
| Datos | Exportar todos los datos (CSV/JSON), importar clientes desde CSV | super-admin |


## 24. Manejo de Multi-Moneda

El sistema soporta CLP, UF y USD. Cada tenant configura su moneda por defecto, pero cada cotización/contrato/factura puede usar una moneda diferente.

### 24.1 Reglas de conversión
* La UF se obtiene diariamente del SII (Servicio de Impuestos Internos de Chile) via Cloud Function scheduled.
* USD/CLP se obtiene de una API gratuita (exchangerate-api.com o similar).
* Los valores se almacenan SIEMPRE en la moneda original del documento. La conversión es solo para visualización en dashboard y reportes.
* Se guarda el tipo de cambio del día de creación del documento para referencia.

### 24.2 Colección: tiposCambio
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `fecha` | string (YYYY-MM-DD) | Fecha del tipo de cambio (document ID) |
| `uf_clp` | number | Valor de 1 UF en CLP |
| `usd_clp` | number | Valor de 1 USD en CLP |
| `updatedAt` | timestamp | Fecha de actualización |


### 24.3 CurrencyFormatPipe
Pipe personalizado que formatea según moneda:
* CLP: `$1.234.567` (sin decimales, separador de miles con punto)
* UF: `45,3 UF` (1 decimal, separador decimal con coma)
* USD: `US$1,234.56` (2 decimales, formato americano)

## 25. Estrategia de Testing

| Nivel | Herramienta | Cobertura Mínima | Qué Testear |
| :--- | :--- | :--- | :--- |
| Unit Tests | Jest + Angular Testing Utilities | 80% servicios core | AuthService, TenantService, cálculos de totales, validadores de RUT, pipes |
| Component Tests | Jest + Angular TestBed | 60% componentes críticos | Formularios de cotización, tabla de datos, KPI cards, pipeline kanban |
| Integration Tests | Firebase Emulators + Jest | Flujos críticos | Registro → Custom Claims, crear cotización → correlativo, firma → estado |
| E2E Tests | Playwright | Happy paths | Login → crear cotización → enviar → firmar contrato → crear factura |
| Security Rules Tests | Firebase Emulators + @firebase/rules-unit-testing | 100% reglas | Cada regla de lectura/escritura/delete con y sin permisos |


### 25.1 Firebase Emulators
Obligatorio para desarrollo local. Configurar emuladores de: Auth, Firestore, Storage, Functions. El comando `npm run dev` debe levantar Angular + todos los emuladores automáticamente.

## 26. Pipeline CI/CD

### 26.1 GitHub Actions Workflow
Archivo: `.github/workflows/deploy.yml`

* **Push a branch feature/*:** Lint + Unit Tests + Build.
* **Pull Request a develop:** Lint + Unit Tests + Integration Tests + Build + Deploy a preview channel (Firebase Hosting preview).
* **Merge a develop:** Deploy automático a ambiente staging.
* **Merge a main:** Deploy automático a producción (Firebase Hosting + Cloud Functions).

### 26.2 Convenciones de Código
* **Commits:** Conventional Commits: `feat(cotizaciones): add PDF generation`
* **Branches:** `feature/modulo-nombre`, `fix/modulo-bug`, `hotfix/descripcion`
* **PRs:** Template obligatorio: descripción, screenshots, checklist de testing
* **Code Review:** Al menos 1 aprobación requerida antes de merge
* **Linting:** ESLint + Prettier con config compartida. Pre-commit hook con Husky

## 27. Audit Logging

Registro inmutable de acciones sensibles para seguridad y compliance. Colección raíz `auditLog`.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | string (auto) | ID único |
| `tenantId` | string | Tenant del evento |
| `usuarioId` | string | UID del actor |
| `usuarioEmail` | string | Email (denormalizado) |
| `accion` | string | create \| update \| delete \| login \| export \| firma \| cambio_estado |
| `entidad` | string | cotizacion \| contrato \| factura \| usuario \| tenant \| config |
| `entidadId` | string | ID del recurso afectado |
| `detalles` | map | Datos específicos del cambio (before/after parcial) |
| `ip` | string | IP del request (obtenida en Cloud Function) |
| `timestamp` | timestamp | Fecha exacta del evento |

### 27.1 Eventos que generan audit log
* Login exitoso y fallido
* Creación, modificación y eliminación de usuarios
* Cambios de rol o permisos
* Cambios de plan/suscripción
* Firma de contratos (interna y externa, con IP)
* Cambios de estado en cotizaciones, contratos y facturas
* Registro y anulación de pagos
* Exportación masiva de datos
* Cambios en configuración del tenant

Los audit logs solo son legibles por super-admin y platform-admin. No se pueden eliminar ni modificar (enforced en Security Rules).

## 28. Accesibilidad e Internacionalización

### 28.1 Accesibilidad (a11y)
* WCAG 2.1 nivel AA como objetivo mínimo.
* Todos los formularios con labels explícitos y `aria-describedby` para errores.
* Navegación completa por teclado: Tab, Enter, Escape, flechas en Kanban.
* Contraste mínimo 4.5:1 para texto normal, 3:1 para texto grande.
* Alt text en todas las imágenes. `aria-live` regions para toasts y cambios dinámicos.
* Focus visible (outline) nunca eliminado, solo estilizado.
* Skip navigation link oculto que aparece con Tab.

### 28.2 Internacionalización (i18n)
* Idioma inicial: español (`es-CL`). Preparado para inglés (`en`) en fase posterior.
* Usar Angular i18n built-in o `@ngx-translate/core`.
* Todos los strings visibles al usuario deben estar en archivos de traducción, no hardcoded.
* Formato de fechas y números según locale (date-fns con locale es).
* El campo `config.idioma` del usuario determina el idioma de la interfaz.

## 29. Importación y Exportación de Datos

### 29.1 Importación
| Dato | Formato | Mapeo | Validación |
| :--- | :--- | :--- | :--- |
| Clientes | CSV | nombreEmpresa, rut, contacto, email, telefono | RUT válido, email válido, sin duplicados por RUT |
| Catálogo servicios | CSV | nombre, descripcion, categoria, precioBase, unidad | Precio numérico, unidad válida |
| Cartola bancaria | CSV / OFX | fecha, monto, referencia, descripcion | Fecha válida, monto numérico |

Flujo: Upload CSV → Preview de datos mapeados → Mostrar errores de validación → Confirmar importación → Cloud Function procesa en batch (máx 500 docs por batch write).

### 29.2 Exportación
* Cada tabla/listado tiene botón de exportar a CSV.
* Exportación completa del tenant (super-admin): todos los datos en JSON, descargable como ZIP.
* Reportes financieros: exportar a PDF o Excel via Cloud Function.
* Cumplimiento GDPR: capacidad de exportar y eliminar todos los datos de un cliente.

## 30. Hoja de Ruta Revisada (Sprints Detallados)

Plan actualizado que incorpora todas las brechas identificadas. 12 sprints de 2 semanas = 24 semanas (6 meses).

### Sprint 1 — Setup, Auth y Multi-Tenancy (Sem 1-2) **[IMPLEMENTADO]**
**Entregable:** usuario puede registrarse, hacer login y ver dashboard vacío.
* Crear proyecto Angular 19 + Tailwind 4 + @angular/fire. Configurar environments.
* Configurar Firebase: Auth, Firestore, Storage, Functions Gen 2, Emulators.
* Definir todas las interfaces TypeScript (`core/interfaces/*.ts`).
* Definir enums y constantes (`core/models/enums.ts`, `constants.ts`).
* LoginComponent con email/password y Google SSO.
* RegisterComponent: formulario 2 pasos con validación de RUT.
* ForgotPasswordComponent.
* Cloud Function onUserCreated: crear tenant + user + Custom Claims (transacción atómica).
* AuthGuard, RoleGuard, PlanGuard.
* AuthService completo con refresh de token y Claims.
* Firestore Security Rules completas (Sección 15).
* Storage Security Rules.
* OnboardingWizardComponent (logo, colores, moneda, impuesto).
* TenantService con `applyBranding()`.
* Error Interceptor global.
* Configurar CI: GitHub Actions lint + test + build.

### Sprint 2 — Layout, Dashboard y Shared Components (Sem 3-4) **[IMPLEMENTADO]**
**Entregable:** app shell completa con dashboard, componentes compartidos listos.
* Sidebar colapsable con íconos Lucide y secciones agrupadas.
* Navbar: logo tenant, búsqueda global (UI sin lógica aún), timer placeholder, notificaciones, avatar.
* BottomNavComponent para móvil.
* Shared components: DataTable, StatCard, Badge, ConfirmDialog, EmptyState, SkeletonLoader, SearchInput, Pagination, FileUploader.
* Shared pipes: CurrencyFormat, RutFormat, RelativeTime.
* Shared directives: RoleVisible, ClickOutside.
* Shared validators: RUT, Email.
* NotificationService (toasts con ngx-toastr).
* DashboardComponent con 6 KPI cards (mockeados).
* Cloud Function `onActividadCreated`: recalcular lead score.
* Cloud Function para generar `searchKeywords` en clientes.
* Importación de clientes desde CSV (upload + preview + confirm).

### Sprint 4 — Catálogo y Cotizaciones (Sem 7-8)
**Entregable:** Catálogo de Productos y Servicios **[IMPLEMENTADO]**, y flujo completo de cotizaciones con PDF.
* CatalogoService + CRUD completo unificando productos y servicios bajo `CatalogoItem` con `tenantId` base.
* Componentes funcionales: `catalogo-list.component` interactivo y reactivo con DataTable.
* Componente `catalogo-form.component` unificando creación mediante ReactiveForms.
* CotizacionesService con CRUD + lógica de estados.
* CotizacionFormComponent: selección cliente (autocomplete), ítems dinámicos desde catálogo, cálculos en tiempo real.
* Cloud Function `generarCorrelativo`: transacción atómica con `FieldValue.increment`.
* CotizacionDetalleComponent con preview estilo PDF.
* Flujo de estados con `historialEstados` y validaciones de transición.
* Template HTML `cotizacion.html` en `functions/src/templates/`.
* Cloud Function `generarPdf` con Puppeteer.
* Cloud Function `onCotizacionUpdated`: si estado=enviada → generar PDF + enviar email.
* Template de email `cotizacion-enviada`.
* Cloud Function scheduled `verificarCotizacionesExpiradas`.

### Sprint 5 — Contratos y Firma Digital (Sem 9-10)
**Entregable:** flujo completo de contrato con firma digital interna y pública.
* ContratosService con CRUD + conversión desde cotización.
* Cloud Function `convertirACotizacion`: transacción atómica.
* Editor de cláusulas contractuales.
* SignaturePadComponent compartido (`shared/components/signature-pad/`).
* Firma interna del representante: canvas → PNG → Cloud Storage.
* Cloud Function `enviarContratoFirma`: generar token UUID v4, email con link.
* Módulo firma-publica: ruta Angular sin AuthGuard, lazy-loaded.
* FirmaPublicaComponent: mobile-first, responsive, touch-enabled canvas.
* Cloud Function `validarFirmaCliente`: validar token, guardar firma, registrar IP/timestamp.
* Colección `contratos_publicos` para datos públicos del contrato (sin info sensible).
* Template `contrato.html` + generación PDF final con ambas firmas.
* Email de confirmación a ambas partes.
* Cloud Function `limpiarTokensExpirados` (scheduled).
* Audit log para firma de contratos.

### Sprint 6 — Facturación y Pagos (Sem 11-12)
**Entregable:** sistema de facturación con pagos parciales y cuotas.
* FacturasService con CRUD + generación desde contrato.
* FacturaFormComponent: manual o desde contrato, cuotas programadas.
* FacturaDetalleComponent: datos, pagos, registrar pago, enviar recordatorio.
* PagosService: registrar pago con comprobante (upload).
* Cloud Function `onPagoRegistrado`: actualizar factura + crear movimiento financiero.
* Template `factura.html` + PDF generation.
* Cloud Function `verificarFacturasVencidas` (scheduled).
* Cloud Function `recordatorioFacturasPorVencer` (scheduled).
* Email templates: factura emitida, recordatorio, vencida.
* Audit log para pagos.

### Sprint 7 — Finanzas (Sem 13-14)
**Entregable:** dashboard financiero, movimientos, conciliación básica.
* FlujoCajaComponent: proyección 90 días, aging 30/60/90 días.
* MovimientosService + CRUD de ingresos/egresos manuales.
* ConciliacionComponent: importar CSV de cartola, matching automático.
* Gráfico ingresos vs egresos mensual (chart.js).
* Multi-moneda: Cloud Function para obtener UF diaria del SII.
* CurrencyFormatPipe con soporte CLP/UF/USD.
* Colección `tiposCambio` con scheduled update.
* Exportación de reportes financieros a CSV/PDF.

### Sprint 8 — Timetracking y Rentabilidad (Sem 15-16)
**Entregable:** timer funcional, registros de horas, reportes de rentabilidad.
* TimerService singleton + TimerComponent en navbar.
* RegistrosTiempoService con CRUD.
* RegistroManualComponent para entrada manual de horas.
* Vista semanal/mensual tipo calendario.
* Cloud Function `onRegistroTiempoCreated`: calcular costos, actualizar tarea/proyecto.
* ReporteRentabilidadComponent por proyecto.
* ReporteEquipoComponent: carga vs capacidad.
* Alerta automática si proyecto supera 80% presupuesto.
* Cloud Function `resumenSemanalEquipo` (scheduled).

### Sprint 9 — Proyectos, Tareas y Archivos (Sem 17-18)
**Entregable:** gestión completa de proyectos con Kanban y archivos.
* ProyectosService + CRUD con creación desde contrato.
* ProyectoDetalleComponent: overview, Kanban, timeline, archivos.
* KanbanBoardComponent con drag-and-drop.
* TareasService con CRUD y ordenamiento.
* Subtareas dentro de cada tarea.
* Gestión de archivos por proyecto (upload/download/preview).
* FileUploadService completo con progress tracking.
* Cálculo automático de progreso del proyecto.

### Sprint 10 — Portal del Cliente (Sem 19-20)
**Entregable:** portal externo funcional para clientes.
* Módulo portal-cliente lazy-loaded con su propio layout.
* Sistema de magic link via Cloud Function + email.
* PortalAuthGuard: valida token temporal.
* Vistas: Mis Cotizaciones, Mis Contratos, Mis Facturas, Mis Proyectos.
* Aprobación/rechazo de cotizaciones con comentario.
* Firma de contratos integrada en el portal.
* Documentos compartidos: upload/download bidireccional.
* Mensajería simple (nueva colección `mensajesPortal`).
* Branding dinámico del tenant (logo + colores).
* 100% responsive mobile-first.

### Sprint 11 — Asistente IA y Búsqueda Global (Sem 21-22)
**Entregable:** chat IA funcional y búsqueda global **[IMPLEMENTADO]**.
* AsistenteIAComponent: interfaz de chat tipo ChatGPT, accesible globalmente desde el Layout.
* Búsqueda Global (Cmd+K) con pre-fetching (searchResults en memoria) para clientes, proyectos y facturas.
* Cloud Function `askSubeIA`: consulta contexto del tenant + proxy a Gemini 1.5/2.0 Flash.
* Integración segura de credenciales vía Google Cloud Secret Manager (`GEMINI_API_KEY`).
* System prompts especializados para cada tipo de análisis (Gestión B2B).
* Historial de conversaciones almacenado en UI (por sesión).
* Auth context inyectado para multi-tenancy seguro.

### Sprint 12 — Admin SaaS, Billing, Polish y Deploy (Sem 23-24)
**Entregable:** plataforma SaaS lista para producción **[IMPLEMENTADO]**.
* Sistema Multi-Tenant: Aprovisionamiento automático mediante `RegisterAgencyComponent` y Cloud Function `registerAgency`.
* Asignación de Claim Seguro: `role: 'admin'` y `tenantId` inyectados en el token JWT durante el registro automatizado.
* Módulo SuperAdmin (God Mode): Dashboards cruzados globales (`SuperAdminDashboardComponent`) con RBAC estricto (`SuperAdminGuard` buscando `role: 'superadmin'`).
* Herramienta CLI local (`setSuperAdmin.js`) para asignación de rol propietario.
* Security Rules escaladas para FireStore: lecturas/escrituras aisladas por tenant, y privilegios globales para superadministradores.
* Controles de Tenant Activo/Suspendido con propagación automática.
* Despliegue en Firebase Hosting & Functions completados exitosamente.

## 31. Naming y Branding del Producto

### 31.1 Nombre oficial
El software se llama **Estratega Sube IA**. Se usa siempre en este formato:
* **Logo:** `ESTRATEGA` (línea 1, bold) + `SUBE IA` (línea 2, color accent)
* **URL propuesta:** `app.estratega.subeia.tech`
* **Nombre corto para UI:** Estratega
* **En código:** `estratega-sube-ia` (kebab-case para proyecto y repositorio)

### 31.2 Colores de marca del producto
| Token | Hex | Uso |
| :--- | :--- | :--- |
| `--brand-primary` | `#0F4C81` | Sidebar, headers, botones principales, links |
| `--brand-accent` | `#E8740C` | CTAs destacados, badges importantes, hover states |
| `--brand-dark` | `#0D1B2A` | Texto principal, fondos oscuros |
| `--brand-success` | `#0D9F6E` | Estados positivos, pagado, completado, aprobado |
| `--brand-warning` | `#D97706` | Alertas, pendiente, en revisión |
| `--brand-error` | `#DC2626` | Errores, rechazado, vencido, cancelado |
| `--brand-surface` | `#F8FAFC` | Fondo general de la app |

> **Recordar:** estos son los colores del producto Estratega Sube IA. Cada tenant configura sus propios colores de branding que se aplican en sus documentos (PDFs, portal del cliente) via CSS variables dinámicas.

---

## 32. Seguridad y Arquitectura SaaS Multi-Escala

Para soportar de manera resiliente el contexto SaaS B2B "God Mode", hemos adoptado una topología ultra-rígida:

* **Custom Claims (JWT)**: Todo el peso de la seguridad descansará en Firebase Auth con dos custom claims inyectados backend-side (`tenantId` y `role`). El cliente no puede falsificar un role.
* **GCP Secret Manager**: Para la incrustación de Kyes de IA (ej: `GEMINI_API_KEY`), se abolieron las Environment Variables inyectadas expuestas, canalizando las directivas vía secret management.
* **Firestore Security Rules**: Todas las colecciones base están capadas condicionalmente a `request.auth.token.tenantId == resource.data.tenantId`. Salvo para los Super Admins (`role == 'superadmin'`) quienes pueden hacer queries cross-tenant para las métricas del Dashboard Global.
* **Firebase App Check con reCAPTCHA Enterprise**: Activación recomendada para bloquear tráfico no-Angular a las APIs (Funciones Callable) de Sube IA y registro de Agencias, mitigando el abuso robótico en formularios públicos.

---

## 33. Visión Evolutiva: IA Estratégica & ESG Sostenibilidad (V4)

La fase 2 del producto (post-MVP) pivota a la proposición de **Sube Estratega como un Ecosistema Operativo Proactivo** (Ver detalles completos en `ESTRATEGIA_FUTURO_SAAS.md`).

Los focos arquitectónicos de esta futura evolución son:
1. **Modelos Predictivos Financieros (AI)**: Dunning automático (emailing dinámico según morosidad) y AI Lead Scoring inyectados en la canalización del CRM.
2. **Control por Voz AI (Voz a CRM)**: Integraciones de audio transcrito por Whisper/Gemini Flash redirigido como CRUD automatizado en Tareas, Notas y Lead Status.
3. **Módulo Inteligente de Sostenibilidad Corporativa (ESG)**: 
   * Cálculos algorítmicos normados (GHG Protocol) sobre la huella de Carbono del Tenant SaaS.
   * Paneles "Sello Verde Sube" para que las Agencias generen y expongan un "ESG Compliance PDF" automatizado con Gemini a sus prospectos en las propuestas comerciales del portal (apuntando a diferenciación para mercado B2B maduro o licitaciones).
