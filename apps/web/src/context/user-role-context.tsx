'use client';

import { createContext, useContext, useMemo, useState } from 'react';

export type UserRole = 'patient' | 'doctor';

interface UserRoleContextValue {
  role: UserRole | null;
  setRole: (role: UserRole) => void;
  clearRole: () => void;
}

const UserRoleContext = createContext<UserRoleContextValue | undefined>(undefined);

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole | null>(null);

  const value = useMemo<UserRoleContextValue>(
    () => ({
      role,
      setRole: (nextRole: UserRole) => setRoleState(nextRole),
      clearRole: () => setRoleState(null),
    }),
    [role],
  );

  return <UserRoleContext.Provider value={value}>{children}</UserRoleContext.Provider>;
}

export function useUserRole() {
  const context = useContext(UserRoleContext);
  if (!context) {
    throw new Error('useUserRole must be used within UserRoleProvider');
  }
  return context;
}
