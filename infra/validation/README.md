# TURNOX — Kit de validación de Fase 0

Este directorio contiene procedimientos y utilidades pequeñas para demostrar
capacidades físicas y de infraestructura sobre equipos reales. No contiene
Print Agent, TURNOX Display, Kiosk Web, backend ni lógica de turnos.

## Reglas de uso

- Copiar `config/validation.env.example` fuera del repositorio y completar
  únicamente valores aprobados para la sede y la ventana de prueba.
- No guardar en el repositorio IPs, nombres de sede, credenciales, certificados
  ni identificadores USB reales.
- Ejecutar cada prueba con una hoja de evidencia de la sede y conservar la
  salida, timestamps, fotografías/capturas y responsable.
- Una utilidad que termina correctamente solo demuestra que su comprobación
  técnica se ejecutó; el estado de la matriz se cambia a `PASS` únicamente
  después de revisar el criterio y la evidencia primaria.
- No ejecutar cortes eléctricos, desconexiones de uplink ni pruebas que puedan
  afectar usuarios sin autorización física y ventana aprobada.

## Preparación común

```sh
cp infra/validation/config/validation.env.example /ruta/segura/validation.env
chmod 600 /ruta/segura/validation.env
```

La ruta anterior es un ejemplo de operación, no una ruta requerida. El archivo
de configuración es `KEY=value` compatible con shell y debe tratarse como
entrada confiable del responsable de la prueba; no debe contener secretos.

## Procedimientos

- [Red, DNS, TLS y operación sin Internet](network/README.md)
- [Impresora POS, USB y ESC/POS](printer/README.md)
- [TV Box Android, HDMI, audio y almacenamiento](display/README.md)
- [Reloj y NTP](time/README.md)
- [Recuperación eléctrica y UPS](docs/POWER_RECOVERY.md)
- [Baseline físico del atril Ubuntu Desktop](../kiosk/docs/PHYSICAL_SETUP.md) y
  [runbook de recuperación](../kiosk/docs/RECOVERY.md)
- [Preparación común de evidencia](docs/EVIDENCE_TEMPLATE.md)

Las pruebas de latencia extremo a extremo quedan preparadas como medición
posterior: requieren el software completo y no tienen un umbral contractual
definido en V4.
