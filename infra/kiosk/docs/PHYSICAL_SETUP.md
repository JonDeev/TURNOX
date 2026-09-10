# Preparación física pendiente

Este documento separa lo que puede declararse en archivos de lo que solo puede comprobarse en el mini-PC real. Ningún punto de esta lista se marca como `PASS` por existir la configuración.

## BIOS y energía

Configurar manualmente en firmware:

1. Registrar fabricante, modelo, serial, versión de BIOS y fecha.
2. Establecer `Restore on AC Power Loss = Power On` (el nombre puede variar; registrar fotografía/captura).
3. No cambiar otras opciones de firmware sin documentar el motivo y el valor anterior.
4. Ejecutar tres ciclos controlados de corte/restauración y registrar desde el encendido hasta Chromium operativo.

Estado actual: `PENDIENTE — REQUIERE VALIDACIÓN FÍSICA`.

## Touchscreen, GPU y monitor

Validar sobre la unidad elegida: detección del touchscreen, calibración con dedo, ausencia de toques fantasma, driver/GPU, resolución, orientación, overscan y recuperación tras reconexión del monitor. Para la Opción A validar además seat/input y permisos necesarios para `cage`.

Estado actual: `PENDIENTE — REQUIERE VALIDACIÓN FÍSICA`.

## Sesión dedicada

- Opción B seleccionada: configurar autologin solo para `turnox-kiosk`, aplicar el perfil GNOME aprobado y comprobar que no quedan paneles, atajos, notificaciones, bloqueo ni actualizaciones interrumpiendo el kiosco.
- Opción A: no activar; probarla solo si una decisión posterior autoriza comparar el perfil Server + `cage`.

El autologin de GDM se configura manualmente revisando `config/desktop/gdm3-autologin.conf.example`; no se guardan credenciales en el repositorio. El usuario dedicado debe ser un usuario de Desktop sin privilegios administrativos, y su pertenencia a grupos adicionales debe justificarse por el hardware validado.
- En ambas opciones, no dejar habilitadas simultáneamente las dos unidades systemd.

Estado actual: `PENDIENTE — REQUIERE VALIDACIÓN FÍSICA`.

## Red, reloj y TLS

Registrar la interfaz física, switch/VLAN, nombre DNS aprobado, CA o certificado administrado, servidor NTP LAN y evidencia de rechazo de certificados inválidos. Repetir con el enlace a Internet desconectado, sin escribir IPs manualmente en el cliente.

Estado actual: `PENDIENTE — REQUIERE VALIDACIÓN DE INFRAESTRUCTURA`.

## Criterio de evidencia

Guardar inventario, capturas BIOS, video de arranque/recuperación, configuración saneada y journals con timestamps en la revisión de la matriz por sede. El resultado global sigue `PENDIENTE` hasta que los requisitos obligatorios de la matriz pasen en la unidad real.
