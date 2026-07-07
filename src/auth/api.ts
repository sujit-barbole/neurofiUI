import type { AgentLoginResponse } from './users';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export class AgentLoginError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function agentLogin(username: string, password: string): Promise<AgentLoginResponse> {
  const res = await fetch(`${API_BASE_URL}/api/agents/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    let message = 'Login failed. Please try again.';
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      // ignore — fall back to default message
    }
    throw new AgentLoginError(res.status, message);
  }

  return res.json();
}
