# Sugerencias de mejora — FaktuGo

## 1. Opinión general del proyecto

- **Visión y documentación**
  - El documento técnico (`doc/tecnica.md`) y el de branding (`doc/branding.md`) son muy completos y profesionales.
  - La arquitectura propuesta (Local‑First + nube opcional + Supabase + panel web) está bien pensada y es coherente.

- **Estado del código**
  - Web (`web/`): Next.js 16 + React + TypeScript + Tailwind 4 + Supabase + Resend.
  - Móvil (`mobile/`): React Native + Expo + Supabase + AsyncStorage + FileSystem.
  - Hay una **demo funcional** sólida: landing, login, dashboard, listado de facturas, subida de archivos, envío a gestoría, alias de email e ingestión automática por correo.
  - La app móvil ya refleja el enfoque Local‑First: estado local de facturas, almacenamiento en fichero JSON y sincronización con Supabase cuando hay cuenta.

- **Nivel de profesionalidad**
  - Para ser un MVP, el nivel es **alto**: buena separación por capas, uso correcto de Supabase, endpoints bien definidos y alineación fuerte con la propuesta de valor.
  - El principal margen de mejora está en:
    - Completar la experiencia Local‑First (estructura de carpetas real, OCR, flujo offline/online más robusto).
    - Unificar dominio entre web y móvil.
    - Añadir testing + CI/CD + observabilidad.

---

## 2. Funcionalidades operativas (estado actual)

### 2.1 Web (`web/`)

- **Landing y marketing** (`web/src/app/page.tsx`)
  - Landing completa con secciones "Cómo funciona", "Funciones avanzadas", "Para quién es", CTA a `/pricing`.
  - Texto muy alineado con `doc/branding.md` (slogan, beneficios, Local‑First, etc.).

- **Cuenta y autenticación**
  - `web/src/app/login/page.tsx` + `LoginForm.tsx`:
    - Login y registro con Supabase Auth.
    - Guardas metadatos de usuario (nombre, apellidos, `full_name`).
  - `web/src/lib/supabaseServer.ts` y `supabaseBrowser.ts` implementan bien el patrón SSR + cliente de navegador.

- **Panel y facturas**
  - `web/src/app/dashboard/page.tsx`:
    - Resumen mensual: importe total, número de facturas, categoría top del mes.
    - Últimas facturas.
    - Formulario de perfil (`ProfileForm`) con datos básicos de `profiles`.
  - `web/src/app/invoices/page.tsx`:
    - Listado de facturas con filtros por texto, categoría, rango de fechas.
    - Agrupación por **mes** o **semana ISO**, siguiendo la lógica descrita en `doc/tecnica.md`.
  - `web/src/lib/invoices.ts`:
    - Tipo `Invoice` con campos de periodo (`period_type`, `period_key`, `folder_path`) y metadatos de archivo.
    - `computePeriodFromDate`: cálculo de claves de periodo y carpeta destino.
    - `getInvoices` y `getInvoiceById` con fallback a `MOCK_INVOICES` cuando no hay Supabase (modo demo).

- **Subida de facturas y envío a gestoría**
  - `web/src/app/api/invoices/upload/route.ts`:
    - Recibe múltiples ficheros (campo `files`) por `multipart/form-data`.
    - Valida número máximo de archivos, tamaño máximo y tipos permitidos (imágenes/PDF).
    - Sube cada archivo al bucket `invoices` de Supabase Storage.
    - Crea registros en la tabla `invoices` con:
      - `user_id`, `date`, `status`, `period_type`, `period_key`, `folder_path`.
      - `file_path`, `file_name_original`, `file_mime_type`, `file_size`.
      - `upload_source = "web_upload"` y `archival_only`.
    - Si se marca `sendToGestoria` y hay configuración de Resend + email, envía automáticamente la factura a la gestoría y actualiza campos `sent_to_gestoria_*`.
  - `web/src/app/api/gestoria/send/route.ts`:
    - Envío manual de una factura concreta a la gestoría (por `invoiceId`).
    - Genera URL firmada desde Storage, construye un email con detalles de la factura y la adjunta.
    - Actualiza el estado de envío en la tabla `invoices`.

- **Alias interno de email + ingestión automática**
  - `web/src/app/api/email-alias/route.ts`:
    - Genera o migra un alias de email interno corto y legible, por ejemplo `mi-empresa-xxxx@invoice.faktugo.com`.
    - Lee/actualiza `auto_send_ingested_to_gestoria` y `gestoria_email` en `profiles`.
  - `web/src/app/api/email-ingest/resend/route.ts`:
    - Webhook para el evento `email.received` de Resend.
    - Localiza alias de `email_ingestion_aliases` y descarga adjuntos desde Resend.
    - Sube los adjuntos a Storage (`invoices`) y crea facturas en la tabla `invoices` con `upload_source = "email_ingest"`.
    - Si el usuario ha activado autoenvío y hay email de gestoría, reenvía automáticamente esos adjuntos a la gestoría y actualiza `sent_to_gestoria_*`.

### 2.2 Móvil (`mobile/`)

- **Arquitectura Local‑First básica**
  - `mobile/storage/localInvoices.js`:
    - Guarda y carga facturas desde `FileSystem.documentDirectory` en `invoices.json`.
    - Al leer, normaliza la lista usando `buildInvoices`.
  - `mobile/domain/period.js` y `invoice.js`:
    - `computePeriodFromDate` replicando la lógica de la web (mes/semana).
    - `buildInvoice` y `buildInvoices` para normalizar facturas con campos de periodo y metadatos de archivo.

- **App principal (`mobile/App.js`)**
  - Tabs: `Home`, `Invoices`, `Connections`, `Account`.
  - Gestiona:
    - Estado local de `invoices` (mock inicial + carga desde almacenamiento local + sincronización desde Supabase si hay usuario).
    - Sesión de Supabase (getSession + onAuthStateChange).
    - Splash screen mientras se inicializa todo.
  - Si hay Supabase pero no usuario, muestra `AuthScreen`. Si hay usuario, muestra tabs principales.

- **Flujos clave de usuario**
  - `HomeScreen.js`:
    - Resumen mensual (nº facturas e importe total del mes actual) basado en `invoices`.
    - Botón "Escanear factura (demo)":
      - Abre la cámara con `expo-image-picker`.
      - Crea una factura local con datos por defecto (proveedor/importe pendientes).
      - Calcula periodo y carpeta (`computePeriodFromDate`).
      - Sube la imagen a Supabase Storage usando `FileSystem.uploadAsync`.
      - Inserta un registro en la tabla `invoices` en Supabase (`upload_source = "mobile_upload"`).
  - `InvoicesScreen.js`:
    - Muestra todas las facturas agrupadas por **mes** o **semana**.
    - Usa la misma idea de agrupación que la web, con etiquetas como "Semana del X‑Y Mes Año".
  - `InvoiceDetailScreen.js`:
    - Muestra detalle de una factura, intenta obtener URL firmada desde Storage y mostrar la imagen o abrir el documento.
  - `AuthScreen.js`:
    - Login y registro con Supabase Auth (email+password, nombre, apellidos), similar al flujo web.
  - `ConnectionsScreen.js`:
    - Muestra el email del usuario y ofrece cierre de sesión.
    - Placeholder para futuras integraciones (Drive, correo interno, etc.).
  - `AccountScreen.js`:
    - Lee el perfil desde `profiles` y permite editar:
      - Nombre, apellidos, tipo de cliente, nombre empresa, país y email de gestoría.
    - Guarda esos datos en la tabla `profiles` de Supabase.

---

## 3. Mejoras concretas sobre funcionalidades actuales

### 3.1 Seguridad y consistencia de datos en facturas (web)

Nota: estas sugerencias asumen el despliegue actual en Vercel con Supabase y reglas RLS activas. `getSupabaseServerClient` es el cliente que ya usas en otras partes del proyecto para trabajar con la sesión real del usuario (cookies) en API Routes y Server Components.

1. **Asociar siempre facturas a un usuario en `/api/invoices`**
   - **Dónde**: `web/src/app/api/invoices/route.ts`.
   - **Motivo**: El endpoint `POST /api/invoices` actualmente hace `upsert` sin incluir `user_id`, mientras que otros flujos (subida web, móvil, ingestión por email) sí rellenan `user_id`.
   - **Sugerencia**:
     - Cambiar a cliente de servidor con sesión (`getSupabaseServerClient`) en lugar de `getSupabaseClient`.
     - Obtener el usuario autenticado y añadir `user_id: user.id` al `upsertPayload`.

2. **Clarificar filtrado por usuario en `getInvoices`**
   - **Dónde**: `web/src/lib/invoices.ts` (`getInvoices`).
   - **Motivo**: La función no filtra explícitamente por `user_id`; esto probablemente lo controla Supabase vía RLS, pero no se ve en el código.
   - **Sugerencia**:
     - Documentar en este archivo que **todas** las consultas pasan por RLS y que solo se usan clientes autenticados.
     - Opcionalmente, cuando recibas un `SupabaseClient` autenticado desde server (`getSupabaseServerClient`), añadir `.eq("user_id", user.id)` si tienes acceso al `user.id` en esa capa.

### 3.2 Local‑First más completo en móvil

3. **Crear estructura real de carpetas locales (`/FaktuGo/YYYY-MM`)**
   - **Dónde**:
     - `mobile/storage/localInvoices.js`.
     - `mobile/domain/period.js`.
   - **Motivo**: Aunque las facturas se guardan localmente en un JSON, el documento técnico define una fuerte promesa de carpetas físicas por mes/semana.
   - **Sugerencia**:
     - Al guardar facturas nuevas, utilizar `folder_path` para crear las carpetas en el sistema de archivos del dispositivo con `FileSystem.makeDirectoryAsync` (si no existen).
     - Guardar/copiar los ficheros locales en esa estructura, no solo en la ruta original de la cámara.

4. **Configurar modo mensual/semanal y carpeta raíz desde la app**
   - **Dónde**:
     - Nueva sección de ajustes, idealmente dentro de `AccountScreen` o una pantalla separada `SettingsScreen`.
     - Usar estos ajustes en `mobile/domain/period.js` y `buildInvoice`.
   - **Motivo**: En el documento técnico el usuario puede elegir:
     - Modo de agrupación: mensual vs semanal.
     - Carpeta raíz (`/FaktuGo/`, nombre comercio, ruta personalizada).
   - **Sugerencia**:
     - Guardar estas preferencias en AsyncStorage.
     - Leerlas en el arranque y pasar `mode` y `rootFolder` a `computePeriodFromDate` y `buildInvoices`.

### 3.3 UX: alineación experiencia web/móvil

5. **Filtros y búsqueda en listado de facturas móvil**
   - **Dónde**: `mobile/screens/InvoicesScreen.js`.
   - **Motivo**: La web ya tiene filtros por proveedor, categoría y rango de fechas; el móvil no.
   - **Sugerencia**:
     - Añadir una barra de búsqueda sencilla por proveedor/categoría.
     - Añadir un switch o botones para filtrar por estado (Enviada/Pendiente) usando el mismo patrón de la web.

6. **Estado de factura y envío a gestoría visible en UI**
   - **Dónde**:
     - Web: `web/src/app/invoices/[id]/page.tsx`.
     - Móvil: `mobile/screens/InvoiceDetailScreen.js`.
   - **Motivo**: Ya guardas campos `sent_to_gestoria_at`, `sent_to_gestoria_status`, `archival_only`, etc., pero no siempre se exponen en la UI.
   - **Sugerencia**:
     - Mostrar en ambas plataformas:
       - Si la factura está solo archivada (`archival_only`).
       - Si ha sido enviada a la gestoría y cuándo (`sent_to_gestoria_at` + `sent_to_gestoria_status`).

---

## 4. Técnicas avanzadas y profesionalización

### 4.1 Dominio compartido entre web y móvil (paquete core)

7. **Extraer lógica de dominio a un paquete compartido**
   - **Dónde**: nueva carpeta raíz `packages/core/`.
   - **Contenido sugerido**:
     - `period.ts`: `computePeriodFromDate`, `getIsoWeek`, helpers para etiquetas de semana/mes.
     - `invoice.ts`: tipo `Invoice` común (sin detalles de framework) y helpers de normalización (`buildInvoice`, `buildInvoices`).
     - `amount.ts`: helpers para parsear y formatear importes (evitar duplicar lógica en dashboard móvil/web).
   - **Beneficios**:
     - Evitar duplicación entre `web/src/lib/invoices.ts` y `mobile/domain/period.js` / `invoice.js`.
     - Facilitar testing unitario independiente de React/React Native.

### 4.2 Testing

8. **Tests unitarios de reglas de negocio**
   - **Qué testear**:
     - `computePeriodFromDate`: fechas válidas/invalidas, bordes de año, modo mes y semana.
     - Cálculo de etiquetas de semana/mes (que web y móvil muestren los mismos rangos y nombres).
     - Normalización de importes (`parseAmountToNumber` en dashboard web) y totales mensuales.
   - **Dónde**:
     - Web: `web/src/lib/__tests__/invoices.test.ts`.
     - Core (si extraes un paquete): `packages/core/__tests__/period.test.ts`, etc.

9. **Tests de API para rutas sensibles**
   - **Rutas prioritarias**:
     - `web/src/app/api/invoices/upload/route.ts`.
     - `web/src/app/api/gestoria/send/route.ts`.
     - `web/src/app/api/email-ingest/resend/route.ts`.
     - `web/src/app/api/email-alias/route.ts`.
   - **Objetivo**:
     - Validar que validaciones, códigos de error y efectos secundarios (insert/update) funcionan como se espera.

### 4.3 CI/CD

10. **Pipeline mínimo de CI**
    - **Dónde**: `.github/workflows/ci.yml` (o similar).
    - **Pasos mínimos**:
      - Instalar dependencias y ejecutar `npm run lint` + `npm test` (cuando existan) en `web` y `mobile`.
      - Ejecutar `npm run build` en `web` para garantizar que la landing y el panel compilan.
      - Ejecutar `tsc --noEmit` en `web` (y en `packages/core` si lo creas) para validar tipos.

### 4.4 Observabilidad

11. **Monitorización de errores en producción**
    - **Herramientas**: Sentry o equivalente.
    - **Dónde**:
      - Web: integrar en `Next.js` (errores de React + API Routes, sobre todo ingestión de email y envío a gestoría).
      - Móvil: SDK de Sentry para React Native.
    - **Motivo**: detectar problemas reales en:
      - Procesamiento de correos entrantes.
      - Envíos fallidos a gestorías.
      - Subidas de facturas desde móvil en condiciones de red variables.

### 4.5 Supabase avanzado y RLS

12. **Revisar y documentar reglas RLS y esquemas**
    - **Objetivo**: garantizar que todas las tablas clave (`invoices`, `profiles`, `email_ingestion_aliases`) filtran por `auth.uid()`.
    - **Acciones**:
      - Asegurarse de que cada select/update/insert en producción pasa por un contexto autenticado.
      - Añadir al repo un pequeño documento técnico (por ejemplo `doc/datos_y_seguridad.md`) explicando las reglas de acceso por tabla para futuros desarrolladores.

13. **Edge Functions para tareas pesadas**
    - **Ideas alineadas con tu documento técnico**:
      - Generación de ZIP por periodo (mes/semana) desde Supabase para evitar hacer esto en Next.js directamente.
      - Jobs programados para envíos automáticos (cada viernes, primer día del mes, etc.).

---

## 5. Próximos pasos recomendados

En términos de prioridad, sugeriría este orden:

1. **Cerrar bien la seguridad y consistencia de invoices**
   - Añadir `user_id` a `/api/invoices`.
   - Revisar y documentar RLS en Supabase.

2. **Completar la experiencia Local‑First en móvil**
   - Estructura real de carpetas locales.
   - Configuración de modo mensual/semanal y carpeta raíz.

3. **Unificar dominio y añadir tests básicos**
   - Paquete core compartido.
   - Tests unitarios de periodos y totales.

4. **Añadir observabilidad y CI**
   - Integración de Sentry (u otro) y pipeline simple en GitHub Actions.

5. **Extender automatizaciones**
   - Generación de ZIP y envíos programados vía Edge Functions.

Este documento puede servir como guía viva para ir marcando qué se va completando y qué pasa al siguiente ciclo (v2, v3, etc.).
