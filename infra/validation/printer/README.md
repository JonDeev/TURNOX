# Validación de impresora POS y ESC/POS

Esta prueba es de hardware, sistema operativo y protocolo. No implementa
Print Agent ni `PrinterAdapter`, no crea trabajos de producción y no usa una
marca, Vendor ID, Product ID o ruta de dispositivo predeterminada.

## Precondiciones y registro

Usar una POS real, rollo aprobado y una ventana sin usuarios. Registrar desde
la etiqueta/manual y la unidad física: fabricante, modelo, serial, firmware,
ancho, tipo de conexión, cortador y capacidades de estado. La ficha comercial
sola no es evidencia suficiente.

## Secuencia

1. Conectar USB al atril Ubuntu y ejecutar con la ruta observada en esa unidad:

   ```sh
   infra/validation/printer/inspect-linux.sh --device /dev/RUTA_OBSERVADA
   ```

   Guardar `lsusb`, `udevadm info`, permisos, grupo, kernel log, puerto físico
   y timestamps. No copiar los identificadores al repositorio.
2. Comprobar permisos con mínimo privilegio: el usuario/servicio de prueba debe
   poder escribir solo sobre el recurso requerido; no usar root como solución
   permanente. Registrar grupo/regla aplicada y revertir cualquier permiso
   temporal al terminar.
3. Repetir conexión en frío, desconexión y reconexión en caliente cinco veces,
   incluyendo reinicio del mini-PC. Confirmar que no aparecen errores USB y que
   la ruta candidata se mantiene o se sustituye por un symlink administrado.
4. Solo después de observar atributos reales, adaptar la plantilla
   [`udev-printer.rules.example`](udev-printer.rules.example). La plantilla no
   es instalable y no autoriza IDs inventados. Probar la regla en la unidad,
   revisar `udevadm test`, permisos, colisiones y cinco reconexiones. El
   rollback consiste en retirar la regla específica aprobada y restaurar la
   configuración udev anterior, conservando evidencia.
5. Ejecutar el patrón independiente de ESC/POS:

   ```sh
   infra/validation/printer/escpos-test.sh \
     --device /RUTA_OBSERVADA --text 'TEXTO_DE_PRUEBA_DE_LA_SEDE' \
     --encoding CODIFICACION_VALIDADA
   ```

   La ruta y el texto son parámetros de la prueba. El patrón envía reset,
   alineación, texto, saltos, avance y corte estándar; la línea `PASS` del
   script solo significa que los bytes se escribieron, no que la impresión
   física sea correcta.
6. Validar en papel de 80 mm: ancho útil, texto, alineación, saltos, caracteres
   requeridos, codificación, legibilidad, avance, corte y velocidad. Repetir
   cinco impresiones y registrar lote, tiempos y fotografías.
7. Si el manual confirma comandos de estado para ese modelo, ejecutar la
   consulta documentada en una herramienta temporal de laboratorio y registrar
   la respuesta. No enviar comandos de estado no confirmados. Probar por
   separado sin papel, tapa abierta, impresora desconectada/offline y restitución;
   el criterio es distinguir cada estado dentro del límite de la matriz.
8. Probar apagado/encendido de la POS y del mini-PC. Después de desconectar USB
   durante una transmisión, reconectar y determinar el resultado sin reintentar
   ciegamente: un resultado físico incierto se escala y no se duplica.

## Criterio de cierre

Actualizar PR-01 a PR-07 solo con evidencia primaria. PR-06 es recomendado;
los demás son obligatorios para las puertas indicadas en la matriz. La
compatibilidad ESC/POS demostrada no selecciona por sí sola la impresora
definitiva.
