# Validación física del TV Box Android

La decisión cerrada es TV Box Android TV / Google TV por HDMI, preferiblemente
Ethernet. El modelo y el mecanismo definitivo de dispositivo dedicado siguen
pendientes y deben decidirse solo después de probar hardware real.

## Inventario

Registrar desde etiqueta, ajustes y comandos verificables: fabricante, modelo,
serial, firmware, versión Android/API, RAM, almacenamiento total y libre,
Ethernet, Wi-Fi de contingencia, USB, resolución y versión del televisor. Como
ayuda opcional, con depuración autorizada y sin usarla como mecanismo
productivo:

```sh
infra/validation/display/adb-inventory.sh --serial SERIAL_OBSERVADO
```

El serial se obtiene del equipo durante la sesión; no se hardcodea.

## Secuencia física

1. Arrancar el box con Ethernet y HDMI conectados. Confirmar enlace Ethernet,
   DHCP/DNS administrados, estabilidad tras cinco reinicios y ausencia de
   dependencia de Wi-Fi para el camino normal.
2. Medir almacenamiento disponible en bytes, instalar únicamente el paquete
   multimedia de prueba y conservar margen aprobado. No convertir GB nominales
   en minutos estimados: depende de bitrate, resolución y códec. Si se evalúa
   USB, registrar montaje, permisos, estabilidad y retirada segura; marcar la
   capacidad como opcional cuando no sea necesaria.
3. Reproducir el video representativo en bucle durante la ventana acordada.
   Registrar resolución, pausas, frames perdidos observables, temperatura,
   throttling, consumo y comportamiento con almacenamiento próximo al límite
   de prueba. El video nunca debe impedir una prueba posterior de llamado.
4. Conectar al televisor de destino y validar HDMI durante arranque,
   reproducción y reconexión. Confirmar resolución, bordes, overscan, texto
   legible y recuperación de imagen. Probar HDMI-CEC solo si la sede lo
   necesita; no usarlo como sustituto de autoarranque. Si no aplica, registrar
   `NO_APLICA` con aprobación.
5. Validar audio HDMI con video activo: voz representativa completa y
   comprensible, sin cortes/distorsión, volumen del box, volumen físico fijado
   en el TV y latencia perceptible. Probar ducking futuro como comportamiento
   esperado: bajar video durante anuncio y restaurarlo al terminar. Registrar
   la autoridad de audio de la sala; con varias TVs, solo una debe anunciar y
   las demás ser visuales.
6. Probar el mecanismo candidato de dispositivo dedicado desde arranque limpio:
   launcher, Device Owner/Lock Task, MDM u otra opción soportada. Intentar
   salir, abrir ajustes y cambiar de aplicación con entradas públicas y de
   mantenimiento documentadas. Registrar el procedimiento de mantenimiento y
   rollback. No seleccionar el mecanismo definitivo antes de esta prueba.
7. Probar reinicio controlado cinco veces y recuperación eléctrica tres veces
   solo con autorización física. Medir desde energía estable hasta imagen,
   audio, Ethernet, hora válida, trust TLS y Display administrado. Si la hora
   es inválida, el cliente futuro debe mostrar causa y esperar antes de
   conectar; no se acepta desactivar TLS.

## Criterio de cierre

Actualizar TV-01 a TV-09 y OPS-03 solo con capturas, video, logs y timestamps
de la unidad. La utilidad ADB es inventario/diagnóstico; no implementa Android,
Display ni pairing.
