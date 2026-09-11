# TURNOX — Implementation Status

Último prompt: P0.3 — Metodología de validación física e infraestructura
Fase actual: 0 — Hardware e infraestructura
Estado: BLOQUEADO

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
- Historial Git revisado: un único commit de documentación en `master`, alineado con `origin/master`.
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

## Bloqueos y pendientes reales para Fase 0–2

### Bloquean el cierre de Fase 0

- No existe una unidad física validada de cada componente: mini-PC/atril, pantalla táctil, impresora POS, TV Box/televisor, red y UPS.
- Falta seleccionar y validar la marca/modelo exactos de la impresora POS.
- Falta confirmar USB, ESC/POS, cortador y realimentación de estado de papel/tapa/offline de la POS.
- El perfil de despliegue V1 del atril quedó confirmado como **DECISIÓN CERRADA**: Ubuntu Desktop endurecido + Chromium; falta validarlo físicamente y demostrar la sesión dedicada.
- Falta seleccionar y validar el TV Box real y su mecanismo de dispositivo dedicado/autoarranque (launcher, Device Owner/Lock Task, MDM u otra opción soportada).
- Falta validar físicamente calibración táctil, Chromium kiosco, regla udev, impresión, Ethernet, HDMI/overscan, audio, almacenamiento, autoarranque y recuperación tras cortes.
- Falta validar conectividad LAN, operación sin Internet externo y latencia básica extremo a extremo.
- Falta definir y validar el nombre DNS interno, estrategia PKI/TLS, trust en Chromium/Android y NTP local.
- Falta cerrar la autonomía/protección base de UPS con infraestructura; RPO y RTO deben acordarse con operación antes del piloto y bloquearán la validación de recuperación, no la selección física de la unidad.

### Bloquean Fase 1 y/o Fase 2 según V4 §60

- Definir si un módulo anuncia hacia una sola sala o hacia varias.
- Definir prefijos de servicios.
- Definir el alcance del reinicio de consecutivos: diariamente, por día operativo, sede o servicio.
- Definir el máximo de rellamados antes de `NO_PRESENTADO`.
- Definir si `NO_PRESENTADO` vuelve a la cola con prioridad degradada o sale definitivamente.
- Definir origen de las prioridades: kiosco, personal u otro sistema.
- Definir si el kiosco solicita solo servicio o también documento de identidad.
- Definir horario del día operativo por sede.
- Definir el tiempo de inactividad para cerrar una sesión de asesor huérfana.

### Políticas que deben cerrarse antes de implementar el motor de turnos

- Gracia para recuperar una `AdvisorSession` con turno activo.
- Resolución de un turno `LLAMADO` cuando el asesor no regresa.
- `announcement_ttl` por defecto.
- Cobertura cuando espera y destino están en salas distintas.
- Prioridad/antigüedad al transferir.
- Definición institucional de abandono.
- Retención del Event Log y de los command receipts.

### No bloqueantes identificados por V4

- Integraciones externas y modalidad de SSO/usuarios compartidos.
- ORM utilizado por otros sistemas de la organización.
- Decisión comercial sobre producto/multi-tenant completo.

### Estado de pruebas y errores detectados en P0.1

- No se detectaron errores físicos: no fue posible ejecutar pruebas físicas ni simular cortes, desconexiones o carga de red.
- Se detectó como bloqueo de evidencia la ausencia de inventario real de equipos y de una sede de prueba disponible.
- Se detectó que varias decisiones que V4 marca como pendientes —impresora, TV Box, DNS/PKI/TLS, UPS, RPO y RTO— no pueden cerrarse desde documentación o recomendación de IA. La selección de Ubuntu Desktop fue confirmada explícitamente por el responsable, pero aún requiere evidencia física.
- La matriz no autoriza marcar una capacidad como confirmada sin evidencia primaria de la unidad y configuración probadas.

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
- La latencia extremo a extremo sigue explícitamente
  `PENDIENTE — UMBRAL POR DEFINIR / MEDIR EN PILOTO`; no se inventó un PASS.
- P0.3 queda completado documentalmente. Fase 0 sigue bloqueada hasta obtener
  evidencia física y cerrar las decisiones de infraestructura pendientes.

## Próximo prompt

P0.GATE — Revisión de evidencia y cierre de decisiones de Fase 0; no ejecutado.
