# TURNOX — RUNBOOK DE PROMPTS PARA CODEX

> Basado en `CONTEXTO_MAESTRO_TURNOX_V4.md`.
>
> Objetivo: implementar TURNOX de forma incremental, con prompts pequeños, verificables y ordenados, evitando saturación de contexto y cambios fuera de alcance.

---

# CÓMO USAR ESTE ARCHIVO

1. Ejecuta **un solo prompt a la vez** y en el orden indicado.
2. No continúes si el prompt actual queda BLOQUEADO o con tests rojos.
3. Al terminar cada fase ejecuta su **GATE**.
4. Si la conversación de Codex crece demasiado, abre una nueva. La nueva sesión solo necesita leer:
   - `CONTEXTO_MAESTRO_TURNOX_V4.md` en las secciones indicadas;
   - `docs/IMPLEMENTATION_STATUS.md`;
   - el prompt actual;
   - archivos directamente relacionados.
5. No cargues `node_modules`, builds, logs gigantes ni módulos de fases futuras salvo necesidad real.
6. El estado durable del proyecto debe vivir en código, tests, migraciones, ADRs y `IMPLEMENTATION_STATUS.md`, no en la memoria del chat.

## Definition of Done común

Cada prompt termina únicamente cuando compila, pasa lint/typecheck/tests relevantes, no deja errores conocidos dentro de su alcance y actualiza `docs/IMPLEMENTATION_STATUS.md`.

## Formato recomendado para `docs/IMPLEMENTATION_STATUS.md`

```md
# TURNOX — Implementation Status
Último prompt: P2.3
Fase actual: 2
Estado: COMPLETADO | BLOQUEADO | EN_PROGRESO

## Entregado
- ...
## Validaciones
- ...
## ADR/decisiones
- ...
## Bloqueos
- ...
## Próximo prompt
P2.4
```

Mantén este archivo corto; no lo conviertas en un diario.

---

# P00 — PREPARACIÓN INICIAL

```text
Actúa como arquitecto senior de TURNOX.

Fuente de verdad: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee V4 secciones 1–8, 52, 56–60, 62 y 63, y revisa la estructura actual del repositorio.

TAREA ÚNICA:
1. Identifica qué existe y qué falta.
2. Verifica que no haya arquitectura previa incompatible con V4.
3. Crea `docs/IMPLEMENTATION_STATUS.md` y `docs/adr/` si no existen.
4. Registra el punto real de inicio y los PENDIENTES que bloquean Fase 0–2.

NO implementes dominio, tablas de tickets, auth ni funcionalidades.
No hagas commit.
Al final reporta estado y deja P0.1 como siguiente prompt.
DETENTE.
```

---


# FASE 0 — HARDWARE E INFRAESTRUCTURA


## P0.1 — Matriz de validación física

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 2, 53, 54 y 60.

OBJETIVO: Crear el paquete de validación de hardware sin afirmar que algo no probado funciona.

IMPLEMENTA:
- Crear `docs/pilot/HARDWARE_VALIDATION.md`.
- Cubrir atril, POS, TV Box, Ethernet, audio, DNS/TLS/NTP, energía y recuperación.
- Estados: PENDIENTE/PASS/FAIL/NO_APLICA con evidencia.

REGLAS ESPECIALES:
- No selecciones marca/modelo por tu cuenta.

CRITERIOS DE ACEPTACIÓN:
- No hay hardware inventado.
- Todos los bloqueos físicos quedan explícitos.

Siguiente prompt si todo pasa: P0.2.
```

---

## P0.2 — Baseline del kiosco Linux

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 2.1, 3.5, 33 y 53.1.

OBJETIVO: Preparar configuración reproducible del mini-PC sin cerrar la distribución pendiente.

IMPLEMENTA:
- Crear `infra/kiosk/`.
- Documentar autoarranque Chromium, suspensión desactivada, recuperación eléctrica y modo kiosco.
- Mantener separadas Ubuntu Server+cage y Ubuntu Desktop mientras siga PENDIENTE.

CRITERIOS DE ACEPTACIÓN:
- Scripts/config no contienen secretos.
- No se declara una variante pendiente como definitiva.

Siguiente prompt si todo pasa: P0.3.
```

---

## P0.3 — Checks de POS, TV Box y red

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 2.2, 2.3, 32, 33 y 53.2–53.4.

OBJETIVO: Preparar pruebas/checklists reproducibles para el hardware real.

IMPLEMENTA:
- Checks LAN/DNS/TLS/NTP.
- Checklist TV Box: modo dedicado, boot, Ethernet, audio, almacenamiento y recuperación.
- Checklist POS: USB, udev, ESC/POS, corte y telemetría disponible.

CRITERIOS DE ACEPTACIÓN:
- Cada PASS exige evidencia real.
- No se simulan capacidades del hardware.

Siguiente prompt si todo pasa: P0.GATE.
```

---

## P0.GATE — GATE DE CALIDAD FASE 0

```text
Actúa como revisor senior de TURNOX.

No implementes nuevas funcionalidades. Lee `docs/IMPLEMENTATION_STATUS.md`, V4 secciones 53, 54, 58 Fase 0 y 60, y solo código/tests/migraciones/contratos creados o modificados en Fase 0.

Comprueba:
- Checklists cubren atril/POS/TV/red.
- No hay hardware inventado.
- Bloqueos reales están identificados.

Ejecuta las pruebas mínimas necesarias para demostrarlo. Si encuentras defectos de esta fase, corrígelos sin adelantar la siguiente. Si falta una decisión PENDIENTE, no la inventes: marca BLOQUEADO y explica el dato exacto faltante.

Si todo pasa, marca Fase 0 COMPLETADA en `docs/IMPLEMENTATION_STATUS.md` y deja como próximo prompt: P1.1.

DETENTE.
```

---

# FASE 1 — FUNDACIÓN


## P1.1 — Monorepo y tooling

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 3, 4, 50, 56 y 57.

OBJETIVO: Crear la estructura base de `turnox-platform` sin dominio.

IMPLEMENTA:
- pnpm workspaces + Turborepo.
- Crear apps/api, console, kiosk, print-agent; packages/contracts, ui, config; infra.
- TypeScript estricto, lint, format, build/test/typecheck.

CRITERIOS DE ACEPTACIÓN:
- Instalación limpia funciona.
- Workspace base compila.

Siguiente prompt si todo pasa: P1.2.
```

---

## P1.2 — Bootstrap API y configuración

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 3.2, 3.3, 5, 33, 44 y 48.

OBJETIVO: Levantar NestJS/Express con configuración segura y observabilidad mínima.

IMPLEMENTA:
- Variables validadas/fail-fast.
- Health/readiness.
- Pino + request/correlation id.
- Prisma/PostgreSQL base.
- Errores uniformes y security headers.

CRITERIOS DE ACEPTACIÓN:
- API inicia con config válida.
- Config inválida falla claramente.

Siguiente prompt si todo pasa: P1.3.
```

---

## P1.3 — Modelo organizacional

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 6–8 y 45.

OBJETIVO: Implementar configuración operativa sin Tickets/Queue.

IMPLEMENTA:
- Migraciones para organizaciones, sedes, servicios, salas, módulos, usuarios y dispositivos.
- CRUD API validado.
- organizacion_id/sede_id donde aplique.
- Auditoría administrativa crítica.

CRITERIOS DE ACEPTACIÓN:
- Migración DB vacía funciona.
- FK/constraints base correctos.

Siguiente prompt si todo pasa: P1.4.
```

---

## P1.4 — Auth, RBAC y contratos base

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 7, 44, 51 y 52.

OBJETIVO: Implementar seguridad y contratos iniciales.

IMPLEMENTA:
- Argon2id.
- Cookies HttpOnly/Secure/SameSite apropiado.
- RBAC server-side.
- OpenAPI.
- AsyncAPI 3.1 base con envelope versionado.
- ADRs de decisiones aplicadas.

REGLAS ESPECIALES:
- No guardar tokens críticos en localStorage.

CRITERIOS DE ACEPTACIÓN:
- Tests positivos/negativos de auth/RBAC.
- OpenAPI y AsyncAPI validan.

Siguiente prompt si todo pasa: P1.GATE.
```

---

## P1.GATE — GATE DE CALIDAD FASE 1

```text
Actúa como revisor senior de TURNOX.

No implementes nuevas funcionalidades. Lee `docs/IMPLEMENTATION_STATUS.md`, V4 secciones 3–8, 44, 50–52 y 58 Fase 1, y solo código/tests/migraciones/contratos creados o modificados en Fase 1.

Comprueba:
- Workspace compila.
- API/DB base funcionan.
- RBAC server-side.
- OpenAPI/AsyncAPI base existen.
- No hay lógica Fase 2 adelantada.

Ejecuta las pruebas mínimas necesarias para demostrarlo. Si encuentras defectos de esta fase, corrígelos sin adelantar la siguiente. Si falta una decisión PENDIENTE, no la inventes: marca BLOQUEADO y explica el dato exacto faltante.

Si todo pasa, marca Fase 1 COMPLETADA en `docs/IMPLEMENTATION_STATUS.md` y deja como próximo prompt: P2.1.

DETENTE.
```

---

# FASE 2 — MOTOR DE TURNOS Y CONCURRENCIA


## P2.1 — Jornada, consecutivos y recorrido

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 9, 15, 16, 19 y 46.

OBJETIVO: Crear el modelo persistente mínimo del turno y sus etapas.

IMPLEMENTA:
- Operational day por sede.
- Consecutivo atómico por clave lógica.
- Ticket global.
- Primera `TicketStage`.
- Timestamps server-side.

REGLAS ESPECIALES:
- Si prefijos/reinicio siguen PENDIENTES, modela configuración pero no inventes valores.

CRITERIOS DE ACEPTACIÓN:
- Consecutivos concurrentes no duplican.
- TicketStage soporta múltiples etapas.

Siguiente prompt si todo pasa: P2.2.
```

---

## P2.2 — State Machine y transferencia

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 9, 19 y 46.

OBJETIVO: Implementar transiciones y transferencia por etapa.

IMPLEMENTA:
- State Machine explícita.
- Bloquear transiciones inválidas.
- Transferencia cierra etapa y crea otra.
- Separar prioridad histórica de métricas.
- Auditar transiciones.

CRITERIOS DE ACEPTACIÓN:
- Tests de transiciones válidas e inválidas.
- Transferencia no mezcla tiempos.

Siguiente prompt si todo pasa: P2.3.
```

---

## P2.3 — AdvisorSession, fencing y command receipts

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 11, 14 y 30.

OBJETIVO: Proteger propiedad del módulo y un turno activo máximo.

IMPLEMENTA:
- AdvisorSession y estados.
- Asignación activa ticket-sesión.
- Constraints: sesión/módulo, asignación/sesión, asignación/ticket.
- fencing_token.
- command_id + receipts.

CRITERIOS DE ACEPTACIÓN:
- Dos sesiones no ocupan módulo.
- Una sesión no tiene dos turnos.
- Token viejo se rechaza.
- Mismo command_id no muta dos veces.

Siguiente prompt si todo pasa: P2.4.
```

---

## P2.4 — Queue transaccional

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 12–16.

OBJETIVO: Implementar llamado siguiente y dirigido con concurrencia segura.

IMPLEMENTA:
- Bloquear/validar sesión primero.
- Validar fencing, command_id y jornada.
- Filtrar servicios autorizados.
- Seleccionar con `FOR UPDATE SKIP LOCKED`.
- Crear asignación; sesión OCUPADA; ticket LLAMADO dentro de una transacción.
- Llamado dirigido con mismas garantías.

REGLAS ESPECIALES:
- No usar Redis/mutex en memoria como lock de consistencia.

CRITERIOS DE ACEPTACIÓN:
- Dos asesores no obtienen el mismo ticket.
- Misma sesión concurrente no obtiene dos.

Siguiente prompt si todo pasa: P2.5.
```

---

## P2.5 — Prioridad y aging

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 12 y 13.

OBJETIVO: Implementar estrategia pura de elegibilidad/prioridad.

IMPLEMENTA:
- FIFO.
- Prioridad preferencial.
- Aging configurable.
- Evitar starvation.
- Tests deterministas.

REGLAS ESPECIALES:
- No inventes cómo se captura prioridad si sigue PENDIENTE.

CRITERIOS DE ACEPTACIÓN:
- Aging permite progresar cola normal.
- Orden es reproducible.

Siguiente prompt si todo pasa: P2.6.
```

---

## P2.6 — Event Log, Outbox y realtime backend

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 28–31 y 51.

OBJETIVO: Implementar infraestructura durable de eventos y recuperación.

IMPLEMENTA:
- Event Log con event_id/event_seq/schema_version/scope/vigencia.
- Outbox en misma transacción.
- Publisher Socket.IO local.
- Redis adapter opcional.
- Snapshot + replay por cursor/high-water mark.
- Actualizar AsyncAPI.

CRITERIOS DE ACEPTACIÓN:
- Caída entre commit/publish no pierde evento.
- Una instancia funciona sin Redis.
- Replay es idempotente.

Siguiente prompt si todo pasa: P2.GATE.
```

---

## P2.GATE — GATE DE CALIDAD FASE 2

```text
Actúa como revisor senior de TURNOX.

No implementes nuevas funcionalidades. Lee `docs/IMPLEMENTATION_STATUS.md`, V4 secciones 9–19, 28–31, 49, 51 y 58 Fase 2, y solo código/tests/migraciones/contratos creados o modificados en Fase 2.

Comprueba:
- 50 asesores sin duplicados.
- Mismo asesor/dos pestañas: un turno.
- Fencing viejo rechazado.
- Mismo command_id = mismo resultado.
- Jornada vieja inelegible.
- Transferencias por etapa.
- Outbox/Event Log recuperables.

Ejecuta las pruebas mínimas necesarias para demostrarlo. Si encuentras defectos de esta fase, corrígelos sin adelantar la siguiente. Si falta una decisión PENDIENTE, no la inventes: marca BLOQUEADO y explica el dato exacto faltante.

Si todo pasa, marca Fase 2 COMPLETADA en `docs/IMPLEMENTATION_STATUS.md` y deja como próximo prompt: P3.1.

DETENTE.
```

---

# FASE 3 — TURNOX CONSOLE


## P3.1 — Console shell y login

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 3.4, 4.2, 7, 44 y 50.

OBJETIVO: Crear la base web y sesión humana.

IMPLEMENTA:
- React/Vite/Tailwind/shadcn.
- Cliente HTTP tipado.
- Login/logout/restore session.
- Routing por permiso.
- TanStack Query para server state.

CRITERIOS DE ACEPTACIÓN:
- Sin tokens críticos en localStorage.
- Rutas protegidas coherentes.

Siguiente prompt si todo pasa: P3.2.
```

---

## P3.2 — Administración operativa

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 6–8 y 45.

OBJETIVO: Crear UI para recursos de Fase 1.

IMPLEMENTA:
- Servicios, salas, módulos, usuarios, asignación asesor-servicio y dispositivos.
- Estados de carga/error/confirmación.
- Respetar organización/sede.

CRITERIOS DE ACEPTACIÓN:
- CRUD no permite acciones sin permiso.
- Mutaciones refrescan estado correctamente.

Siguiente prompt si todo pasa: P3.3.
```

---

## P3.3 — Consola del asesor

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 11, 12, 14 y 55.

OBJETIVO: Implementar selección de módulo y operación del asesor.

IMPLEMENTA:
- Abrir/recuperar AdvisorSession.
- Manejar fencing token.
- Estados DISPONIBLE/OCUPADA/PAUSADA/RECUPERACION_REQUERIDA.
- Llamar, llamado dirigido, rellamar, iniciar y finalizar.
- command_id por mutación.

CRITERIOS DE ACEPTACIÓN:
- Dos pestañas no rompen invariantes.
- UI refleja estado server-side.

Siguiente prompt si todo pasa: P3.4.
```

---

## P3.4 — Transferencia y recuperación supervisor

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 11, 18, 19, 45 y 46.

OBJETIVO: Completar acciones operativas sensibles.

IMPLEMENTA:
- Transferir con destino/contexto de espera.
- No presentado según política.
- Supervisor resuelve sesiones RECUPERACION_REQUERIDA.
- Errores de fencing/conflicto accionables.

CRITERIOS DE ACEPTACIÓN:
- Resoluciones quedan auditadas.
- No se libera atención activa automáticamente.

Siguiente prompt si todo pasa: P3.GATE.
```

---

## P3.GATE — GATE DE CALIDAD FASE 3

```text
Actúa como revisor senior de TURNOX.

No implementes nuevas funcionalidades. Lee `docs/IMPLEMENTATION_STATUS.md`, V4 secciones 4.2, 7, 11, 18, 19, 44–46 y 55, y solo código/tests/migraciones/contratos creados o modificados en Fase 3.

Comprueba:
- Asesor completa atención.
- Dos pestañas no rompen invariantes.
- Supervisor resuelve sesión huérfana.
- Permisos negativos probados.

Ejecuta las pruebas mínimas necesarias para demostrarlo. Si encuentras defectos de esta fase, corrígelos sin adelantar la siguiente. Si falta una decisión PENDIENTE, no la inventes: marca BLOQUEADO y explica el dato exacto faltante.

Si todo pasa, marca Fase 3 COMPLETADA en `docs/IMPLEMENTATION_STATUS.md` y deja como próximo prompt: P4.1.

DETENTE.
```

---

# FASE 4 — TURNOX KIOSK WEB


## P4.1 — Kiosco táctil

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 3.5, 4.3, 20, 24 y 37.

OBJETIVO: Crear la UI pública sin impresión directa USB.

IMPLEMENTA:
- Servicios visibles.
- Touch targets grandes.
- Timeout/retorno inicio.
- Modo full screen friendly.
- Estado simple de conectividad.

CRITERIOS DE ACEPTACIÓN:
- Flujo usable con dedo.
- No deja datos de usuario anterior.

Siguiente prompt si todo pasa: P4.2.
```

---

## P4.2 — Idempotencia durable del kiosco

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 17, 20 y 30.

OBJETIVO: Resistir doble toque, timeout, refresh y reinicio.

IMPLEMENTA:
- Persistir intención antes del POST.
- idempotency_key por interacción.
- Reusar clave si respuesta se pierde.
- Resolver resultado canónico antes del siguiente usuario.
- Conflicto por fingerprint.

CRITERIOS DE ACEPTACIÓN:
- Doble toque = un ticket.
- Refresh/reinicio tras commit devuelve mismo ticket.

Siguiente prompt si todo pasa: P4.3.
```

---

## P4.3 — UX de PrintJob y degradado

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 20, 22–24.

OBJETIVO: Integrar estado de impresión con el kiosco.

IMPLEMENTA:
- Mostrar turno/progreso.
- Manejar fallo confirmado y unknown.
- Reprint solo por flujo autorizado.
- Backend caído => contingencia sin emitir offline.

CRITERIOS DE ACEPTACIÓN:
- Fallo POS conserva ticket.
- Unknown no genera retry ciego.
- Backend caído no emite.

Siguiente prompt si todo pasa: P4.GATE.
```

---

## P4.GATE — GATE DE CALIDAD FASE 4

```text
Actúa como revisor senior de TURNOX.

No implementes nuevas funcionalidades. Lee `docs/IMPLEMENTATION_STATUS.md`, V4 secciones 17, 20, 22–24 y 37, y solo código/tests/migraciones/contratos creados o modificados en Fase 4.

Comprueba:
- Doble toque no duplica.
- Respuesta perdida/reinicio no duplica.
- Backend caído no emite.
- Fallo POS no crea otro turno.

Ejecuta las pruebas mínimas necesarias para demostrarlo. Si encuentras defectos de esta fase, corrígelos sin adelantar la siguiente. Si falta una decisión PENDIENTE, no la inventes: marca BLOQUEADO y explica el dato exacto faltante.

Si todo pasa, marca Fase 4 COMPLETADA en `docs/IMPLEMENTATION_STATUS.md` y deja como próximo prompt: P5.1.

DETENTE.
```

---

# FASE 5 — TURNOX PRINT AGENT


## P5.1 — Print Agent base

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 21, 26, 27, 33 y 44.3.

OBJETIVO: Crear servicio local con pairing/canal saliente.

IMPLEMENTA:
- Node/TS app.
- Config validada.
- Pairing/credencial.
- Canal saliente autenticado.
- Heartbeat.
- systemd + backoff.

CRITERIOS DE ACEPTACIÓN:
- No expone puerto innecesario.
- Credencial revocable.

Siguiente prompt si todo pasa: P5.2.
```

---

## P5.2 — Persistencia PrintJob/PrintAttempt

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 10, 21–23 y 30.

OBJETIVO: Implementar recuperación local durable.

IMPLEMENTA:
- SQLite o equivalente.
- Persistir antes de enviar.
- ENVIANDO tras reinicio => RESULTADO_DESCONOCIDO.
- Idempotencia print_job_id.
- Distinguir retry/reprint/unknown.

CRITERIOS DE ACEPTACIÓN:
- Job completado no se reenvía.
- Reinicio incierto queda unknown.

Siguiente prompt si todo pasa: P5.3.
```

---

## P5.3 — PrinterAdapter ESC/POS

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 2.3, 21 y 53.2.

OBJETIVO: Implementar adapter sin acoplarse a marca.

IMPLEMENTA:
- PrinterAdapter.
- USB Linux detrás del adapter.
- Ticket 80mm configurable.
- Corte si soportado.
- udev.
- Clasificación de errores disponibles.

REGLAS ESPECIALES:
- Sin POS real no inventes comandos propietarios; deja prueba física BLOQUEADA.

CRITERIOS DE ACEPTACIÓN:
- Formato tiene tests.
- Adapter fake permite integración sin hardware.

Siguiente prompt si todo pasa: P5.4.
```

---

## P5.4 — ACK, reprint y telemetría

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 10, 21–23, 27 y 45.

OBJETIVO: Completar protocolo extremo a extremo.

IMPLEMENTA:
- ACK canónico.
- Job completado reentregado => receipt sin imprimir.
- Reprint => nuevo job relacionado.
- Heartbeat estado agente/POS.
- Reconciliación tras reinicio.

CRITERIOS DE ACEPTACIÓN:
- Pérdida ACK no repite job.
- Unknown no retry automático.
- Reprint distinguido/auditado.

Siguiente prompt si todo pasa: P5.GATE.
```

---

## P5.GATE — GATE DE CALIDAD FASE 5

```text
Actúa como revisor senior de TURNOX.

No implementes nuevas funcionalidades. Lee `docs/IMPLEMENTATION_STATUS.md`, V4 secciones 10, 21–23, 27, 49.6 y 53.2, y solo código/tests/migraciones/contratos creados o modificados en Fase 5.

Comprueba:
- Job reentregado no imprime de nuevo.
- Reinicio incierto => unknown.
- Reprint usa nuevo ID.
- Pruebas físicas ejecutadas o bloqueadas explícitamente.

Ejecuta las pruebas mínimas necesarias para demostrarlo. Si encuentras defectos de esta fase, corrígelos sin adelantar la siguiente. Si falta una decisión PENDIENTE, no la inventes: marca BLOQUEADO y explica el dato exacto faltante.

Si todo pasa, marca Fase 5 COMPLETADA en `docs/IMPLEMENTATION_STATUS.md` y deja como próximo prompt: P6.1.

DETENTE.
```

---

# FASE 6 — TURNOX DISPLAY


## P6.1 — Android Display base

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 3.6, 4.5, 25–27 y 50.

OBJETIVO: Crear `turnox-android` y pairing/configuración.

IMPLEMENTA:
- Gradle multi-módulo V4.
- Kotlin + Compose for TV.
- Hilt + Coroutines/Flow + almacenamiento local.
- Pairing/credencial.
- Heartbeat y estados de diagnóstico.

CRITERIOS DE ACEPTACIÓN:
- App recupera identidad local.
- No usa credenciales humanas con control remoto.

Siguiente prompt si todo pasa: P6.2.
```

---

## P6.2 — Cursor, replay y resync

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 28–31 y 51.

OBJETIVO: Implementar cliente realtime sin huecos.

IMPLEMENTA:
- Persistir last_applied_event_seq.
- Handshake high-water mark.
- Snapshot + replay + live.
- Detectar gaps.
- Idempotencia event_id/event_seq.
- schema_version.

CRITERIOS DE ACEPTACIÓN:
- Evento durante sync no se pierde.
- Duplicado no se aplica.
- Gap dispara recuperación.

Siguiente prompt si todo pasa: P6.3.
```

---

## P6.3 — UI de llamados y audio leader

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 18, 25, 31.4, 35–37.

OBJETIVO: Implementar presentación y coordinación de anuncios.

IMPLEMENTA:
- Mostrar turno/módulo/destino.
- CallTargets.
- AnnouncementQueue.
- announcement_ttl.
- AUDIO_PRIMARY/VISUAL_ONLY.
- Failover preparado.

CRITERIOS DE ACEPTACIÓN:
- Evento obsoleto no suena.
- Dos TVs no emiten voz duplicada.

Siguiente prompt si todo pasa: P6.4.
```

---

## P6.4 — VoiceEngine, ducking y boot

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 32, 34–36, 41 y 53.3.

OBJETIVO: Completar voz local y operación dedicada.

IMPLEMENTA:
- VoiceEngine por fragmentos.
- TTS solo fallback.
- Ducking.
- NTP/hora inválida visible.
- Autoarranque/keepScreenOn/modo dedicado según hardware.
- Reportar versión.

CRITERIOS DE ACEPTACIÓN:
- Voz funciona sin Internet.
- Volumen se restaura.
- Boot/recuperación según hardware validado.

Siguiente prompt si todo pasa: P6.GATE.
```

---

## P6.GATE — GATE DE CALIDAD FASE 6

```text
Actúa como revisor senior de TURNOX.

No implementes nuevas funcionalidades. Lee `docs/IMPLEMENTATION_STATUS.md`, V4 secciones 25–37, 49.5, 51 y 53.3, y solo código/tests/migraciones/contratos creados o modificados en Fase 6.

Comprueba:
- Resync sin huecos.
- Duplicados no anuncian doble.
- Evento obsoleto no suena.
- Varias TVs no generan eco.

Ejecuta las pruebas mínimas necesarias para demostrarlo. Si encuentras defectos de esta fase, corrígelos sin adelantar la siguiente. Si falta una decisión PENDIENTE, no la inventes: marca BLOQUEADO y explica el dato exacto faltante.

Si todo pasa, marca Fase 6 COMPLETADA en `docs/IMPLEMENTATION_STATUS.md` y deja como próximo prompt: P7.1.

DETENTE.
```

---

# FASE 7 — MULTIMEDIA


## P7.1 — StorageProvider multimedia

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 38–40.

OBJETIVO: Implementar almacenamiento sin binarios en PostgreSQL.

IMPLEMENTA:
- StorageProvider.
- Disco/NAS V1.
- Metadata DB.
- Upload validado.
- Hash/ruta segura.
- Nginx range support documentado.

CRITERIOS DE ACEPTACIÓN:
- No hay binarios en DB.
- Path traversal/tipo/tamaño inválidos se rechazan.

Siguiente prompt si todo pasa: P7.2.
```

---

## P7.2 — Playlists versionadas

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 39 y 40.

OBJETIVO: Implementar playlists y asignaciones.

IMPLEMENTA:
- CRUD items/orden.
- Asignación sala/display.
- Horario/vigencia.
- Revision/version.
- Validación por bytes disponibles.

CRITERIOS DE ACEPTACIÓN:
- Cambios producen revisión detectable.
- Aislamiento org/sede correcto.

Siguiente prompt si todo pasa: P7.3.
```

---

## P7.3 — Media3 cache/background sync

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 25.1, 38–40.

OBJETIVO: Integrar multimedia sin bloquear llamados.

IMPLEMENTA:
- Reproducir cache válido.
- Descargar cambios en background.
- Media3/ExoPlayer.
- Reportar espacio/sync.
- Continuar con cache si storage cae.

CRITERIOS DE ACEPTACIÓN:
- Llamados funcionan durante descarga.
- Storage caído no detiene realtime/cache.

Siguiente prompt si todo pasa: P7.GATE.
```

---

## P7.GATE — GATE DE CALIDAD FASE 7

```text
Actúa como revisor senior de TURNOX.

No implementes nuevas funcionalidades. Lee `docs/IMPLEMENTATION_STATUS.md`, V4 secciones 38–40 y 49, y solo código/tests/migraciones/contratos creados o modificados en Fase 7.

Comprueba:
- Videos fuera de DB.
- Playlist versionada.
- Descarga no bloquea llamados.
- Cache funciona con storage caído.

Ejecuta las pruebas mínimas necesarias para demostrarlo. Si encuentras defectos de esta fase, corrígelos sin adelantar la siguiente. Si falta una decisión PENDIENTE, no la inventes: marca BLOQUEADO y explica el dato exacto faltante.

Si todo pasa, marca Fase 7 COMPLETADA en `docs/IMPLEMENTATION_STATUS.md` y deja como próximo prompt: P8.1.

DETENTE.
```

---

# FASE 8 — REPORTES Y OBSERVABILIDAD


## P8.1 — Auditoría consultable

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 19, 45 y 46.

OBJETIVO: Reconstruir recorrido completo de un turno.

IMPLEMENTA:
- Timeline de eventos.
- TicketStages.
- Calls/transferencias/asignaciones.
- Actor/módulo/sala/timestamps.
- Filtros seguros.

CRITERIOS DE ACEPTACIÓN:
- Puede responder quién llamó, dónde y cuándo.
- Transferencias aparecen por etapa.

Siguiente prompt si todo pasa: P8.2.
```

---

## P8.2 — KPIs por etapa

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 46 y 47.

OBJETIVO: Implementar métricas correctas y definidas.

IMPLEMENTA:
- Espera a primer llamado/inicio.
- Duración atención.
- Tiempo por etapa/recorrido.
- Promedio/mediana/p50/p90/máximo.
- Por servicio/asesor/módulo/sede.
- tasa_no_presentado separada de abandono.

CRITERIOS DE ACEPTACIÓN:
- Transferencia no mezcla tiempos.
- Percentiles probados con dataset conocido.

Siguiente prompt si todo pasa: P8.3.
```

---

## P8.3 — Observabilidad y alertas

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 27, 41, 48 y 54.

OBJETIVO: Añadir telemetría operativa.

IMPLEMENTA:
- OTel/Prometheus.
- Grafana básico.
- Alertas: outbox, Display offline, Print Agent/POS error, impresión, latencia.
- Correlación request/event/command/print_job.

CRITERIOS DE ACEPTACIÓN:
- Al menos una alerta probada.
- Logs no contienen secretos/PII innecesaria.

Siguiente prompt si todo pasa: P8.GATE.
```

---

## P8.GATE — GATE DE CALIDAD FASE 8

```text
Actúa como revisor senior de TURNOX.

No implementes nuevas funcionalidades. Lee `docs/IMPLEMENTATION_STATUS.md`, V4 secciones 45–49, y solo código/tests/migraciones/contratos creados o modificados en Fase 8.

Comprueba:
- Auditoría reconstruye recorrido.
- KPIs no mezclan etapas.
- NO_PRESENTADO separado de abandono.
- Alertas mínimas operativas.

Ejecuta las pruebas mínimas necesarias para demostrarlo. Si encuentras defectos de esta fase, corrígelos sin adelantar la siguiente. Si falta una decisión PENDIENTE, no la inventes: marca BLOQUEADO y explica el dato exacto faltante.

Si todo pasa, marca Fase 8 COMPLETADA en `docs/IMPLEMENTATION_STATUS.md` y deja como próximo prompt: P9.1.

DETENTE.
```

---

# FASE 9 — HARDENING


## P9.1 — Security hardening

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 33, 42–44, 48 y 49.

OBJETIVO: Endurecer sin agregar features.

IMPLEMENTA:
- Cookies/CSRF/CORS según topología.
- Rate limits.
- Credenciales dispositivos.
- Privacidad pantalla pública.
- Logs sin secretos.
- Pruebas negativas RBAC.
- Dependencias/config.

CRITERIOS DE ACEPTACIÓN:
- Sin bypass TLS.
- Sin tokens críticos en localStorage.
- Permisos server-side cubiertos.

Siguiente prompt si todo pasa: P9.2.
```

---

## P9.2 — Fault injection

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 5, 11, 16, 23, 28–31 y 49.

OBJETIVO: Probar fallos controlados y corregir resiliencia.

IMPLEMENTA:
- Reinicio API.
- Redis caído.
- Socket desconectado.
- Advisor disconnect con turno activo.
- Servidor apagado en cierre.
- Print Agent/USB/POS fallando.
- Display offline/reconnect.

CRITERIOS DE ACEPTACIÓN:
- Ningún fallo duplica turno/asignación.
- Estado se reconcilia.

Siguiente prompt si todo pasa: P9.3.
```

---

## P9.3 — Backup, restore y capacidad

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 47, 49, 54 y 57.

OBJETIVO: Demostrar recuperabilidad y carga antes del piloto.

IMPLEMENTA:
- Backup DB/storage.
- Restore entorno limpio.
- DNS/TLS/NTP.
- k6 escenarios críticos.
- E2E principal.
- Checklist release/piloto.

REGLAS ESPECIALES:
- Usa RPO/RTO solo si ya fueron acordados.

CRITERIOS DE ACEPTACIÓN:
- Restore funciona.
- Carga no viola invariantes.
- No hay defectos críticos abiertos.

Siguiente prompt si todo pasa: P9.GATE.
```

---

## P9.GATE — GATE DE CALIDAD FASE 9

```text
Actúa como revisor senior de TURNOX.

No implementes nuevas funcionalidades. Lee `docs/IMPLEMENTATION_STATUS.md`, V4 secciones 49, 54, 57 y 61, y solo código/tests/migraciones/contratos creados o modificados en Fase 9.

Comprueba:
- Restore probado.
- Fault tests no rompen invariantes.
- Seguridad/TLS pasan.
- Sin blockers críticos para piloto.

Ejecuta las pruebas mínimas necesarias para demostrarlo. Si encuentras defectos de esta fase, corrígelos sin adelantar la siguiente. Si falta una decisión PENDIENTE, no la inventes: marca BLOQUEADO y explica el dato exacto faltante.

Si todo pasa, marca Fase 9 COMPLETADA en `docs/IMPLEMENTATION_STATUS.md` y deja como próximo prompt: P10.1.

DETENTE.
```

---

# FASE 10 — PILOTO


## P10.1 — Paquete de despliegue piloto

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 53, 54, 58 Fase 10, 60 y 61.

OBJETIVO: Preparar despliegue reproducible.

IMPLEMENTA:
- Docker Compose prod.
- Nginx.
- Migraciones controladas.
- Config Kiosk/Print Agent/Display.
- Runbook install/rollback.
- Contingencia manual.
- Checklist preapertura.

CRITERIOS DE ACEPTACIÓN:
- Instalación desde cero está documentada.
- Rollback no depende de editar DB manualmente.

Siguiente prompt si todo pasa: P10.2.
```

---

## P10.2 — Aceptación end-to-end

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 55, 58 Fase 10 y 61.

OBJETIVO: Ejecutar/documentar aceptación con hardware real.

IMPLEMENTA:
- Emitir/imprimir.
- Llamados concurrentes.
- Rellamar/iniciar/finalizar.
- Transferir/no presentado.
- Reconnect.
- Fallos POS/Redis.
- Auditoría/KPIs.
- Contingencia.

REGLAS ESPECIALES:
- No marques pruebas físicas PASS sin evidencia.

CRITERIOS DE ACEPTACIÓN:
- Cada criterio MVP tiene PASS/FAIL con evidencia.
- Defectos clasificados por severidad.

Siguiente prompt si todo pasa: P10.3.
```

---

## P10.3 — Cierre técnico del piloto

```text
Actúa como desarrollador y arquitecto senior de TURNOX.

FUENTE DE VERDAD: `CONTEXTO_MAESTRO_TURNOX_V4.md`.
Lee `docs/IMPLEMENTATION_STATUS.md`, las secciones V4 indicadas y solo los archivos relacionados.
Implementa ÚNICAMENTE el alcance de este prompt. No adelantes la fase siguiente, no hagas refactors oportunistas, no cambies stack/arquitectura y no inventes PENDIENTES.
Al finalizar ejecuta lint/typecheck/tests relevantes, actualiza brevemente `docs/IMPLEMENTATION_STATUS.md`, reporta archivos modificados, pruebas y bloqueos, sugiere mensaje de commit y DETENTE. No hagas commit automáticamente.

SECCIONES V4: 41, 46, 48, 54, 58 y 61.

OBJETIVO: Cerrar el piloto sin agregar features.

IMPLEMENTA:
- Consolidar métricas/incidentes.
- Revisar impresión/reconexión/sesiones recovery.
- Registrar deuda técnica real.
- Backlog post-MVP priorizado.
- Actualizar ADR si evidencia cambió una decisión.
- Congelar baseline estable.

CRITERIOS DE ACEPTACIÓN:
- No hay incidente crítico sin plan.
- Backlog separa bug/deuda/feature.

Siguiente prompt si todo pasa: P10.GATE.
```

---

## P10.GATE — GATE DE CALIDAD FASE 10

```text
Actúa como revisor senior de TURNOX.

No implementes nuevas funcionalidades. Lee `docs/IMPLEMENTATION_STATUS.md`, V4 secciones 58 Fase 10, 61 y 63, y solo código/tests/migraciones/contratos creados o modificados en Fase 10.

Comprueba:
- Piloto cumple criterios o fallos están documentados.
- Sin intervención manual en DB como operación normal.
- Contingencia validada.
- Baseline y backlog existen.

Ejecuta las pruebas mínimas necesarias para demostrarlo. Si encuentras defectos de esta fase, corrígelos sin adelantar la siguiente. Si falta una decisión PENDIENTE, no la inventes: marca BLOQUEADO y explica el dato exacto faltante.

Si todo pasa, marca Fase 10 COMPLETADA en `docs/IMPLEMENTATION_STATUS.md` y deja como próximo prompt: FIN DEL MVP.

DETENTE.
```

---

# REGLA DE CIERRE

Cuando `P10.GATE` termine satisfactoriamente, no pedir a Codex que invente una Fase 11.

El trabajo post-MVP debe surgir de evidencia: métricas del piloto, incidentes, feedback del cliente, requisitos aprobados y ADRs nuevos.

La V4 continúa siendo la fuente de verdad hasta que exista una versión posterior formalmente aprobada.

## Recomendación práctica

Para los prompts de mayor riesgo (`P2.*`, `P5.*`, `P6.*`) conviene usar una conversación nueva de Codex por prompt o por máximo dos prompts consecutivos. El agente debe reconstruir contexto leyendo V4 solo en las secciones indicadas y `IMPLEMENTATION_STATUS.md`.
