Documento técnico funcional — FaktuGo
1. Descripción general del producto

FaktuGo es un ecosistema de aplicaciones (app móvil/tablet + panel web) para digitalizar, clasificar y gestionar facturas y tickets de autónomos y pequeñas empresas.

Características clave (estado actual):

- Captura de facturas y tickets desde la app móvil (cámara) o subida de PDFs/imágenes desde la web.
- Análisis automático de documentos con IA en el backend (OpenAI + parseo de PDFs) para extraer fecha, proveedor, importe, tipo de documento y una categoría/concepto sugeridos.
- Clasificación automática de cada factura en un periodo mensual (YYYY-MM) y agrupación visual por mes o semana en las interfaces web y móvil.
- Creación de un registro único de factura en una base de datos Postgres (Supabase), con metadatos normalizados y ruta al fichero almacenado en el bucket `invoices`.
- Gestión de facturas y metadatos mediante cuenta FaktuGo y conexión a internet (app móvil + panel web).
- Funciones avanzadas basadas en la nube: límites por plan, envío a gestoría, recepción por correo interno, detección de duplicados y exportación ZIP.
- Integración actual con un proveedor de email transaccional (Resend) para:
  - Envío de facturas a gestoría.
  - Recepción de facturas en una dirección interna de FaktuGo (alias dedicado por usuario).
- Panel web para revisar, filtrar y gestionar facturas desde PC, con exportación ZIP y acceso a configuración de cuenta.

2. Filosofía de arquitectura
2.1 Arquitectura general

La app se apoya en servicios en la nube (principalmente Supabase, el backend Next.js de FaktuGo y proveedores externos como OpenAI y Resend) para:

- Autenticación de usuarios (Supabase Auth).
- Procesamiento de documentos e IA (análisis de facturas en el backend usando OpenAI y parseo de PDF).
- Almacenamiento de facturas (bucket `invoices` de Supabase Storage) y metadatos (Postgres).
- Sincronización entre dispositivos (app móvil) y panel web a partir de una única base de datos central.

Se requiere cuenta FaktuGo y conexión a internet para completar el flujo estándar de escaneo, análisis y guardado de facturas.

2.2 Funciones opcionales sobre la nube

La base del servicio es siempre online (cuenta + conexión). Sobre esa base, el usuario decide si:

- Configura el email de su gestoría para poder enviarle facturas directamente desde FaktuGo.
- Activa el correo interno de FaktuGo (alias dedicado) y, opcionalmente, el autoenvío de facturas ingeridas a la gestoría.
- En el futuro, conecta servicios externos de archivos (Drive/Dropbox/OneDrive) cuando esas integraciones estén disponibles.

2.3 Privacidad

Los PDFs/imágenes y sus metadatos se almacenan y procesan en la infraestructura de FaktuGo (Supabase + almacenamiento asociado) de acuerdo con la política de privacidad y el aviso legal del producto.

El usuario puede exportar sus datos (por ejemplo, ZIP de facturas) y eliminar su cuenta, lo que implica también la eliminación de los datos asociados en los sistemas de FaktuGo.

2.4 Plataformas y despliegue sin instalación en PC

Clientes principales:

App móvil/tablet (Android/iOS) distribuida a través de App Store y Google Play.

Panel web responsive accesible desde navegadores modernos (PC, portátil, tablet) y con opción de PWA instalable desde el propio navegador.

Principios:

No se distribuyen ejecutables .exe ni instaladores de escritorio propios para evitar advertencias de SmartScreen y costes de firma de código.

En escritorio, el acceso se realiza siempre vía navegador (URL segura HTTPS) o instalación como PWA, sin necesidad de permisos especiales del sistema operativo.

En móvil/tablet se prioriza una buena experiencia de captura y revisión rápida; los documentos se procesan y almacenan a través de la infraestructura de FaktuGo y, cuando sea necesario, pueden existir copias locales temporales para mejorar la experiencia de usuario.

Arquitectura de referencia (orientativa):

App móvil/tablet: **React Native + Expo** (TypeScript), con soporte para cámara, almacenamiento local de una copia de trabajo y sincronización con Supabase.

Panel web: **Next.js** (React + TypeScript) en modo SPA/PWA, que consume la misma API y permite la gestión desde PC sin instalación.

Backend en la nube: API Routes de Next.js + **Supabase** (Postgres, Auth, Storage) como base de datos y almacenamiento principal, orquestando cuentas, metadatos de facturas, reglas y automatizaciones, además de las integraciones con **OpenAI** (IA de facturas) y **Resend** (email).

3. Roles de usuario

Usuario estándar (autónomo / pyme)

Usa la app móvil.

Accede con su cuenta FaktuGo.

Puede utilizar también el panel web vinculado a esa misma cuenta.

Gestoría

Recibe facturas vía:

Carpeta compartida en Drive.

Email con adjuntos/enlaces.

Opcional: acceso a panel web multi-cliente (futuro).

4. Funcionalidades principales (MVP extendido)
4.1 Escaneo de facturas (app móvil y web)

Entrada:

- App móvil: captura con cámara usando Expo Image Picker.
- Web: subida de uno o varios archivos desde el navegador (imágenes o PDFs).

Procesos actuales:

- En móvil se realiza una captura sencilla (sin editor avanzado de bordes/perspectiva) con compresión básica para reducir tamaño antes del envío.
- La app móvil envía el archivo al backend mediante el endpoint `/api/invoices/upload`, indicando además:
  - `archivalOnly` (solo archivar en FaktuGo, sin marcar como pendiente para gestoría).
  - `sendToGestoria` (intentar enviar por email a la gestoría en el mismo flujo).
  - `uploadSource` (`mobile_upload` o `web_upload`).

Salida:

- Archivo almacenado en el bucket `invoices` de Supabase Storage.
- Registro de factura creado en la tabla `invoices` con metadatos iniciales, origen (`upload_source`) y estado.

4.2 IA y extracción de datos (backend)

Datos a extraer (cuando es posible):

- Fecha de la factura (YYYY-MM-DD).
- Importe total y moneda.
- Nombre del proveedor.
- Concepto/categoría de gasto.
- Número de factura.
- Tipo de documento (factura, ticket, proforma, presupuesto, otros).

Algoritmo real:

- El backend usa la función `analyzeInvoiceFile` (módulo `invoiceAI`) para analizar cada archivo:
  - Si es PDF, se extrae primero el texto con `pdf-parse` y se analiza con OpenAI (modelo gpt‑4o) como texto estructurado.
  - Si es imagen, se envía directamente al modelo de visión de OpenAI (gpt‑4o) junto con un prompt que define el esquema de salida.
- La función `isValidInvoice` verifica que el documento sea una factura/ticket válido y que la confianza del modelo sea suficiente.
- Si el documento no pasa los criterios, se construye un mensaje legible con `getRejectionReason` y **no** se sube a Storage ni se crea registro en `invoices`.

Corrección y edición:

- Los datos devueltos por la IA rellenan los campos iniciales de la factura.
- El usuario puede editar posteriormente fecha, proveedor, categoría y importe tanto desde el panel web como desde la app móvil (pantalla de detalle de factura).

4.3 Clasificación temporal automática

Dos modos configurables:

Mensual

Carpeta: YYYY-MM (ej: 2025-02).

Semanal

Carpeta: YYYY-SWW (ej: 2025-S07, semana ISO).

Origen de fecha:

Preferente: fecha extraída de la factura via OCR.

Fallback: fecha de creación del archivo.

Reglas:

Si una factura con fecha 15/02/2025 se escanea el 03/03/2025:

Se asigna a 2025-02 (o 2025-Sxx correspondiente).

Si la carpeta no existe:

La app la crea automáticamente.

4.4 Estructura de carpetas (modo nube)

Carpeta raíz:

Valor por defecto: /FaktuGo/.

Se puede configurar como:

/FaktuGo/

/NombreComercio/

Ruta personalizada (opción avanzada).

Ejemplo modo mensual:

/FaktuGo/
    /2025-01/
    /2025-02/
    /2025-03/

Ejemplo modo semanal:

/FaktuGo/
    /2025-S01/
    /2025-S02/
    /2025-S03/

Formato de archivo por defecto:
YYYY-MM-DD_Proveedor_Importe.pdf
Ejemplo: 2025-02-14_REPSOL_45,60EUR.pdf.

4.5 Funcionamiento por defecto (con cuenta FaktuGo y servicios en la nube)

La app:

- Escanea la factura o ticket desde el móvil.
- Envía el documento y los datos necesarios al backend de FaktuGo para su análisis.
- Extrae y guarda metadatos (fecha, importe, proveedor, estado) en la base de datos en la nube.
- Clasifica la factura en el periodo correcto (mes/semana) y la hace visible en el panel y en la app.

Requiere:

- Registro y autenticación del usuario.
- Conexión a internet para completar el flujo de guardado y sincronización.

5. Cuenta, autenticación y funciones avanzadas

La cuenta FaktuGo es obligatoria para usar la app móvil y el panel web. En esta sección se detalla cómo funciona la autenticación y qué funciones adicionales dependen del perfil y del plan.

5.1 Cuenta y autenticación

Registro (estado actual):

- Email + contraseña usando Supabase Auth (misma cuenta en móvil y web).
- En la app móvil se solicitan además nombre, apellidos, tipo de cuenta (autónomo/empresa), nombre comercial/empresa opcional y país opcional.

Autenticación:

- Gestión de sesión vía Supabase Auth; internamente se usan tokens JWT mantenidos por el SDK oficial.

Datos de cuenta y CRM (mínimos necesarios):

Datos de identificación:

Email (obligatorio, login y comunicaciones operativas).

Nombre y, opcionalmente, nombre comercial.

Tipo de cliente (autónomo, pyme, gestoría).

País / región (para aspectos fiscales y legales).

Datos opcionales de negocio:

NIF/CIF y datos de facturación si se emiten facturas al cliente.

Sector y tamaño aproximado (rangos de número de empleados o volumen de facturas).

Datos de uso (CRM ligero, sin leer contenido de facturas):

Plan contratado, fecha de alta, última actividad.

Número de facturas procesadas por periodo e integraciones activas.

Principios de protección de datos:

Minimización: solo se piden datos necesarios para prestar el servicio y mejorar el producto.

Transparencia: textos claros en el alta explicando qué se guarda y con qué finalidad.

Opciones de baja de comunicaciones comerciales y eliminación de cuenta/datos desde la app/panel.

5.2 Sincronización multi-dispositivo

Sincroniza:

Metadatos (ID, fecha, proveedor, importe, categoría, ruta lógica de periodo, flags, estado de envío a gestoría, etc.).

Documentos asociados a cada factura mediante la ruta en el bucket `invoices` de Supabase Storage.

Notas:

- La app móvil puede mantener una copia local del fichero en su carpeta privada (sandbox) para acceso más rápido, pero la copia canónica vive en Supabase Storage.
- El acceso al fichero desde web y móvil se hace mediante URLs firmadas de corta duración generadas por el backend.

Dispositivos:

Móvil Web Tablet (vía navegador o PWA).

Resolución de conflictos:

Actualmente se asume que la última edición guardada en la base de datos es la que prevalece (estrategia "última modificación gana").

5.3 Panel web

Funcionalidades:

Listado de facturas (metadatos + enlace a archivo).

Filtros:

Fecha [rango].

Proveedor.

Importe.

Categoría.

Estado (enviada / no enviada).

Acciones:

Descargar.

Reenviar por email.

Exportar ZIP por periodo.

Editar campos (fecha, proveedor, categoría).

Panel de estadísticas simple:

Total por mes.

Total por categoría.

Top proveedores.

6. Integraciones con otros servicios
6.1 Proveedor de email (Resend) — estado actual

Proveedor principal: **Resend**.

Usos:

- Envío de facturas a gestoría desde:
  - Subida manual (web o móvil) cuando el usuario marca `sendToGestoria`.
  - Envío manual desde el detalle de factura (endpoint `/api/gestoria/send`).
  - Autoenvío de facturas ingeridas por correo si el usuario tiene activado el flag `auto_send_ingested_to_gestoria`.
- Recepción de facturas por correo interno FaktuGo:
  - Cada usuario puede generar un alias tipo `loquesea@subdominio.faktugo...`.
  - Resend reenvía eventos de email entrante al endpoint `/api/email-ingest/resend`.
  - El backend descarga los adjuntos desde la API de Resend, los analiza con IA y crea facturas en la cuenta correspondiente.

Flujo de ingestión por correo (resumen):

1. El usuario obtiene su alias interno desde el panel (`/api/email-alias`).
2. Cualquier proveedor (Amazon, Uber, suministros, etc.) envía sus facturas a ese alias.
3. Resend notifica a FaktuGo, que:
   - Verifica que el alias pertenece a un usuario y que el plan permite **correo interno** (`canUseEmailIngestion`).
   - Comprueba límites de facturas mensuales (`canUploadInvoice`).
   - Descarga y analiza cada adjunto con `analyzeInvoiceFile` (OpenAI).
   - Rechaza documentos que no son facturas válidas y detecta posibles duplicados.
   - Sube el fichero a `invoices` y crea la fila en la tabla `invoices` con `upload_source = "email_ingest"`.
4. Si el usuario tiene configurado email de gestoría y autoenvío activo, se dispara un envío automático usando también Resend.

6.2 Integraciones de almacenamiento (roadmap)

Actualmente **no** hay sincronización directa con Google Drive/Dropbox/OneDrive. El roadmap contempla:

- Integración Google Drive: seleccionar carpeta raíz, reflejar estructura de periodos y subir allí copias de las facturas.
- Integraciones adicionales: Dropbox, OneDrive, WebDAV/S3 u otros, siempre como capas opcionales encima del almacenamiento principal en FaktuGo.

7. Envío por email a gestoría
7.1 Configuración

Campos clave en el perfil de usuario:

- **Email de la gestoría** (`gestoria_email`): destino principal de los envíos.
- **Autoenvío de facturas ingeridas por correo** (`auto_send_ingested_to_gestoria`): activa el envío automático desde el alias interno.

Configuración técnica:

- Dirección de envío configurada en el backend (`GESTORIA_FROM_EMAIL`).
- Proveedor de envío: Resend (API HTTP).

7.2 Modos de envío actuales

- **Manual desde detalle de factura (web y móvil)**:
  - Acción explícita del usuario sobre una factura concreta (endpoint `/api/gestoria/send`).
- **Durante la subida manual** (web/móvil):
  - El usuario puede elegir "Subir y enviar a gestoría"; el backend adjunta la factura al correo en el mismo flujo de subida.
- **Automático desde el alias de correo interno** (si está activado):
  - Cada factura válida ingerida por correo se puede reenviar automáticamente a la gestoría si se cumplen:
    - Alias activo.
    - `auto_send_ingested_to_gestoria = true`.
    - Email de gestoría configurado.
    - El plan del usuario permite envío a gestoría (`canSendToGestoria`).

7.3 Estado de envío

Campos por factura (tabla `invoices`):

- `status`: "Pendiente", "Enviada" o "Archivada" (vista de usuario).
- `sent_to_gestoria_status`: `pending | sent | failed | null`.
- `sent_to_gestoria_at`: fecha/hora del último intento de envío.
- `sent_to_gestoria_message_id`: identificador devuelto por Resend.

8. Funcionalidades avanzadas (diferenciación)

Estas funciones pueden estar en plan “Pro” o en roadmap 2.0/3.0.

8.1 Categorías automáticas por proveedor

Reglas:

Si proveedor contiene “REPSOL” → categoría = “Gasolina”.

“MERCADONA” → “Dietas”.

“AMAZON” → “Compras”.

Configuración:

Tabla de reglas editables por usuario.

Uso:

Mostrar filtro por categoría en app y web.

(Opcional) Subcarpetas por categoría.

8.2 Detección de duplicados

Lógica:

Mismo proveedor + mismo importe + misma fecha ± margen.

O checksum del archivo.

Acciones:

Aviso al usuario:

“Parece un duplicado de [factura X]. ¿Guardar o descartar?”

8.3 Exportación ZIP automática

Opciones:

Exportar:

Mes completo.

Semana concreta.

Generar fichero:

Facturas_2025-02.zip

Destino:

Descarga local.

Adjuntar a email.

Subir a Drive.

8.4 Buscador avanzado

Permitir búsqueda combinada por:

Texto OCR.

Proveedor.

Importe.

Fecha.

Categoría.

8.5 Panel de estadísticas

Métricas principales:

Gasto total por mes.

Gasto por categoría.

Número de facturas/mes.

Top proveedores por gasto.

Visualización:

Gráficas simples (barras, líneas, tarta).

8.6 Reconocimiento fiscal avanzado (futuro)

Campos adicionales vía OCR:

Base imponible.

IVA.

Número de factura.

Validaciones:

Comprobación de sumas (base + IVA = total).

Formato de número de factura.

8.7 Notificaciones y recordatorios inteligentes

Casos de uso:

Recordatorio mensual o semanal para revisar y cerrar facturas pendientes de cada periodo.

Aviso cuando se detecta un periodo prolongado sin nuevas facturas (posible olvido de escanear tickets).

Notificación cuando hay facturas con errores de OCR o pendientes de enviar a gestoría.

Canales:

Notificaciones push en la app móvil/tablet.

Emails opcionales para usuarios con cuenta FaktuGo.

8.8 Modo empresas/gestoría avanzado (futuro)

Permitir múltiples empresas por usuario con separación clara de datos y preferencias.

Acceso para gestorías con panel web multi-cliente basado en navegador, sin instalación en PC.

Flujos de trabajo:

La gestoría puede marcar facturas como "revisadas", "con incidencia" o "pendiente de documento adicional".

Comentarios por factura visibles para el cliente desde la app móvil/tablet o el panel web.

9. Configuración del usuario

Parámetros configurables:

Modo de agrupación: mensual o semanal.

Carpeta raíz local.

Conexión a Drive (on/off).

Cuenta FaktuGo (on/off).

Emails para gestoría (si usa envíos).

Reglas de envío automático.

Formato de nombres de archivo.

Reglas de categorías por proveedor.

Nombre comercial / alias de empresa.

Idioma (futuro).

10. Seguridad

Capa de transporte:

HTTPS/TLS para todo tráfico con servidores FaktuGo.

App móvil:

Opción bloqueo con PIN/biométrico (FaceID/huella) para proteger el acceso a la app.

Datos en servidor:

Guardar solo metadatos mínimos.

Cifrado en base de datos si se requiere.

Integraciones:

Tokens OAuth almacenados de forma segura.

Privacidad:

PDFs e imágenes de facturas almacenados principalmente en Supabase Storage (infraestructura cloud de FaktuGo). En el roadmap se contempla, de forma opcional, sincronizar copias a clouds del usuario (Drive, etc.) mediante integraciones externas.

11. Roadmap propuesto (alto nivel)
Versión 1.x — Estado actual

- App móvil Expo (React Native) conectada a Supabase.
- Panel web Next.js con listado de facturas, filtros y detalle.
- Subida de facturas desde móvil y web.
- Recepción de facturas por correo interno (alias) con análisis IA.
- Envío de facturas a gestoría (manual y automático al subir/ingerir).
- Gestión de planes y límites (free/básico/pro) desde panel admin.
- Exportación de todas las facturas en un ZIP desde el panel.

Versión 2.x — Automatizaciones y producto gestoría

- Estadísticas más avanzadas por categorías/periodos.
- Reglas de categorización más ricas y editables por usuario.
- Búsqueda avanzada por texto, proveedor e importes.
- Mejoras en flujos de envío a gestoría (lotes, plantillas de email, etc.).

Versión 3.x — Integraciones y multiempresa

- Integraciones adicionales con clouds de archivos (Drive/Dropbox/OneDrive).
- API para gestorías y modo multiempresa.
- Panel multi-cliente para asesorías con estados y comentarios estructurados.

12. Stack tecnológico recomendado

12.1 Visión general

El objetivo es maximizar productividad, calidad y mantenibilidad usando tecnologías modernas, con un único lenguaje principal (TypeScript) tanto en móvil como en web y en gran parte del backend.

Componentes principales:

App móvil/tablet: **React Native + Expo** (TypeScript).

Panel web/PWA: **Next.js** (React + TypeScript).

Backend/BaaS: **Supabase** (Postgres gestionado, Auth, Storage, Edge Functions) como base, complementado con APIs propias en Next.js cuando es necesario.

Integraciones externas: proveedor de email transaccional **Resend** (estado actual) y, en el roadmap, APIs de Google Drive u otros storages gestionadas desde el backend.

12.2 App móvil/tablet — React Native + Expo

Motivación:

Permite desarrollar una sola base de código para Android e iOS.

Ecosistema maduro, con muchas librerías para cámara, OCR y acceso a archivos.

Expo simplifica el ciclo de desarrollo, testing y publicación en tiendas.

Características clave a implementar:

Módulo de cámara/escáner de documentos.

Almacenamiento local cifrado de metadatos y rutas de archivos.

Sincronización selectiva con Supabase cuando el usuario activa la cuenta.

Soporte para notificaciones push (recordatorios y estados de envío).

12.3 Panel web/PWA — Next.js (React + TypeScript)

Motivación:

Permite crear una web rápida, SEO-friendly y fácilmente desplegable como PWA.

Uso del mismo lenguaje y patrones de UI que la app (React).

Soporte integrado para API Routes (si se necesitan endpoints propios adicionales).

Características clave a implementar:

Listado y filtros avanzados de facturas basados en metadatos de Supabase.

Descarga masiva y generación de ZIP por periodo (lado servidor).

Vista multi-cliente para gestorías.

Instalación como PWA desde el navegador para acceso rápido desde PC sin instalador.

12.4 Backend y datos — Supabase

Motivación:

Base de datos Postgres gestionada, robusta y escalable.

Autenticación integrada (email/password, OAuth con Google/Microsoft).

Almacenamiento de archivos opcional (si en el futuro se decide subir PDFs al servidor).

Edge Functions en TypeScript para automatizaciones (envíos de email, integraciones con Drive, generación de ZIP, etc.).

Responsabilidades principales del backend:

Gestionar cuentas de usuario y empresas.

Almacenar metadatos de facturas y reglas de automatización.

Orquestar envíos de emails a gestorías.

Gestionar tokens seguros para acceso a Google Drive u otros clouds.

12.5 Principios de calidad y buenas prácticas

Uso extensivo de TypeScript para minimizar errores en tiempo de compilación.

Arquitectura modular por funciones/dominios (escaneo, facturas, integraciones, gestorías).

Pruebas automatizadas en las partes críticas (OCR/parsing, reglas de clasificación, exportaciones).

CI/CD con pipelines que ejecuten tests y análisis estático antes de desplegar (GitHub Actions u otro proveedor).

Monitorización básica de errores en producción (por ejemplo, Sentry) en app móvil y panel web.

13. Mapa de pantallas UX (visión funcional)

13.1 App móvil/tablet

Pantallas principales (estado actual en la app Expo):

- Pantalla de autenticación (Auth): login y registro con email y contraseña usando Supabase Auth. En el alta desde móvil se piden nombre, apellidos, tipo de cuenta (autónomo/empresa), nombre comercial/empresa opcional y país opcional, además de la aceptación de términos y privacidad.

- Inicio / Home (tab "Inicio"): accesos rápidos a "Escanear", listado resumido de últimas facturas y acciones para refrescar datos desde el backend.

- Lista de facturas (tab "Facturas"): listado de facturas con búsqueda y filtros por periodo (mes/semana), proveedor y estado, con navegación al detalle.

- Detalle de factura: vista del documento (imagen o PDF mediante URL firmada), edición de metadatos básicos (fecha, proveedor, categoría, importe) y acciones (enviar a gestoría, eliminar).

- Conexiones (tab "Conexiones"): muestra el correo interno FaktuGo (alias) cuando está activo, indica si el plan permite la ingestión por email y permite copiar el alias. Incluye acciones de envío masivo de facturas pendientes a la gestoría (por mes actual o todas), con selección individual de facturas y seguimiento de progreso.

- Cuenta (tab "Cuenta"): acceso a ajustes de cuenta básicos en móvil y navegación hacia información de planes y suscripción (complementados desde el panel web).

Configuración: los detalles de preferencias de agrupación (mes/semana), correo de la gestoría y opciones de plan se gestionan principalmente desde el panel web, aunque ciertas opciones se reflejan también en la app móvil.

13.2 Panel web (PC, portátil y navegador)

Pantallas principales (estado actual):

- Dashboard / Inicio: resumen de gasto por mes y categorías, número de facturas, top proveedores y últimos documentos, además de accesos rápidos a listados y acciones clave (basado en la página `/dashboard`).

- Listado de facturas: vista avanzada con filtros combinados (fecha/periodo, proveedor, categoría, estado, búsqueda por texto) y enlaces a detalle de factura, permitiendo editar metadatos y consultar el historial de envío a gestoría.

- Configuración de cuenta: gestión de suscripción y planes, configuración del email de la gestoría, exportación ZIP de todas las facturas de la cuenta y, en su caso, eliminación de cuenta y datos asociados.

Elementos en roadmap (no implementados aún):

- Vista multi-empresa para usuarios con varias actividades/autónomos con varias marcas.
- Gestor de exportaciones por periodo (selección de mes/semana concreta, previsualización y descarga/ZIP o envío directo a gestoría en bloque).
- Centro de integraciones (Drive, otros storages y automatizaciones avanzadas) con gestión de tokens.

13.3 Modo gestoría (roadmap)

Pantallas principales previstas:

- Lista de clientes con estado general (documentación completa/incompleta, incidencias abiertas).

- Vista por cliente: facturas por periodo, indicadores de revisión y comentarios.

- Panel de tareas/incidencias: facturas con observaciones o documentación pendiente.

14. Plan de implementación por fases

14.1 Fase 1 — MVP cloud (completada)

Objetivo: validar el uso diario con app móvil + panel web conectados a la nube.

Alcance:

- Subida de facturas desde móvil y web.
- Análisis IA en el backend y creación de facturas en Supabase.
- Listado y detalle de facturas en el panel web.
- Exportación ZIP de todas las facturas.

14.2 Fase 2 — Automatizaciones y gestoría (en curso)

Objetivo: reducir trabajo manual en el envío y clasificación.

Alcance:

- Alias de correo interno y ingestión automática de facturas.
- Envío manual y automático a gestoría.
- Límites y planes de suscripción.

14.3 Fase 3 — Integraciones externas y multiempresa (roadmap)

Objetivo: conectar FaktuGo con más herramientas y soportar escenarios más complejos.

Alcance:

- Integraciones con clouds externos (Drive/Dropbox/OneDrive).
- Modo multiempresa y panel avanzado para gestorías.
- Automatizaciones adicionales (recordatorios, reglas, etc.).

15. Planes, precios y qué incluye cada plan

15.1 Modelo técnico de planes

Los planes de suscripción se modelan en la tabla `plans` de Supabase y se exponen a móvil/web mediante el endpoint público `/api/plans`.

Campos principales de la tabla `plans`:

- `id`: identificador interno del plan (ej.: `free`, `basico`, `pro`).
- `display_name`: nombre visible del plan (ej.: "Gratuito", "Básico", "Pro").
- `description`: descripción corta que se muestra en la página de precios y en la app móvil.
- `invoices_per_month`: límite de facturas/mes que el plan permite antes de bloquear nuevas subidas (usado por `canUploadInvoice`).
- `can_send_gestoria`: si el plan permite o no enviar facturas a la gestoría (usado por `canSendToGestoria`).
- `can_use_email_ingestion`: si el plan permite o no usar el correo interno FaktuGo (alias) para ingerir facturas por email (usado por `canUseEmailIngestion`).
- `price_monthly_cents`: precio mensual en céntimos de euro. Se transforma a €/mes en:
  - Página web de precios (`/pricing`), vía `/api/plans`.
  - App móvil (pantalla "Planes").
- `stripe_price_id`: identificador del precio en Stripe asociado a ese plan.
- `is_active`: indica si el plan está disponible para nuevos clientes.
- `sort_order`: orden de aparición en las interfaces.
- `features`: lista de textos cortos que resumen las características comerciales del plan (lo que se enseña en web/app).

A partir de estos datos, la capa de negocio construye:

- Un objeto `PlanConfig` por plan (en `src/lib/subscription.ts`).
- Un objeto `PlanLimits` con los límites efectivos (`invoicesPerMonth`, `canSendToGestoria`, `canUseEmailIngestion`).
- Un `SubscriptionStatus` por usuario, que indica su plan actual y el estado de factura de Stripe.

Los precios finales para el usuario se gestionan en Stripe y en la tabla `plans`; el documento no fija valores concretos salvo el caso del plan gratuito.

15.2 Plan gratuito (Free / Gratuito)

Características generales del plan gratuito (basado en el `FALLBACK_FREE_PLAN` y en la lógica actual):

- **Precio**: 0 €/mes.
- **Límite de facturas/mes**:
  - Valor leído de `invoices_per_month` en la tabla `plans`.
  - Si por algún motivo no hubiera planes configurados en BD, el backend aplica un fallback mínimo de 5 facturas/mes.
- **Envío a gestoría**:
  - `can_send_gestoria = false` (no debería permitir envío a gestoría en el plan gratuito).
  - Si el usuario intenta enviar, `canSendToGestoria` devuelve un mensaje indicando que la función no está incluida y sugiere actualizar a un plan de pago.
- **Correo interno FaktuGo (alias email)**:
  - `can_use_email_ingestion = false` en el plan gratuito.
  - En la app móvil (pantalla Conexiones) se muestra un aviso indicando que esta función no está disponible en el plan free.
- **Casos de uso típicos**:
  - Prueba del producto.
  - Autónomos con muy poco volumen de facturas/mes que quieren evaluar el flujo de captura + IA + panel web.

15.3 Planes de pago (Básico, Pro y otros)

Además del plan gratuito, la tabla `plans` permite configurar uno o varios planes de pago (por defecto se contempla al menos un plan "Básico" y uno "Pro"). Todos ellos comparten la misma estructura de campos, variando solo los valores.

Ejes principales de diferenciación:

- **Precio mensual (`price_monthly_cents`)**:
  - Se define en céntimos en la tabla `plans` y se sincroniza con un `price` de Stripe (`stripe_price_id`).
  - La página `/pricing` muestra el precio ya formateado en €/mes.
  - La app móvil (pantalla "Planes") consume el mismo endpoint `/api/plans` y muestra también el precio mensual.

- **Límite de facturas/mes (`invoices_per_month`)**:
  - Los planes de pago deben tener un límite de facturas/mes superior al gratuito.
  - Este límite se aplica en `canUploadInvoice`, que bloquea nuevas subidas cuando el usuario ha alcanzado el máximo de su plan.

- **Envío a gestoría (`can_send_gestoria`)**:
  - Al menos uno de los planes de pago habilita el envío a gestoría (`can_send_gestoria = true`).
  - Esta bandera controla tanto el envío manual desde el detalle de factura como el envío masivo desde la pantalla Conexiones y el autoenvío desde el alias interno.

- **Correo interno FaktuGo / ingestión por email (`can_use_email_ingestion`)**:
  - Al menos uno de los planes de pago habilita el uso del alias de correo interno (`can_use_email_ingestion = true`).
  - Cuando está activo, el endpoint `/api/email-alias` devuelve un alias válido y la pantalla Conexiones lo muestra como "ACTIVO".

- **Lista de características (`features`)**:
  - Cada plan puede listar textos como "Hasta X facturas/mes", "Envío a gestoría incluido", "Correo interno para facturas", etc.
  - Esta lista se usa tanto en la web (`/pricing`) como en la pantalla "Planes" de la app móvil para explicar rápidamente qué incluye cada plan.

Ejemplo de posicionamiento (orientativo, configurable desde el panel admin de planes):

- **Básico**: pensado para autónomos y pequeños negocios con volumen moderado de facturas al mes. Suele incluir:
  - Más facturas/mes que el plan gratuito.
  - Envío a gestoría habilitado.
  - Sin o con limitaciones en el correo interno según se decida a nivel de producto.

- **Pro**: orientado a usuarios con mayor volumen o a pequeños equipos que necesitan automatizar al máximo.
  - Límite de facturas/mes claramente superior al plan Básico.
  - Envío a gestoría habilitado.
  - Correo interno FaktuGo habilitado para ingestión automática de facturas.
  - Más características en el array `features` (prioridad, soporte, automatizaciones, etc.).

15.4 Gestión de precios y suscripciones (Stripe)

- Los precios reales que ve el usuario se gestionan en **Stripe** a través de `price` objects asociados a cada plan (`stripe_price_id`).
- La web y la app crean sesiones de pago o portales de gestión de suscripción llamando a los endpoints:
  - `/api/stripe/checkout` para iniciar una nueva suscripción o cambiar de plan.
  - `/api/stripe/portal` para que el usuario gestione su suscripción (cambios, cancelaciones, método de pago, etc.).
- La tabla `subscriptions` en Supabase guarda el `plan_name`, el `status` y el `current_period_end`, que luego se combinan con `PlanConfig` para obtener los límites efectivos de cada usuario.

Esta sección sirve como referencia de alto nivel: los valores concretos de precios y límites se ajustan desde el panel admin de planes y en Stripe, sin necesidad de cambiar el código.