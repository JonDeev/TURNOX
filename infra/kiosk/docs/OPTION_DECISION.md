# Decisión de plataforma del kiosco

La decisión documental del proyecto es **Opción B — Ubuntu Desktop endurecido + Chromium**, confirmada explícitamente por el responsable el 2026-09-10. La validación sobre hardware real sigue pendiente; por ello esta decisión no convierte ninguna prueba física en `PASS`. La Opción A se conserva como alternativa no activa.

| Criterio | Opción A — Ubuntu Server + `cage` (no activa) | Opción B — Ubuntu Desktop endurecido (seleccionada) |
|---|---|---|
| Superficie de ataque | Menor: no incluye un escritorio completo; quedan Chromium, compositor, sesión/seat y servicios base. | Mayor: incluye GNOME, servicios de sesión y más componentes que deben desactivarse o actualizarse. |
| Mantenimiento | Requiere conocimiento de Wayland, `cage`, seat/input y diagnóstico de sesión. | Más familiar para soporte Linux de escritorio; más ajustes persistentes que revisar. |
| Simplicidad | Menos piezas visibles una vez validado; configuración inicial más especializada. | Arranque inicial más conocido; el endurecimiento y las excepciones de GNOME agregan complejidad. |
| Consumo de recursos | Menor consumo esperado; debe medirse en la unidad real. | Mayor consumo esperado; debe medirse junto con Chromium y la pantalla táctil. |
| Recuperación | Flujo dedicado y más determinista si el compositor obtiene correctamente el seat. | Chromium puede reiniciar, pero GNOME puede mostrar overlays o dejar una sesión no dedicada si el endurecimiento es incompleto. |
| Facilidad de soporte | Logs concentrados en systemd/compositor/Chromium; requiere runbook específico. | Herramientas de escritorio familiares, pero más estados y notificaciones que descartar. |
| Experiencia de usuario | Más cercana a un electrodoméstico dedicado. | Puede ser equivalente solo tras validar que no aparece escritorio, bloqueo, actualización o notificación. |
| Conveniencia comercial | Mejor encaje potencial para un producto sin supervisión técnica, sujeto a soporte de la pila gráfica. | Puede acelerar soporte en instalaciones con Desktop estandarizado, con mayor coste operativo por unidad. |

## Evidencia requerida antes de cerrar Fase 0

- Arranque automático y recuperación de Chromium tras reinicio y cierre inesperado.
- Calibración táctil, ausencia de navegación lateral accidental y ausencia de escritorio visible.
- Consumo de CPU/RAM/almacenamiento medido en la unidad real.
- Comportamiento de GPU/driver, monitor y resolución.
- Recuperación tras corte eléctrico con BIOS en `Restore on AC Power Loss = Power On`.
- Mantenimiento, actualización y diagnóstico ejecutados por el responsable de soporte.

Hasta obtener esa evidencia, la selección de Opción B es documental; HW-01 a HW-08 permanecen `PENDIENTE` y no debe habilitarse el perfil Server + `cage`.
