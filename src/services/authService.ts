import { directus, directusAuth } from '@/integrations/directus/client';
import { readItems, createItem, readItem, updateItem } from '@directus/sdk';

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

  // Admin login using Directus authentication
  async adminLogin(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      // Try to authenticate with Directus
      const result = await directusAuth.login(email, password);
      
      if (result.access_token) {
        // Get user info
        const userInfo = await directusAuth.request(readItem('directus_users', 'me' as any));
        
        // Check if user has admin role (you can customize this based on your Directus role setup)
        const user: AuthUser = {
          id: (userInfo as any).id,
          email: (userInfo as any).email,
          role: 'admin',
        };
        
        setStoredAuth(user, result.access_token);
        return { user, error: null };
      }
      
      return { user: null, error: 'Login failed' };
    } catch (error: any) {
      console.error('Admin login error:', error);
      return { user: null, error: error.message || 'Invalid credentials' };
    }
  },

  // Tenant login - simplified for Directus
  async tenantLogin(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      // Check if account is locked
      const locked = await this.checkAccountLock(email);
      if (locked) {
        await this.logLoginAttempt(email, false, 'Account locked');
        return { user: null, error: 'Account temporarily locked. Please wait 15 minutes.' };
      }

      // Try Directus authentication
      const result = await directusAuth.login(email, password);
      
      if (result.access_token) {
        const userInfo = await directusAuth.request(readItem('directus_users', 'me' as any));
        
        // Check if this user is linked to a tenant
        const tenantUsers = await directus.request(
          readItems('tenant_users', {
            filter: { user_id: { _eq: (userInfo as any).id } },
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
                user_id: (userInfo as any).id,
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
          id: (userInfo as any).id,
          email: (userInfo as any).email,
          role: 'tenant',
        };
        
        setStoredAuth(user, result.access_token);
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
    try {
      await directusAuth.logout();
    } catch {
      // Ignore logout errors
    }
    setStoredAuth(null, null);
  },

  // Check if account is locked (5+ failed attempts in 15 minutes)
  async checkAccountLock(email: string): Promise<boolean> {
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      
      const attempts = await directus.request(
        readItems('login_attempts', {
          filter: {
            email: { _eq: email },
            success: { _eq: false },
            created_at: { _gte: fifteenMinutesAgo },
          },
        })
      );
      
      return attempts.length >= 5;
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

  // Check user role
  async getUserRole(userId: string): Promise<string | null> {
    try {
      const roles = await directus.request(
        readItems('user_roles', {
          filter: { user_id: { _eq: userId } },
          limit: 1,
        })
      );
      
      return roles.length > 0 ? roles[0].role : null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
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
      // This would typically be done through Directus admin API
      // For now, we'll create the user through Directus
      // Note: You may need to set up a custom endpoint or use Directus flows for this
      
      // Create tenant_users link if user already exists
      const existingUsers = await directus.request(
        readItems('directus_users' as any, {
          filter: { email: { _eq: email } },
          limit: 1,
        })
      );

      if (existingUsers && existingUsers.length > 0) {
        const userId = (existingUsers[0] as any).id;
        
        // Check if already linked
        const existingLink = await directus.request(
          readItems('tenant_users', {
            filter: { user_id: { _eq: userId }, tenant_id: { _eq: tenantId } },
            limit: 1,
          })
        );

        if (!existingLink || existingLink.length === 0) {
          await directus.request(
            createItem('tenant_users', {
              user_id: userId,
              tenant_id: tenantId,
            })
          );
        }

        // Add tenant role if not exists
        const existingRole = await directus.request(
          readItems('user_roles', {
            filter: { user_id: { _eq: userId }, role: { _eq: 'tenant' } },
            limit: 1,
          })
        );

        if (!existingRole || existingRole.length === 0) {
          await directus.request(
            createItem('user_roles', {
              user_id: userId,
              role: 'tenant',
            })
          );
        }

        return { success: true };
      }

      // For new user creation, you would need Directus admin privileges
      // This might require a custom Directus flow or extension
      return { success: false, error: 'User creation requires Directus admin setup' };
    } catch (error: any) {
      console.error('Error creating tenant account:', error);
      return { success: false, error: error.message };
    }
  },
};

export default authService;
