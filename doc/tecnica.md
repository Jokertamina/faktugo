Documento técnico funcional — FaktuGo
1. Descripción general del producto

FaktuGo es un ecosistema de aplicaciones Local-First (app móvil/tablet + panel web) para digitalizar, clasificar y gestionar facturas y tickets de autónomos y pequeñas empresas.

Características clave:

Escaneo de facturas/tickets con cámara o PDF.

Extracción automática de datos con OCR.

Clasificación automática por mes o semana según la fecha de la factura.

Creación automática de carpetas (mes/semana).

Funcionamiento completo sin registro y sin conexión (modo local).

Sincronización y funciones avanzadas mediante cuenta opcional.

Integraciones opcionales: Google Drive, otros clouds, envío por email a gestoría.

Panel web opcional para revisar y gestionar facturas desde PC.

2. Filosofía de arquitectura
2.1 Local-First

La app debe ser totalmente funcional sin registro:

Escanear.

Extraer datos.

Clasificar.

Guardar en sistema de archivos local.

No es obligatorio subir nada a servidores de FaktuGo.

La nube se usa solo para:

Metadatos.

Sincronización.

Automatizaciones.

Panel web.

2.2 Nube opcional

El usuario decide si:

Crea cuenta FaktuGo.

Conecta servicios externos (Drive/Dropbox/OneDrive).

Activa envíos automáticos por email.

2.3 Privacidad

Los PDFs/imágenes no se guardan en servidores de FaktuGo.

Solo se almacenan en:

Dispositivo del usuario.

Servicios cloud del usuario (Drive, etc.).

2.4 Plataformas y despliegue sin instalación en PC

Clientes principales:

App móvil/tablet (Android/iOS) distribuida a través de App Store y Google Play.

Panel web responsive accesible desde navegadores modernos (PC, portátil, tablet) y con opción de PWA instalable desde el propio navegador.

Principios:

No se distribuyen ejecutables .exe ni instaladores de escritorio propios para evitar advertencias de SmartScreen y costes de firma de código.

En escritorio, el acceso se realiza siempre vía navegador (URL segura HTTPS) o instalación como PWA, sin necesidad de permisos especiales del sistema operativo.

Se mantiene el enfoque Local-First en móvil/tablet: los PDFs se guardan en el dispositivo o en el cloud del usuario; el backend solo gestiona metadatos y automatizaciones.

Arquitectura de referencia (orientativa):

App móvil/tablet: framework cross-platform (por ejemplo Flutter o React Native) con soporte para cámara, almacenamiento local cifrado y sincronización selectiva.

Panel web: SPA/PWA (por ejemplo React/Next.js) que consume la misma API y permite la gestión desde PC sin instalación.

Backend en la nube: API REST/GraphQL + base de datos gestionada (por ejemplo Supabase, Firebase u otra solución equivalente) para cuentas, metadatos, reglas y automatizaciones.

3. Roles de usuario

Usuario estándar (autónomo / pyme)

Usa la app móvil.

Puede usar solo modo local.

Opcional: cuenta + panel web.

Gestoría

Recibe facturas vía:

Carpeta compartida en Drive.

Email con adjuntos/enlaces.

Opcional: acceso a panel web multi-cliente (futuro).

4. Funcionalidades principales (MVP extendido)
4.1 Escaneo de facturas

Entrada:

Cámara del móvil (foto).

Importación de imagen o PDF desde galería/archivos.

Procesos:

Detección de bordes.

Recorte automático.

Corrección de perspectiva.

Mejora de contraste/blanco y negro.

Salida:

Imagen procesada lista para OCR y guardado.

4.2 OCR y extracción de datos

Datos a extraer:

Fecha de la factura.

Importe total.

Nombre del proveedor.

Algoritmos:

OCR (motor externo o interno).

Regex y heurísticas para:

Formatos de fecha.

Formatos de importe con € / , / .

Proveedor (títulos grandes, cabeceras).

Corrección:

UI para revisión rápida:

“Fecha detectada: [14/02/2025] ¿Correcto?”

“Importe detectado: [45,60 €]”

El usuario puede editar manualmente.

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

4.4 Estructura de carpetas (modo local)

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

4.5 Funcionamiento por defecto (sin cuenta, sin nube, sin email)

La app:

Escanea.

Extrae datos.

Clasifica.

Crea carpetas mes/semana.

Guarda archivos localmente.

No requiere:

Registro.

Conexión a internet.

Servicios externos.

5. Funciones opcionales con cuenta FaktuGo

La cuenta solo se pide cuando el usuario activa funciones avanzadas.

5.1 Cuenta y autenticación

Registro:

Email + contraseña.

Opcional: login social (Google, Microsoft).

Autenticación:

JWT / similar.

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

Metadatos (ID, fecha, proveedor, importe, categoría, ruta remota/local, flags).

No sincroniza (por defecto):

PDFs/imagenes (están en dispositivo o cloud del usuario).

Dispositivos:

Móvil ↔ Web ↔ Tablet.

Resolución de conflictos:

Última modificación gana o estrategia definida.

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

6. Integraciones opcionales
6.1 Integración Google Drive (MVP)

Autenticación:

OAuth2.

Configuración:

Seleccionar carpeta raíz en Drive.

Mantener estructura YYYY-MM o YYYY-SWW.

Flujo:

Al guardar localmente una factura:

Si Drive está activo:

Subir archivo a la carpeta correspondiente.

Guardar ruta remota en metadatos.

Errores:

Si falla la subida:

Reintentos.

Marcar factura con estado “pendiente de subir”.

6.2 Otras integraciones (futuro)

Dropbox.

OneDrive.

WebDAV / S3 (opcional).

7. Envío por email a gestoría (opcional)
7.1 Configuración

Campos:

Email del usuario (remitente o reply-to).

Email de la gestoría.

Asunto base (configurable).

Mensaje base (texto editable).

Opciones:

Adjuntar PDFs.

Enviar solo enlaces (si se usan Drive/Dropbox).

7.2 Modos de envío

Manual:

Botón “Enviar a gestoría”.

Seleccionar rango temporal o facturas pendientes.

Automático programado:

Cada viernes a X hora.

Primer día de cada mes.

Al insertar una nueva factura (envío inmediato).

Enviar solo facturas con flag “no enviada”.

7.3 Estado de envío

Campos por factura:

subida_cloud: boolean

enviada_gestoria: boolean

fecha_envio: datetime

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

Opción bloqueo con PIN/biométrico (FaceID/huella).

Datos en servidor:

Guardar solo metadatos mínimos.

Cifrado en base de datos si se requiere.

Integraciones:

Tokens OAuth almacenados de forma segura.

Privacidad:

PDFs principalmente en almacenamiento local o cloud del usuario.

11. Roadmap propuesto (alto nivel)
Versión 1.0 (MVP sólido)

App móvil Local-First.

Escaneo + OCR básico.

Clasificación mensual/semanal.

Estructura de carpetas automáticas.

Drive opcional.

Email manual opcional.

Sincronización mínima + panel web básico (si se decide).

Versión 2.0

Cuenta FaktuGo refinada.

Email automático programado.

Panel web con filtros y estadísticas básicas.

Categorías por proveedor.

Detección de duplicados.

Export ZIP.

Versión 3.0

Integraciones adicionales (Dropbox, OneDrive).

Reconocimiento IVA/bases.

API para gestorías.

Flujo empresa–gestoría (comentarios, estados).

12. Stack tecnológico recomendado

12.1 Visión general

El objetivo es maximizar productividad, calidad y mantenibilidad usando tecnologías modernas, con un único lenguaje principal (TypeScript) tanto en móvil como en web y en gran parte del backend.

Componentes principales:

App móvil/tablet: React Native + Expo (TypeScript).

Panel web/PWA: Next.js (React + TypeScript).

Backend/BaaS: Supabase (Postgres gestionado, Auth, Storage, Edge Functions) como base, complementado si es necesario con APIs propias.

Integraciones externas: APIs de Google Drive y proveedores de email (por ejemplo, SendGrid) gestionadas desde el backend.

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

Pantallas principales:

Inicio / Dashboard rápido: accesos a "Escanear", últimas facturas y resumen del periodo actual.

Flujo de escaneo: cámara, revisión de recorte y filtros de imagen.

Pantalla de revisión de datos OCR: fecha, importe, proveedor, categoría y carpeta objetivo.

Lista de facturas: búsqueda básica, filtros por mes/semana y estado de envío (enviada/no enviada, subida/no subida).

Detalle de factura: vista del documento, edición de metadatos y acciones (enviar, mover, eliminar, marcar como revisada).

Configuración: opciones de carpeta raíz, modo mensual/semanal, idioma futuro, ajustes de privacidad/local-first y conexión con cuenta FaktuGo.

13.2 Panel web (PC, portátil y navegador)

Pantallas principales:

Inicio con resumen de gasto por mes, categorías y avisos (facturas pendientes de enviar, errores de OCR, pendientes de subir a Drive).

Listado avanzado de facturas con filtros combinados (fecha, proveedor, importe, categoría, estado, empresa).

Vista multi-empresa para usuarios con varias actividades/autónomos con varias marcas.

Gestor de exportaciones: selección de periodo, previsualización y descarga/ZIP o envío directo a gestoría.

Centro de integraciones: Drive, email, automatizaciones y configuración de tokens.

13.3 Modo gestoría

Pantallas principales:

Lista de clientes con estado general (documentación completa/incompleta, incidencias abiertas).

Vista por cliente: facturas por periodo, indicadores de revisión y comentarios.

Panel de tareas/incidencias: facturas con observaciones o documentación pendiente.

14. Plan de implementación por fases

14.1 Fase 1 — MVP Local-First

Objetivo: validar el uso diario de la app móvil sin depender de la nube.

Alcance:

App móvil con escaneo, OCR básico y clasificación mensual/semanal en carpetas locales.

Generación de nombres de archivo estándar y estructura de carpetas.

Pantalla de listado y búsqueda simple en móvil.

14.2 Fase 2 — Cuenta FaktuGo y sincronización mínima

Objetivo: habilitar cuenta de usuario y metadatos en la nube.

Alcance:

Registro/login con Supabase Auth.

Sincronización de metadatos entre app móvil y panel web básico.

Activación de integraciones con Drive y envío manual de emails a gestoría desde el panel web.

14.3 Fase 3 — Automatizaciones y modo gestoría

Objetivo: diferenciar el producto con automatizaciones avanzadas.

Alcance:

Reglas de categorías por proveedor, detección de duplicados y recordatorios inteligentes.

Envíos automáticos programados a gestoría y exportaciones ZIP automáticas.

Panel web multi-cliente para gestorías con estados y comentarios por factura.