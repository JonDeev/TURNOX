# Validación de reloj y NTP

La zona requerida para la sede es `America/Bogota`. El servidor NTP definitivo
de la LAN sigue pendiente de infraestructura y no se inventa aquí.

## Linux: servidor y atril

Completar `TURN0X_NTP_SERVERS` con el/los servidores administrados, no con un
servicio público provisional, y definir el desfase máximo aprobado por
infraestructura. En el servidor y en el atril Ubuntu ejecutar:

```sh
infra/validation/time/check-clock.sh --config /ruta/segura/validation.env
```

Registrar `timedatectl`, fuente NTP, desfase, estado de sincronización, zona,
hora UTC/local y timestamps. Si se usa `chrony`, conservar `tracking` y
`sources`; si se usa otro servicio, conservar evidencia equivalente de fuente
y desfase.

## TV Box Android

En el box registrar zona, fecha/hora antes y después de reinicio, fuente de
hora disponible, fecha inválida después de pérdida de energía, tiempo hasta
hora válida y conexión posterior. Validar que la aplicación futura no intenta
autenticar TLS antes de una hora válida y que muestra un diagnóstico explícito.
No aceptar una corrección manual como evidencia de sincronización operativa.

## Corte y relación con TLS

Tras corte eléctrico autorizado, repetir la secuencia `boot -> Ethernet -> NTP
LAN -> hora válida -> validación TLS`. Comparar el reloj con la fuente
administrada y correlacionar los logs. Un fallo de TLS con reloj inválido se
diagnostica como problema de tiempo/PKI, nunca con un bypass de certificado.

Actualizar NET-05, TV-08 y OPS-02/03 únicamente después de la prueba física.
