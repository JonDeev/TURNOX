# ADR-020 — Autenticación web y RBAC de P1.4

Estado: aceptado — 2026-09-11

## Contexto

V4 §7 y §44 exigen Argon2id, cookies seguras, autorización server-side y no
guardar tokens críticos en `localStorage`. La API ya tiene usuarios con
organización/sede y auditoría administrativa transaccional.

## Decisión

- Las contraseñas se almacenan únicamente como PHC Argon2id.
- La autenticación usa sesiones persistentes server-side. El navegador recibe
  un identificador aleatorio en cookie `HttpOnly`; PostgreSQL guarda solo su
  SHA-256, junto con usuario, organización, creación, última actividad,
  expiración y revocación.
- El contexto autenticado contiene `userId`, organización, `siteId`, rol y
  expiración de sesión. El scope de organización no se acepta desde body,
  query ni headers del cliente.
- Los roles son exactamente `SUPERADMINISTRADOR`, `ADMINISTRADOR`,
  `SUPERVISOR` y `ASESOR`. Los permisos se resuelven en backend desde una
  matriz explícita de rol a permiso.
- Las mutaciones autenticadas usan double-submit CSRF: cookie no HttpOnly y
  header `X-CSRF-Token`. `SameSite=lax` es el valor predeterminado; `none` se
  rechaza sin una decisión explícita de topología cross-site. `Secure` es
  obligatorio en producción.
- Los intentos se limitan localmente por origen y cuenta, y la cuenta se
  bloquea temporalmente tras cinco fallos consecutivos. No se agrega Redis en
  P1.4.

## Alternativas descartadas

JWT, refresh tokens, Passport, `localStorage`, contraseñas reversibles y Redis
para rate limiting quedan fuera porque V4 cerró sesiones por cookie y no exige
infraestructura distribuida en esta fase.

## Consecuencias

El despliegue multi-instancia necesitará un rate limiter compartido en una
fase de hardening. El flujo de bootstrap inicial de la primera organización y
su primer superadministrador no está definido por V4; P1.4 no crea
credenciales productivas por defecto ni una ruta de bootstrap pública.
