export type ApiRole = 'RM' | 'ANALYST' | 'RESEARCHER' | 'ADMIN';
export type PortalRole = 'rm' | 'analyst' | 'researcher';

export interface AgentLoginResponse {
  agentId: number;
  username: string;
  role: ApiRole;
  status: 'Active' | 'Inactive';
}

export interface NfAuth {
  agentId: number;
  username: string;
  role: PortalRole;
}

const DASHBOARD_PATH: Record<PortalRole, string> = {
  rm: '/dashboard/rm.html',
  analyst: '/dashboard/analyst.html',
  researcher: '/dashboard/researcher.html',
};

export function dashboardPathForRole(role: ApiRole): string | null {
  const portalRole = role.toLowerCase();
  if (portalRole === 'rm' || portalRole === 'analyst' || portalRole === 'researcher') {
    return DASHBOARD_PATH[portalRole];
  }
  return null;
}
