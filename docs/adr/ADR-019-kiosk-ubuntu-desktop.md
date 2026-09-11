# ADR-019 — Perfil V1 del atril con Ubuntu Desktop endurecido y Chromium

- Estado: `DECISIÓN CERRADA`
- Fecha: 2026-09-10
- Alcance: perfil de despliegue inicial V1 del atril TURNOX
- Confirmación: responsable del proyecto

## Contexto

El despliegue inicial V1 del atril TURNOX se ejecutará sobre un mini-PC Linux/Ubuntu con pantalla táctil e impresora POS USB. TURNOX Kiosk será una aplicación web React separada del sistema operativo y se abrirá mediante Chromium en modo kiosco. El atril no es una APK Android.

La decisión de Ubuntu Desktop pertenece a la infraestructura del despliegue V1. No define el dominio, no define el frontend y no convierte a Ubuntu Desktop en un requisito arquitectónico de TURNOX Kiosk Web.

La V4 mantenía abierta la elección entre Ubuntu Server con el compositor kiosco `cage` y Ubuntu Desktop endurecido. La decisión afecta el soporte, la superficie operativa, el consumo de recursos, el autologin, la recuperación y la facilidad de comercializar el producto.

Esta decisión arquitectónica no constituye evidencia de que exista un mini-PC definitivo ni de que sus capacidades físicas hayan sido probadas.

## Decisión

El **perfil de despliegue oficialmente soportado inicialmente para V1** será **Ubuntu Desktop endurecido + Chromium en modo kiosco**.

Ubuntu Desktop operará como una sesión dedicada de kiosco, no como un escritorio normal expuesto al usuario público. Chromium será el runtime del TURNOX Kiosk Web en este perfil. TURNOX Kiosk continúa siendo una aplicación web React + TypeScript + Vite, ejecutada mediante navegador y desacoplada del sistema operativo en la medida técnicamente posible. La aplicación web permanecerá separada de la configuración del sistema operativo.

Para V1, el Print Agent tendrá soporte oficial sobre Linux/Ubuntu. `systemd` y `udev` pertenecen al adapter/plataforma Linux y a la integración local con la impresora; TURNOX Kiosk Web no debe depender de esos detalles. El Print Agent continuará siendo un servicio local independiente y no formará parte de Chromium ni del escritorio.

Esta decisión no impide agregar en el futuro adapters del Print Agent para otros sistemas operativos, ni otros perfiles de despliegue con navegador, sin modificar el dominio ni la aplicación web del kiosco.

La alternativa Ubuntu Server + `cage` + Chromium queda como alternativa no seleccionada y se conserva para trazabilidad histórica; no debe habilitarse junto con el perfil Desktop.

## Alternativas consideradas

### Opción A — Ubuntu Server + `cage` + Chromium

Ventajas consideradas: menor superficie de ataque, menor consumo esperado y comportamiento más cercano a un electrodoméstico dedicado. Desventajas: mayor especialización para soporte de seat/input, compositor Wayland, GPU y diagnóstico de arranque.

### Opción B — Ubuntu Desktop endurecido + Chromium — seleccionada

Ventajas consideradas: soporte más familiar, integración gráfica más accesible y menor fricción para operar una sesión táctil en una instalación Ubuntu Desktop estándar. Desventajas: mayor superficie de ataque, consumo adicional y riesgo de que GNOME muestre paneles, notificaciones, bloqueo, actualizaciones u otros overlays si el endurecimiento es incompleto.

## Razones

- Se prioriza una base gráfica familiar para soporte y mantenimiento.
- La experiencia pública seguirá siendo dedicada y controlada mediante autologin, endurecimiento de la sesión y Chromium kiosco.
- La decisión mantiene el kiosco como Web, permitiendo separar el ciclo de vida de React del sistema operativo y mantener abierta la evolución hacia otros perfiles de despliegue.
- El Print Agent no se incorpora al navegador ni al escritorio; mantiene su frontera como servicio independiente y su adapter Linux en V1.
- La alternativa Server + `cage` se conserva porque su menor superficie puede ser relevante en una futura revisión, pero no forma parte del perfil aprobado actual.

## Consecuencias

### Positivas

- Menor especialización inicial para el equipo de soporte Linux.
- Integración directa con una sesión gráfica Desktop y sus herramientas de diagnóstico.
- Baseline reproducible mediante usuario dedicado, configuración externa, unidades systemd y runbooks.
- Alcance V1 explícito: Ubuntu Desktop es infraestructura del atril; el Kiosk Web y el dominio permanecen independientes.

### Negativas y riesgos aceptados

- Mayor superficie operativa que Ubuntu Server + `cage`.
- Requiere revisar claves y comportamiento de GNOME por versión de Ubuntu.
- El consumo de CPU, RAM y almacenamiento debe medirse en el mini-PC real.
- Autologin, touchscreen, GPU/driver, monitor, recuperación eléctrica y ausencia de overlays pueden fallar por diferencias de hardware o imagen.
- El soporte oficial inicial del Print Agent queda limitado a Linux/Ubuntu; otros sistemas operativos requieren adapters específicos posteriores.

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
