# Recuperación eléctrica y continuidad

Este procedimiento requiere una ventana aprobada y responsable de
infraestructura. No ejecutar cortes, retirar UPS ni desconectar el uplink en
un entorno de usuarios como parte de una validación documental.

## Preparación

Registrar inventario y conexiones reales de servidor TURNOX, switch, router o
firewall local, almacenamiento crítico, mini-PC/atril, TV Box/TV, POS y UPS.
Registrar modelo, serial, firmware, carga medida, tomas protegidas y estado
inicial. Obtener aprobación de autonomía, RPO y RTO; permanecen pendientes si
operación no los ha definido.

## Secuencia controlada

1. Capturar logs y hora de todos los equipos. Confirmar que el servidor, switch,
   router/firewall y almacenamiento crítico estén en la UPS aprobada.
2. Para infraestructura central, simular un microcorte y después un corte
   controlado con carga real. Medir autonomía, estabilidad de LAN, disponibilidad
   del servicio, integridad y recuperación. No extrapolar la autonomía nominal.
3. Para el atril, comprobar en BIOS `Restore on AC Power Loss = Power On` y
   ejecutar tres ciclos. En cada uno registrar boot Ubuntu Desktop, autologin,
   Chromium, red, hora y acceso TLS. El umbral de retorno lo debe aprobar la
   sede.
4. Para el TV Box/TV, ejecutar tres ciclos separados y registrar boot, HDMI,
   audio, Ethernet, hora válida, trust TLS y Display dedicado futuro. No aceptar
   reinicio manual como recuperación.
5. Para la POS, reiniciar el mini-PC y hacer cinco ciclos de reconexión USB.
   Determinar cualquier resultado de impresión incierto sin retry ciego ni
   duplicación física.
6. Restaurar el estado eléctrico y la configuración previa aprobada. Revisar
   logs, reloj, DNS/TLS y estado de cada dependencia; documentar desviaciones y
   el rollback realizado.

## Criterio y evidencia

Un ciclo es `PASS` solo si cumple el criterio correspondiente de OPS-01 a
OPS-03, HW-07/08, TV-07/08 y PR-07, con timestamps y evidencia primaria. La
autonomía UPS, RPO y RTO no se pueden declarar hasta contar con valores
aprobados y una medición cronometrada. Una interrupción no autorizada o una
intervención manual fuera del procedimiento obliga a repetir el ciclo.
