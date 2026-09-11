# TURNOX Kiosk — Linux/Ubuntu deployment profile

## Propósito

Este directorio prepara el baseline reproducible del perfil de despliegue Linux/Ubuntu del atril TURNOX. Para V1, ese perfil es Ubuntu Desktop endurecido + Chromium en modo kiosco. Define un usuario dedicado, configuración externa, lanzamiento del navegador, recuperación mediante systemd, configuración de hostname/tiempo y procedimientos operativos.

No contiene TURNOX Kiosk, React, Print Agent, infraestructura de TURNOX ni paquetes instalables. TURNOX Kiosk continúa siendo una aplicación web independiente del sistema operativo; este directorio describe únicamente su perfil de despliegue V1. La URL debe apuntar a una aplicación real únicamente después de que el equipo y la red hayan sido validados.

La decisión del **perfil de despliegue inicial V1** está **CERRADA**: **Ubuntu Desktop endurecido + Chromium**, confirmada explícitamente por el responsable del proyecto. Ubuntu Desktop es infraestructura del atril V1, no un requisito de TURNOX Kiosk Web. La validación física de la unidad todavía está pendiente. La Opción A se conserva como alternativa técnica no activa para comparación histórica.

- **Opción A — Ubuntu Server + `cage` + Chromium:** alternativa no seleccionada.
- **Opción B — Ubuntu Desktop endurecido + Chromium:** perfil de despliegue V1 seleccionado, pendiente de validación física.

Ambos perfiles se entregan como plantillas. El perfil Desktop es el activo; el baseline no habilita servicios automáticamente.

## Estructura

```text
infra/kiosk/
├── README.md
├── config/
│   ├── kiosk.conf.example
│   ├── common/
│   │   ├── logind-kiosk.conf.example
│   │   └── sleep-kiosk.conf.example
│   └── desktop/
│       ├── dconf-kiosk.ini.example
│       └── gdm3-autologin.conf.example
├── docs/
│   ├── OPTION_DECISION.md
│   ├── PHYSICAL_SETUP.md
│   └── RECOVERY.md
├── scripts/
│   ├── configure-hostname.sh
│   ├── configure-time.sh
│   ├── install.sh
│   ├── launch-cage.sh
│   ├── launch-chromium.sh
│   ├── uninstall.sh
│   └── validate-config.sh
└── systemd/
    ├── turnox-kiosk-cage.service
    └── turnox-kiosk-desktop.service
```

La configuración del sistema operativo vive en `/etc/turnox/kiosk.conf`; no se copia ningún secreto al repositorio. La aplicación, sus despliegues y sus certificados quedan fuera de este baseline.

Los ejemplos en `config/common/` y `config/desktop/` son perfiles declarativos para la Opción B. Deben aplicarse solo después de revisar la versión de Ubuntu/GNOME; no se activan automáticamente. Bloquean suspensión, acciones de energía y la inactividad del escritorio, y requieren validación física para confirmar que no impiden mantenimiento o apagado controlado.

## Instalación en un mini-PC real

La instalación requiere acceso root y debe ejecutarse sobre una imagen de Ubuntu aprobada, no sobre este entorno de desarrollo. El instalador no instala paquetes, no habilita un perfil y no cambia BIOS.

1. Revisar [`docs/OPTION_DECISION.md`](docs/OPTION_DECISION.md) y la imagen Ubuntu Desktop aprobada.
2. Instalar los paquetes mantenidos por Ubuntu necesarios para Chromium y el entorno Desktop. No instalar `cage` para el perfil activo; sus archivos se conservan únicamente como alternativa no seleccionada.
3. Copiar el repositorio al equipo y ejecutar:

   ```sh
   sudo infra/kiosk/scripts/install.sh
   sudoedit /etc/turnox/kiosk.conf
   sudo infra/kiosk/scripts/validate-config.sh
   ```

4. Configurar hostname, zona horaria y NTP de la LAN con los valores aprobados:

   ```sh
   sudo infra/kiosk/scripts/configure-hostname.sh
   sudo infra/kiosk/scripts/configure-time.sh
   ```

5. Configurar autologin y la sesión gráfica del usuario dedicado según `PHYSICAL_SETUP.md`. Activar únicamente `turnox-kiosk-desktop.service`.
6. Aplicar los perfiles de `config/common/`, configurar el autologin de GDM y aplicar el perfil dconf candidato solo con revisión de la versión instalada.
7. Ejecutar las comprobaciones de `systemd-analyze verify` y revisar el journal antes de entregar el equipo.

La configuración de ejemplo deja los parámetros requeridos vacíos a propósito. No sustituirlos por IPs, certificados, credenciales o secretos en scripts.

## Parámetros

Editar `/etc/turnox/kiosk.conf`, propiedad de `root:turnox-kiosk` y con permisos `0640`:

| Parámetro | Uso |
|---|---|
| `TURN0X_KIOSK_URL` | URL HTTPS del kiosco. Debe ser un nombre DNS estable, no una IP escrita en el script. |
| `TURN0X_HOSTNAME` | Hostname aprobado para el mini-PC. |
| `TURN0X_TIMEZONE` | Zona horaria IANA de la sede. |
| `TURN0X_NTP_SERVERS` | Uno o más servidores NTP administrados en la LAN. |
| `TURN0X_CHROMIUM_BINARY` | Ruta del binario Chromium instalado en la imagen. |
| `TURN0X_CAGE_BINARY` | Ruta de `cage` para la alternativa A no activa. |
| `TURN0X_CHROMIUM_PROFILE_DIR` | Directorio persistente del perfil aislado del kiosco. |
| `TURN0X_CHROMIUM_EXTRA_FLAGS` | Flags adicionales aprobados; el launcher rechaza flags que debilitan TLS o el sandbox. |
| `TURN0X_CA_CERT_PATH` | Ruta externa opcional para la CA administrada; no se almacena el certificado aquí. La instalación del trust requiere procedimiento de infraestructura. |

La configuración no contiene credenciales. El hostname, DNS, PKI/TLS, NTP, RPO/RTO y autonomía de UPS deben ser definidos por infraestructura/operación antes del piloto.

## Responsabilidades y límites

| Elemento | Responsabilidad en V1 |
|---|---|
| TURNOX Kiosk | Aplicación web React + TypeScript + Vite; no depende arquitectónicamente de Ubuntu Desktop |
| Chromium | Runtime de navegador del Kiosk Web en el perfil V1 |
| Ubuntu Desktop endurecido | Plataforma de despliegue de referencia del atril V1 |
| Print Agent Linux | Integración local con la impresora; soporte inicial Linux/Ubuntu |

`systemd` y `udev` pertenecen al adapter/plataforma Linux del Print Agent y del baseline de despliegue. El Kiosk Web no debe depender de esos detalles. En el futuro podrían añadirse adapters del Print Agent para otros sistemas operativos sin modificar el dominio ni la aplicación web.

## Operación

### Opción B — Desktop endurecido (perfil activo)

Después de preparar autologin, GNOME y los perfiles de endurecimiento en el mini-PC real, la instalación deja la unidad Desktop en el ámbito global de unidades de usuario (`/etc/systemd/user/`). Habilitarla desde la sesión del usuario dedicado:

```sh
systemctl --user daemon-reload
systemctl --user enable --now turnox-kiosk-desktop.service
```

La unidad Desktop no debe instalarse ni habilitarse como servicio del system
manager: depende de la sesión gráfica autenticada del usuario `turnox-kiosk`.

### Opción A — Server + `cage` (alternativa no activa)

La unidad `turnox-kiosk-cage.service` permanece versionada para comparación o futura decisión, pero no debe instalarse ni habilitarse en el atril actual.

Estado del perfil activo:

```sh
systemctl --user status turnox-kiosk-desktop.service
```

Detener sin deshabilitar el arranque:

```sh
systemctl --user stop turnox-kiosk-desktop.service
```

Consultar logs:

```sh
journalctl --user -u turnox-kiosk-desktop.service -b --no-pager
```

La política `Restart=on-failure` con espera y límites de arranque evita loops agresivos. Un cierre limpio no se reinicia automáticamente; un fallo sí.

## Recuperación

Para probar recuperación en una ventana autorizada, registrar hora y evidencia antes de provocar un cierre controlado:

```sh
systemctl --user kill --signal=TERM turnox-kiosk-desktop.service
journalctl --user -fu turnox-kiosk-desktop.service
```

Verificar después que Chromium vuelve a la URL configurada, que no se expone el escritorio y que el perfil no se corrompe.

La pérdida temporal de red no debe convertirse en una orden de reinicio continuo: Chromium se mantiene ejecutando y la aplicación futura debe mostrar su estado degradado y recuperar la conexión. DNS, TLS y la hora válida se verifican en la infraestructura y durante la validación física; nunca se corrigen con `--ignore-certificate-errors`.

Los cortes eléctricos y `Restore on AC Power Loss = Power On` requieren intervención física y están documentados en [`docs/PHYSICAL_SETUP.md`](docs/PHYSICAL_SETUP.md). Siguen `PENDIENTE — REQUIERE VALIDACIÓN FÍSICA`.

## Revertir / desinstalar

Antes de revertir, detener y deshabilitar el perfil activo y conservar el journal de la incidencia. El procedimiento seguro es:

```sh
systemctl --user disable --now turnox-kiosk-desktop.service
sudo infra/kiosk/scripts/uninstall.sh
```

`uninstall.sh` elimina únicamente las unidades, scripts y directorios que este baseline instala; preserva `/etc/turnox/kiosk.conf` por defecto. Para retirar la configuración después de verificar una copia protegida, usar explícitamente `--remove-config`. No elimina paquetes, perfiles de usuario ni datos de aplicación de forma recursiva.

## Acceso físico requerido

Requieren acceso físico y no están validados por este repositorio: ajuste BIOS, autoarranque tras corte, pantalla táctil y calibración, GPU/driver, monitor/resolución, seat/input de `cage`, red física, DNS/PKI/TLS de la sede, comportamiento sin Internet y recuperación eléctrica real. Todos deben permanecer pendientes hasta disponer de evidencia primaria de la unidad.

## Límites de alcance

Este baseline no implementa React, TURNOX Kiosk, NestJS, PostgreSQL, tickets, impresión, Print Agent, Docker, tablas, autenticación ni ninguna funcionalidad de negocio.
