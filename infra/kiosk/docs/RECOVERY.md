# Runbook de recuperación del kiosco

## Diagnóstico inicial

```sh
systemctl status turnox-kiosk-cage.service
systemctl --user status turnox-kiosk-desktop.service
sudo journalctl -u turnox-kiosk-cage.service -b -n 200 --no-pager
journalctl --user -u turnox-kiosk-desktop.service -b -n 200 --no-pager
sudo systemctl show turnox-kiosk-cage.service -p NRestarts -p ExecMainStatus
```

Usar únicamente el servicio correspondiente a la opción aprobada. Si ambos aparecen activos, detener el no aprobado y registrar la desviación.

## Chromium no inicia

1. Ejecutar `sudo infra/kiosk/scripts/validate-config.sh`.
2. Confirmar que el binario configurado existe y que el usuario dedicado puede acceder a su perfil.
3. Revisar el primer error del journal, permisos de `/etc/turnox/kiosk.conf`, resolución DNS y hora del sistema.
4. Corregir configuración o dependencia; no añadir `--no-sandbox` ni desactivar validación TLS.

## Chromium se reinicia repetidamente

El límite de arranque de systemd evita un loop ilimitado. Conservar el journal, detener el servicio si la pantalla queda inestable y corregir la causa antes de limpiar el contador:

```sh
sudo systemctl stop turnox-kiosk-cage.service
sudo systemctl reset-failed turnox-kiosk-cage.service
```

No borrar el perfil automáticamente: puede contener evidencia o una sesión que deba analizarse.

## Pérdida temporal de red

No reiniciar Chromium repetidamente. Comprobar enlace, DNS, hora y certificado; restaurar la LAN y observar que el proceso se mantiene estable. El comportamiento visual de modo degradado pertenece a la futura aplicación y debe validarse antes del piloto.

## Corte eléctrico

Comprobar primero el estado de energía y la BIOS. Tras restituir la alimentación, verificar arranque del OS, login, servicio, Chromium, hora válida y TLS en ese orden. Esta prueba requiere acceso físico y no se considera realizada por este documento.
