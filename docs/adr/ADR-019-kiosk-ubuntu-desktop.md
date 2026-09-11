# ADR-019 — Atril con Ubuntu Desktop endurecido y Chromium

- Estado: `DECISIÓN CERRADA`
- Fecha: 2026-09-10
- Alcance: plataforma base del atril TURNOX
- Confirmación: responsable del proyecto

## Contexto

El atril TURNOX se ejecutará sobre un mini-PC Linux Ubuntu con pantalla táctil e impresora POS USB. El TURNOX Kiosk será una aplicación web React separada del sistema operativo y se abrirá mediante Chromium en modo kiosco. El atril no es una APK Android.

La V4 mantenía abierta la elección entre Ubuntu Server con el compositor kiosco `cage` y Ubuntu Desktop endurecido. La decisión afecta el soporte, la superficie operativa, el consumo de recursos, el autologin, la recuperación y la facilidad de comercializar el producto.

Esta decisión arquitectónica no constituye evidencia de que exista un mini-PC definitivo ni de que sus capacidades físicas hayan sido probadas.

## Decisión

El atril TURNOX utilizará **Ubuntu Desktop endurecido + Chromium en modo kiosco**.

Ubuntu Desktop operará como una sesión dedicada de kiosco, no como un escritorio normal expuesto al usuario público. Chromium continuará siendo la plataforma del TURNOX Kiosk Web. La aplicación React del kiosco permanecerá separada de la configuración del sistema operativo. El Print Agent continuará siendo un servicio local independiente.

La alternativa Ubuntu Server + `cage` + Chromium queda como alternativa no seleccionada y se conserva para trazabilidad histórica; no debe habilitarse junto con el perfil Desktop.

## Alternativas consideradas

### Opción A — Ubuntu Server + `cage` + Chromium

Ventajas consideradas: menor superficie de ataque, menor consumo esperado y comportamiento más cercano a un electrodoméstico dedicado. Desventajas: mayor especialización para soporte de seat/input, compositor Wayland, GPU y diagnóstico de arranque.

### Opción B — Ubuntu Desktop endurecido + Chromium — seleccionada

Ventajas consideradas: soporte más familiar, integración gráfica más accesible y menor fricción para operar una sesión táctil en una instalación Ubuntu Desktop estándar. Desventajas: mayor superficie de ataque, consumo adicional y riesgo de que GNOME muestre paneles, notificaciones, bloqueo, actualizaciones u otros overlays si el endurecimiento es incompleto.

## Razones

- Se prioriza una base gráfica familiar para soporte y mantenimiento.
- La experiencia pública seguirá siendo dedicada y controlada mediante autologin, endurecimiento de la sesión y Chromium kiosco.
- La decisión mantiene el kiosco como Web, permitiendo separar el ciclo de vida de React del sistema operativo.
- El Print Agent no se incorpora al navegador ni al escritorio; mantiene su frontera como servicio independiente.
- La alternativa Server + `cage` se conserva porque su menor superficie puede ser relevante en una futura revisión, pero no forma parte del perfil aprobado actual.

## Consecuencias

### Positivas

- Menor especialización inicial para el equipo de soporte Linux.
- Integración directa con una sesión gráfica Desktop y sus herramientas de diagnóstico.
- Baseline reproducible mediante usuario dedicado, configuración externa, unidades systemd y runbooks.

### Negativas y riesgos aceptados

- Mayor superficie operativa que Ubuntu Server + `cage`.
- Requiere revisar claves y comportamiento de GNOME por versión de Ubuntu.
- El consumo de CPU, RAM y almacenamiento debe medirse en el mini-PC real.
- Autologin, touchscreen, GPU/driver, monitor, recuperación eléctrica y ausencia de overlays pueden fallar por diferencias de hardware o imagen.

## Requisitos de hardening

- Usuario dedicado `turnox-kiosk`, no privilegiado y sin credenciales almacenadas en el repositorio.
- Autologin controlado únicamente para la sesión del kiosco; sin permitir un escritorio normal al público.
- Chromium con `--kiosk`, perfil aislado y URL HTTPS configurable externamente.
- Sin navegación normal del escritorio, paneles, atajos públicos, notificaciones, bloqueo ni actualización interrumpiendo la operación.
- Suspensión, hibernación y apagado automático de pantalla bloqueados según los perfiles aprobados y compatibles con la versión instalada.
- Navegación accidental por gestos laterales y zoom táctil controlados sin desactivar eventos táctiles necesarios.
- Reinicio automático de Chromium mediante systemd con espera y límite de arranque; sin loops agresivos.
- Dependencias, configuración y logs consultables con `systemctl` y `journalctl`.
- Configuración externa, con permisos root y sin URL real, IP fija, certificado privado, credencial o secreto embebido.
- Validación TLS siempre activa; no usar `--ignore-certificate-errors`, `--no-sandbox` ni equivalentes.
- Hostname y servicio resueltos por DNS administrado; NTP contra la LAN y hora válida antes de confiar en TLS.
- BIOS configurada manualmente en `Restore on AC Power Loss = Power On` cuando el equipo lo soporte.

## Pendientes de validación física

Permanecen `PENDIENTE — REQUIERE VALIDACIÓN FÍSICA` hasta probar el equipo real:

- autologin efectivo y arranque automático tras boot;
- ausencia real de escritorio, paneles, notificaciones y navegación accidental;
- GPU, driver, Wayland/Xorg, touchscreen y calibración;
- monitor, resolución, orientación y ausencia de overscan;
- rendimiento y estabilidad de Chromium;
- reinicio tras cierre inesperado;
- BIOS y recuperación tras corte eléctrico;
- red física, DNS, PKI/TLS y NTP de la sede;
- comportamiento durante pérdida temporal de red y sin Internet externo.

No se marca ninguna prueba física como `PASS` por la aprobación de este ADR.
