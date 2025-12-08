import { directus } from '@/integrations/directus/client';
import { readItems, createItem } from '@directus/sdk';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'tenant' | 'guest';
}

const AUTH_STORAGE_KEY = 'directus_auth';

// Store auth state in localStorage
const getStoredAuth = (): { user: AuthUser | null; token: string | null } => {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return { user: null, token: null };
};

const setStoredAuth = (user: AuthUser | null, token: string | null) => {
  if (user && token) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, token }));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
};

export const authService = {
  // Get current session
  async getSession(): Promise<{ user: AuthUser | null }> {
    const { user } = getStoredAuth();
    return { user };
  },

  // Admin login - simplified for Directus static token auth
  async adminLogin(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      // For static token auth, we validate against a configured admin
      // In production, you'd use Directus user authentication
      const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL;
      
      if (!DIRECTUS_URL) {
        return { user: null, error: 'Directus not configured. Please set VITE_DIRECTUS_URL.' };
      }

      // Try to authenticate with Directus REST API
      const response = await fetch(`${DIRECTUS_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ errors: [{ message: 'Login failed' }] }));
        return { user: null, error: error.errors?.[0]?.message || 'Invalid credentials' };
      }

      const data = await response.json();
      
      if (data.data?.access_token) {
        const user: AuthUser = {
          id: email,
          email: email,
          role: 'admin',
        };
        
        setStoredAuth(user, data.data.access_token);
        return { user, error: null };
      }
      
      return { user: null, error: 'Login failed' };
    } catch (error: any) {
      console.error('Admin login error:', error);
      return { user: null, error: error.message || 'Login failed' };
    }
  },

  // Tenant login
  async tenantLogin(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      // Check if account is locked
      const locked = await this.checkAccountLock(email);
      if (locked) {
        await this.logLoginAttempt(email, false, 'Account locked');
        return { user: null, error: 'Account temporarily locked. Please wait 15 minutes.' };
      }

      const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL;
      
      if (!DIRECTUS_URL) {
        return { user: null, error: 'Directus not configured' };
      }

      // Try Directus authentication
      const response = await fetch(`${DIRECTUS_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        await this.logLoginAttempt(email, false, 'Invalid credentials');
        return { user: null, error: 'Invalid credentials' };
      }

      const data = await response.json();
      
      if (data.data?.access_token) {
        // Check if this user is linked to a tenant
        const tenantUsers = await directus.request(
          readItems('tenant_users', {
            filter: { user_id: { _eq: email } },
            limit: 1,
          })
        );

        if (!tenantUsers || tenantUsers.length === 0) {
          // Check if there's a tenant with this email
          const tenants = await directus.request(
            readItems('tenants', {
              filter: { email: { _eq: email } },
              limit: 1,
            })
          );

          if (tenants && tenants.length > 0) {
            // Link user to tenant
            await directus.request(
              createItem('tenant_users', {
                user_id: email,
                tenant_id: tenants[0].id,
              })
            );
          } else {
            await this.logLoginAttempt(email, false, 'No tenant account found');
            return { user: null, error: 'No tenant account found for this email.' };
          }
        }

        await this.logLoginAttempt(email, true);
        
        const user: AuthUser = {
          id: email,
          email: email,
          role: 'tenant',
        };
        
        setStoredAuth(user, data.data.access_token);
        return { user, error: null };
      }
      
      await this.logLoginAttempt(email, false, 'Invalid credentials');
      return { user: null, error: 'Invalid credentials' };
    } catch (error: any) {
      console.error('Tenant login error:', error);
      await this.logLoginAttempt(email, false, error.message);
      return { user: null, error: error.message || 'Login failed' };
    }
  },

  // Sign out
  async signOut(): Promise<void> {
    setStoredAuth(null, null);
  },

  // Check if account is locked (5+ failed attempts in 15 minutes)
  async checkAccountLock(email: string): Promise<boolean> {
    try {
      // Get all failed attempts for this email
      const attempts = await directus.request(
        readItems('login_attempts', {
          filter: {
            email: { _eq: email },
            success: { _eq: false },
          },
          sort: ['-created_at'],
          limit: 10,
        })
      );
      
      // Filter attempts within last 15 minutes in JavaScript
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      const recentFailures = attempts.filter(a => 
        new Date(a.created_at) > fifteenMinutesAgo
      );
      
      return recentFailures.length >= 5;
    } catch (error) {
      console.error('Error checking account lock:', error);
      return false;
    }
  },

  // Log login attempt
  async logLoginAttempt(email: string, success: boolean, failureReason?: string): Promise<void> {
    try {
      await directus.request(
        createItem('login_attempts', {
          email,
          success,
          failure_reason: failureReason || null,
          user_agent: navigator.userAgent,
        })
      );
    } catch (error) {
      console.error('Error logging login attempt:', error);
    }
  },

  // Get tenant data for a user
  async getTenantForUser(userId: string): Promise<string | null> {
    try {
      const tenantUsers = await directus.request(
        readItems('tenant_users', {
          filter: { user_id: { _eq: userId } },
          limit: 1,
        })
      );
      
      return tenantUsers.length > 0 ? tenantUsers[0].tenant_id : null;
    } catch (error) {
      console.error('Error getting tenant for user:', error);
      return null;
    }
  },

  // Create tenant account
  async createTenantAccount(email: string, password: string, tenantId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if tenant_users link exists
      const existingLink = await directus.request(
        readItems('tenant_users', {
          filter: { 
            user_id: { _eq: email }, 
            tenant_id: { _eq: tenantId } 
          },
          limit: 1,
        })
      );

      if (!existingLink || existingLink.length === 0) {
        await directus.request(
          createItem('tenant_users', {
            user_id: email,
            tenant_id: tenantId,
          })
        );
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error creating tenant account:', error);
      return { success: false, error: error.message };
    }
  },
};

export default authService;
