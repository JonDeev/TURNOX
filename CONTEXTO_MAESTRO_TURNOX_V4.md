# TURNOX — CONTEXTO MAESTRO DEL PROYECTO

> Documento de contexto técnico y funcional para desarrollo en VS Code.
>
> Este archivo es la fuente de verdad inicial del proyecto TURNOX.
> Cualquier asistente de programación, desarrollador o agente IA que trabaje sobre el proyecto debe leerlo completo antes de proponer cambios arquitectónicos o escribir código.
>
> Estado: PLANIFICACIÓN / PRE-DESARROLLO
> Versión del documento: 4.0
> Última actualización conceptual: agosto de 2026

---


## CÓMO USAR ESTE DOCUMENTO

Las secciones marcadas como **DECISIÓN CERRADA** incluyen su razón. No se cambian sin una razón técnica más fuerte que la registrada, y todo cambio queda documentado como ADR (sección 52).

Las secciones marcadas como **PENDIENTE** son huecos conocidos. Un agente IA no debe resolverlos por su cuenta: debe preguntar.

Las secciones marcadas como **INVARIANTE** describen propiedades que el sistema no puede violar bajo ninguna circunstancia. Cualquier cambio que las ponga en riesgo se rechaza.

---

# CAMBIOS PRINCIPALES DE LA VERSIÓN 4.0

Esta versión incorpora una revisión senior adicional sobre la V3 y cierra escenarios que deben estar definidos antes de implementar el motor de turnos.

Cambios principales:

1. Una sesión de asesor admite **un solo turno activo**.
2. Los comandos mutantes del asesor usan `command_id` idempotente.
3. `AdvisorSession` usa `fencing_token` para rechazar pestañas/sesiones antiguas.
4. La sesión queda ocupada desde `LLAMADO`, no solamente desde `EN_ATENCION`.
5. Una sesión con turno activo no se libera automáticamente por pérdida de heartbeat.
6. Display usa `event_seq`, cursor persistente, replay y high-water mark para eliminar la ventana entre snapshot y realtime.
7. Eventos recuperados pero obsoletos reconstruyen estado sin reproducir una voz tardía.
8. Se separan destino de atención, contexto de espera y cobertura del anuncio.
9. Las transferencias crean `TicketStage` para medir correctamente cada espera y atención.
10. `NO_PRESENTADO` y `ABANDONO` se definen como conceptos distintos.
11. La jornada vigente se valida en cada operación; el job de cierre es solo reconciliación.
12. La idempotencia del kiosco es durable y sobrevive pérdida de respuesta/reinicio.
13. Impresión se modela como `PrintJob` + `PrintAttempt`.
14. Se reconoce explícitamente que una impresora física no permite una garantía exactamente-una-vez transaccional.
15. La reimpresión deliberada usa un nuevo `print_job_id` relacionado con el original.
16. Varias TVs en la misma sala usan una autoridad única de audio para evitar eco.
17. OpenAPI gobierna HTTP y AsyncAPI 3.1 gobierna contratos realtime/event-driven.
18. La sincronización multimedia nunca bloquea el canal de llamados.
19. Se corrigen artefactos desplegables, numeración y referencias editoriales.
20. Los nuevos escenarios quedan incorporados a criterios de aceptación y pruebas.

---

# 1. VISIÓN DEL PRODUCTO

TURNOX es una plataforma de gestión de turnos para organizaciones con atención presencial al público, especialmente útil para IPS, centros de atención, oficinas, empresas de servicios y sedes con múltiples puntos de atención.

El sistema debe permitir que:

1. Un usuario llegue a un kiosco o atril.
2. Seleccione en una interfaz web el servicio por el cual desea ser atendido.
3. El sistema genere un turno.
4. El turno sea impreso por una impresora térmica POS.
5. El turno entre a una cola de atención.
6. Un asesor inicie sesión en la aplicación web.
7. El asesor seleccione el módulo físico o puesto de trabajo desde el cual atenderá.
8. El asesor pueda llamar el siguiente turno permitido según los servicios que tenga asignados.
9. El turno aparezca inmediatamente en una pantalla de sala de espera.
10. La pantalla anuncie el turno mediante voz.
11. La pantalla pueda reproducir videos educativos/institucionales mientras no está mostrando un llamado.
12. El sistema registre tiempos, eventos, atención, abandonos, rellamados, transferencias y métricas.

TURNOX debe diseñarse desde el inicio como un producto reutilizable y potencialmente comercializable, no como una solución rígida para una única sede.

El primer despliegue será una IPS en Colombia, que actúa como cliente cero.

---

# 2. CONTEXTO DE HARDWARE CONFIRMADO

Esta sección condiciona varias decisiones de arquitectura. **Un punto solo se considera CONFIRMADO si fue validado explícitamente por el responsable del proyecto o en Fase 0; una recomendación de una IA no equivale a confirmación.**

## 2.1 Atril / kiosco — CONFIRMADO — PERFIL DE DESPLIEGUE V1

- Para el despliegue inicial V1 del atril: mini-PC con **Ubuntu Desktop endurecido**.
- Pantalla táctil.
- Impresora térmica POS conectada por USB.

Consecuencia para este perfil de despliegue: **el kiosco no puede ser una APK Android**. TURNOX Kiosk será una aplicación web ejecutada en Chromium en modo kiosco, con un agente local de impresión. Ubuntu Desktop es una decisión de infraestructura del despliegue inicial V1; no es una dependencia arquitectónica de TURNOX Kiosk.

## 2.2 Pantallas de sala — CONFIRMADO

- Televisores con **TV Box Android TV / Google TV** conectado por HDMI.
- Conexión de red preferentemente **Ethernet**, no WiFi.

### Matiz importante sobre el tipo de box

**No se fija todavía AOSP genérico ni Google TV certificado como requisito obligatorio.**

La decisión arquitectónica cerrada es otra: **el dispositivo debe poder operar de forma administrada como dispositivo dedicado**, iniciar TURNOX Display automáticamente y recuperar la aplicación sin intervención humana tras reinicios o cortes de energía.

AOSP con launcher personalizado es una alternativa válida y debe probarse. Un dispositivo Android/Google TV correctamente administrable mediante mecanismos de dispositivo dedicado también puede ser válido. La elección final se toma en **Fase 0**, con hardware real.

**Requisitos mínimos del box:**

| Requisito | Razón |
|---|---|
| Puerto Ethernet | WiFi en sala de espera con decenas de teléfonos es menos predecible |
| Android 11 o superior | Base razonable para Media3, Compose for TV y soporte moderno |
| 2 GB de RAM mínimo | Video continuo + animaciones + WebSocket simultáneos |
| Capacidad de operación como dispositivo dedicado | Debe iniciar y permanecer en TURNOX Display sin exponer la interfaz de consumo al público |
| Autoarranque y recuperación tras corte eléctrico | Requisito operativo esencial |
| Almacenamiento adecuado + puerto USB cuando aplique | Los videos cacheados consumen espacio |
| Salida de audio HDMI estable | El anuncio de voz debe sonar limpio sobre el video |
| Soporte razonable de actualizaciones y mantenimiento | Evitar hardware abandonado o imposible de administrar |

**PENDIENTE de Fase 0:** decidir el modelo exacto y el mecanismo de administración (`launcher`, Device Owner / Lock Task, MDM u otro soportado por el equipo elegido).

## 2.3 Impresora POS — PENDIENTE

Falta definir marca y modelo exactos.

Criterios de selección:

- 80 mm.
- Protocolo ESC/POS.
- Conexión **USB** (atril e impresora comparten mueble; no introducir red innecesariamente).
- Cortador automático.
- **Debe reportar estado de papel.** Sin realimentación de "sin papel", el panel de dispositivos nunca podrá mostrar el estado real de la impresora y las fallas solo se detectarán por ausencia de respuesta.

Marcas con soporte confiable de ESC/POS crudo en Linux: Epson, Bixolon, Star. Las genéricas tipo Xprinter funcionan pero con documentación irregular.

---

# 3. DECISIONES ARQUITECTÓNICAS CERRADAS

Cada decisión incluye su razón. Sin la razón registrada, cualquiera puede revertirla dentro de un año sin entender el costo.

## 3.1 Arquitectura general — DECISIÓN CERRADA

- Monolito modular.
- Arquitectura Clean / Hexagonal.
- DDD pragmático.
- No microservicios en la primera etapa.
- No Event Sourcing completo.
- No CQRS complejo.
- Separación clara entre dominio, aplicación, infraestructura e interfaces.

**Razón:** un dominio acotado, una institución por despliegue, y latencia de llamado que importa más que escalabilidad horizontal infinita. Microservicios aquí solo agregan complejidad de despliegue, transacciones distribuidas y modos de falla, sin beneficio real.

## 3.2 Backend — DECISIÓN CERRADA

- Lenguaje: TypeScript.
- Framework: NestJS.
- Adaptador HTTP: **Express**, no Fastify.
- API principal: REST.
- Contrato: OpenAPI.
- Tiempo real: Socket.IO / WebSocket.
- Redis como apoyo para realtime, presencia, cache y coordinación.
- Redis nunca será la fuente de verdad de los turnos.

**Razón de Express sobre Fastify:** la carga pico son decenas de asesores, no decenas de miles de peticiones por segundo. La ganancia de throughput de Fastify es irrelevante aquí, y su adaptador introduce fricción real con gateways de WebSocket y middlewares que asumen Express. Sería cambiar rendimiento innecesario por riesgo en la pieza más crítica del sistema.

## 3.3 Base de datos — DECISIÓN CERRADA

- PostgreSQL 18 como base de datos principal.
- PostgreSQL es la fuente definitiva del estado.
- ORM principal: Prisma 8.
- Para operaciones críticas de concurrencia se permite SQL PostgreSQL explícito y transaccional.
- No usar MongoDB como BD principal.
- No usar Firebase como motor de cola.
- No almacenar videos dentro de PostgreSQL.

**Razón de PostgreSQL:** el modelo es fuertemente relacional y el problema central es concurrencia. `FOR UPDATE SKIP LOCKED`, índices parciales para invariantes, window functions para percentiles de espera y transacciones robustas son exactamente lo que este dominio necesita.

**Razón de Prisma:** modelos tipados, migraciones sólidas y velocidad de desarrollo en el 90% del sistema, que es CRUD administrativo. El 5-10% crítico de la cola se resuelve con SQL explícito. Verificar al inicio del proyecto si otros sistemas de la organización usan otro ORM; la consistencia entre proyectos puede pesar más que la preferencia técnica.

## 3.4 Frontend web — DECISIÓN CERRADA

- React.
- TypeScript.
- Vite.
- Tailwind CSS.
- shadcn/ui.
- TanStack Query para estado del servidor.
- Zustand únicamente para estado local/UI cuando sea necesario.
- React Hook Form para formularios.
- Zod para validaciones y contratos.
- Motion para animaciones web.

**Razón de descartar Next.js:** no hay SEO, no hay páginas públicas indexables, no hay necesidad de SSR. Es una aplicación empresarial altamente interactiva detrás de login. Next.js agregaría complejidad de Server Components y despliegue sin aportar nada.

## 3.5 Kiosco — DECISIÓN CERRADA

El kiosco de toma de turnos será **WEB**, no una APK Android.

El **perfil de despliegue de referencia V1 del atril** es **Ubuntu Desktop endurecido + Chromium en modo kiosco**. Ubuntu Server + compositor kiosco (`cage`) + Chromium fue considerada como alternativa de infraestructura, pero no es el perfil V1 seleccionado. Esta decisión no convierte en PASS las validaciones físicas del equipo real ni crea una dependencia arquitectónica de Ubuntu Desktop para TURNOX Kiosk.

TURNOX Kiosk continúa siendo una aplicación web React + TypeScript + Vite, ejecutada mediante navegador y desacoplada del sistema operativo en la medida técnicamente posible. La aplicación React del kiosco permanece separada del sistema operativo. El Print Agent continúa siendo un servicio local independiente; no forma parte de Chromium ni del escritorio.

- React + TypeScript + Vite.
- Bundle y despliegue separados de la consola administrativa.
- Optimizado para pantalla táctil.
- Sin login del usuario final.
- Pantalla completa.
- Retorno automático al inicio tras cada operación o timeout de inactividad.
- Ejecutado en Chromium en modo kiosco dentro del perfil de despliegue V1.

**Razón:** el atril del despliegue inicial V1 utiliza Linux, donde una APK no es viable. Mantener TURNOX Kiosk como aplicación web permite incorporar en el futuro otros perfiles de despliegue con navegador sin desarrollar y mantener un cliente nativo por plataforma, lo cual importa si el producto se comercializa. El costo aceptado de esta decisión es la necesidad de un Print Agent local (sección 21), cuyo soporte inicial es Linux/Ubuntu mediante un adapter de plataforma.

## 3.6 Pantalla de sala / TV — DECISIÓN CERRADA

Aplicación Android nativa.

- Kotlin.
- Jetpack Compose.
- Compose for TV.
- Media3 / ExoPlayer para video.
- Coroutines + Flow.
- Room y/o DataStore para cache y configuración local.
- Hilt para inyección de dependencias.
- Arquitectura Clean + MVVM/MVI + flujo unidireccional.
- La app debe operar como aplicación dedicada y autoarrancar. El mecanismo exacto (launcher, Device Owner / Lock Task u otro soportado) se define en Fase 0 según el hardware.

**Razón de descartar WebView y React Native:** el reproductor debe cachear video localmente, manejar audio con ducking, sobrevivir a reinicios y operar como aplicación dedicada. Eso es trabajo nativo. Un WebView en un box económico además puede rendir mal con video y animaciones simultáneos.

## 3.7 Infraestructura — DECISIÓN CERRADA

- Docker.
- Docker Compose.
- Nginx.
- Operación **local-first dentro de la LAN**.
- El sistema debe seguir operando aunque se caiga Internet externo. La LAN sí debe permanecer disponible.
- Los videos deben estar disponibles localmente o previamente cacheados en la pantalla.
- El almacenamiento multimedia se abstrae mediante `StorageProvider`.
- En V1: disco local o NAS servido por Nginx.
- No casarse obligatoriamente con MinIO.

**Razón:** si el enlace a Internet de la institución cae, las salas de espera no pueden quedar sin llamados ni sin video. Todo servicio administrado en la nube rompería ese principio. Internet se usa solo para respaldos externos y actualizaciones.

**Razón de `StorageProvider` sobre MinIO fijo:** disco local + Nginx es suficiente en V1 y elimina un contenedor del Compose. La abstracción permite migrar a MinIO o S3 después sin tocar el dominio.

---

# 4. APLICACIONES Y ARTEFACTOS DESPLEGABLES

TURNOX tendrá **cinco artefactos de aplicación desplegables**. PostgreSQL, Redis y Nginx son infraestructura, no aplicaciones de producto.

## 4.1 TURNOX API — Backend

Aplicación NestJS + TypeScript responsable de:

- API REST;
- autenticación y autorización;
- reglas de dominio;
- motor de turnos;
- concurrencia;
- auditoría;
- Outbox y Event Log;
- realtime;
- reportes;
- dispositivos;
- trabajos de impresión.

## 4.2 TURNOX Console — Web

Una sola aplicación web para administradores, supervisores y asesores. Roles y permisos controlan opciones y operaciones.

**No crear aplicaciones web separadas para administrador y asesor.**

## 4.3 TURNOX Kiosk — Web

Aplicación React independiente para el atril.

Es una aplicación web ejecutada mediante navegador y no depende arquitectónicamente de Ubuntu Desktop. El navegador es el runtime del Kiosk Web; el perfil Ubuntu Desktop endurecido + Chromium corresponde al despliegue inicial V1 del atril.

Responsabilidades:

- mostrar servicios;
- interacción táctil;
- generar turno;
- persistir una intención pendiente;
- recuperar una creación cuyo resultado no se recibió;
- solicitar impresión;
- mostrar número generado;
- retornar automáticamente al inicio;
- contingencia ante caída de backend o impresión.

## 4.4 TURNOX Print Agent — Servicio local

Servicio local que ejecuta impresión física y mantiene un canal saliente autenticado con TURNOX API.

En V1 tendrá soporte oficial sobre Linux/Ubuntu. `systemd`, `udev` y el acceso local a la impresora pertenecen al adapter/plataforma Linux, no al dominio ni a TURNOX Kiosk Web. En el futuro podrán agregarse adapters para otros sistemas operativos sin modificar el dominio ni la aplicación web del kiosco.

## 4.5 TURNOX Display — Android TV

Aplicación Android nativa responsable de:

- llamados visuales;
- anuncios de voz;
- multimedia;
- cache;
- pairing;
- heartbeat;
- cursor/replay realtime;
- recuperación tras desconexión.

---

# 5. PRINCIPIOS DE DISEÑO — INVARIANTES

## 5.1 PostgreSQL es la verdad

Todo turno, cambio de estado, sesión de asesor, llamado, rellamado, transferencia, impresión y auditoría crítica debe quedar persistido en PostgreSQL.

**Redis puede desaparecer y el sistema no debe perder turnos.**

Comportamiento esperado durante una caída de Redis:

- Los llamados se siguen registrando en PostgreSQL normalmente.
- El Outbox conserva los eventos pendientes.
- **En despliegue de una sola instancia de API, el canal Socket.IO local debe poder seguir publicando sin depender de Redis.**
- Redis se utiliza como adapter/fanout cuando existen múltiples instancias o para capacidades distribuidas adicionales.
- Si el broadcast no pudo entregarse por ninguna vía, la pantalla se resincroniza por REST al reconectar.
- La consecuencia aceptable es retraso temporal; **nunca pérdida del turno ni corrupción del estado**.

**INVARIANTE:** Redis no debe convertirse en un punto único de fallo para el anuncio en una instalación de una sola instancia.

## 5.2 El frontend nunca decide reglas críticas

React no decide:

- cuál es el siguiente turno;
- quién tiene prioridad;
- si un asesor puede tomar un servicio;
- si un módulo está ocupado;
- si una transición de estado es válida.

Estas reglas viven en backend y, cuando sea posible, están reforzadas por constraints de PostgreSQL.

## 5.3 Los dispositivos nunca escriben directo a PostgreSQL

Ruta única:

`Cliente -> API -> Caso de uso -> Dominio -> Repositorio -> PostgreSQL`

## 5.4 Los timestamps importantes los genera el servidor

No confiar en el reloj de kioscos, PCs de asesores, boxes ni televisores.

Zona horaria operativa inicial: `America/Bogota`.

Nota: esto no exime a los dispositivos de tener hora correcta. Ver sección 32.

## 5.5 Operación sin Internet externo

La caída de Internet no debe impedir:

- emitir turno;
- imprimir ticket;
- llamar turno;
- iniciar y finalizar atención;
- mostrar turnos en pantalla;
- reproducir voz local;
- reproducir videos ya sincronizados.

---

# 6. MODELO ORGANIZACIONAL

TURNOX debe prepararse desde el esquema inicial para múltiples organizaciones y sedes.

Jerarquía:

```
Organización
  -> Sedes
     -> Salas
        -> Módulos
        -> Pantallas
        -> Kioscos
     -> Servicios
     -> Usuarios
```

Agregar desde el principio `organizacion_id` y `sede_id` en todas las tablas relevantes.

**No construir todavía:** facturación SaaS, suscripciones, reseller, marketplace, Row Level Security ni maquinaria multi-tenant.

Preparar el modelo sí. Construir maquinaria comercial todavía no.

**Razón:** agregar las columnas ahora cuesta casi nada. Agregarlas después, con datos en producción, es una migración dolorosa.

---

# 7. ROLES Y PERMISOS

RBAC con permisos, no roles hardcodeados.

| Rol | Alcance |
|---|---|
| Superadministrador | Acceso total del producto |
| Administrador | Configuración de su organización y sede |
| Supervisor | Monitorea operación, turnos, asesores y métricas |
| Asesor | Llama, rellama, atiende, transfiere y finaliza turnos permitidos |

Los permisos se validan **siempre** en backend. El frontend solo oculta o muestra.

---

# 8. MÓDULOS DEL BACKEND

Son límites lógicos dentro del monolito modular, no microservicios.

| Módulo | Responsabilidad |
|---|---|
| Identity | Login y sesiones de autenticación |
| Authorization | Roles, permisos y autorización |
| Organizations | Organizaciones |
| Locations | Sedes |
| Users | Usuarios y asesores |
| Services | Servicios, prefijos y configuración |
| ServiceAssignments | Asesor ↔ servicios autorizados |
| Rooms | Salas y áreas de espera |
| Counters | Módulos / puestos físicos |
| AdvisorSessions | Propiedad asesor-módulo, lease, fencing y estado operativo |
| Tickets | Turno global, consecutivo y estado |
| TicketJourney | Etapas del recorrido (`TicketStage`) |
| Queue | Selección del siguiente turno elegible |
| Calls | Llamados y rellamados |
| Transfers | Transferencias entre etapas/servicios |
| Devices | Inventario y estado de dispositivos |
| Kiosks | Configuración de kioscos |
| Displays | Configuración de pantallas |
| Printing | `PrintJob`, `PrintAttempt`, reimpresión y recuperación |
| Media | Multimedia |
| Playlists | Listas y programación |
| Idempotency | Recibos de comandos e idempotency keys |
| Realtime | Socket.IO, rooms y sesiones realtime |
| RealtimeEventLog | Eventos persistentes, secuencia y replay |
| Outbox | Publicación transaccional confiable |
| Reports | KPIs |
| Audit | Auditoría funcional y administrativa |

Ejemplos de servicios: reclamar fórmula, autorizaciones, facturación, información y entrega de resultados.

---

# 9. MÁQUINA DE ESTADOS DEL TURNO — INVARIANTE

No implementar estados mediante `if` dispersos. Debe existir una State Machine explícita, con tabla de transiciones validada en dominio.

## 9.1 Estados persistentes del turno

Estados principales:

```text
EN_ESPERA -> LLAMADO -> EN_ATENCION -> ATENDIDO
```

Estados terminales o alternativos:

```text
NO_PRESENTADO
CANCELADO
NO_ATENDIDO_CIERRE
```

**DECISIÓN:** `TRANSFERIDO` no es un estado persistente principal del turno. Una transferencia es un **evento de dominio** y un registro auditable que modifica destino, servicio, prioridad o cola según las reglas. Después de transferirse, el turno normalmente regresa a `EN_ESPERA` en su destino.

**DECISIÓN:** no se introduce `EMITIDO` en V1 salvo que aparezca un caso real donde un turno deba existir persistentemente pero todavía no pertenecer a la cola. La creación exitosa del turno deja el ticket directamente en `EN_ESPERA`.

Ejemplos:

- `EN_ESPERA -> LLAMADO` es válido.
- `LLAMADO -> EN_ATENCION` es válido.
- `EN_ATENCION -> ATENDIDO` es válido.
- `ATENDIDO -> EN_ESPERA` es inválido salvo caso de negocio explícito, excepcional y auditado.

Toda transición queda auditada con actor, módulo, sala cuando aplique y timestamp del servidor.

## 9.2 Transferencia como evento

Una transferencia debe registrar, como mínimo:

- `ticket_id`;
- servicio origen y destino;
- módulo origen y destino cuando aplique;
- sala origen y destino cuando aplique;
- asesor que transfiere;
- razón;
- timestamp del servidor;
- política aplicada sobre tiempo de espera y prioridad.

Después de la transferencia, el turno vuelve a `EN_ESPERA` en la cola destino salvo que una regla de negocio específica indique otra cosa.

---

# 10. MODELO DE IMPRESIÓN — SEPARADO DEL TURNO

La impresión es un eje independiente del estado del turno.

## 10.1 PrintJob

`PrintJob` representa una intención lógica de imprimir un ticket concreto.

Estados conceptuales:

```text
PENDIENTE
PROCESANDO
IMPRESO
FALLO
RESULTADO_DESCONOCIDO
CANCELADO
```

`REIMPRESO` no es un estado final. Una reimpresión deliberada crea un **nuevo `PrintJob`** con nuevo `print_job_id` y referencia `reprint_of_job_id`.

## 10.2 PrintAttempt

Cada ejecución física pertenece a un `PrintJob`.

Campos mínimos conceptuales:

- `print_attempt_id`;
- `print_job_id`;
- número de intento;
- estado;
- timestamps;
- error/telemetría.

Estados conceptuales:

```text
PREPARADO
ENVIANDO
CONFIRMADO
FALLO_ANTES_DE_ENVIO
FALLO_CONFIRMADO
RESULTADO_DESCONOCIDO
```

Antes de enviar bytes a la impresora, el Print Agent persiste localmente el intento.

Si el proceso o mini-PC reinicia y encuentra un intento que quedó `ENVIANDO` sin resultado final, debe tratarlo como `RESULTADO_DESCONOCIDO`.

## 10.3 Límite físico

PostgreSQL y SQLite pueden ser transaccionales. La impresión física de una POS externa no forma parte de esas transacciones.

Por tanto, TURNOX **no promete exactly-once físico absoluto** en el caso extremo donde el papel sale y el agente pierde energía antes de persistir la confirmación.

La garantía correcta es:

- no repetir automáticamente trabajos confirmados;
- no repetir automáticamente resultados desconocidos;
- distinguir retry de reprint;
- permitir reimpresión deliberada y auditada;
- minimizar tickets físicos duplicados.

---

# 11. SESIÓN ASESOR-MÓDULO — INVARIANTE DE OCUPACIÓN

## 11.1 Apertura

1. Asesor autentica.
2. Selecciona un módulo permitido y disponible.
3. Se crea `AdvisorSession`.
4. PostgreSQL garantiza una única sesión operativa propietaria por módulo.

## 11.2 Estados operativos

```text
DISPONIBLE
OCUPADA
PAUSADA
RECUPERACION_REQUERIDA
CERRADA
CERRADA_POR_INACTIVIDAD
CERRADA_POR_SUPERVISOR
```

Reglas:

- `DISPONIBLE`: puede tomar un turno.
- `OCUPADA`: tiene un turno activo en `LLAMADO` o `EN_ATENCION`.
- `PAUSADA`: no toma turnos.
- `RECUPERACION_REQUERIDA`: perdió conectividad con trabajo activo; no se libera automáticamente.

**La sesión queda `OCUPADA` desde que el turno pasa a `LLAMADO`.**

## 11.3 Un turno activo máximo por sesión — INVARIANTE

Una `AdvisorSession` admite como máximo **un turno activo simultáneo**.

La base de datos debe reforzar:

- una sesión operativa activa por módulo;
- una asignación activa por `advisor_session_id`;
- una asignación activa por `ticket_id`.

No basta con deshabilitar botones en React.

## 11.4 Fencing token

Cada sesión operativa tiene un `fencing_token` opaco y versionado.

Todo comando mutante del asesor incluye:

- `advisor_session_id`;
- `fencing_token`;
- `command_id`.

Si el módulo fue reasignado o la sesión perdió propiedad, el token anterior se rechaza aunque una pestaña antigua siga abierta.

## 11.5 Idempotencia de comandos del asesor

Acciones como:

- llamar siguiente;
- llamar turno específico;
- rellamar;
- iniciar atención;
- finalizar;
- no presentado;
- transferir;
- pausar/reanudar;

usan un `command_id` único por intención.

El backend persiste un recibo del comando. Repetir el mismo `command_id` devuelve el resultado canónico y no ejecuta una segunda mutación.

## 11.6 Sesiones huérfanas

Heartbeat ausente **no demuestra que la atención presencial terminó**.

### Sin turno activo

Una sesión `DISPONIBLE` o `PAUSADA` puede cerrarse por timeout y liberar módulo.

### Con turno `LLAMADO` o `EN_ATENCION`

La sesión pasa a `RECUPERACION_REQUERIDA`.

Mientras se resuelve:

- módulo permanece reservado;
- no se asignan nuevos turnos;
- el mismo cliente puede recuperar la sesión durante una gracia configurable;
- una sesión obsoleta no puede ejecutar comandos si ya fue reemplazada.

Si no se recupera:

- un supervisor resuelve explícitamente;
- un turno `EN_ATENCION` nunca vuelve automáticamente a la cola;
- un turno `LLAMADO` solo se reencola, reasigna o marca no presentado según política auditable.

---

# 12. POLÍTICA PARA ELEGIR SIGUIENTE TURNO

Usar Strategy Pattern. La política no debe quedar codificada rígidamente como FIFO.

Debe poder contemplar:

- FIFO.
- Atención preferencial.
- Prioridad ponderada.
- Aging.
- Round-robin entre servicios.
- Políticas futuras configurables por sala u organización.

El motor considera:

1. Servicios autorizados al asesor.
2. Estado de la sesión del asesor (`DISPONIBLE`).
3. Sede.
4. Sala y módulo.
5. Turnos en estado `EN_ESPERA`.
6. Prioridad.
7. Tiempo esperando.
8. Reglas configuradas.

La estrategia debe ser una **función pura**, testeable sin base de datos.

## 12.1 Llamado de turno específico

Además de "llamar siguiente", el asesor debe poder llamar **un turno puntual** por su número.

Casos reales: el paciente salió y regresó, el turno fue transferido a ese módulo, o el supervisor pide atender un caso concreto.

Esta operación pasa por las mismas validaciones de autorización, estado y concurrencia que el llamado automático, y queda auditada indicando que fue un llamado dirigido.

---

# 13. ATENCIÓN PREFERENCIAL — REQUISITO NORMATIVO

En Colombia esto no es una funcionalidad opcional. Es obligación legal derivada de la Ley 1171 de 2007 (adulto mayor), la Ley 1618 de 2013 (personas con discapacidad) y la normativa de atención a gestantes.

Debe existir desde una fase temprana, no como mejora posterior.

Categorías configurables por organización:

- Adulto mayor.
- Persona con discapacidad.
- Gestante.
- Otras definidas por la organización.

**No permitir starvation de la cola normal.** Usar aging: un turno normal que espera demasiado aumenta progresivamente su prioridad efectiva hasta competir con los preferenciales.

Los parámetros de aging deben ser configurables y estar cubiertos por pruebas unitarias.

---

# 14. CONCURRENCIA — REQUISITO CRÍTICO / INVARIANTE

`FOR UPDATE SKIP LOCKED` evita que dos consumidores tomen la misma fila bloqueada, pero no impide que la misma sesión tome dos turnos diferentes.

TURNOX protege cuatro invariantes simultáneamente:

1. un turno no puede estar activo con dos asesores;
2. una sesión no puede tener dos turnos activos;
3. un módulo no puede tener dos sesiones propietarias;
4. un mismo comando no puede aplicarse dos veces.

## 14.1 Transacción "Llamar siguiente"

En una única transacción:

1. validar `command_id`;
2. bloquear/validar `AdvisorSession`;
3. validar `fencing_token`;
4. exigir sesión `DISPONIBLE`;
5. comprobar que no exista asignación activa para esa sesión;
6. validar jornada operativa vigente;
7. seleccionar ticket elegible con `FOR UPDATE SKIP LOCKED`;
8. crear asignación activa;
9. sesión -> `OCUPADA`;
10. ticket -> `LLAMADO`;
11. actualizar etapa;
12. registrar Call, auditoría y evento persistente;
13. escribir Outbox;
14. persistir command receipt;
15. commit.

## 14.2 Constraints PostgreSQL

Reforzar:

- una sesión operativa activa por módulo;
- una asignación abierta por sesión;
- una asignación abierta por ticket;
- unicidad de `command_id` según alcance;
- unicidad de claves de idempotencia.

## 14.3 Pruebas obligatorias

- 50 asesores diferentes llaman simultáneamente: cero turnos duplicados.
- un asesor desde dos pestañas llama simultáneamente: un solo turno.
- doble clic con mismo `command_id`: mismo resultado.
- pestaña antigua con fencing token vencido: rechazada.

---

# 15. CONSECUTIVOS

Los consecutivos deben generarse de forma atómica.

Ejemplo:

```
Servicio Fórmulas:    F001, F002, F003
Servicio Información: I001, I002
```

La clave lógica del consecutivo puede depender de organización, sede, servicio y día operativo.

No depender de lógica vulnerable a race conditions (leer el último y sumar uno). Debe existir una estrategia atómica de secuencias por clave lógica, resuelta en una sola operación de base de datos.

No usar secuencias nativas de PostgreSQL: no se reinician limpiamente por día ni por clave compuesta.

---

# 16. DÍA OPERATIVO — INVARIANTE DE ELEGIBILIDAD

Cada turno pertenece explícitamente a una jornada (`operational_day_id` o equivalente).

## 16.1 El job de cierre no es la autoridad

El job de cierre es reconciliación/mantenimiento.

Cada operación que seleccione o vuelva a poner un ticket en cola debe validar la jornada vigente:

- llamar siguiente;
- llamado dirigido;
- reencolado;
- transferencia;
- recuperación.

Un ticket de ayer no puede llamarse hoy aunque el job programado no se haya ejecutado.

## 16.2 Recuperación de jornadas

Al iniciar el servidor se reconcilian jornadas anteriores que hayan quedado abiertas por caída o apagón.

## 16.3 Operaciones en el borde del cierre

Regla inicial:

- `EN_ATENCION` puede finalizar después de la hora de cierre manteniendo su jornada original;
- `LLAMADO` dispone de una gracia configurable y luego requiere resolución;
- un ticket vencido nunca migra silenciosamente a la cola del día siguiente;
- una transferencia que cree una nueva espera después del cierre se rechaza o exige decisión explícita según política.

---

# 17. IDEMPOTENCIA EN LA CREACIÓN DE TURNOS — REQUISITO CRÍTICO

La idempotencia de creación debe ser **durable**, no una ventana corta en memoria.

## 17.1 Intención local

Antes del POST, el kiosco crea una `idempotency_key` y persiste localmente la intención pendiente.

La petición incluye:

- `kiosk_id`;
- `idempotency_key`;
- fingerprint del payload relevante;
- versión del contrato.

Backend persiste la clave y el resultado canónico.

Reglas:

- misma clave + mismo fingerprint => mismo turno;
- misma clave + payload incompatible => conflicto;
- nunca crear otro turno por timeout o reintento.

## 17.2 Respuesta perdida y reinicio

Escenario:

1. API crea F025 y hace commit.
2. Se pierde la respuesta.
3. Kiosco reinicia.

Al arrancar, recupera la intención pendiente y reintenta **la misma `idempotency_key`** hasta obtener el resultado canónico.

Solo al completar el flujo se crea una nueva clave para el próximo usuario.

## 17.3 Retención

Backend conserva los recibos al menos durante la jornada operativa más un margen de recuperación.

No deduplicar por "mismo servicio dentro de X segundos"; pueden existir dos usuarios distintos consecutivos.

## 17.4 UX

Bloquear el botón al primer toque y dar feedback inmediato, pero la garantía real vive en backend.

---

# 18. ENRUTAMIENTO DEL LLAMADO: DESTINO, ESPERA Y COBERTURA

No confundir dónde se atiende con dónde está esperando la persona.

TURNOX distingue:

1. **Destino de atención**: módulo/sala destino.
2. **Contexto de espera actual**: área donde se espera que la persona pueda ver/u oír el llamado.
3. **Cobertura del anuncio**: pantallas/salas que reciben un llamado concreto.

## 18.1 Destino

El módulo define su ubicación de atención.

Ejemplo:

`Módulo 7 -> Segundo piso`.

## 18.2 Contexto de espera

El ticket puede mantener un `current_waiting_room_id` o equivalente **mutable**.

Al crearse suele derivarse del kiosco.

En una transferencia puede cambiar explícitamente si la persona debe esperar en otra zona.

## 18.3 CallTargets

Cada `Call` persiste sus destinos de anuncio.

Puede incluir:

- sala donde actualmente espera la persona;
- sala del módulo destino;
- otras áreas configuradas.

Así alguien esperando en primer piso puede recibir:

"Turno A025, diríjase al módulo 7, segundo piso".

## 18.4 Transferencias

Una transferencia define:

- nuevo destino;
- nuevo contexto de espera cuando aplique;
- cobertura de próximos llamados.

No asumir que "módulo en segundo piso" equivale a "solo anunciar en segundo piso".

## 18.5 Audio

Todas las pantallas objetivo muestran el llamado visualmente. Solo una autoridad de audio por sala reproduce voz; ver sección 35.

---

# 19. TRANSFERENCIAS Y RECORRIDO POR ETAPAS

Una transferencia es un evento de dominio, no un estado global permanente del ticket.

## 19.1 TicketStage

Un ticket puede recorrer varios servicios.

Cada tramo se modela como `TicketStage`.

Campos conceptuales:

- `stage_id`;
- `ticket_id`;
- orden;
- `service_id`;
- `queue_entered_at`;
- `first_called_at`;
- `service_started_at`;
- `service_completed_at`;
- resultado de etapa;
- origen;
- vínculo a etapa siguiente cuando exista.

## 19.2 Transferencia

Al transferir:

1. registrar evento;
2. cerrar etapa actual con resultado de etapa `TRANSFERRED`;
3. crear nueva etapa;
4. estado global vuelve normalmente a `EN_ESPERA`;
5. definir contexto de espera/cobertura;
6. auditar actor, origen, destino y razón.

## 19.3 Métricas vs prioridad

Conservar antigüedad para prioridad **no significa mezclar tiempos**.

TURNOX debe medir por separado:

- espera etapa 1;
- atención etapa 1;
- espera etapa 2;
- atención etapa 2;
- tiempo total del recorrido.

No usar un único `waiting_time` para todo el recorrido.

---

# 20. FLUJO DEL KIOSCO WEB

## Inicio

Mostrar: *"Seleccione el servicio por el cual desea ser atendido"*.

Servicios como botones grandes, con áreas táctiles amplias. Diseñar y probar con dedo, no con mouse.

## Selección

El usuario toca, por ejemplo, "Reclamar fórmula".

La UI bloquea inmediatamente el botón y muestra feedback.

## Creación

El kiosco llama a la API con clave de idempotencia.

Backend: valida servicio, genera consecutivo, crea turno, persiste, devuelve el turno. Ejemplo: F025.

## Impresión

El backend encola un trabajo de impresión para el kiosco correspondiente. El Print Agent lo recibe e imprime. Ver sección 21.

## Confirmación

Pantalla: *"Su turno es F025"*, con mensaje de conservar el ticket y esperar el llamado.

## Retorno

Tras algunos segundos, volver automáticamente al inicio.

---

# 21. TURNOX PRINT AGENT

## 21.1 Topología

El Print Agent mantiene una conexión saliente autenticada hacia TURNOX API.

```text
Kiosk Web -> TURNOX API -> Print Agent -> ESC/POS -> Impresora
```

El navegador no llama directamente a `localhost`.

## 21.2 Implementación

- Node.js + TypeScript.
- soporte oficial V1 sobre Linux/Ubuntu;
- `systemd` y `udev` como detalles del adapter/plataforma Linux;
- `apps/print-agent`;
- contratos compartidos;
- SQLite o storage embebido equivalente;
- pairing y credencial propia.

## 21.3 ESC/POS

V1 usa ESC/POS directo para reducir capas y controlar el dispositivo.

CUPS puede operar en modo raw; por tanto no se afirma que CUPS sea inherentemente incompatible. Simplemente no es una dependencia necesaria para V1.

Usar:

- regla `udev`;
- `PrinterAdapter`;
- SDK oficial cuando aporte mejor telemetría/estado.

## 21.4 PrintJob + PrintAttempt

Backend crea `PrintJob`.

Agente ejecuta uno o más `PrintAttempt`.

Antes del envío físico:

1. persistir localmente `print_job_id` y `print_attempt_id`;
2. marcar intento `PREPARADO`/`ENVIANDO`;
3. enviar bytes.

Si el agente reinicia con un intento `ENVIANDO` sin resultado final:

- marcar `RESULTADO_DESCONOCIDO`;
- no reenviar automáticamente.

## 21.5 Idempotencia persistente

Si llega un `print_job_id` ya confirmado:

- no imprimir nuevamente;
- devolver ACK almacenado.

Un fallo confirmado **antes** de producir efecto físico puede permitir otro `PrintAttempt` del mismo job según política.

Un resultado desconocido nunca activa retry automático ciego.

## 21.6 Reimpresión deliberada

"Reimprimir F025" crea:

- nuevo `print_job_id`;
- `reprint_of_job_id`;
- actor/razón;
- auditoría.

Así se diferencia reentrega accidental, retry seguro y reprint intencional.

## 21.7 Responsabilidades

- autoarranque;
- pairing;
- conexión saliente;
- idempotencia local;
- impresión;
- ACK;
- telemetría;
- heartbeat;
- logs;
- recuperación tras reinicio;
- no exponer puerto de red.

---

# 22. REGLA FUNDAMENTAL: TURNO ≠ IMPRESIÓN — INVARIANTE

Crear el turno y materializarlo en papel son operaciones distintas.

Si se creó A025 y la POS falla:

**NO se crea A026 por reintentar.**

Persistir por `PrintJob`:

- `print_job_id`;
- `ticket_id`;
- `kiosk_id`;
- `printer_id`;
- estado;
- timestamps;
- relación de reimpresión.

Persistir por `PrintAttempt`:

- `print_attempt_id`;
- `print_job_id`;
- número de intento;
- estado;
- timestamps;
- error/telemetría.

Definiciones:

- **retry**: otro intento controlado del mismo job cuando se conoce que no hubo efecto físico;
- **reprint**: nuevo job explícito y auditado para emitir otra copia;
- **unknown**: resultado incierto; nunca retry automático ciego.

---

# 23. RECUPERACIÓN DE IMPRESIÓN

Ante fallo:

- conservar turno;
- registrar fallo;
- no crear otro turno;
- informar al kiosco/operador;
- alertar si persiste.

Cuando el hardware lo permita, distinguir:

- sin papel;
- tapa abierta;
- offline;
- fallo antes de enviar;
- fallo confirmado;
- resultado desconocido.

## 23.1 Resultado desconocido

Si pudo salir el papel pero no existe confirmación durable:

- `RESULTADO_DESCONOCIDO`;
- no retry automático;
- resolución explícita;
- reimpresión deliberada si corresponde.

## 23.2 Reinicio del agente

Al arrancar:

- leer intentos locales no finalizados;
- reconciliar con backend;
- intento `ENVIANDO` sin resultado => `RESULTADO_DESCONOCIDO`;
- nunca asumir "reinició, por tanto no imprimió".

---

# 24. KIOSCO — MODO DEGRADADO

Para el MVP: si el backend no responde, **el kiosco NO emite turnos offline**.

Mostrar: *"Servicio temporalmente no disponible. Por favor diríjase a recepción."*

**Razón:** emitir offline introduce colisión de consecutivos, necesidad de reconciliación, huecos en la numeración y complejidad de auditoría.

Puede evaluarse más adelante mediante folios preasignados si existe un requisito real y medido.

---

# 25. TURNOX DISPLAY — COMPORTAMIENTO

La función primaria de Display es recibir y mostrar llamados. Multimedia es secundaria.

## 25.1 Arranque

Orden:

1. cargar identidad local;
2. validar hora/TLS;
3. autenticar;
4. obtener configuración mínima;
5. establecer realtime y ejecutar resincronización;
6. declararse listo para llamados;
7. iniciar heartbeat;
8. reproducir multimedia cacheada válida;
9. sincronizar multimedia nueva en segundo plano.

**Nunca bloquear el canal de llamados esperando descargas de video.**

## 25.2 Procesamiento de llamado

1. validar `event_id`/`event_seq`;
2. validar vigencia del anuncio;
3. aplicar estado;
4. encolar anuncio;
5. ducking;
6. mostrar turno/módulo/destino;
7. reproducir voz solo si tiene autoridad de audio;
8. persistir cursor;
9. confirmar procesamiento;
10. retomar multimedia.

## 25.3 Plataforma

- modo dispositivo dedicado según hardware;
- autoarranque;
- recuperación tras boot;
- `keepScreenOn`;
- protección de burn-in;
- control de salida de audio cuando el hardware lo permita.

---

# 26. PAIRING DE DISPOSITIVOS

No usar usuario y contraseña con control remoto ni configuración manual de URLs.

Primer arranque del dispositivo:

```
TURNOX Display
Código: 839241
```

El administrador entra a TURNOX Console, va a Dispositivos, selecciona el código y asigna organización, sede, sala y nombre del dispositivo.

El dispositivo obtiene una credencial segura y persistente, con alcance mínimo y posibilidad de rotación y revocación.

**El mismo mecanismo aplica a kioscos y a Print Agents.** Un solo flujo de aprovisionamiento para todos los dispositivos.

---

# 27. HEARTBEAT DE DISPOSITIVOS

Cada dispositivo reporta periódicamente:

- online/offline
- `last_seen`
- versión instalada
- tipo de dispositivo
- IP cuando corresponda
- espacio disponible
- playlist sincronizada
- estado de la impresora en el caso del Print Agent
- estado del reloj

Panel de ejemplo:

```
TV Recepción       ONLINE   v1.2.0
TV Segundo Piso    OFFLINE  hace 14 min
Kiosco Principal   ONLINE   v1.1.3
POS Kiosco         ERROR    sin papel
```

---

# 28. REALTIME Y GARANTÍAS DE ENTREGA

Socket.IO es el transporte realtime principal.

**No se asume entrega exactly-once.**

La corrección se obtiene mediante:

- eventos persistentes;
- `event_id`;
- `event_seq`;
- cursor persistente;
- idempotencia;
- replay;
- snapshot/reconciliación;
- vigencia del anuncio.

## 28.1 Una instancia

Socket.IO local funciona sin Redis.

## 28.2 Varias instancias

Redis puede usarse como adapter/fanout.

Redis no sustituye al Event Log ni define qué procesó cada pantalla.

## 28.3 Envelope realtime

Todo evento relevante contiene al menos:

- `event_id`;
- `event_seq` monotónico dentro del alcance definido;
- `event_type`;
- `schema_version`;
- `occurred_at`;
- organización/sede/sala/dispositivo según aplique;
- `expires_at` o información de vigencia;
- payload.

## 28.4 Orden y gaps

El cliente aplica eventos por secuencia dentro de su alcance.

Debe detectar gaps y solicitar replay/reconciliación.

## 28.5 Contrato

Los eventos se documentan mediante AsyncAPI y schemas versionados; ver sección 51.

---

# 29. TRANSACTIONAL OUTBOX + REALTIME EVENT LOG — OBLIGATORIO

Outbox resuelve la atomicidad entre una mutación de negocio y la intención de publicar.

**Outbox no demuestra que un Display recibió ni reprodujo un anuncio.**

## 29.1 Event Log persistente

En la transacción de negocio se crea un evento con:

- `event_id`;
- `event_seq`;
- tipo;
- `schema_version`;
- alcance;
- payload;
- timestamp;
- vigencia.

Debe conservarse suficiente tiempo para replay y diagnóstico.

## 29.2 Outbox

En la misma transacción se registra la intención de publicación.

```text
PostgreSQL
  -> Outbox Worker
     -> Realtime Publisher
        -> Socket.IO local
        -> Redis adapter si aplica
```

## 29.3 Retención

El Event Log no se elimina al publicar.

Definir una retención suficiente para:

- reconexiones;
- dispositivos temporalmente apagados;
- replay;
- soporte.

La auditoría de negocio puede tener una política de retención distinta y mayor.

---

# 30. IDEMPOTENCIA, ACK Y RECEIPTS

TURNOX protege al menos cuatro fuentes de duplicación:

| Riesgo | Identificador |
|---|---|
| Doble toque/reintento al crear turno | `idempotency_key` |
| Doble clic/reintento de comando asesor | `command_id` |
| Reentrega realtime | `event_id` + `event_seq` |
| Reentrega de impresión | `print_job_id` |

## 30.1 ACK no es exactly-once

Un ACK puede perderse. El emisor puede reenviar y el receptor debe reconocer identificadores ya aplicados.

## 30.2 Command receipts

Persistir:

- `command_id`;
- actor/sesión;
- tipo;
- fingerprint;
- resultado canónico;
- timestamp.

Misma clave + mismo payload => mismo resultado.

Misma clave + payload incompatible => conflicto.

## 30.3 Display receipts/cursor

Display persiste `last_applied_event_seq` y los datos necesarios para recuperación segura.

## 30.4 Print receipts

Print Agent persiste resultado de `print_job_id` para no repetir automáticamente un trabajo confirmado.

---

# 31. RESINCRONIZACIÓN SIN VENTANA DE PÉRDIDA — INVARIANTE

La secuencia "consultar REST y luego conectar Socket.IO" deja una carrera temporal.

TURNOX usa cursor/offset persistente y una sincronización coordinada.

## 31.1 Protocolo conceptual

Al conectar o reconectar:

1. Display envía `last_applied_event_seq`.
2. Servidor autentica y determina alcance.
3. Servidor captura `sync_high_watermark`.
4. Display obtiene snapshot operativo.
5. Se entregan/aplican eventos con:
   `last_applied_event_seq < event_seq <= sync_high_watermark`.
6. Eventos nuevos posteriores al high-water mark se conservan/bufferizan para entrega.
7. Cliente aplica en orden e idempotentemente.
8. Se completa `SYNC_READY`.
9. Comienza live stream desde el siguiente `event_seq`.

La implementación exacta puede variar, pero las pruebas deben demostrar **cero huecos** entre snapshot/replay y stream en vivo.

## 31.2 Connection State Recovery

La recuperación nativa de Socket.IO puede usarse como optimización para cortes breves.

No es la única garantía: si falla, TURNOX siempre puede reconstruirse desde Event Log + snapshot.

## 31.3 Reconstruir estado != anunciar por voz

Un evento recuperado puede ser necesario para consistencia, pero no ser correcto reproducirlo tarde.

Ejemplo: A025 fue llamado y luego atendido mientras la TV estaba desconectada. Al volver, Display debe reconstruir estado **sin anunciar A025**.

## 31.4 Vigencia del anuncio

Solo se reproduce voz si:

- sigue siendo el llamado vigente;
- el ticket continúa en estado compatible;
- no fue supersedido;
- está dentro de `announcement_ttl`;
- el Display pertenece todavía a los CallTargets.

Fuera de esas condiciones, el evento se aplica silenciosamente.

---

# 32. RELOJ Y SINCRONIZACIÓN HORARIA

Aunque los timestamps de negocio los genera el servidor (sección 5.4), los dispositivos necesitan hora correcta para tres cosas: **validación de certificados TLS**, vigencia de playlists y correlación de logs.

**Problema real:** los TV Box económicos no tienen batería de reloj. Tras un corte de energía arrancan con fecha inválida, la validación del certificado TLS falla y el dispositivo no conecta a nada. Se percibe como "la TV no funciona" y el diagnóstico toma horas.

Requisitos:

- NTP configurado contra un servidor de la LAN en boxes y en el mini-PC del atril.
- Verificación de hora válida **antes** de intentar conectar.
- Mensaje explícito en pantalla si la hora no es válida, indicando la causa.
- El estado del reloj se reporta en el heartbeat.

---

# 33. IDENTIDAD DE RED, DNS Y PKI/TLS — REQUISITO DE INFRAESTRUCTURA

TURNOX opera local-first dentro de la LAN, pero eso **no significa operar sin identidad de red ni sin TLS**.

Debe existir una estrategia explícita para:

- resolución DNS local;
- nombre estable del servidor TURNOX;
- HTTPS para Console y Kiosk;
- WSS/HTTPS para Display y Print Agent;
- emisión y renovación de certificados;
- trust de certificados en Chromium y Android;
- NTP local;
- rotación de credenciales.

No depender de IPs escritas manualmente en cada cliente.

## 33.1 DNS

Definir un nombre estable para el servicio en cada despliegue, por ejemplo mediante DNS corporativo o DNS local administrado.

El nombre exacto es **PENDIENTE de infraestructura** y no se inventa desde la aplicación.

## 33.2 TLS / PKI

Dos estrategias válidas:

1. Certificados públicos si el dominio y la infraestructura permiten renovación confiable.
2. CA interna administrada, instalando la confianza en el mini-PC y dispositivos Android administrados.

La estrategia final se decide antes del piloto.

**INVARIANTE:** no desactivar validación TLS para “hacer que funcione” en producción.

---

# 34. VOZ

## 34.1 Motor — DECISIÓN CERRADA

No depender del TextToSpeech del Android Box como motor principal.

**Razón:** los boxes económicos con frecuencia carecen de datos de voz en español, o traen un motor recortado. La pronunciación de identificadores alfanuméricos es inconsistente entre motores y versiones: "A025" puede salir como "a veinticinco", "a cero veinticinco" o deletreado. Cada sala sonaría distinta, y en una institución eso se percibe como sistema defectuoso.

Tampoco depender de TTS en la nube, porque violaría el principio de operación sin Internet.

**Implementación principal: fragmentos de audio locales.**

El vocabulario es finito y pequeño, del orden de 60 a 100 fragmentos:

- "Turno"
- Letras A–Z
- Dígitos 0–9
- "por favor diríjase"
- "módulo", "ventanilla", "consultorio"
- Números de módulo
- **Nombres de sala** (requerido por la sección 18.2)

Los fragmentos se generan una sola vez con voz neuronal de calidad en español, o se graban profesionalmente. Se empaquetan en el APK o se descargan al vincular el dispositivo.

Resultado: voz consistente en todas las salas, sin Internet, sin costo recurrente.

## 34.2 Abstracción

Definir una interfaz `VoiceEngine`. Implementación principal por fragmentos, con Android TextToSpeech como **fallback** si falta un fragmento.

No acoplar Display a un solo proveedor de voz.

---

# 35. COLA DE ANUNCIOS Y COORDINACIÓN DE AUDIO

## 35.1 Cola local

Un Display nunca reproduce dos anuncios simultáneamente.

Usa `AnnouncementQueue`.

## 35.2 Varias TVs en una sala

Dos TVs reproduciendo la misma voz con pocos milisegundos de diferencia producen eco.

Por ello cada sala/área de audio tiene una sola autoridad activa:

- una pantalla `AUDIO_PRIMARY`;
- otras `VISUAL_ONLY`;
- uno o más fallbacks opcionales.

## 35.3 Failover

Si `AUDIO_PRIMARY` queda offline:

- backend puede promover un fallback;
- usar lease/fencing para evitar dos líderes;
- todas las pantallas siguen mostrando visualmente;
- solo el líder reproduce voz.

Con una sola TV por sala, esta lógica se simplifica.

---

# 36. AUDIO: DUCKING Y VOLUMEN

## 36.1 Ducking

Durante un anuncio, el volumen del video baja; la voz se reproduce clara; al terminar, el volumen se restaura.

## 36.2 Volumen del box

La aplicación fija el nivel de salida de audio del box al arrancar, y el nivel debe ser ajustable remotamente desde TURNOX Console.

## 36.3 Volumen físico del televisor — REQUISITO OPERATIVO

**El box controla su propia salida de audio, no el volumen del televisor.**

Si alguien baja el volumen del TV con el control remoto, el sistema deja de anunciar audiblemente y se percibe como falla del software. No hay solución por código.

Requiere procedimiento operativo documentado: control remoto resguardado, volumen del televisor fijado en la instalación, y verificación incluida en la rutina de apertura de la sala.

Este punto debe quedar en el manual de instalación, no solo en el código.

## 36.4 HDMI-CEC — opcional

Si el box lo soporta, permite encender y apagar el televisor por horario desde la aplicación. No es prioridad para el MVP, pero evita que alguien tenga que subir físicamente a encender la TV cada mañana. Evaluar en la Fase 0.

---

# 37. LEGIBILIDAD Y ACCESIBILIDAD

La pantalla se diseña para distancia de visión, no para monitor de escritorio.

Regla práctica: **altura de carácter ≈ distancia de visión / 150**. A 6 metros, el número de turno necesita aproximadamente 4 cm de alto.

Esto es una restricción de diseño desde el primer mockup, no un ajuste final.

Prioridades visuales:

1. Número de turno.
2. Módulo (y sala destino si difiere).
3. Indicador visual llamativo.
4. Últimos llamados.
5. Multimedia.

**Accesibilidad:** conforme a la Ley 1618 de 2013, el anuncio visual debe ser autosuficiente para personas con discapacidad auditiva. Contraste y movimiento suficientes para no depender del audio.

**Rendimiento:** en TV usar únicamente animaciones compositadas por GPU (`transform` y `opacity` o su equivalente en Compose). Los boxes tienen GPU débil y cualquier animación que dispare layout produce tirones visibles.

---

# 38. MULTIMEDIA Y STORAGE

Los videos educativos e institucionales son administrables desde la consola.

PostgreSQL almacena **metadata**, nunca el archivo binario:

- id, nombre, descripción, ruta, duración, hash, estado, fecha de creación, organización.

El archivo vive en `StorageProvider`.

V1: disco local o NAS servido por Nginx, con soporte adecuado de rangos para streaming.

---

# 39. PLAYLISTS

El administrador crea playlists y las asocia a salas o pantallas.

Ejemplo:

```
Playlist Primer Piso:
  1. Lavado de manos
  2. Derechos del usuario
  3. Seguridad del paciente
  4. Servicios de la IPS
```

Atributos: orden, sala, pantalla, horario, vigencia por fechas.

Las playlists deben estar versionadas para que los cambios se propaguen a los dispositivos de forma detectable.

---

# 40. CACHE DE VIDEO Y LÍMITES DE ALMACENAMIENTO

TURNOX Display usa Media3 para cache/descarga.

Multimedia nunca tiene prioridad sobre el llamado.

## 40.1 Arranque y sincronización

- reproducir contenido cacheado válido;
- conectar/reconciliar realtime primero;
- descargar contenido nuevo en background;
- pausar/reducir descargas si afectan red o rendimiento.

## 40.2 Capacidad

No fijar una regla universal de "X GB = Y minutos". Depende de bitrate, resolución y códec.

La consola debe calcular/mostrar:

- bytes totales;
- espacio disponible reportado;
- margen reservado;
- advertencias de capacidad.

Soportar almacenamiento externo solo si hardware/operación lo justifican.

---

# 41. ACTUALIZACIÓN DE DISPOSITIVOS

Existen dos artefactos desplegados fuera del servidor: TURNOX Display (APK) y TURNOX Print Agent (servicio Linux).

**Problema:** un box Android TV típicamente no tiene Play Store operativa. Actualizar cuatro boxes a mano por USB es viable; actualizar cuarenta en tres sedes de un cliente comercial no lo es. Lo mismo aplica al Print Agent en N mini-PCs.

**Decisión (implementación posterior, empaquetado desde ahora):**

- Cada dispositivo consulta al backend si existe versión nueva.
- Descarga el artefacto desde el servidor local, no desde Internet.
- Se actualiza en ventana horaria fuera del horario de atención.
- La versión instalada se reporta en el heartbeat.
- Debe existir posibilidad de rollback.

No es necesario construir esto en V1, pero **sí debe estar decidido ahora**, porque condiciona cómo se empaquetan y firman ambos artefactos.

---

# 42. PRIVACY BY DESIGN — INVARIANTE

En pantalla pública.

**Permitido:**

```
A025
MÓDULO 4
```

**Prohibido:** nombre del paciente, documento, diagnóstico, medicamento, nombre de servicio sensible, cualquier dato clínico.

**Razón:** bajo la Ley 1581 de 2012 los datos de salud son categoría sensible. Mostrar el servicio junto al turno en una sala de espera puede revelar información clínica de una persona identificable.

La pantalla pública muestra el mínimo de información necesaria. Esta regla no se relaja por conveniencia de UX.

---

# 43. RETENCIÓN Y TRATAMIENTO DE DATOS

Si el kiosco llega a solicitar documento de identidad (decisión pendiente, sección 60), aplica la Ley 1581 de 2012 y su régimen de tratamiento de datos personales.

Requisitos en ese caso:

- Definir la finalidad del tratamiento.
- Definir el período de retención antes de anonimizar o eliminar.
- Implementar el job de anonimización desde el modelo, no después.
- Registrar la base de legitimación para el tratamiento.
- Documentar el flujo en la política de tratamiento de datos de la organización.

Si el kiosco solicita únicamente el servicio, sin identificar a la persona, este apartado no aplica al kiosco pero sí a cualquier integración futura con sistemas clínicos.

---

# 44. AUTENTICACIÓN Y SEGURIDAD

## 44.1 Usuarios web

- Contraseñas con **Argon2id**.
- Sesiones mediante cookies seguras: `HttpOnly`, `Secure`, `SameSite` apropiado.
- **No guardar tokens críticos en localStorage.**

## 44.2 Backend

- Rate limiting.
- Validación estricta de entrada.
- Autorización verificada siempre en servidor.
- Logs y auditoría.
- Headers de seguridad.
- HTTPS en producción, también dentro de la LAN.
- Rotación y revocación de credenciales.
- Bloqueo temporal tras intentos fallidos repetidos.

## 44.3 Dispositivos

- Pairing por código.
- Credenciales específicas por dispositivo.
- Alcance mínimo de permisos.
- Rotación y revocación desde la consola.
- El Print Agent no expone puertos en la red.

---

# 45. AUDITORÍA

Debe existir desde el inicio, no como fase final.

Historial operativo del turno, append-only:

```
09:30  F025  CREADO      Kiosco 1
09:48  F025  LLAMADO     Asesor Juan / Módulo 3 / Primer piso
09:49  F025  RELLAMADO
09:50  F025  EN_ATENCION
10:01  F025  ATENDIDO
```

Auditoría administrativa: quién creó un servicio, quién modificó un usuario, quién deshabilitó un módulo, quién transfirió un turno, quién cambió asignaciones, quién forzó el cierre de una sesión.

**Razón:** ante una PQRS o una auditoría de SIAU, la institución debe poder responder quién llamó qué turno, desde qué módulo y a qué hora.

---

# 46. REPORTES, RECORRIDO Y DEFINICIONES DE KPI

Los KPIs se derivan de eventos y etapas bien definidos.

## 46.1 Métricas globales

- emitidos;
- atendidos;
- no presentados;
- cancelados;
- no atendidos al cierre;
- transferidos;
- recorrido total;
- actualmente esperando.

## 46.2 Métricas por TicketStage

Para cada etapa:

- `queue_entered_at`;
- `first_called_at`;
- `service_started_at`;
- `service_completed_at`.

Derivar:

- espera hasta primer llamado;
- espera hasta inicio real;
- duración de atención;
- tiempo total de etapa.

No mezclar espera de un servicio con la de otro tras transferencia.

## 46.3 Métricas por asesor/módulo

- cantidad atendida;
- duración de atención;
- pausas;
- tiempo disponible;
- rellamados;
- SLA.

## 46.4 NO_PRESENTADO ≠ ABANDONO

`NO_PRESENTADO` significa que, después de la política de llamadas/rellamadas, la persona no se presentó al módulo.

Esto no demuestra que abandonó físicamente la sede.

Por tanto:

- reportar `tasa_no_presentado`;
- usar "abandono" solo si existe evidencia/regla específica;
- no convertir automáticamente `NO_PRESENTADO` en abandono.

## 46.5 Estadística

Mantener promedio, mediana, p50, p90 y máximo donde sea útil.

Las definiciones de SLA/KPI deben quedar documentadas y versionadas.

---

# 47. ESCALABILIDAD Y PARTICIONAMIENTO

**No particionar prematuramente.** La tabla de turnos comienza como una tabla PostgreSQL bien diseñada e indexada.

**Razón:** una institución con 1.500 turnos diarios genera del orden de 450.000 filas al año. PostgreSQL maneja ese volumen indexado sin dificultad. Particionar en V1 es complejidad sin métrica que la justifique.

**Diseñar para poder particionar después:**

- Que la llave primaria y los índices principales de turnos incluyan la fecha del día operativo.
- Evitar constraints únicos globales que obliguen a recorrer toda la tabla.

Así, si el volumen algún día lo exige, particionar es una migración mecánica y no un rediseño.

Reevaluar cuando exista volumen real medido.

---

# 48. OBSERVABILIDAD

Stack:

- Pino para logs estructurados.
- OpenTelemetry.
- Prometheus.
- Grafana.
- Sentry opcional para errores de aplicación.

Monitorear: API, PostgreSQL, Redis, Socket.IO, dispositivos online, kioscos, impresoras, outbox pendiente, errores de impresión, reconexiones, latencia, cantidad de turnos, fallos de multimedia, sesiones cerradas por inactividad.

Alertas mínimas: outbox creciendo, dispositivo offline en horario de atención, impresora en error, tasa de fallo de impresión elevada.

---

# 49. TESTING — OBLIGATORIO DESDE EL NÚCLEO

## 49.1 Unit

Vitest para State Machine, Strategy, aging, jornada, idempotencia, vigencia de anuncios y métricas.

## 49.2 Integration — Testcontainers

PostgreSQL real y Redis cuando corresponda.

No mockear `SKIP LOCKED`, constraints ni transacciones críticas.

Escenarios mínimos:

- 50 asesores diferentes en paralelo;
- mismo asesor en dos pestañas;
- `command_id` repetido;
- fencing token antiguo;
- servidor apagado durante cierre;
- transferencia con nueva `TicketStage`.

## 49.3 API E2E

Auth, RBAC, creación idempotente, respuesta perdida, llamado, rellamado, atención, transferencia, cierre, recuperación de sesión y comandos obsoletos.

## 49.4 Web E2E — Playwright

Contextos simultáneos:

- admin;
- kiosco;
- dos pestañas del mismo asesor;
- dos asesores distintos.

## 49.5 Realtime / Display

Probar:

- evento producido durante sincronización;
- gap por secuencia;
- replay;
- duplicado;
- llamado ya atendido no suena al reconectar;
- dos TVs no generan eco;
- failover de audio.

## 49.6 Printing

Pruebas físicas:

- sin papel;
- USB desconectado;
- reinicio antes de enviar;
- reinicio durante `ENVIANDO`;
- pérdida del ACK después de imprimir;
- reentrega del mismo `print_job_id`;
- reimpresión con nuevo job.

No se exige una garantía imposible de exactly-once físico; se exige no hacer retry ciego ante resultado desconocido.

## 49.7 Android

JUnit, Compose UI Test, MockWebServer, Turbine e instrumentadas.

## 49.8 Load

k6 en Fase 2.

## 49.9 Hardware

TV real, box real, atril real e impresora real.

---

# 50. REPOSITORIOS

## turnox-platform — Monorepo TypeScript

```
apps/api
apps/console
apps/kiosk
apps/print-agent
packages/contracts
packages/ui
packages/config
infra/
docs/adr/
```

Herramientas: pnpm workspaces + Turborepo.

## turnox-android — Gradle multi-módulo

```
app-display
core-network
core-realtime
core-models
core-storage
core-ui
core-media
core-voice
```

**Razón de la separación:** mezclar el ecosistema Gradle/Kotlin con el de Node en un solo repositorio complica CI sin beneficio operativo.

Nota: `core-printer` no existe en el proyecto Android. La impresión vive en `apps/print-agent` dentro del monorepo TypeScript, porque TURNOX Kiosk es web y el perfil de despliegue inicial V1 del atril es Linux/Ubuntu.

---

# 51. CONTRATOS HTTP Y REALTIME

## 51.1 OpenAPI — HTTP

OpenAPI es el contrato oficial para HTTP.

Se utiliza para:

- documentación;
- clientes tipados;
- validación;
- control de breaking changes.

## 51.2 AsyncAPI — realtime/event-driven

Los eventos Socket.IO y otros mensajes event-driven se documentan con **AsyncAPI 3.1** o una versión compatible vigente al implementar.

Debe describir:

- evento/canal;
- dirección;
- envelope;
- payload;
- `schema_version`;
- alcance;
- ACK cuando aplique;
- semántica.

AsyncAPI documenta el contrato; no sustituye replay/idempotencia.

## 51.3 Versionado

Todo evento realtime incluye `schema_version`.

Breaking changes requieren versión nueva o una estrategia explícita de compatibilidad.

Durante rollout, backend debe soportar Displays todavía no actualizados según una ventana/version policy definida.

## 51.4 Schemas compartidos

Evitar duplicar manualmente payloads.

Generar/derivar tipos para:

- web;
- Print Agent;
- Android;
- documentación.

---

# 52. REGISTRO DE DECISIONES (ADR)

Existe el directorio `docs/adr/` en `turnox-platform`.

Cada decisión arquitectónica cerrada tiene un archivo con: contexto, decisión, alternativas consideradas, consecuencias y fecha.

ADR iniciales a redactar:
1. Monolito modular en lugar de microservicios.
2. Express en lugar de Fastify.
3. PostgreSQL como fuente de verdad.
4. Kiosco web.
5. Print Agent con conexión saliente.
6. ESC/POS directo en V1.
7. Voz local por fragmentos.
8. StorageProvider con disco/NAS.
9. Sin particionamiento prematuro.
10. Android como dispositivo dedicado, hardware validado en Fase 0.
11. Un turno activo máximo por AdvisorSession.
12. `command_id` + fencing token para comandos de asesor.
13. Realtime con Event Log + cursor/replay, no Socket.IO solo.
14. Transferencias modeladas mediante `TicketStage`.
15. Destino de atención separado de cobertura de anuncio.
16. PrintJob/PrintAttempt y tratamiento de resultado desconocido.
17. Una autoridad de audio por sala.
18. OpenAPI para HTTP + AsyncAPI para eventos.
**Razón:** las decisiones de la sección 3 no pueden revertirse sin entender su costo. Un agente IA o un desarrollador futuro aplica lo que está escrito, no la intención.

---

# 53. VALIDACIÓN DE HARDWARE — FASE 0

Antes de desarrollo avanzado del kiosco y de la pantalla, validar físicamente **una unidad de cada componente**. No comprar la flota antes.

## 53.1 Atril / mini-PC Linux

- Arranque automático de Chromium en modo kiosco.
- Comportamiento tras corte eléctrico.
- **BIOS configurada en "Restore on AC Power Loss = Power On".** Sin esto, un corte de luz deja el atril apagado hasta que alguien lo note.
- Chromium bajo systemd con reinicio automático.
- Calibración de pantalla táctil, probada con dedo.
- Navegación por gesto lateral desactivada. En pantalla táctil, un deslizamiento horizontal dispara "atrás" en Chromium y saca al usuario del flujo.
- Bloqueo de pantalla, apagado de pantalla, notificaciones del sistema y actualizaciones automáticas desactivados.
- Montaje automático de USB desactivado.
- Inicio de sesión automático configurado.

**Perfil de despliegue de referencia V1 — DECISIÓN CERRADA:**

- **Perfil seleccionado para V1 — Ubuntu Desktop endurecido + Chromium:** más familiar de mantener, pero requiere desactivar explícitamente todo lo anterior y sigue expuesto a que GNOME muestre algo encima. Debe operar como sesión dedicada, no como escritorio normal para el público.
- **Alternativa de infraestructura no seleccionada — Ubuntu Server + compositor kiosco (`cage`) + Chromium:** sin escritorio; el atril queda como un electrodoméstico. Se conserva el razonamiento histórico porque podría ofrecer menor superficie operativa si una decisión posterior revisara el perfil de despliegue.

Este perfil es una decisión de infraestructura del atril V1. TURNOX Kiosk continúa siendo una aplicación web y no requiere Ubuntu Desktop para funcionar; Chromium es el runtime del Kiosk Web en este perfil. El Print Agent tiene soporte oficial inicial sobre Linux/Ubuntu; `systemd` y `udev` pertenecen a su adapter Linux.

La decisión fue confirmada explícitamente por el responsable del proyecto el 2026-09-10. Autologin real, endurecimiento efectivo, touchscreen, GPU/driver, monitor, BIOS, recuperación eléctrica, red, DNS/TLS/NTP y demás capacidades físicas permanecen pendientes de validación sobre el equipo real.

## 53.2 Impresora POS

- Driver y comunicación ESC/POS cruda.
- Regla udev con nombre estable.
- Detección de sin papel, tapa abierta y offline.
- Velocidad de impresión y corte.
- Legibilidad del ticket.
- Comportamiento al reconectar el USB.

## 53.3 TV Box Android

- **Que permita operar TURNOX Display como aplicación dedicada y autoarrancable.** Validar launcher, Device Owner / Lock Task u otro mecanismo soportado.
- Ethernet funcionando.
- Salida de audio HDMI con el anuncio de voz sobre video real.
- Reproducción de video continua sin caídas de frames.
- Espacio de almacenamiento disponible real.
- Comportamiento tras corte eléctrico.
- Hora tras corte eléctrico y validación TLS.
- Soporte de HDMI-CEC.
- Resolución y sobrebarrido (overscan) del televisor.

## 53.4 Red

- Conectividad LAN entre atril, boxes y servidor.
- Latencia del llamado extremo a extremo.
- Comportamiento con el enlace a Internet desconectado.

---

# 54. CONTINUIDAD OPERATIVA

Además del modo degradado del kiosco (sección 24), debe existir un procedimiento manual documentado para el caso en que TURNOX completo no esté disponible en día pico.

Requisitos antes del piloto:

- Procedimiento manual escrito y entregado a la institución.
- Personal capacitado en él.
- Definición de cómo conviven TURNOX y el método actual durante el piloto.
- Criterio explícito de cuándo se activa la contingencia.

**Razón:** el rechazo del personal al cambio y la ausencia de plan B son las causas más frecuentes de fracaso en implantaciones de este tipo, y ninguna es técnica.

## 54.1 Continuidad eléctrica — REQUISITO DE INFRAESTRUCTURA

Como TURNOX es local-first, el núcleo de infraestructura debe contar con continuidad eléctrica razonable.

Mínimo a proteger mediante UPS o solución equivalente:

- servidor TURNOX;
- switch principal de la LAN;
- router/firewall o equipo necesario para la red local;
- almacenamiento local crítico cuando aplique.

Las TVs no necesariamente requieren UPS individual para el MVP, pero el servidor y la red central no deben apagarse ante microcortes comunes.

La autonomía requerida se define durante el diseño de infraestructura de cada sede.

## 54.2 Respaldos

- Respaldo automatizado de PostgreSQL.
- Respaldo del almacenamiento multimedia.
- **El criterio de aceptación es una restauración probada**, no la existencia del job. Un respaldo que nunca se restauró no es un respaldo.


## 54.3 RPO y RTO — PENDIENTE DE NEGOCIO / OPERACIÓN

Antes del piloto se deben definir:

- **RPO (Recovery Point Objective):** cuánta pérdida máxima de datos es aceptable.
- **RTO (Recovery Time Objective):** cuánto tiempo máximo puede tardar la recuperación del servicio.

No inventar estos valores desde desarrollo. Deben acordarse con operación/negocio y convertirse en requisitos verificables de backup y recuperación.

---

# 55. FLUJO DE ATENCIÓN COMPLETO

## Usuario / Kiosco

1. Selecciona servicio.
2. Kiosco persiste intención + `idempotency_key`.
3. API crea ticket `EN_ESPERA` y primera `TicketStage`.
4. Devuelve resultado canónico.
5. Backend crea `PrintJob`.
6. Print Agent imprime.
7. Kiosco confirma al usuario y completa su intención pendiente.

## Asesor

1. Login.
2. Selecciona módulo.
3. Recibe `AdvisorSession` + `fencing_token`.
4. Sesión `DISPONIBLE`.
5. Ejecuta `Llamar siguiente` con `command_id`.

## Backend — transacción

1. valida `command_id`;
2. valida sesión/fencing;
3. bloquea sesión;
4. verifica un turno activo máximo;
5. valida jornada;
6. selecciona ticket con `SKIP LOCKED`;
7. crea asignación;
8. sesión -> `OCUPADA`;
9. ticket -> `LLAMADO`;
10. actualiza etapa;
11. crea Call + CallTargets;
12. crea evento persistente;
13. crea Outbox;
14. guarda command receipt;
15. commit.

## Realtime

Publisher entrega eventos. Displays aplican cursor/replay/vigencia. Solo una autoridad de audio por sala reproduce voz.

## Atención

- rellamar: sesión sigue ocupada;
- iniciar: ticket -> `EN_ATENCION`;
- finalizar: ticket -> `ATENDIDO`, cierra etapa/asignación y sesión -> `DISPONIBLE`;
- no presentado: resuelve asignación según política y libera sesión;
- transferir: cierra etapa, crea nueva etapa, redefine espera/cobertura y vuelve normalmente a `EN_ESPERA`.

## Pérdida de conexión

Con turno activo:

- sesión -> `RECUPERACION_REQUERIDA`;
- módulo permanece reservado;
- recuperar o resolver explícitamente por supervisor.

---

# 56. REGLAS PARA ASISTENTES IA Y DESARROLLADORES

1. Leer este archivo completo antes de escribir código.
2. No cambiar stack sin ADR.
3. PostgreSQL sigue siendo la fuente de verdad.
4. Redis nunca decide consistencia.
5. No confiar en frontend para invariantes.
6. Un asesor/sesión solo puede tener un turno activo.
7. Todo comando mutante del asesor requiere `command_id`.
8. Todo comando operativo requiere fencing token vigente.
9. No liberar un módulo con turno activo solo por heartbeat perdido.
10. `SKIP LOCKED` no sustituye constraints de sesión/asignación.
11. El job de cierre no sustituye validar jornada.
12. No crear segundo turno por doble toque, timeout o respuesta perdida.
13. Idempotencia del kiosco debe ser durable.
14. Turno e impresión son independientes.
15. Reimpresión deliberada usa nuevo `print_job_id`.
16. No reintentar automáticamente una impresión con resultado desconocido.
17. No prometer exactly-once físico de una POS externa.
18. Socket.IO no se asume durable por sí solo.
19. Realtime requiere Event Log, `event_seq`, cursor y replay.
20. Un evento obsoleto recuperado no debe sonar.
21. Multimedia nunca bloquea llamados.
22. Distinguir destino, espera y cobertura.
23. Transferencia crea nueva `TicketStage`.
24. No mezclar tiempos de etapas.
25. `NO_PRESENTADO` no equivale automáticamente a abandono.
26. Una sala con varias TVs tiene una sola autoridad de audio.
27. OpenAPI gobierna HTTP; AsyncAPI documenta eventos.
28. Todo evento tiene `schema_version`.
29. No guardar tokens críticos en localStorage.
30. No almacenar videos en PostgreSQL.
31. No desactivar TLS.
32. No acoplar dominio a Prisma, Redis o Socket.IO.
33. No acoplar Print Agent a una marca.
34. No acoplar Display a un proveedor de voz.
35. Toda operación concurrente requiere análisis transaccional.
36. Toda feature nueva define reglas, permisos, persistencia, auditoría, realtime y pruebas.
37. No convertir una recomendación IA en hecho confirmado.
38. No escribir código sin identificar la capa correcta.

---

# 57. CRITERIOS DE CALIDAD

Prioridad, en orden:

1. Correctitud.
2. Concurrencia segura.
3. Resiliencia.
4. Seguridad y privacidad.
5. Mantenibilidad.
6. Observabilidad.
7. UX.
8. Performance.

Nunca sacrificar consistencia de turnos por una optimización superficial.

---

# 58. FASES DE DESARROLLO CON CRITERIOS DE SALIDA

## FASE 0 — Hardware e infraestructura

Validar atril, Chromium, POS, Print Agent, TV/box, audio, Ethernet, DNS/TLS/NTP y operación sin Internet.

**Salida:** impresión real + Display dedicado + LAN segura probados físicamente.

## FASE 1 — Fundación

Monorepo, API, PostgreSQL, Prisma, OpenAPI, AsyncAPI base, auth, RBAC, organizaciones, sedes, salas, módulos, servicios y dispositivos.

**Salida:** configuración operativa completa con autorización server-side.

## FASE 2 — Motor de turnos y concurrencia

State Machine, `TicketStage`, consecutivos, jornada, AdvisorSession, fencing, asignaciones, `command_id`, Queue Strategy, aging, `SKIP LOCKED`, Event Log, Outbox, realtime e idempotencia del kiosco.

**Salida:**

- 50 asesores sin duplicar turnos;
- mismo asesor/dos pestañas recibe uno;
- fencing antiguo rechazado;
- jornada vencida inelegible;
- transferencias preservan métricas por etapa.

## FASE 3 — Console

Flujo administrador/supervisor/asesor y recuperación de sesión.

**Salida:** atención completa y escenarios de reconexión/doble pestaña probados.

## FASE 4 — Kiosk Web

UI táctil + intención persistente + idempotencia durable + contingencia.

**Salida:** perder respuesta o reiniciar navegador no duplica turno.

## FASE 5 — Print Agent

`PrintJob`, `PrintAttempt`, SQLite, ESC/POS, udev, resultado desconocido y reprint.

**Salida:**

- mismo `print_job_id` no imprime de nuevo;
- intento interrumpido => desconocido;
- reprint => nuevo job auditado.

## FASE 6 — Display

Pairing, cursor, replay, snapshot, event_seq, vigencia, audio leader, voz, heartbeat.

**Salida:**

- evento durante resync no se pierde;
- evento obsoleto no suena;
- múltiples TVs no duplican audio;
- reconexión no duplica anuncios.

## FASE 7 — Multimedia

StorageProvider, playlists, Media3 y background sync.

**Salida:** llamados funcionan aunque storage/sync multimedia esté ocupado o caído temporalmente.

## FASE 8 — Reportes

KPIs por etapa + auditoría + observabilidad.

**Salida:** transferencia no mezcla esperas/atenciones entre servicios.

## FASE 9 — Hardening

E2E, carga, fallos de red, Redis, API, POS, Display, backup/restore y seguridad.

**Salida:** ninguna prueba de fallo viola invariantes.

## FASE 10 — Piloto

1 kiosco, 1 POS, 1 sala, 1 TV, 2 módulos, 2 asesores.

**Salida:** una semana de operación real sin intervención manual en BD.

---

# 59. DECISIONES EXPLÍCITAMENTE DESCARTADAS

No usar inicialmente:

- Microservicios.
- Kubernetes.
- Kafka.
- MongoDB como fuente principal.
- Firebase como cola.
- Redis como fuente de verdad de turnos.
- Next.js.
- React Native para TV.
- WebView para TV.
- APK Android para el kiosco.
- Dos aplicaciones web separadas para admin y asesor.
- Videos dentro de PostgreSQL.
- Dependencia obligatoria de Internet.
- Servicios administrados en la nube para PostgreSQL o Redis.
- Tokens críticos en localStorage.
- Event Sourcing completo.
- CQRS complejo.
- Particionamiento prematuro de turnos.
- Dependencia rígida de MinIO.
- TTS del dispositivo como motor de voz principal.
- Emisión de turnos offline en el kiosco.
- Desactivar validación TLS en producción.
- Hacer de Redis un requisito para broadcast local en una sola instancia.
- Reintentos automáticos ciegos de impresión con resultado desconocido.
- Fijar un modelo de TV Box antes de validarlo en Fase 0.


---

# 60. PREGUNTAS PENDIENTES

## Nota de gobernanza

Una decisión solo puede figurar como **CONFIRMADA** si fue confirmada explícitamente por el responsable del proyecto o validada en Fase 0. Una recomendación técnica de un asistente IA no cuenta como confirmación.

## Resueltas

- ~~¿Qué sistema operativo tendrá el despliegue inicial del atril?~~ **Perfil V1: Ubuntu Desktop endurecido + Chromium en modo kiosco.** Ubuntu Server + `cage` fue considerada y queda no seleccionada. Es una decisión de infraestructura del despliegue inicial; no una dependencia arquitectónica de TURNOX Kiosk Web. La decisión fue confirmada por el responsable del proyecto el 2026-09-10; la validación física del atril continúa pendiente (sección 53.1).
- ~~¿Los televisores son Android TV, Google TV, Tizen o webOS?~~ **TV Box Android TV / Google TV**, si esto fue confirmado por el responsable del proyecto. El modelo exacto y el mecanismo de modo dedicado quedan para Fase 0.

## Abiertas — bloquean Fase 0

1. Marca y modelo exactos de la impresora POS.
2. Confirmar conexión USB y que el modelo reporte estado de papel.
## Abiertas — políticas operativas que deben cerrarse antes de Fase 2

- Duración de la gracia para recuperar una `AdvisorSession` con turno activo.
- Política exacta para resolver un turno `LLAMADO` si el asesor no vuelve.
- `announcement_ttl` por defecto.
- Política de cobertura cuando espera y destino están en salas distintas.
- Política de prioridad/antigüedad al transferir.
- Definición institucional de "abandono", si se desea medir.
- Tiempo de retención de Event Log y command receipts.

## Abiertas — bloquean Fase 1 y 2

4. ¿Un módulo anuncia hacia una única sala o puede anunciar hacia varias?
5. ¿Qué prefijos usarán los servicios?
6. ¿Los consecutivos reinician diariamente, por día operativo, por sede o por servicio?
7. ¿Cuántos rellamados se permiten antes de marcar `NO_PRESENTADO`?
8. ¿Un turno marcado `NO_PRESENTADO` regresa a la cola con prioridad degradada, o sale definitivamente?
9. ¿Las prioridades se seleccionan en el kiosco, las determina el personal, o vienen de otro sistema?
10. ¿El kiosco solicitará únicamente servicio, o también documento de identidad? (Si es lo segundo, aplica la sección 43.)
11. Horario del día operativo por sede.
12. Tiempo de inactividad tras el cual se cierra una sesión de asesor huérfana.

## Abiertas — infraestructura / piloto

- ¿Qué nombre DNS interno usará TURNOX en cada sede?
- ¿Se usarán certificados públicos o una CA interna?
- ¿Qué autonomía de UPS requiere el servidor y la red principal?
- ¿Cuál es el RPO acordado?
- ¿Cuál es el RTO acordado?

## Abiertas — no bloqueantes

13. ¿Se integrará TURNOX con un sistema clínico o administrativo externo? ¿Mediante SSO o base de usuarios compartida?
14. ¿Qué ORM usan los otros sistemas de la organización? La consistencia puede pesar más que la preferencia técnica.
15. ¿TURNOX se comercializará como producto? Si la respuesta es sí, la preparación multi-tenant de la sección 6 pasa de recomendable a obligatoria.

---

# 61. DEFINICIÓN DE ÉXITO DEL MVP

El MVP es técnicamente exitoso cuando:

- kiosco genera turnos sin duplicar por doble toque;
- pérdida de respuesta/reinicio no duplica;
- impresión funciona;
- reentrega del mismo `print_job_id` no imprime otra vez;
- resultado incierto no dispara retry ciego;
- reimpresión usa nuevo job auditado;
- asesor puede autenticar y seleccionar módulo;
- módulo tiene un solo propietario;
- sesión tiene un solo turno activo;
- dos pestañas/doble clic no asignan dos turnos;
- fencing antiguo es rechazado;
- pérdida de heartbeat con turno activo no libera módulo incorrectamente;
- 50 asesores concurrentes no duplican turnos;
- jornada vencida nunca es elegible aunque falle el job de cierre;
- transferencias crean etapas y métricas correctas;
- llamado llega a todas las salas necesarias;
- varias TVs en una sala no generan doble voz;
- resync no tiene ventana de pérdida;
- evento obsoleto no se anuncia;
- Redis puede caer sin perder estado;
- una sola instancia puede publicar localmente sin Redis;
- multimedia no bloquea llamados;
- LAN funciona sin Internet;
- TLS/DNS/NTP están validados;
- auditoría reconstruye el recorrido;
- `NO_PRESENTADO` se reporta separado de abandono;
- backup fue restaurado exitosamente;
- existe contingencia manual.

---

# 62. RESUMEN EJECUTIVO DEL STACK

| Capa | Decisión |
|---|---|
| Backend | TypeScript + NestJS + Express |
| DB | PostgreSQL 18 + Prisma 8 + SQL explícito para concurrencia |
| Arquitectura | Monolito modular + Clean/Hexagonal + DDD pragmático |
| HTTP | REST + OpenAPI |
| Realtime | Socket.IO + Event Log + Transactional Outbox |
| Contrato realtime | AsyncAPI 3.1 + schemas versionados |
| Redis | Adapter/fanout/cache cuando aplique |
| Web | React + TypeScript + Vite + Tailwind + shadcn/ui |
| Kiosk Web | Aplicación React + TypeScript + Vite ejecutada mediante navegador |
| Runtime Kiosk Web V1 | Chromium en modo kiosco |
| Perfil de despliegue del atril V1 | Ubuntu Desktop endurecido |
| Idempotencia Kiosk | `idempotency_key` durable |
| Advisor | `AdvisorSession` + `fencing_token` + `command_id` |
| Queue | PostgreSQL + `FOR UPDATE SKIP LOCKED` + constraints |
| Journey | `TicketStage` |
| Print Agent | Node.js + TypeScript; soporte inicial Linux/Ubuntu con adapter `systemd`/`udev` + SQLite |
| Printing | `PrintJob` + `PrintAttempt` + ESC/POS |
| Display | Kotlin + Jetpack Compose for TV |
| Recovery Display | `event_id` + `event_seq` + cursor + replay |
| Audio | Fragmentos locales + TTS fallback + audio leader por sala |
| Video | Media3 / ExoPlayer |
| Storage | Disco/NAS + `StorageProvider` |
| Testing | Vitest + Testcontainers + Playwright + JUnit + Compose Test + k6 |
| Observabilidad | Pino + OpenTelemetry + Prometheus + Grafana |
| Infra | Docker Compose + Nginx + DNS/TLS/NTP + UPS |

---

# 62.1 REFERENCIAS TÉCNICAS PARA LAS GARANTÍAS DE LA V4

Fuentes oficiales que fundamentan decisiones críticas:

- PostgreSQL 18 — locking y `SKIP LOCKED`:
  https://www.postgresql.org/docs/18/sql-select.html
- PostgreSQL 18 — consistencia y explicit locking:
  https://www.postgresql.org/docs/18/applevel-consistency.html
- Socket.IO 4.x — delivery guarantees:
  https://socket.io/docs/v4/delivery-guarantees/
- Socket.IO 4.x — connection state recovery:
  https://socket.io/docs/v4/connection-state-recovery/
- AsyncAPI 3.1:
  https://www.asyncapi.com/docs/reference/specification/v3.1.0

Estas fuentes describen capacidades de plataforma. Las garantías de negocio de TURNOX dependen de su propia implementación, persistencia, constraints, idempotencia y pruebas.

---

# 63. REGLA FINAL DEL PROYECTO

TURNOX debe ser simple donde pueda ser simple y extremadamente riguroso donde deba serlo.

La UI puede evolucionar. Los estilos pueden cambiar. Los dashboards pueden crecer.

Estos aspectos no pueden ser frágiles:

- generación de turnos;
- consecutivos;
- jornada operativa;
- concurrencia;
- propiedad de sesión/módulo;
- un turno activo máximo por sesión;
- idempotencia de creación y comandos;
- State Machine;
- recorrido por etapas;
- transferencias;
- impresión y resultado desconocido;
- realtime recuperable;
- cursor/secuencia de eventos;
- cobertura de anuncios;
- autoridad de audio;
- auditoría;
- seguridad y privacidad;
- DNS/TLS/NTP;
- recuperación y continuidad operativa.

**La arquitectura debe proteger estos invariantes desde el primer día y cada criterio importante debe demostrarse mediante pruebas, no solo mediante intención documental.**

---
