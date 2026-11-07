/**
 * Role-based access control policies
 */

export type UserRole = 'super_admin' | 'admin' | 'employee';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt?: string;
}

export const SUPER_ADMIN_EMAIL = 'shivam.kumar01@dutyerp.com';

export function isSuperAdmin(user?: { email?: string | null; role?: string | null } | null): boolean {
  if (!user) return false;
  return user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() || user.role === 'super_admin';
}

export function canManageUsers(role?: string | null): boolean {
  return role === 'super_admin';
}

export function canCreateDutyChart(role?: string | null): boolean {
  return role === 'super_admin' || role === 'admin';
}

export function canManageDutyChartLinks(role?: string | null): boolean {
  return role === 'super_admin' || role === 'admin';
}

export function canOnlyViewDutyChartLinks(role?: string | null): boolean {
  return role === 'employee';
}
