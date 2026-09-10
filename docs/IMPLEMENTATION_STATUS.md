# TURNOX — Implementation Status

Último prompt: P0.1 — Matriz de validación física  
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
- Los 18 ADR iniciales enumerados en V4 §52 todavía no están redactados; quedan pendientes de los prompts de implementación correspondientes o de una tarea explícita de documentación.
- La referencia de V4 a un `turnox-platform/docs/adr/` no coincide con el repositorio actual, que aún no contiene `turnox-platform/`. Se conserva la decisión de monolito modular como requisito documental, sin asumir que exista una implementación.

## Bloqueos y pendientes reales para Fase 0–2

### Bloquean el cierre de Fase 0

- No existe una unidad física validada de cada componente: mini-PC/atril, pantalla táctil, impresora POS, TV Box/televisor, red y UPS.
- Falta seleccionar y validar la marca/modelo exactos de la impresora POS.
- Falta confirmar USB, ESC/POS, cortador y realimentación de estado de papel/tapa/offline de la POS.
- Falta decidir la variante del atril: Ubuntu Server + `cage` o Ubuntu Desktop endurecido.
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
- Se detectó que varias decisiones que V4 marca como pendientes —impresora, distribución del atril, TV Box, DNS/PKI/TLS, UPS, RPO y RTO— no pueden cerrarse desde documentación o recomendación de IA.
- La matriz no autoriza marcar una capacidad como confirmada sin evidencia primaria de la unidad y configuración probadas.

## Próximo prompt

P0.2 — Validación física e infraestructura según la matriz, únicamente con equipos y responsables disponibles.
