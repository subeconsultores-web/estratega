# Plan de Evolución: Estratega Sube IA V4.0+

Este documento contiene el plan de trabajo hiper-detallado para la evolución de Estratega Sube IA hacia un Ecosistema Operativo Inteligente. Cada épica está dividida en tareas accionables y controlables.

---

## Pilar 1: Automatización Autónoma (AI Action)

### 1.1 Motor de Flujos de Trabajo Visual (Hyper-Automation Builder)
- [ ] **Diseño Arquitectónico:**
  - [ ] Diseñar esquema de datos en Firestore para `workflows` (nodos, aristas, triggers, actions).
  - [ ] Seleccionar librería de UI de nodos para Angular (ej. `rete.js` o `ngx-graph`).
- [ ] **Backend (Cloud Functions):**
  - [ ] Crear Cloud Task Queue para garantizar ejecución garantizada de flujos largos.
  - [ ] Implementar motor evaluador de flujos (parser de JSON a ejecución de funciones).
  - [ ] Desarrollar acciones base: Crear Proyecto, Actualizar Cliente, Enviar Email, Llamada HTTP (Webhook).
- [ ] **Frontend (Angular):**
  - [ ] Crear módulo `automation-builder`.
  - [ ] Implementar Canvas de edición drag-and-drop.
  - [ ] Crear panel de configuración de parámetros por cada nodo (Trigger / Action).
- [ ] **Integración de IA en Flujos:**
  - [ ] Crear nodo de acción "Decisión IA" (Gemini).
  - [ ] Implementar parsing de salida de Gemini para dirigir el flujo (ej. bifurcaciones if/else basadas en sentiment).

### 1.2 Meeting Copilot (Agente de Reuniones)
- [ ] **Integración de Audio/Video:**
  - [ ] Implementar UI para subida de transcripciones (texto) o archivos de audio (MP3/WAV).
  - [ ] Investigar/Configurar Google Cloud Speech-to-Text (si se sube audio crudo).
- [ ] **Procesamiento con IA:**
  - [ ] Crear Cloud Function `analyzeMeeting` que use Gemini 2.0 Flash / Pro para extraer: Action Items, Sentiment, Resumen.
  - [ ] Implementar prompt engineering para generar "Cotización Sugerida" desde el transcript.
- [ ] **Frontend (Angular):**
  - [ ] Crear vista "Meeting Insights" dentro del detalle del Cliente.
  - [ ] Componente para aceptar/rechazar Tareas generadas automáticamente y agregarlas al Kanban del proyecto.

### 1.3 Smart Dunning Autónomo con Negociación (Collections AI)
- [ ] **Lógica de Disparo:**
  - [ ] Configurar CRON Job diario para detectar facturas vencidas (30, 60, 90 días).
- [ ] **Interacción Omnicanal:**
  - [ ] Implementar webhook para recibir respuestas limitadas de emails vía SendGrid.
- [ ] **Agente Negociador:**
  - [ ] Desarrollar Cloud Function `handleDunningResponse` que llame a Gemini para analizar la respuesta del cliente.
  - [ ] Crear lógica para permitir que Gemini sugiera fraccionamiento de pago si está pre-autorizado por las reglas del Tenant.
  - [ ] Generación y envío automático de nuevo link de pago de Stripe.

---

## Pilar 2: Inteligencia Financiera y Operativa (Predictividad)

### 2.1 Predictor Dinámico de Flujo de Caja
- [ ] **Análisis de Datos Históricos:**
  - [ ] Crear Cloud Function scheduled que semanalmente analice el `DiasPromedioPago` por cada `clienteId`.
  - [ ] Guardar el comportamiento de pago en el registro del cliente en Firestore.
- [ ] **Visualización predictiva:**
  - [ ] Actualizar `FlujoCajaComponent` en Angular.
  - [ ] Reemplazar la proyección plana (basada en `fechaVencimiento`) por proyección dinámica (`fechaVencimiento + DiasPromedioPago`).
  - [ ] Implementar alertas visuales (Rojo/Amarillo/Verde) para semanas con posible déficit proyectado.

### 2.2 Gestión Dinámica de Precios (Yield Management)
- [ ] **Cálculo de Capacidad:**
  - [ ] Desarrollar lógica para calcular % de ocupación del equipo basado en `tareas` activas y `horasEstimadas` de las próximas 4 semanas.
- [ ] **Motor de Recomendación:**
  - [ ] Implementar endpoint en Cloud Functions que al solicitar una nueva "Cotización Sugerida" evalúe la capacidad.
  - [ ] Si capacidad > 85%, sugerir aplicar recargo (Premium/Rush).
  - [ ] Si capacidad < 50%, sugerir campaña de reactivación a clientes pasados con descuento.

### 2.3 Smart Capacity Planning
- [ ] **Matriz de Skills:**
  - [ ] Actualizar modelo `users` para incluir array de `skills` (ej. Angular, Firebase, Diseño UX).
- [ ] **Algoritmo de Asignación IA:**
  - [ ] Crear botón "Autocompletar Equipo" al planificar un Proyecto.
  - [ ] Cloud Function que cruza `skills` requeridas del proyecto, `horasReales/Estimadas` históricas del usuario, y carga actual, para devolver el escuadrón ideal.

---

## Pilar 3: Hiper-Colaboración Omnicanal

### 3.1 Bandeja de Entrada Unificada (Omnichannel Hub)
- [ ] **Integraciones Externas:**
  - [ ] Configurar App en Meta Developers para API de WhatsApp Business.
  - [ ] Crear webhooks centralizados en Firebase para recibir mensajes entrantes de WhatsApp.
- [ ] **CRM Sync:**
  - [ ] Asociar números de teléfono entrantes con `clientes` o `contactos` existentes en Firestore.
- [ ] **UI de Bandeja (Angular):**
  - [ ] Desarrollar componente `ChatInboxComponent` estilo WhatsApp Web / Intercom.
  - [ ] Añadir botón "IA Suggested Reply" (Gemini lee el historial del chat y el proyecto del cliente y redacta una respuesta contextual).

### 3.2 Portal del Cliente Colaborativo
- [ ] **Documentos Colaborativos:**
  - [ ] Investigar implementación de Yjs + TipTap para editor de texto colaborativo en tiempo real.
  - [ ] Integrar el editor en el Portal del Cliente (para comentar cotizaciones/entregables).
- [ ] **AI FAQ Específico por Cliente:**
  - [ ] Indexar documentos y comunicaciones del cliente en una base de datos vectorial (Pinecone / Vertex).
  - [ ] Añadir widget de Chat en el Portal del Cliente, donde el "Agente del Proyecto" responde dudas basadas *solo* en los archivos de ese proyecto específico.

---

## Pilar 4: Robustez y Seguridad Enterprise

### 4.1 Arquitectura Zero Trust y Passkeys
- [ ] **Autenticación Biométrica:**
  - [ ] Implementar WebAuthn API en Angular para dar soporte a Passkeys (TouchID, FaceID, Windows Hello).
  - [ ] Actualizar Firebase Auth para soportar linkeo de credenciales FIDO2.
- [ ] **Seguridad Contextual:**
  - [ ] Guardar metadata (IP aproximada, User-Agent) en inicio de sesión.
  - [ ] Cloud function trigger en base de datos `clientes` o `exportaciones`: si el request viene de un contexto "anómalo", bloquear payload y requerir paso 2FA.

### 4.2 Audit Trail Criptográfico
- [ ] **Lógica de Hashing:**
  - [ ] Implementar librería criptográfica simple en backend Node (`crypto`).
- [ ] **Eventos Protegidos:**
  - [ ] Modificar Cloud Functions de `Facturas`, `Contratos` y `Pagos`.
  - [ ] Cada creación o modificación debe generar un hash vinculante: `hash(datos_actuales + hash_del_evento_anterior)`.
  - [ ] Guardar este hash en el doc del evento.
- [ ] **Vista de Cumplimiento:**
  - [ ] Crear módulo en Super Admin para "Verificar Integridad del Ledger", recalculando los hashes y mostrando si hubo alteraciones directas a la base de datos.

### 4.3 Búsqueda Vectorial Híbrida
- [ ] **Sincronización de Base Vectorial:**
  - [ ] Configurar instancia de base vectorial (ej. Pinecone o Vertex AI).
  - [ ] Crear Cloud Function que escuche cambios en Firestore (Entidades text-heavy: Cotizaciones, Notas, Transcripciones) y sincronice los embeddings usando el modelo text-embedding de Google.
- [ ] **Búsqueda Semántica en UI:**
  - [ ] Modificar la barra de búsqueda global del Navbar.
  - [ ] Permitir queries en lenguaje natural (ej. "clientes interesados en marketing verde este año").
  - [ ] Integrar resultados vectoriales con resultados exactos (Firestore direct match).

---

## 📈 Tareas Iniciales (Quick Wins / Sprint 0)
Para no abrumar al equipo de desarrollo, sugerimos estas tareas para esta primera semana:
- [ ] Crear nueva rama de features para el V4 (`feature/v4-evolution`).
- [ ] Priorizar e investigar integración API oficial de WhatsApp Business.
- [ ] Crear la estructura base del módulo Node para el Audit Trail Criptográfico (es backend sin impacto en UI, pero de alto impacto en ventas "Enterprise").
- [ ] Implementar prototipo de "Búsqueda Semántica" en clientes.
