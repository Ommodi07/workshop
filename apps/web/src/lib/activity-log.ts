export type ActivityAction =
  | 'ADD_RECORD'
  | 'GRANT_ACCESS'
  | 'GRANT_ACCESS_WITH_EXPIRY'
  | 'REVOKE_ACCESS'
  | 'CHECK_ACCESS'
  | 'DECRYPT_RECORD_SUCCESS'
  | 'DECRYPT_RECORD_FAILURE';

export interface ActivityLogEntry {
  id: string;
  action: ActivityAction;
  actor: string;
  tokenId?: string;
  details?: string;
  createdAt: string;
}

const ACTIVITY_LOG_KEY = 'medical-nft:activity-log';
const MAX_LOG_ITEMS = 200;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function getActivityLogs(): ActivityLogEntry[] {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = localStorage.getItem(ACTIVITY_LOG_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as ActivityLogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendActivityLog(entry: Omit<ActivityLogEntry, 'id' | 'createdAt'>): void {
  if (!canUseStorage()) {
    return;
  }

  const nextEntry: ActivityLogEntry = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    ...entry,
  };

  const nextLogs = [nextEntry, ...getActivityLogs()].slice(0, MAX_LOG_ITEMS);
  localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(nextLogs));
}

export function clearActivityLogs(): void {
  if (!canUseStorage()) {
    return;
  }

  localStorage.removeItem(ACTIVITY_LOG_KEY);
}
