# TURNOX Platform

Fundación del monorepo TypeScript de TURNOX. Android Display permanece en su
repositorio Gradle separado y no forma parte de esta base.

## Requisitos

- Node.js `24.20.0` (la línea LTS configurada en `.nvmrc`).
- pnpm `12.3.4`.

La versión de pnpm está fijada en `packageManager`; `pnpm-lock.yaml` fija las
dependencias. Instalar con `corepack enable` si pnpm aún no está disponible.

## Instalación y comandos

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
```

`pnpm dev` inicia API, Console y Kiosk; Print Agent queda en modo de
typecheck/watch porque su integración todavía no existe.

## Aplicaciones y paquetes

```text
apps/api          NestJS + Express
apps/console      React + Vite
apps/kiosk        React + Vite, independiente del sistema operativo
apps/print-agent  Node.js + TypeScript, skeleton local
packages/contracts  Contratos compartidos (skeleton)
packages/ui         Componentes compartidos (skeleton)
packages/config     TypeScript, ESLint y Prettier compartidos
infra                Baseline y validaciones de infraestructura
```

Para ejecutar una aplicación de forma aislada:

```bash
pnpm --filter @turnox/api dev
pnpm --filter @turnox/console dev
pnpm --filter @turnox/kiosk dev
pnpm --filter @turnox/print-agent dev
```

Console usa el puerto `5173` y Kiosk el `5174`. El Print Agent queda en
typecheck/watch hasta que se implemente su integración.
