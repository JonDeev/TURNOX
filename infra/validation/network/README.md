# Validación de LAN, DNS, TLS y operación local

## Alcance

La red de prueba debe contener el servidor TURNOX, el atril, el TV Box y la
ubicación prevista para el Print Agent. El Print Agent aún no se implementa;
solo se valida que su futuro host tendría conectividad hacia los servicios
necesarios. La prueba no modifica rutas, DNS ni firewall.

El nombre del servicio y los puertos se toman de una configuración externa. No
se escribe una IP en los clientes y no se inventa el hostname pendiente de
infraestructura.

## Preparación

Completar una copia saneada de `config/validation.env.example`:

```sh
TURN0X_DNS_NAMES="server|HOSTNAME_APROBADO|PUERTO_TLS kiosk|HOSTNAME_APROBADO|PUERTO_TLS"
TURN0X_LAN_TARGETS="server|HOSTNAME_APROBADO|PUERTO_TLS display|HOSTNAME_APROBADO|PUERTO_TLS"
TURN0X_PING_COUNT="VALOR_APROBADO"
TURN0X_PING_TIMEOUT_SECONDS="VALOR_APROBADO"
TURN0X_TCP_TIMEOUT_SECONDS="VALOR_APROBADO"
```

La línea anterior es una forma de configuración, no valores para producción.
Usar el archivo solo en una máquina autorizada y no incorporarlo al control de
versiones.

## Secuencia reproducible

1. Dibujar el mapa físico: servidor, switch, router/firewall, VLAN, puertos,
   atril, TV Box, televisor y futuro host del Print Agent. Registrar cableado,
   enlace negociado y cambios de firewall con sus responsables.
2. Desde cada host Linux disponible ejecutar:

   ```sh
   infra/validation/network/check-dns.sh --config /ruta/segura/validation.env
   infra/validation/network/check-lan.sh --config /ruta/segura/validation.env
   ```

   En Android, usar los diagnósticos del box o una captura de su configuración
   Ethernet. La utilidad Linux no sustituye la prueba desde el cliente real.
3. Para cada endpoint HTTPS, ejecutar `check-tls.sh` con el hostname, puerto,
   ruta de salud y timeouts aprobados por infraestructura. Si se usa una CA
   interna, pasar su archivo administrado con `--ca-file`; no copiarlo al
   repositorio. El resultado debe demostrar cadena de confianza, hostname y
   vigencia. Repetir desde Chromium y desde el TV Box cuando la estrategia de
   trust esté instalada.
4. Verificar renovación/rotación en un entorno controlado: emitir un
   certificado de prueba por el mecanismo aprobado, instalar solo la cadena
   prevista, rotar sin bypass y documentar la reconexión. Probar también que un
   certificado expirado, con nombre incorrecto o sin cadena confiable es
   rechazado. No usar `--ignore-certificate-errors` ni equivalentes.
5. Medir latencia LAN hacia cada servicio relevante desde cada tipo de cliente:

   ```sh
   infra/validation/network/measure-latency.sh \
     --host HOSTNAME_APROBADO --count N --timeout-seconds N
   ```

   Guardar la salida completa, pérdida, mínimo, media, máximo y desviación.
   Repetir en reposo y con carga representativa, sin convertir la demostración
   ICMP en una afirmación de latencia de aplicación.
6. Repetir DNS, TCP y HTTPS tras reiniciar switch/router y tras una
   desconexión/reconexión controlada del enlace del cliente. Registrar si el
   nombre conserva el mismo servicio aunque cambie la dirección gestionada por
   infraestructura.

## Escenario sin Internet externo

Requiere ventana autorizada. Desconectar únicamente el uplink externo; no
desconectar la LAN ni apagar el servidor, switch o router/firewall local.

Durante el aislamiento registrar timestamps y probar:

- resolución DNS interna;
- TCP hacia el servicio local;
- HTTPS/WSS del servicio local, con validación TLS normal;
- acceso del atril y del Display al núcleo local;
- impresión futura desde el host del Print Agent, cuando exista;
- audio/video y estado operativo local;
- hora mediante el NTP de la LAN;
- ausencia de llamadas a servicios externos en DNS, logs y captura de red
  aprobada.

El resultado esperado es `PASS` solo para las funciones locales necesarias que
sean demostradas. Documentar por separado cualquier función deliberadamente
no disponible sin Internet. Restaurar el uplink y repetir las comprobaciones,
registrando el tiempo y la ausencia de intervención manual inesperada.

## Diagnóstico y rollback

- Fallo DNS: revisar registro y zona administrada, búsqueda desde el cliente y
  TTL; no sustituirlo por IP fija.
- Fallo TCP: revisar enlace, VLAN, rutas y firewall por puerto; conservar
  capturas y configuración anterior para rollback.
- Fallo TLS: revisar reloj, SAN/hostname, cadena, trust y vigencia; renovar o
  corregir PKI. No desactivar validación.
- Fallo tras reconexión: conservar logs, no reiniciar en bucle ni borrar estado;
  restituir el último cambio de red aprobado y repetir en una ventana segura.

La prueba de latencia extremo a extremo queda pendiente hasta que existan API,
realtime, Display y captura correlacionable. Medir posteriormente:

`acción del asesor -> API -> realtime -> Display -> inicio visual/sonoro`

Registrar un identificador de evento, timestamps monotónicos y de pared en cada
salto, al menos 30 muestras, pérdida/duplicación y p50/p95/máximo. Estado de
aceptación: `PENDIENTE — UMBRAL POR DEFINIR / MEDIR EN PILOTO`.
