# SUBE GESTIÓN
Software SaaS de Gestión Empresarial

**Documento Técnico de Arquitectura y Especificaciones**  
Versión 2.0 — Multi-Tenant SaaS  
Preparado para: Equipo Antigravity  
Preparado por: SUBE IA Tech  
Fecha: Febrero 2026

---

## Tabla de Contenidos
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

---

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
