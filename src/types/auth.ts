
export enum RoleLevel {
  CONSULTA = 1,
  CAJA = 2,
  CAJERO_PRINCIPAL = 3,
  GERENTE = 4,
  SUPER_ADMIN = 5
}

export interface CustomPermissions {
  tc_limit: number;           // Porcentaje máximo de desviación del TC
  can_cancel: boolean;        // Permiso para cancelar operaciones
  show_vault_balance: boolean; // Visibilidad de saldos reales de bóveda
}

export interface UserProfile {
  auth_user_id: string;
  nickname: string;
  puesto: string;
  role_level: RoleLevel;
  branch_id: string;
  custom_permissions: CustomPermissions;
  is_active: boolean;
}

export const ROLE_NAMES: Record<RoleLevel, string> = {
  [RoleLevel.CONSULTA]: 'Auditor / Consulta',
  [RoleLevel.CAJA]: 'Operador de Caja',
  [RoleLevel.CAJERO_PRINCIPAL]: 'Cajero Principal',
  [RoleLevel.GERENTE]: 'Gerente Sucursal',
  [RoleLevel.SUPER_ADMIN]: 'Super Administrador'
};
