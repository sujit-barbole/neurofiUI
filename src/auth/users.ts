export type Role = 'rm' | 'analyst' | 'researcher';

export interface NfUser {
  username: string;
  password: string;
  role: Role;
  displayName: string;
}

export const USERS: NfUser[] = [
  { username: 'rm', password: 'rm12345', role: 'rm', displayName: 'Relationship Manager' },
  { username: 'analyst', password: 'analyst12345', role: 'analyst', displayName: 'Financial Analyst' },
  { username: 'researcher', password: 'researcher12345', role: 'researcher', displayName: 'Investment Strategist' },
];

export const DASHBOARD_PATH: Record<Role, string> = {
  rm: '/dashboard/rm.html',
  analyst: '/dashboard/analyst.html',
  researcher: '/dashboard/researcher.html',
};

export function authenticate(username: string, password: string): NfUser | null {
  return (
    USERS.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password,
    ) || null
  );
}
