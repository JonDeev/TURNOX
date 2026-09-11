import type { AuthRole } from './roles.js';

export const PERMISSIONS = {
  ORGANIZATION_READ: 'organization:read',
  ORGANIZATION_MANAGE: 'organization:manage',
  SITE_READ: 'site:read',
  SITE_MANAGE: 'site:manage',
  SERVICE_READ: 'service:read',
  SERVICE_MANAGE: 'service:manage',
  ROOM_READ: 'room:read',
  ROOM_MANAGE: 'room:manage',
  COUNTER_READ: 'counter:read',
  COUNTER_MANAGE: 'counter:manage',
  USER_READ: 'user:read',
  USER_MANAGE: 'user:manage',
  ASSIGNMENT_READ: 'assignment:read',
  ASSIGNMENT_MANAGE: 'assignment:manage',
  DEVICE_READ: 'device:read',
  DEVICE_MANAGE: 'device:manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ADMIN_PERMISSIONS: readonly Permission[] = [
  PERMISSIONS.ORGANIZATION_READ,
  PERMISSIONS.SITE_READ,
  PERMISSIONS.SITE_MANAGE,
  PERMISSIONS.SERVICE_READ,
  PERMISSIONS.SERVICE_MANAGE,
  PERMISSIONS.ROOM_READ,
  PERMISSIONS.ROOM_MANAGE,
  PERMISSIONS.COUNTER_READ,
  PERMISSIONS.COUNTER_MANAGE,
  PERMISSIONS.USER_READ,
  PERMISSIONS.USER_MANAGE,
  PERMISSIONS.ASSIGNMENT_READ,
  PERMISSIONS.ASSIGNMENT_MANAGE,
  PERMISSIONS.DEVICE_READ,
  PERMISSIONS.DEVICE_MANAGE,
];

const SUPERVISOR_PERMISSIONS: readonly Permission[] = [
  PERMISSIONS.ORGANIZATION_READ,
  PERMISSIONS.SITE_READ,
  PERMISSIONS.SERVICE_READ,
  PERMISSIONS.ROOM_READ,
  PERMISSIONS.COUNTER_READ,
  PERMISSIONS.USER_READ,
  PERMISSIONS.ASSIGNMENT_READ,
  PERMISSIONS.DEVICE_READ,
];

const ROLE_PERMISSIONS: Readonly<Record<AuthRole, readonly Permission[]>> = {
  SUPERADMINISTRADOR: Object.values(PERMISSIONS),
  ADMINISTRADOR: ADMIN_PERMISSIONS,
  SUPERVISOR: SUPERVISOR_PERMISSIONS,
  ASESOR: [],
};

export function roleHasPermission(role: AuthRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
