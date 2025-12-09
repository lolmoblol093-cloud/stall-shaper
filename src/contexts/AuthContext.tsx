import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { mockUsers, mockTenants, getTenantById } from '@/data/mockData';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'tenant' | 'guest';
  tenant_id?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isTenant: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved session in localStorage
    const savedUser = localStorage.getItem('mockUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    // Check admin login
    if (email === mockUsers.admin.email && password === mockUsers.admin.password) {
      const adminUser: User = {
        id: mockUsers.admin.id,
        email: mockUsers.admin.email,
        role: 'admin',
      };
      setUser(adminUser);
      localStorage.setItem('mockUser', JSON.stringify(adminUser));
      return { error: null };
    }

    // Check tenant login
    const tenant = mockTenants.find(t => t.email === email);
    if (tenant) {
      // For demo, accept any password for tenants or use 'tenant123'
      if (password === 'tenant123' || password.length >= 6) {
        const tenantUser: User = {
          id: `user-${tenant.id}`,
          email: tenant.email || email,
          role: 'tenant',
          tenant_id: tenant.id,
        };
        setUser(tenantUser);
        localStorage.setItem('mockUser', JSON.stringify(tenantUser));
        return { error: null };
      }
    }

    return { error: 'Invalid email or password' };
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('mockUser');
  };

  const isAdmin = user?.role === 'admin';
  const isTenant = user?.role === 'tenant';

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, isAdmin, isTenant }}>
      {children}
    </AuthContext.Provider>
  );
};
