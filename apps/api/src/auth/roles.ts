export const AUTH_ROLES = ['SUPERADMINISTRADOR', 'ADMINISTRADOR', 'SUPERVISOR', 'ASESOR'] as const;

export type AuthRole = (typeof AUTH_ROLES)[number];
