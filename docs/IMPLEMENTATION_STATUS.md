# TURNOX — Implementation Status

Último prompt: P1.3
Fase actual: 1; siguiente: P1.4 — Autenticación, RBAC y contratos base
Estado: FASE 1 — MODELO ORGANIZACIONAL Y CONFIGURACIÓN OPERATIVA IMPLEMENTADOS

## Resultado del GATE

**FASE 0 — CERRADA PARA DESARROLLO.** TURNOX puede avanzar a `P1.1 —
Monorepo y tooling base`.

**VALIDACIONES FÍSICAS PENDIENTES — OBLIGATORIAS ANTES DE LAS FASES/PILOTO
CORRESPONDIENTES.** No se registra Fase 0 como completamente validada: no
existe evidencia física de los equipos, sede o infraestructura final.

No se encontró un bloqueador técnico real para iniciar software desacoplado.
Las validaciones físicas pendientes bloquean las integraciones que las
consumen y el piloto, no el monorepo, los contratos base ni el desarrollo con
ports/adapters, configuración externa y fake/test adapters.

## Punto real de inicio

- Auditoría realizada el 2026-09-10 sobre `CONTEXTO_MAESTRO_TURNOX_V4.md`, secciones 1–8, 52, 56–60, 62 y 63, y sobre la estructura completa visible del repositorio.
- Commit base observado antes de P00: `a4125dc` (`docs: add TURNOX v4 context and implementation prompts`).
- El repositorio contiene únicamente `CONTEXTO_MAESTRO_TURNOX_V4.md` y `PROMPTS_IMPLEMENTACION_TURNOX_V4.md`, además de metadatos locales no funcionales.
- No hay implementación ejecutable ni arquitectura previa: no existen paquetes, código fuente, monorepo, aplicaciones web/Android, infraestructura, Docker Compose, Nginx, migraciones, Prisma schema, OpenAPI/AsyncAPI, pruebas, observabilidad ni configuración de despliegue.
- No se encontró una arquitectura previa incompatible con V4. La base efectiva es documental y parte desde cero.
- El árbol de trabajo estaba limpio antes de P00. No se hizo commit.

## Entregado

- Auditoría inicial de existencia, ausencia e incompatibilidades.
- Este registro durable del estado de implementación.
- Creación de `docs/adr/` para el registro de decisiones arquitectónicas.
- Matriz profesional de validación física e infraestructura en [`docs/pilot/HARDWARE_VALIDATION.md`](pilot/HARDWARE_VALIDATION.md).
- Puertas de entrada para Fase 0, Fase 1, Fase 2 y piloto, con estados `PENDIENTE`, `PASS`, `FAIL` y `NO_APLICA`.
- Baseline documental y declarativo en [`infra/kiosk/`](../infra/kiosk/): usuario dedicado, configuración externa, perfiles separados para Ubuntu Server + `cage` y Ubuntu Desktop endurecido, unidades systemd, recuperación, reloj/NTP, hostname y runbooks.
- Procedimiento HW-08 para validar en una unidad real la idempotencia, permisos, diagnóstico y separación de configuración del baseline.

## Validaciones

- Estructura inspeccionada con listado completo de archivos y directorios del repositorio.
- En el punto inicial se observó un único commit de documentación en `master`, alineado con `origin/master`.
- No se ejecutaron lint, typecheck ni tests: no existe todavía código o tooling ejecutable.
- No se modificaron dominio, tablas de tickets, autenticación ni funcionalidades.
- No se ejecutaron pruebas físicas ni de infraestructura: no hay acceso a los equipos, sede, LAN, DNS, PKI/TLS, NTP ni UPS.
- No se inventaron marcas, modelos, firmware, versiones de OS, mediciones de latencia, autonomía ni resultados de hardware.
- La matriz deja todas las validaciones iniciales en `PENDIENTE`; no existe ningún `FAIL` físico observado porque ninguna prueba física fue ejecutada.

## ADR / decisiones

- La fuente de verdad arquitectónica continúa siendo V4.
- El perfil de despliegue inicial V1 del atril está cerrado: Ubuntu Desktop endurecido + Chromium en modo kiosco. Es una decisión de infraestructura, no una dependencia arquitectónica de TURNOX Kiosk Web. Se conserva Ubuntu Server + `cage` únicamente como alternativa histórica no seleccionada.
- ADR específico: [`docs/adr/ADR-019-kiosk-ubuntu-desktop.md`](adr/ADR-019-kiosk-ubuntu-desktop.md).
- Los 18 ADR iniciales enumerados en V4 §52 todavía no están redactados; quedan pendientes de los prompts de implementación correspondientes o de una tarea explícita de documentación.
- La referencia de V4 a un `turnox-platform/docs/adr/` no coincide con el repositorio actual, que aún no contiene `turnox-platform/`. Se conserva la decisión de monolito modular como requisito documental, sin asumir que exista una implementación.

## Clasificación de pendientes

### No bloquea desarrollo

- Disponibilidad temporal del atril, touchscreen, impresora POS, TV Box,
  Smart TV, red física, UPS y hardware final del mueble: validación diferida.
- Redacción de los 18 ADR iniciales aún no redactados: trabajo documental que
  no impide `P1.1`; deben redactarse cuando corresponda a cada decisión.
- `NET-07` — rotación de credenciales: recomendado; resolver antes del piloto.
- `TV-09` — HDMI-CEC: capacidad opcional; resolver antes del piloto solo si la
  sede la requiere; en caso contrario registrar `NO_APLICA` con justificación.
- RPO/RTO: no se inventan ni bloquean `P1.1`; resolver antes de hardening y
  piloto.

### Resolver antes de Fase 5

- Impresora POS real y modelo exacto.
- Vendor ID/Product ID USB obtenidos del equipo real y regla udev específica.
- USB estable, ESC/POS, corte, legibilidad, estados de papel/tapa/offline y
  recuperación de impresión.

### Resolver antes de Fase 6

- TV Box Android real y mecanismo de dispositivo dedicado/autoarranque.
- Android, Ethernet del box, HDMI/overscan, audio sobre video,
  almacenamiento y recuperación del Display.

### Resolver antes del piloto

- Atril/mini-PC, Ubuntu Desktop como perfil V1, autologin, Chromium kiosco,
  touchscreen/calibración, navegación lateral, sesión endurecida y
  recuperación tras reinicio.
- DNS interno, PKI/TLS/trust definitivo, NTP LAN y operación sin Internet.
- BIOS `Restore on AC Power Loss`, UPS, recuperación eléctrica, respaldos y
  restauración, contingencia manual, RPO/RTO y latencia extremo a extremo.

### Bloquea Fase 1

V4 §60 marca explícitamente como bloqueantes de Fase 1/Fase 2 las siguientes
decisiones de dominio y operación. No bloquean el alcance acotado de `P1.1`,
pero deben cerrarse antes de implementar los casos de uso y modelos que
dependan de ellas:

- Cobertura de anuncio de un módulo: una sala o varias.
- Prefijos de servicios.
- Reinicio de consecutivos: día calendario, día operativo, sede o servicio.
- Máximo de rellamados antes de `NO_PRESENTADO`.
- Política posterior de `NO_PRESENTADO`.
- Origen de prioridades.
- Si el kiosco solicita solo servicio o también documento de identidad.
- Horario del día operativo por sede.
- Tiempo de inactividad para cerrar una sesión de asesor huérfana.

También deben cerrarse antes de Fase 2 las políticas de gracia de
`AdvisorSession`, resolución de `LLAMADO`, `announcement_ttl`, cobertura,
prioridad/antigüedad de transferencias, definición institucional de abandono y
retención de Event Log/command receipts.

### Latencia

`PENDIENTE — MEDIR EN INTEGRACIÓN/PILOTO`. Todavía no existe el sistema
completo para medir `asesor -> API -> realtime -> Display -> inicio
visual/sonoro`; no se fija ni se inventa un umbral.

## Bloqueadores reales

Ninguno para iniciar `P1.1`.

Los `PENDIENTE` de HW/infraestructura son evidencia y preparación operativa
diferidas. Un `FAIL` futuro bloqueará la integración o el piloto afectado,
pero su ausencia actual no hace incorrecto construir el software desacoplado.

## Decisiones arquitectónicas cerradas

- TURNOX Kiosk = aplicación web React + TypeScript + Vite.
- Chromium = runtime web del kiosco V1.
- Ubuntu Desktop endurecido = perfil de despliegue inicial V1 del atril; no es
  dependencia de TURNOX Kiosk.
- Print Agent = servicio separado para integración local de impresión.
- TURNOX Display = aplicación Android independiente.
- Impresión y Android permanecen detrás de adapters/ports; la lógica de
  negocio no dependerá directamente de `/dev/usb/...`, udev, Android,
  fabricante POS, modelo de TV Box ni Ubuntu Desktop.

## Defectos encontrados y corregidos en P0.GATE

- La matriz hacía que `PASS` físico fuera requisito de entrada a toda Fase 1.
  Se corrigió para permitir `P1.1` y exigir la evidencia solo antes de la
  integración física correspondiente.
- `install.sh` instalaba la unidad Ubuntu Desktop en el system manager,
  aunque el servicio depende de la sesión gráfica y el runbook lo operaba como
  unidad de usuario. Se corrigió para instalarla en `/etc/systemd/user/`; el
  servicio `cage` alternativo permanece en el ámbito del system manager.
- El texto de latencia se corrigió a `PENDIENTE — MEDIR EN
  INTEGRACIÓN/PILOTO`, sin umbral inventado.

## Validaciones del GATE

- `bash -n` sobre todos los scripts de Kiosk y validación.
- `systemd-analyze verify` sobre ambas unidades declarativas: no emitió
  diagnósticos de unidad, pero el runner restringido devolvió código 1 por
  errores de permisos en sus sockets; queda pendiente repetirlo en Ubuntu real.
- `git diff --check` sobre la base de Fase 0 y el árbol de trabajo.
- Revisión de permisos de archivos: scripts ejecutables `0755`; documentos,
  configuraciones de ejemplo y unidades `0644`.
- Búsqueda de secretos, credenciales, certificados privados, IPs/hostnames de
  sede, Vendor IDs/Product IDs reales, flags TLS inseguros y rutas de dispositivo
  hardcodeadas.
- Revisión de referencias internas, configuración externa, systemd,
  idempotencia/rollback documentados y separación de responsabilidades.
- No se ejecutaron pruebas físicas ni se marcaron capacidades de hardware como
  `PASS`.

## Entregado en P0.2 — baseline del perfil Linux/Ubuntu V1 del atril

- Se confirmó y cerró Opción B (`Ubuntu Desktop endurecido + Chromium`) como perfil de despliegue V1 activo; Opción A (`Ubuntu Server + cage + Chromium`) permanece versionada como alternativa no activa.
- Se prepararon plantillas para configuración externa, servicio systemd de Chromium, servicio systemd con `cage`, perfil candidato de endurecimiento Desktop, configuración de hostname y zona horaria/NTP LAN.
- Se documentaron start, stop, status, logs, recuperación, rollback, BIOS y validaciones que requieren acceso físico.
- El instalador es deliberadamente conservador: crea el usuario dedicado y archivos del baseline, conserva una configuración existente y no instala paquetes, habilita servicios ni toca BIOS.
- No se implementó funcionalidad de TURNOX: React, NestJS, PostgreSQL, tickets, Print Agent, Docker y lógica de negocio permanecen fuera de alcance.

## Validaciones de P0.2

- Estructura revisada con `find` y estado Git; solo se añadieron `infra/kiosk/` y cambios documentales solicitados.
- Se ejecutaron comprobaciones sintácticas de Bash. `systemd-analyze verify` no reportó errores de sintaxis de las unidades; su validación completa quedó limitada porque las rutas `/usr/local/libexec/turnox-kiosk/*` solo existen después de ejecutar el instalador en Ubuntu real.
- Se comprobó que no hay URL real, IP, certificado, credencial o secreto embebido en el baseline.
- Se verificó consistencia entre V4, ADR-019, `OPTION_DECISION.md`, el baseline y la matriz de hardware: decisión cerrada, validaciones físicas pendientes.
- No se ejecutó `install.sh`, `configure-hostname.sh`, `configure-time.sh` ni ninguna activación sobre un mini-PC real.
- HW-01 a HW-08 continúan `PENDIENTE`; la actualización de HW-08 no marca ninguna prueba física como `PASS`.

## Entregado en P0.3 — metodología reproducible de Fase 0

- Se creó [`infra/validation/`](../infra/validation/) con configuración externa,
  hoja de evidencia y procedimientos separados para red, impresora, Display y
  reloj.
- Se prepararon utilidades pequeñas para DNS, conectividad LAN/TCP, latencia
  ICMP, TLS con validación normal, reloj/NTP Linux, inventario Android
  autorizado, inspección USB/udev y transmisión mínima ESC/POS.
- La prueba ESC/POS es independiente del futuro Print Agent y no implementa
  `PrinterAdapter`; el inventario Android es diagnóstico y no selecciona el
  mecanismo final de dispositivo dedicado.
- Se añadió una plantilla parametrizada de udev que no contiene Vendor ID,
  Product ID ni ruta real y que no es instalable sin evidencia de la impresora.
- Se actualizaron los vínculos y procedimientos de
  [`docs/pilot/HARDWARE_VALIDATION.md`](pilot/HARDWARE_VALIDATION.md). Todos
  los resultados físicos e infraestructura permanecen `PENDIENTE`.

## Validaciones de P0.3

- Se ejecutaron comprobaciones estáticas de sintaxis Bash y revisión de
  permisos/estructura del kit; no se ejecutaron scripts contra equipos reales.
- Se revisó que el kit no contenga IPs, hostnames de sede, credenciales,
  certificados, Vendor IDs o Product IDs reales, ni opciones de bypass TLS.
- No se ejecutaron cortes eléctricos, desconexiones de uplink, pruebas USB,
  ESC/POS, Android, DNS, PKI/TLS, NTP ni latencia extremo a extremo: requieren
  hardware, red y responsables disponibles.
- La latencia extremo a extremo queda explícitamente
  `PENDIENTE — MEDIR EN INTEGRACIÓN/PILOTO`; no se inventó un umbral ni un
  PASS.
- P0.3 queda completado documentalmente. El GATE cierra Fase 0 para desarrollo;
  la validación física y las decisiones de infraestructura siguen pendientes
  hasta las fases y el piloto indicados arriba.

## Entregado en P1.1 — fundación técnica del monorepo

- Se creó el monorepo `turnox-platform` con `apps/api`, `apps/console`,
  `apps/kiosk`, `apps/print-agent`, `packages/contracts`, `packages/ui`,
  `packages/config` e `infra/` existente preservado.
- Se configuraron pnpm workspaces, catálogo de versiones, Turbo, TypeScript
  strict, ESLint flat config y Prettier compartidos.
- Se definió Node.js `24.20.0` mediante `.nvmrc` y `engines`, junto con
  `packageManager: pnpm@12.3.4` y lockfile reproducible.
- Se añadió el bootstrap mínimo de NestJS/Express para API, los shells React +
  Vite de Console y Kiosk, y el entrypoint TypeScript del Print Agent.
- `packages/contracts` y `packages/ui` quedan como skeletons sin modelos de
  negocio ni componentes prematuros. Android Display permanece fuera del
  monorepo.
- No se implementaron dominio, autenticación, base de datos, Prisma, realtime,
  impresión, USB, Android ni lógica funcional.

## Validaciones de P1.1

- Instalación limpia: `pnpm install --frozen-lockfile` — PASS.
- `pnpm build` — PASS; API, Console, Kiosk, Print Agent, contracts y UI
  compilan.
- `pnpm lint` — PASS.
- `pnpm typecheck` — PASS con TypeScript strict.
- `pnpm test` — PASS; pruebas de shell de Console/Kiosk y compilación del
  módulo raíz de API; packages y Print Agent sin tests artificiales.
- Smoke checks de ejecución: API Nest inicia, Print Agent ejecuta su entrypoint
  y Console/Kiosk levantan Vite.
- `pnpm dedupe --check` — PASS; catálogo y lockfile sin duplicación evitable.
- `git diff --check` — PASS.
- Revisión de estructura, imports y secretos: sin credenciales, tokens,
  certificados privados, `.env` versionado ni acceso de Kiosk a Ubuntu/USB.

## Bloqueos de P1.1

Ninguno. Las validaciones físicas pendientes de Fase 0 se conservan sin
modificación y continúan diferidas a las fases indicadas.

## Entregado en P1.2 — bootstrap profesional de API

- Configuración central, tipada y fail-fast para `NODE_ENV`, `PORT`, `HOST`,
  `LOG_LEVEL`, CORS, límite de body y `TRUST_PROXY`, con `.env.example` seguro.
- Bootstrap NestJS/Express con shutdown hooks, body parsers limitados, Helmet,
  CORS explícito y validación global preparada para futuros DTOs.
- Health operativo separado: `/health/live` y `/health/ready`; readiness solo
  verifica el proceso porque todavía no existen dependencias conectadas.
- Logging Pino estructurado con niveles configurables, JSON en producción,
  formato legible en desarrollo, redaction, request id, método, ruta, estado,
  duración y errores.
- Correlation ID seguro por request, respuesta uniforme de errores HTTP y
  ocultamiento de detalles inesperados en respuestas.
- No se implementaron dominio, auth, Prisma, PostgreSQL, Redis, Socket.IO,
  Outbox, Event Log ni funcionalidades de negocio.

## Validaciones de P1.2

- `pnpm build` — PASS; todos los paquetes del monorepo compilan.
- `pnpm lint` — PASS.
- `pnpm typecheck` — PASS.
- `pnpm test` — PASS; 8 pruebas del API más la suite existente del monorepo.
  El sandbox requirió permisos ampliados para abrir sockets efímeros de
  Supertest.
- `pnpm format:check` — PASS.
- `git diff --check` — PASS.
- Smoke real — PASS: arranque válido, configuración inválida con salida 1,
  health, correlation ID, headers y error production sin stack en respuesta.

## Decisiones y bloqueos de P1.2

- Se mantuvo Express, sin prefijo ni versionado ficticio porque V4 no define
  todavía una estrategia HTTP adicional.
- CORS exige orígenes explícitos en producción; desarrollo usa solo los puertos
  locales de Console y Kiosk. `TRUST_PROXY` permanece desactivado por defecto.
- No se añadieron `DATABASE_URL`, Prisma ni conexiones externas: corresponden
  a P1.3 o a fases posteriores.
- Bloqueadores reales: ninguno.

## Entregado en P1.3 — modelo organizacional y configuración operativa

- PostgreSQL integrado mediante Prisma Client y `@prisma/adapter-pg`; `DATABASE_URL` es obligatorio para desarrollo/producción y existe una excepción controlada para tests unitarios.
- Prisma schema en [`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma) con `Organization`, `Site`, `Service`, `Room`, `Counter`, `User`, `ServiceAssignment` y `Device`.
- IDs UUID, timestamps `TIMESTAMPTZ(3)` con defaults del servidor y triggers PostgreSQL para `updatedAt`; no se guardan credenciales ni passwords.
- Migración inicial en [`apps/api/prisma/migrations/20260910120000_initial_organizational_operational_model/migration.sql`](../apps/api/prisma/migrations/20260910120000_initial_organizational_operational_model/migration.sql), sin datos productivos y con `ON DELETE RESTRICT`.
- CRUD administrativo mínimo y activación/desactivación mediante PATCH para organizaciones, sedes, servicios, salas, módulos, usuarios y dispositivos; asignación explícita usuario-servicio.
- Rutas de recursos operativos anidadas bajo `/organizations/:organizationId/...`; servicios, salas, módulos, usuarios y dispositivos validan scope en el caso de uso y PostgreSQL lo refuerza con FKs compuestas organización/sede.
- Índices para scope, estado, tipo y claves únicas por organización/sede; metadata de dispositivos limitada a JSON operativo sin pairing, secretos ni heartbeat.
- `/health/live` sigue independiente; `/health/ready` ejecuta `SELECT 1` mediante un adapter de readiness y responde `503 DATABASE_UNAVAILABLE` si PostgreSQL no está disponible.
- Compose opcional para desarrollo en [`infra/dev/compose.yaml`](../infra/dev/compose.yaml) con PostgreSQL 18, credenciales ficticias, volumen local y healthcheck; no se agregó Redis.

## Validaciones de P1.3

- `pnpm install --frozen-lockfile` — PASS.
- `pnpm build` — PASS.
- `pnpm lint` — PASS.
- `pnpm typecheck` — PASS.
- `pnpm test` — PASS: 9 tests API y suite existente del monorepo; 1 test de integración omitido sin PostgreSQL explícita.
- `pnpm --filter @turnox/api test:integration` — PASS operativo con la suite omitida cuando no se define `RUN_INTEGRATION_TESTS=true`; con PostgreSQL real ejecuta pruebas E2E de relaciones, uniqueness y aislamiento.
- `pnpm format:check` — PASS.
- `git diff --check` — PASS.
- `prisma validate` y `prisma generate` — PASS.
- `prisma migrate deploy` desde la WSL actual — BLOQUEADO por ausencia de Docker, Podman y PostgreSQL local; el comando se ejecutó contra `127.0.0.1:5432` y no había servidor disponible. La migración queda lista para validarse desde DB vacía con `infra/dev/compose.yaml`.

## Decisiones, bloqueos y deuda de P1.3

- Prisma 8 estable no está publicado en el registro al momento de implementar P1.3; la última estable disponible es Prisma 7.10.0. Se usó 7.10.0 con adapter PostgreSQL, sin usar una release dev/RC de Prisma 8. Deuda: revisar upgrade al publicarse Prisma 8 estable.
- La autenticación, `password_hash`, roles, permisos y autorización efectiva permanecen deliberadamente para P1.4. Las rutas P1.3 usan el `organizationId` explícito de la URL como contexto de pruebas y servicio, no como autenticación.
- No se implementaron tickets, jornada, consecutivos, `AdvisorSession`, Queue Engine, realtime, Outbox, Event Log, impresión ni multimedia.
- Bloqueo real restante: ejecutar migración desde PostgreSQL vacío y la suite de integración contra PostgreSQL real en un entorno con Docker o una instancia PostgreSQL disponible.

## Próximo prompt

P1.4 — Autenticación, RBAC y contratos base
